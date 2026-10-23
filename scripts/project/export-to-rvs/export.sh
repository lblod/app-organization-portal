#!/usr/bin/env bash
# Export OP's non-worship organisation data into <out>/op-rvs.nt.
#
# Reads the OP stack over HTTP, in pages: one CONSTRUCT cannot return the
# ~5.7M source triples (Virtuoso caps a CONSTRUCT at 2,097,150). The pages
# are loaded into scratch graphs in the same store and scoped there by
# queries/scope.rq. The same file runs against OP dev, OP prod and a restored
# dump; only the endpoint changes.
#
# Usage: export.sh [--dry-run] [--page-size N] [--out DIR]
# Environment and output files: see README.md.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)

OP_SPARQL_ENDPOINT=${OP_SPARQL_ENDPOINT:-http://triplestore:8890/sparql/}
OP_SPARQL_USER=${OP_SPARQL_USER:-dba}
OP_SPARQL_PASSWORD=${OP_SPARQL_PASSWORD:-dba}

app=http://mu.semte.ch/apps/rvs-dump
load=$app/load
computed=$app/computed
kept=$app/kept

# The 6 Oct note's source graphs. Every other graph in an OP stack
# (organisatieportaal, organizations/<uuid>, landing-zone, jobs, privacy,
# kalliope, delta folding, Virtuoso's own) is left out by enumerating these
# three instead of excluding by name.
source_graphs=${OP_SOURCE_GRAPHS:-"http://mu.semte.ch/graphs/administrative-unit http://mu.semte.ch/graphs/shared http://mu.semte.ch/graphs/public"}

# Subjects under these IRI prefixes are OP's file stores, and none of them holds
# organisation data:
#   http://data.lblod.info/files/  binary file records (8,999 of the first 9,000
#                                  subjects of the dev store)
#   share://                       the migration delta files under share:///deltas/
#                                  and share:////deltas/, ~1,700 triples each
# On the dev store that is 232k + 241k subjects against 299k real ones. Checked
# on a full run that no share:// subject is ever marked kept or reaches the dump,
# so skipping them only removes work, not output.
skip_prefixes=${OP_SKIP_PREFIXES:-"http://data.lblod.info/files/ share://"}

# skip_filter -> the FILTER body shared by export-page.rq and op-count.rq, so
# the pages and the expected count exclude the same subjects. Starts at `1` so
# it is never empty and FILTER(...) stays valid.
skip_filter() {
  local prefix filter=1
  for prefix in $skip_prefixes; do
    filter="$filter && !STRSTARTS(STR(?s), \"$prefix\")"
  done
  printf '%s' "$filter"
}

# A page holds up to this many subjects (a few thousand to a few ten thousand
# triples). Too small and the export crawls; too large and the response times
# out. Pages are split into 500-triple INSERTs anyway (Virtuoso refuses an
# INSERT DATA beyond ~1,500 triples), so the page size only bounds the response.
page_size=9000
out=
dry_run=0
# A dry run samples this many pages of the read and builds this many pages of
# the artifact: enough to exercise every step, small enough to run in minutes.
dry_pages=${OP_DRY_RUN_PAGES:-4}
dry_dump_pages=${OP_DRY_RUN_DUMP_PAGES:-2}
while [ $# -gt 0 ]; do
  case "$1" in
    --page-size) page_size=$2; shift 2; continue ;;
    --out) out=$2; shift 2; continue ;;
    --dry-run) dry_run=1 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

# Git-ignored dumps folder in the project. run.sh sets OP_DUMP_ROOT to the
# mounted project folder when mu runs this; a laptop run resolves it from the
# script's location. --out overrides both.
stamp=$(date -u +%y%m%d%H%M%S)
out_root=${OP_DUMP_ROOT:-$here/../../../data/dumps}
final=${out:-$out_root/$stamp}

log() { printf '[export %s] %s\n' "$(date -u +%H:%M:%S)" "$*" >&2; }
die() { log "error: $*"; exit 1; }

