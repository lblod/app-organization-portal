import { moveTriples } from "../support";
import { Changeset } from "../types";
import { query, sparqlEscapeUri } from 'mu';

export default async function dispatch(changesets: Changeset[]) {
	for (const changeset of changesets) {
		const subjects = new Set(changeset.inserts.map((insert) => insert.subject.value));
		for (const subject of subjects) {
			const { results: { bindings } } = await query(`
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX code: <http://telegraphis.net/ontology/measurement/code#>
        PREFIX org: <http://www.w3.org/ns/org#>
        PREFIX adms: <http://www.w3.org/ns/adms#>
        PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
  
        CONSTRUCT {
          ?organization a org:Organization;
                        skos:prefLabel ?prefLabel;
                        adms:identifier ?identifier;
                        org:hasPrimarySite ?site.
          ?identifier skos:notation ?identifierLabel;
                      generiek:gestructureerdeIdentificator ?gestructureerdeIdentificator.
          ?gestructureerdeIdentificator generiek:lokaleIdentificator ?lokaleIdentificator.
          ?site org:siteAddress ?siteAddress.
          ?siteAddress ?p ?o.
        } WHERE {
          {
            VALUES ?organization { ${sparqlEscapeUri(subject)} }
            ?organization a org:Organization;
                          skos:prefLabel ?prefLabel;
                          adms:identifier ?identifier;
                          org:hasPrimarySite ?site.
            ?identifier skos:notation ?identifierLabel;
                        generiek:gestructureerdeIdentificator ?gestructureerdeIdentificator.
            ?gestructureerdeIdentificator generiek:lokaleIdentificator ?lokaleIdentificator.
            ?site org:siteAddress ?siteAddress.
            ?siteAddress ?p ?o.
          } UNION {
            VALUES ?site { ${sparqlEscapeUri(subject)} }
            ?organization a org:Organization;
                          skos:prefLabel ?prefLabel;
                          adms:identifier ?identifier;
                          org:hasPrimarySite ?site.
            ?identifier skos:notation ?identifierLabel;
                        generiek:gestructureerdeIdentificator ?gestructureerdeIdentificator.
            ?gestructureerdeIdentificator generiek:lokaleIdentificator ?lokaleIdentificator.
            ?site org:siteAddress ?siteAddress.
            ?siteAddress ?p ?o.
          } UNION {
            VALUES ?siteAddress { ${sparqlEscapeUri(subject)} }
            ?organization a org:Organization;
                          skos:prefLabel ?prefLabel;
                          adms:identifier ?identifier;
                          org:hasPrimarySite ?site.
            ?identifier skos:notation ?identifierLabel;
                        generiek:gestructureerdeIdentificator ?gestructureerdeIdentificator.
            ?gestructureerdeIdentificator generiek:lokaleIdentificator ?lokaleIdentificator.
            ?site org:siteAddress ?siteAddress.
            ?siteAddress ?p ?o.
          } 
        }
			`);
      if(bindings.length){
        console.log('SUCCESS')
        await moveTriples([
          {
            inserts: bindings.map(({ s, p, o}) => { return { subject: s, predicate: p, object: o} }),
          }
        ])
      }
		}
	}
}