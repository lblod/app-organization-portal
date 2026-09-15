# The report spec, as SHACL

A spec is `rep:ReportSpec` + `sh:NodeShape`. The shape half selects
the subjects and is real SHACL; the `rep:` half says what the CSV holds,
which SHACL has no word for. This file is the spec format's own shapes graph:
a machine-readable definition that doubles as reference documentation.

The namespace:

```
rep:  →  http://mu.semte.ch/vocabularies/reporting/
```

File: `config/report-profiles/report-spec-shapes.ttl`.

## What it defines

One `sh:NodeShape` per term:

- **ReportSpec** — the document. `dct:title`, `rep:profile` (which profile it
  was written against), `sh:targetClass`, `rep:entity` (optional; picks the
  shape when two entities share one `sh:targetClass`), `sh:property` (the
  filters), `rep:columns` (the CSV, in order, an rdf:List).
- **Filter** — a `sh:property` on the ReportSpec: `sh:path` plus exactly one
  condition (`sh:hasValue`, `sh:in`, `sh:minCount`/`sh:maxCount`,
  `sh:min/maxInclusive`/`sh:min/maxExclusive`, `sh:pattern` + `sh:flags`,
  `rep:anyOf`). A path with no condition is refused by the validator.
- **Column** — a list item: `sh:path` (hops, or `rep:self` for the row's own
  subject), `rdfs:label` (unique, required), optional `rep:collect`
  (`sh:groupConcat` default, `rep:row`, `sh:min`, `sh:max`), optional
  `sh:separator`. No constraints on a column — `sh:hasValue` and friends
  belong in filters.

## What it cannot say (and the runner enforces anyway)

A shapes graph cannot express "a column must end on a value field" (that
needs the profile), "a path resolves hop by hop" (needs the profile walk),
"at most 24 anyOf terms" (cardinality over list contents), or "anyOf takes
words, not URIs" (term typing). Those live in the service's `src/runner/check.js`.

## Not yet

`sh:count`, `sh:sum`, `sh:orderBy`, `sh:limit`, `sh:offset` (SHACL-AF names for when counting and ordering arrive), `rep:graph` (regex the subject's
graph must match).

## Example

```turtle
<http://data.lblod.info/id/report-specs/e3f1> a rep:ReportSpec , sh:NodeShape ;
  dct:title "Meldingen met bijlagen" ;
  rep:profile <http://data.lblod.info/id/report-profiles/toezicht> ;
  sh:targetClass meb:Submission ;
  sh:property [ sh:path ( pav:createdBy skos:prefLabel ) ;
                sh:hasValue "West-Vlaanderen" ] ;
  rep:columns (
    [ sh:path rep:self ; rdfs:label "melding" ]
    [ sh:path nmo:sentDate ; rdfs:label "datumVerstuurd" ]
    [ sh:path ( prov:generated dct:hasPart nfo:fileName ) ;
      rdfs:label "bestandsnamen" ; rep:collect rep:row ]
  ) .
```

## Validating a spec against these shapes

The shapes are self-describing documentation. `validate_spec` (the MCP tool)
does more: it walks every path through the mounted profile and refuses
what a shapes graph cannot see. Both together are the spec contract.