# --out names the dump folder, so it must not exist yet: replacing it would
# either nest the dump inside the old one (mv into a directory) or overwrite a
# dump someone may want to keep.
#
# Write into <stamp>.tmp and rename only on success: a failed run then leaves a
# .tmp folder the operator can delete at a glance, never an empty dump folder
# that looks like a usable dump.
out=${final}.tmp
[ -e "$final" ] && die "$final exists; --out must name a new folder (delete it, or pass a different path)"
# Never delete a folder this run did not create: an earlier run's .tmp is
# evidence, and removing it is how a failed run comes to look like it "ate" the
# previous dump.
[ -e "$out" ] && die "$out exists (left by an earlier run); inspect it, then delete it or pass --out"
made_out=0
mkdir_out() {
  # Called after the first request has answered: a run that dies before it
  # (bad endpoint, no triples) then leaves no folder at all, empty or not.
  [ "$made_out" -eq 1 ] && return 0
  mkdir -p "$out"
  made_out=1
}
tmp_expected=$(mktemp)
tmp_page=$(mktemp)
tmp_filtered=$(mktemp)
cleanup_out() {
  # A .tmp that never got its first file is removed, so a failed run does not
  # leave an empty folder next to a good dump. Once the folder has files it
  # stays: the operator inspects it, as the README says.
  if [ "$made_out" -eq 1 ] && [ -d "$out" ] && [ -z "$(ls -A "$out")" ]; then
    rmdir "$out"
  fi
  rm -f "$tmp_expected" "$tmp_page" "$tmp_filtered"
}
trap cleanup_out EXIT

# --- plumbing -----------------------------------------------------------------
# Every request goes through a file: a page or the scope file is larger than the
# kernel's argv limit, and a placeholder in a long comment changes how the
# stack's Virtuoso answers (see queries/export-page.rq).

