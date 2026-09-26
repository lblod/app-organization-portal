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
  Optional `rep:where` (see below).
- **Column** — a list item: `sh:path` (hops, or `rep:self` for the row's own
  subject), `rdfs:label` (unique, required), optional `rep:collect`
  (`sh:groupConcat` default, `rep:row`, `sh:min`, `sh:max`), optional
  `sh:separator`, optional `sh:nodeKind sh:IRI` (the cell shows the URI of
  the node the path ends on; only then may the path end on a link). No
  constraints on a column — `sh:hasValue` and friends belong in filters, or
  in the column's `rep:where`.

## Conditions on the way: rep:where

A filter tests only the end of its own path, and two filters never share a
node. `rep:where` tests a node in the middle of a path. It is written like a
filter, with its path from the row. The steps it has in common with its
filter or column are the same nodes; its condition tests where its own path
ends. On a filter it drops rows; on a column it drops values from the cell,
never rows. Several `rep:where` on one filter or column all apply.

```turtle
[ sh:path ( org:holds [ sh:inversePath lblodlg:heeftBestuursfunctie ]
            generiek:isTijdspecialisatieVan besluit:bestuurt
            [ sh:inversePath besluit:bestuurt ] [ sh:inversePath generiek:isTijdspecialisatieVan ]
            org:hasPost [ sh:inversePath org:holds ]
            mandaat:isBestuurlijkeAliasVan foaf:familyName ) ;
  rdfs:label "Burgemeester" ;
  rep:where [ sh:path ( org:holds [ sh:inversePath lblodlg:heeftBestuursfunctie ]
                        generiek:isTijdspecialisatieVan besluit:bestuurt
                        [ sh:inversePath besluit:bestuurt ] [ sh:inversePath generiek:isTijdspecialisatieVan ]
                        org:hasPost org:role ) ;
              sh:hasValue <http://data.vlaanderen.be/id/concept/BestuursfunctieCode/5ab0e9b8a3b2ca7c5e000013> ] ]
```

Per leidinggevende: the names of the mandatarissen whose mandate, in an
organ of the same bestuurseenheid, has the role Burgemeester. The condition
shares seven steps with the column, so it tests the mandate. `validate_spec`
says so: `rep:where 1 on column "Burgemeester" applies at "mandaat", after
step 7`.

On a filter with `sh:maxCount 0`, the filter and its `rep:where` together
become "none such".

## What it cannot say (and the runner enforces anyway)

A shapes graph cannot express "a column must end on a value field, or on a
link with `sh:nodeKind sh:IRI`" (that needs the profile), "a path resolves hop by hop" (needs the profile walk),
"at most 24 anyOf terms" (cardinality over list contents), or "anyOf takes
words, not URIs" (term typing), or "a rep:where shares at least one step with
its filter or column", or "a date or number condition ends on a value, not on
a link". Those live in the service's `src/runner/check.js`.

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

The shapes are self-describing documentation. `validate_spec` (the conversion tool)
does more: it walks every path through the mounted profile and refuses
what a shapes graph cannot see. Both together are the spec contract.
