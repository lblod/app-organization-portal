import { moveTriples } from "../support";
import { Changeset } from "../types";
import { query, sparqlEscapeUri } from 'mu';

export default async function dispatch(changesets: Changeset[]) {
	for (const changeset of changesets) {
		const subjects = new Set(changeset.inserts.map((insert) => insert.subject.value));
		for (const subject of subjects) {
			const { results: { bindings } } = await query(`
				PREFIX org: <http://www.w3.org/ns/org#>
				CONSTRUCT {
					${sparqlEscapeUri(subject)} a org:Organization;
																			?p ?o.
				}
        WHERE { 
          ${sparqlEscapeUri(subject)} a org:Organization;
                                      ?p ?o.
        }
			`);
      if(bindings.length){
        await moveTriples([
          {
            inserts: bindings.map(({ s, p, o}) => { return { subject: s, predicate: p, object: o} }),
          }
        ])
      }
		}
	}
}