# Placeholders are filled with awk, not ${text//placeholder/value}: that
# expansion reads '&' in the value as "the matched text" and offers no way to
# quote it, and the skip filter is nothing but '&&'. The values reach awk
# through the environment, in one \x1f-separated record, so awk only ever
# reads them and never parses them as syntax.
fill_file() {
  # fill_file TEMPLATE OUT [name value]...: write TEMPLATE to OUT with each
  # @NAME@ replaced by its value, wherever it stands in a line.
  local file=$1 out=$2
  shift 2
  local names=() values=()
  while [ $# -gt 1 ]; do
    names+=("$1")
    values+=("$2")
    shift 2
  done
  local payload=
  local i
  for i in "${!names[@]}"; do
    payload+="${names[i]}=${values[i]}"$'\x1f'
  done
  FILL_VALUES=$payload awk '
    BEGIN {
      n = split(ENVIRON["FILL_VALUES"], rec, "\x1f")
      for (i = 1; i <= n; i++) {
        eq = index(rec[i], "=")
        if (eq == 0) continue
        name = substr(rec[i], 1, eq - 1)
        values[name] = substr(rec[i], eq + 1)
      }
    }
    {
      line = $0
      out = ""
      while (match(line, /@[A-Z_]+@/)) {
        token = substr(line, RSTART, RLENGTH)
        out = out substr(line, 1, RSTART - 1)
        if (token in values) out = out values[token]
        else out = out token
        line = substr(line, RSTART + RLENGTH)
      }
      print out line
    }
  ' "$file" > "$out"
}

merged_query() {
  # merged_query QUERY_FILE OUT [name value]...: prefixes on top, then the
  # query with its placeholders filled, in OUT. Every request goes out as a
  # file: a page or the scope file is larger than the kernel's argv limit.
  local file=$1 out=$2
  shift 2
  local filled
  filled=$(mktemp)
  fill_file "$file" "$filled" "$@"
  cat "$here/queries/prefixes.rq" > "$out"
  printf '\n' >> "$out"
  cat "$filled" >> "$out"
  rm -f "$filled"
}

select_file() {
  # select_file QUERY_FILE OUT [name value]...: CSV rows without the header.
  local file=$1 out=$2 merged
  shift 2
  merged=$(mktemp)
  merged_query "$file" "$merged" "$@"
  curl --fail --silent --show-error --user "$OP_SPARQL_USER:$OP_SPARQL_PASSWORD" \
    -G --data-urlencode "query@$merged" -H 'Accept: text/csv' "$OP_SPARQL_ENDPOINT" \
    | tail -n +2 | tr -d '\r' > "$out"
  rm -f "$merged"
}

construct_file() {
  # construct_file QUERY_FILE OUT [name value]...: N-Triples output. An empty
  # result prints a '# Empty NT' comment line, which is dropped.
  local file=$1 out=$2 merged
  shift 2
  merged=$(mktemp)
  merged_query "$file" "$merged" "$@"
  curl --fail --silent --show-error --user "$OP_SPARQL_USER:$OP_SPARQL_PASSWORD" \
    -G --data-urlencode "query@$merged" -H 'Accept: application/n-triples' \
    "$OP_SPARQL_ENDPOINT" | grep -v '^# Empty NT$' > "$out" || true
  rm -f "$merged"
}

update_file() {
  # update_file FILE: SPARQL update from a file.
  curl --fail --silent --show-error --user "$OP_SPARQL_USER:$OP_SPARQL_PASSWORD" \
    -H 'Content-Type: application/sparql-update' \
    --data-binary "@$1" "$OP_SPARQL_ENDPOINT" >/dev/null
}

insert_triples() {
  # insert_triples FILE: insert N-Triples into the load graph, one statement per
  # 500 triples (see page_size above).
  local file=$1 parts body chunk
  parts=$(mktemp -d)
  split -l 500 "$file" "$parts/chunk."
  body=$(mktemp)
  for chunk in "$parts"/chunk.*; do
    {
      printf 'INSERT DATA { GRAPH <%s> {\n' "$load"
      cat "$chunk"
      printf '} }\n'
    } > "$body"
    update_file "$body"
  done
  rm -rf "$parts" "$body"
}

select_file_value() {
  # select_file_value QUERY_FILE [key value]... -> the first cell of the first
  # row, without the CSV's quoting. An IRI comes back as "http://..."; the
  # quotes are the CSV's, not part of the IRI.
  local file=$1 result
  shift
  result=$(mktemp)
  select_file "$file" "$result" "$@"
  sed -n '1p' "$result" | tr -d '"'
  rm -f "$result"
}

graph_count() {
  # graph_count GRAPH -> number of triples in it
  local result
  result=$(mktemp)
  select_file "$here/queries/graph-count.rq" "$result" '@GRAPH@' "$1"
  cat "$result"
  rm -f "$result"
}

log "endpoint $OP_SPARQL_ENDPOINT, output $out"

clear_scratch() {
  # One CLEAR per request: three statements in one transaction aborted with
  # "log after image size went above the 150000000 bytes limit" on a large
  # load graph.
  local graph
  for graph in $scratch_graphs; do
    body=$(mktemp)
    printf 'CLEAR GRAPH <%s>\n' "$graph" > "$body"
    update_file "$body"
    rm -f "$body"
  done
}

# Every graph the export can create, not only the three this version writes: an
# older export kept a copy in rvs-dump/export, and a scratch left in either
# graph is read as if it were this run's.
scratch_graphs="$load $computed $kept $app/export $app/scratch"

# --- 1. clean scratch state ---------------------------------------------------
# Stale scratch graphs from an earlier (failed) run would be scoped and counted
# with this one, so all of them are cleared before the read.
log "clearing scratch graphs"
clear_scratch

# --- 2. read OP into the load graph, page by page ----------------------------
# Pages advance by subject cursor: this Virtuoso refuses a sorted TOP once
# LIMIT + OFFSET passes ~10,000 rows, and an unsorted OFFSET page repeats
# rows. The read is verified with a COUNT instead: the load graph must hold
# exactly as many triples as the source graphs do.
patterns=
for graph in $source_graphs; do
  [ -n "$patterns" ] && patterns="$patterns UNION"
  patterns="$patterns { GRAPH <$graph> { ?s ?p ?o } }"
done
select_file "$here/queries/op-count.rq" "$tmp_expected" \
  '@PATTERNS@' "$patterns" '@SKIP@' "$(skip_filter)"
expected=$(cat "$tmp_expected")
log "$expected triples in the OP graphs"

# The first request has answered, so the run is real: create the folder now.
mkdir_out

# A dry run samples from the organisation data: the first subjects of a store
# are its file store and loader bookkeeping (http://data.lblod.info/files/...,
# delta timestamps), so the first pages hold no unit or body and the scope then
# keeps nothing, which reads as a failing smoke test. Starting just below the
# first unit's IRI keeps the sample meaningful; a full run starts at the
# beginning as before.
cursor=
if [ "$dry_run" -eq 1 ]; then
  if [ -n "${OP_DRY_RUN_FROM:-}" ]; then
    cursor=$OP_DRY_RUN_FROM
  else
    first_unit=$(select_file_value "$here/queries/first-unit.rq" \
      '@SOURCE_GRAPHS@' "$(for graph in $source_graphs; do printf ' FROM <%s>' "$graph"; done)")
    if [ -z "$first_unit" ]; then
      # No unit found means either an empty store or a broken start query. Do
      # not fall back to the start silently: the sample would then be the file
      # store again and report zeros as if it were a real failure.
      die "no besluit:Bestuurseenheid in the source graphs; nothing to sample"
    fi
    # The cursor is compared as STR(?s) > "<cursor>", so dropping the IRI's
    # last character makes that true for the first unit itself. Do not shorten
    # it further: a prefix would also admit shorter IRIs that sort before it.
    cursor=${first_unit%?}
  fi
  log "dry run: sampling from <$cursor>"
fi
pages=0
while :; do
  construct_file "$here/queries/export-page.rq" "$tmp_page" \
    '@SOURCE_GRAPHS@' "$(for graph in $source_graphs; do printf ' FROM <%s>' "$graph"; done)" \
    '@FROM_TEXT@' "$cursor" '@PAGE_SIZE@' "$page_size" '@SKIP@' "$(skip_filter)"
  [ -s "$tmp_page" ] || break
  # OP's loader wrote bookkeeping into the same graphs: a delta timestamp on
  # every changed subject, a graph version, and the graph as a subject.
  grep -v -e 'vocabularies/migrations/executedAt' \
    -e 'http://mu.semte.ch/vocabularies/core/graph' \
    -e 'vocabularies/core/graph>' "$tmp_page" > "$tmp_filtered"
  insert_triples "$tmp_filtered"
  # The cursor is the largest subject on the page, not the last line: a
  # CONSTRUCT does not promise an order inside its output.
  cursor=$(sed -n 's/^<\([^>]*\)>.*/\1/p' "$tmp_page" | LC_ALL=C sort | tail -1)
  n=$(grep -c . "$tmp_page" || true)
  pages=$((pages + 1))
  log "page $pages: $n triples, through <$cursor>"
  if [ "$dry_run" -eq 1 ] && [ "$pages" -ge "$dry_pages" ]; then
    log "dry run: stopped after $pages pages"
    break
  fi
done

loaded=$(graph_count "<$load>")
log "read $loaded of $expected triples in $pages pages"
if [ "$dry_run" -eq 0 ] && [ "$loaded" != "$expected" ]; then
  die "read $loaded of $expected triples: a page repeated or was skipped"
fi

# --- 3. scope, transform, closure --------------------------------------------
# The scope reads the load graph directly. A COPY of it into a scratch graph
# aborts with "log after image size went above the 150000000 bytes limit",
# and the scope only reads @SCRATCH@, so the load graph is passed in its
# place. Nothing is written to it.
bash "$here/scope.sh" "$OP_SPARQL_ENDPOINT" "$OP_SPARQL_USER" "$OP_SPARQL_PASSWORD" \
  "$load" "$computed" "$kept"

# --- 4. the artifact ----------------------------------------------------------
# Paged by subject, straight out of the load graph: the filtered export is
# never written into a graph (one INSERT of ~5M triples exceeds Virtuoso's
# dictionary limit). Pages are appended and the file sorted once at the end,
# so two dumps of the same data are byte-identical.
: > "$out/op-rvs.nt"
dump_cursor=
dump_pages=0
while :; do
  page=$(mktemp)
  construct_file "$here/queries/dump.rq" "$page" \
    '@LOAD@' "<$load>" '@KEPT@' "<$kept>" '@COMPUTED@' "<$computed>" \
    '@FROM_TEXT@' "$dump_cursor" '@PAGE_SIZE@' "$page_size"
  [ -s "$page" ] || { rm -f "$page"; break; }
  cat "$page" >> "$out/op-rvs.nt"
  dump_cursor=$(sed -n 's/^<\([^>]*\)>.*/\1/p' "$page" | LC_ALL=C sort | tail -1)
  dump_pages=$((dump_pages + 1))
  # Every page, not every tenth: the artifact step runs for many minutes and a
  # silent gap reads as a hang.
  log "artifact page $dump_pages: $(grep -c . "$page" || true) triples, through <$dump_cursor>"
  rm -f "$page"
  if [ "$dry_run" -eq 1 ] && [ "$dump_pages" -ge "$dry_dump_pages" ]; then
    log "dry run: stopped after $dump_pages artifact pages"
    break
  fi
done
LC_ALL=C sort -u "$out/op-rvs.nt" -o "$out/op-rvs.nt"
log "artifact: $(grep -c . "$out/op-rvs.nt" || true) triples in $dump_pages pages"

construct_file "$here/queries/dump-kept.rq" "$out/kept.nt" '@GRAPH@' "<$kept>"
LC_ALL=C sort -u "$out/kept.nt" -o "$out/kept.nt"
nt=$(grep -c . "$out/op-rvs.nt" || true)

# --- 5. counts and contradictions --------------------------------------------
# Counted from the artifact itself: it is exactly what ships, and one pass
# over the file is cheaper than 30 COUNT queries over ~5M triples.
python3 "$here/counts.py" --classes "$here/classes.tsv" --nt "$out/op-rvs.nt" \
  > "$out/counts.tsv"

python3 "$here/check-export.py" --classes "$here/classes.tsv" --nt "$out/op-rvs.nt" \
  > "$out/contradictions.tsv"

# --- 6. manifest --------------------------------------------------------------
python3 "$here/manifest.py" \
  --stamp "$stamp" \
  --endpoint "$OP_SPARQL_ENDPOINT" \
  --sources "$source_graphs" \
  --triples "$nt" \
  --pages "$pages" \
  --dry-run "$dry_run" \
  --dir "$out" > "$out/manifest.json"

log "wrote $nt triples to $out/op-rvs.nt"
sed 's/^/  /' "$out/counts.tsv" >&2
# contradictions.tsv always lists every check, zero or not; the run fails only
# when one count is non-zero.
if awk -F'\t' '$2 != 0 { found = 1 } END { exit !found }' "$out/contradictions.tsv"; then
  log "contradictions in the export (see $out/contradictions.tsv):"
  sed 's/^/  /' "$out/contradictions.tsv" >&2
  die "export failed its check"
fi

# The dump is only named like a dump once it passed: rename the .tmp folder.
mv "$out" "$final"
out=$final
log "dump at $out"

# --- 7. clean scratch state ---------------------------------------------------
# Only after every artifact and the check passed: a failed run keeps the graphs
# so the operator can inspect them. This is a large CLEAR and takes time on a
# full read.
log "clearing scratch graphs"
clear_scratch

if [ "$dry_run" -eq 1 ]; then
  log "dry run: this is a $pages-page / $dump_pages-artifact-page sample, not a usable dump"
fi
