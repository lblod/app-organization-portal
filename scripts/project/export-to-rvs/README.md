# Export OP data for RVS

Reads OP's non-worship organisation data over SPARQL and writes a dump for RVS's
`import-from-op` script. This is the export half of the OP → RVS sync; the import lives in
lblod/app-lokale-verkenner, `config/project-scripts/import-from-op/`.

## What travels

From OP's `administrative-unit`, `shared` and `public` graphs:

- units (`besluit:Bestuurseenheid`) and registered organisations (`regorg:RegisteredOrganization`), each also typed `org:Organization` (RVS-25; OP does not always assert it);
- governing bodies (`besluit:Bestuursorgaan`): those that `bestuurt` a unit or registered organisation, and their time specialisations (`generiek:isTijdspecialisatieVan`);
- persons (`person:Person`), mandatarissen, mandaten, posts, bestuursfuncties and functionarissen, with full detail;
- identifiers, sites, addresses, contact points, memberships, locations;
- change events and KBO shadow organisations, when their organisation is kept;
- the codelists all of the above point at.

Only worship is excluded. A subject is worship when it has an `ere:*` type in any graph of
the store (the worship graph included: OP keeps fragments of worship units in
`administrative-unit`, typed as plain units, with their `ere:*` type in `worship-service`
only), or when its IRI is under one of OP's worship bases (`besturenVanDeEredienst/`,
`centraleBesturenVanDeEredienst/`, `representatieveOrganen/`, ...). Worship concept
schemes and the concepts in them are worship too. A link from a kept subject to a worship
subject is dropped; the kept subject stays. The export fails if worship or another
contradiction reaches its output (`check-export.py`).

A root (unit, registered organisation, change event, KBO shadow) needs a `mu:uuid`; a
unit IRI with nothing but a type triple in the source graphs is a stub RVS could not show,
and the check would refuse it. Stubs, and change events or KBO shadows whose organisation
is not kept, are listed in `skipped.tsv` with their reason. The run does not fail on
them.

The dump contains natural-person data. It is written under the git-ignored `data/dumps/`. Never commit it, never copy it outside a guarded location.

## Running it

The script reads OP's triplestore, so both containers must exist — `mu` only
*creates* the script container, so start the store first:

```sh
docker compose up -d triplestore project-scripts
```

Without a running triplestore the script fails on its first request ("could not
connect", or an empty count) — that is the cause, not the export.

Then, inside OP's stack:

```sh
mu script project-scripts export-to-rvs
mu script project-scripts export-to-rvs --dry-run
```

From a laptop against OP dev:

```sh
OP_SPARQL_ENDPOINT=http://localhost:8890/sparql/ bash scripts/project/export-to-rvs/export.sh --dry-run
```

Both scripts here are bash: call them with `bash <script>`, not `sh <script>` (`sh` is dash
on Debian, and these are bash scripts). Name the endpoint with `OP_SPARQL_ENDPOINT` when
you run from a laptop, since the default names the container's `triplestore`.

| Variable | Default |
| --- | --- |
| `OP_SPARQL_ENDPOINT` | `http://triplestore:8890/sparql/` |
| `OP_SPARQL_USER` | `dba` |
| `OP_SPARQL_PASSWORD` | `dba` |
| `OP_DUMP_ROOT` | `data/dumps` in the project |
| `OP_SKIP_PREFIXES` | `http://data.lblod.info/files/ share://` |

Subjects under `OP_SKIP_PREFIXES` are not read. They are OP's file stores: the binary
`files/` records, and the migration delta files under `share://` (`share:///deltas/`,
`share:////deltas/`, ~1,700 triples each). Neither holds organisation data, neither is
ever marked kept, and neither reaches the dump. On the dev store they are more subjects
than the real data: 232k `files/` plus 241k `share://` against 299k organisation
subjects. Skipping them keeps the pages on organisation data, cuts a full export from
~61 pages to ~34, and keeps the expected-triple count honest; the pages and that count
use the same filter.

Flags:

- `--out DIR` (default `<OP_DUMP_ROOT>/<stamp>`) — the dump folder. It must not exist yet;
  the run refuses one that does, so a typo cannot overwrite or nest into an older dump.
- `--page-size N` (subjects per page, default 9000) — bounds each response, not the write:
  every page is inserted in 500-triple chunks regardless.
- `--dry-run` (a smoke test: `OP_DRY_RUN_PAGES` read pages, 4 by default, starting at the
  first unit IRI with a uuid so the sample is organisation data and not OP's file store or
  a stub; override with `OP_DRY_RUN_FROM`. The artifact stops after `OP_DRY_RUN_DUMP_PAGES` pages, 2 by
  default, so the whole test is a couple of minutes).

The stamp is `YYMMDDhhmmss` in UTC, e.g. `261022102439`. No separators, no timezone suffix: it sorts and reads left to right.

A full export reads ~1.9M triples in 34 pages and takes ~25 minutes; the dump is ~1.4M
triples. Progress goes to stderr, one line per read page and per artifact page — it is not
a silent command.

## Output

The run writes into `<stamp>.tmp/` and renames it to `<stamp>/` only once the dump
passed its check. A failed or interrupted run therefore leaves `<stamp>.tmp/`, never an
empty `<stamp>/` that looks like a usable dump; delete the `.tmp` folder at will. With
`--out DIR` the same rule holds: the run writes `DIR.tmp` and refuses a `DIR` that already
exists.

The folder is created after the first request has answered, so a run that fails before it
(wrong endpoint, nothing to read) leaves nothing behind — no empty `<stamp>.tmp/`. One
that fails later leaves its `.tmp/` with what it wrote, as above.

In `data/dumps/<stamp>/`: `op-rvs.nt`, `kept.nt`, `counts.tsv`, `contradictions.tsv`, `skipped.tsv`, `manifest.json`. Copy the whole directory to the RVS project's `data/dumps/<stamp>/`, keeping the same name; RVS's `import-from-op --dump data/dumps/<stamp>` reads it from there.

`kept.nt` is an audit trail of what the export kept; it is not loaded into RVS.

## The scratch graphs

The export pages OP into three scratch graphs in the OP store: `http://mu.semte.ch/apps/rvs-dump/{load,computed,kept}`. They are temporary:

- cleared at the start of every run, together with `rvs-dump/export` and `rvs-dump/scratch`, which older versions of the export wrote and which would otherwise sit there with data;
- cleared again after a **successful** run, once the dump, the counts, the contradiction check and the manifest are all written. This is a large `CLEAR` (the load graph holds ~5.7M triples) and takes time;
- left in place after a **failed** run, so the operator can inspect them.

OP must therefore be writable, not just readable: paging loads the pages into the OP store. A read-only replica cannot run the export; the fallback is a local Virtuoso holding a restored dump — the same script, only `OP_SPARQL_ENDPOINT` changes.

The clears are one statement per request. A `CLEAR` of a ~5.7M-triple graph once aborted with "log after image size went above the 150000000 bytes limit"; if a clear still aborts, clear the graphs by hand and report it.

## Remarks

- The script holds the OP credentials (`dba` by default), because it writes the scratch graphs directly. That is the trade-off for speed; it is not a mu-auth path.
- `mu script project-scripts export-to-rvs` runs in `python:3.12-bookworm` and joins the stack network, so the in-network `triplestore` alias works without an endpoint override.
- `create-export` (the ruby script in `scripts/project/export/`) is a different, per-unit export. This command is `export-to-rvs`.
- `classes.tsv` also exists in RVS's import package: it is one file, two copies. Change them together; the import's verification fails when they drift.
