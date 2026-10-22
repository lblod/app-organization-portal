#!/usr/bin/env bash
# Run queries/scope.rq against the OP store until the closure stops growing.
# Called by export.sh; not meant to be run by hand.
#
# Arguments: endpoint user password scratch computed export kept
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
endpoint=$1 user=$2 password=$3 scratch=$4 computed=$5 kept=$6

update() {
  # The scope file is far beyond the kernel's argv limit, so it goes in a file.
  local body
  body=$(mktemp)
  printf '%s' "$1" > "$body"
  curl --fail --silent --show-error --user "$user:$password" \
    -H 'Content-Type: application/sparql-update' \
    --data-binary "@$body" "$endpoint" >/dev/null
  rm -f "$body"
}

# A COUNT, as a bare number. Plain COUNT of marker triples, not COUNT(DISTINCT)
# over a join: Virtuoso returned 10 for a 1,395-row COUNT(DISTINCT) on the dev
# stack. One marker triple per marked subject, so the plain count is the count.
count() {
  curl --fail --silent --show-error --user "$user:$password" \
    -G --data-urlencode "query=$1" -H 'Accept: text/csv' "$endpoint" \
    | sed -n '2p' | tr -d '\r"' | tr -d '\n'
}

# Fill the placeholders once. @SCRATCH@ is the graph holding the raw dump —
# the load graph, see export.sh.
query=$(cat "$here/queries/prefixes.rq"; cat "$here/queries/scope.rq")
query=${query//@SCRATCH@/<$scratch>}
query=${query//@COMPUTED@/<$computed>}
query=${query//@KEPT@/<$kept>}

# Marker counts. One COUNT per marker, plain COUNT: see the note on count().
count_markers() {
  # One line, "bodies,reached". The two counts are gathered first and joined
  # after: piping the loop's whole output through one sed let each count's
  # second line run into the next (it produced "0\n,0"), and the settle test
  # below compares this string between passes.
  local marker counts=()
  for marker in body reached; do
    counts+=("$(count "$(cat "$here/queries/prefixes.rq"; printf 'SELECT (COUNT(*) AS ?c) WHERE { GRAPH <%s> { ?s a <urn:x-rvs-marker-%s> } }\n' "$computed" "$marker")")")
  done
  local IFS=,
  printf '%s' "${counts[*]}"
}

# One request per ';'-terminated statement, not the whole file in one. A pass
# that grew large (persons and mandates are in scope) aborted with "log after
# image size went above the 150000000 bytes limit" when sent as a single
# transaction. The statements are independent, so splitting keeps each
# transaction below the limit and each pass idempotent.
split_and_update() {
  local prefix=$1 file=$2
  local statement line
  statement=
  while IFS= read -r line; do
    if [ "$line" = ";" ]; then
      if [ -n "$statement" ]; then
        printf '%s\n%s\n' "$prefix" "$statement" > "$body"
        update "$(cat "$body")"
        statement=
      fi
    else
      statement=$statement$line$'\n'
    fi
  done < "$file"
  if [ -n "$statement" ]; then
    printf '%s\n%s\n' "$prefix" "$statement" > "$body"
    update "$(cat "$body")"
  fi
}

# The closure has one fixed point; a full OP dump settles in a handful of
# passes (deepest chain: unit -> body -> time specialisation). Hitting the cap
# means a cycle the data should not have, and a dump that would be too small.
max_passes=${SCOPE_MAX_PASSES:-15}
previous=
body=$(mktemp)
trap 'rm -f "$body"' EXIT
query_file=$(mktemp)
trap 'rm -f "$body" "$query_file"' EXIT
printf '%s\n' "$query" > "$query_file"

# settled=0 means the last pass changed no count.
settled=0
for pass in $(seq 1 "$max_passes"); do
  split_and_update "$(cat "$here/queries/prefixes.rq")" "$query_file"
  current=$(count_markers)
  [[ $current =~ ^[0-9]+,[0-9]+$ ]] \
    || { echo "scope: unexpected marker count '$current'" >&2; exit 1; }
  printf '[scope] pass %s: bodies,reached = %s\n' "$pass" "$current" >&2
  if [ "$current" = "$previous" ]; then
    settled=1
    break
  fi
  previous=$current
done
[ "$settled" -eq 1 ] || { echo "scope: closure did not settle in $max_passes passes" >&2; exit 1; }
