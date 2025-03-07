import { moveTriples } from "../support";
import { Changeset } from "../types";
import { sparqlEscapeUri } from "mu";
import { querySudo } from "@lblod/mu-auth-sudo";
import ldesTypes from "./ldes-types";
import ldesGraphs from "./ldes-graphs";
import { pathToBestuurseenheid } from "./utils";

const safeLdesTypes = ldesTypes
  .map((type) => {
    return sparqlEscapeUri(type);
  })
  .join("\n");

const safeGraphValues = ldesGraphs
  .map((graph) => {
    return sparqlEscapeUri(graph);
  })
  .join("\n");

export default async function dispatch(changesets: Changeset[]) {
  const subjects = new Set();
  // note: we're not getting filtered changesets here so if there is a 'change'
  // that inserts the same triple again, we still consider it to be a change and we WILL republish
  // this can be optimized but we don't want to impact the rest of the application
  for (const changeset of changesets) {
    changeset.inserts.forEach((insert) => subjects.add(insert.subject.value));
    changeset.deletes.forEach((del) => subjects.add(del.subject.value));
  }
  const safeSubjects = Array.from(subjects)
    .map((subject) => {
      return sparqlEscapeUri(subject);
    })
    .join("\n");

  const {
    results: { bindings },
  } = await querySudo(`
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX code: <http://telegraphis.net/ontology/measurement/code#>
    PREFIX org: <http://www.w3.org/ns/org#>
    PREFIX adms: <http://www.w3.org/ns/adms#>
    PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
    PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
    PREFIX schema: <http://schema.org/>
    PREFIX as: <http://www.w3.org/ns/activitystreams#>
    PREFIX locn: <http://www.w3.org/ns/locn#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

    CONSTRUCT {
      ?target ?p ?o .
      ?target ext:owningBestuurseenheid ?bestuurseenheid .
    } WHERE {
      VALUES ?target { ${safeSubjects} }
      VALUES ?type { ${safeLdesTypes} }
      ?target a ?type .
      GRAPH ?g {
        ?target ?p ?o.
      }
      OPTIONAL {
        ?target ${pathToBestuurseenheid} ?bestuurseenheid .
        ?bestuurseenheid a besluit:Bestuurseenheid .
      }
      VALUES ?g {
        ${safeGraphValues}
      }
    }
  `);
  if (bindings.length) {
    await moveTriples([
      {
        inserts: bindings.map(({ s, p, o }) => {
          return { subject: s, predicate: p, object: o };
        }),
      },
    ]);
  }
}
