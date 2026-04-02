import { generateReportFromData, batchedQuery } from "../helpers.js";
import { PREFIXES } from "./utils";

export default {
  cronPattern: "0 00 2 * * *",
  name: "organizationsPlatform",
  execute: async () => {
    const reportData = {
      title: "organizations platform",
      description: "List of Organizations with digital platform information",
      filePrefix: "exports/organizations-platform",
    };

    console.log("Generating organizations platform report");

    const queryString = `
    ${PREFIXES}
    PREFIX muAccount: <http://mu.semte.ch/vocabularies/account/>

    SELECT
      ?org
      ?org_pref_label
      ?org_classification_label
      ?org_status_label
      ?org_legal_name
      ?org_alt_label
      ?org_werkingsgebied_label
      ?org_ovo_number
      ?org_kbo_number
      (COALESCE(?platforms, "Loket voor Lokale Besturen") AS ?org_digitaal_platform)
    WHERE {
      ?org a org:Organization .

      OPTIONAL { ?org skos:prefLabel ?org_pref_label }
      OPTIONAL { ?org skos:altLabel ?org_alt_label }

      OPTIONAL {
        ?org regorg:legalName ?org_legal_name .
      }

      OPTIONAL {
        ?org org:classification ?org_classification .
        ?org_classification skos:prefLabel ?org_classification_label .
      }

      OPTIONAL {
        ?org regorg:orgStatus ?org_status .
        ?org_status skos:prefLabel ?org_status_label .
      }

      OPTIONAL {
        ?org besluit:werkingsgebied ?org_werkingsgebied .
        ?org_werkingsgebied rdfs:label ?org_werkingsgebied_label .
      }

      OPTIONAL {
        ?org adms:identifier ?identifier1 .
        ?identifier1 skos:notation "KBO nummer" ;
                     generiek:gestructureerdeIdentificator ?id1 .
        ?id1 generiek:lokaleIdentificator ?org_kbo_number .
      }

      OPTIONAL {
        ?org adms:identifier ?identifier2 .
        ?identifier2 skos:notation "OVO-nummer" ;
                     generiek:gestructureerdeIdentificator ?id2 .
        ?id2 generiek:lokaleIdentificator ?org_ovo_number .
      }

      OPTIONAL {
        SELECT ?org (GROUP_CONCAT(DISTINCT ?digitaal_platform; separator=", ") AS ?platforms)
        WHERE {
          ?vendor a ext:Vendor ;
                  muAccount:canActOnBehalfOf ?org ;
                  foaf:name ?digitaal_platform .
        }
        GROUP BY ?org
      }
    }
    `;

    const queryResponse = await batchedQuery(queryString);

    const data = queryResponse.results.bindings.map((row) => ({
      "URI organisatie": getSafeValue(row, "org"),
      "label naam": getSafeValue(row, "org_pref_label"),
      "label classificatie": getSafeValue(row, "org_classification_label"),
      "label status": getSafeValue(row, "org_status_label"),
      "label juridische naam": getSafeValue(row, "org_legal_name"),
      "label alternatieve naam": getSafeValue(row, "org_alt_label"),
      "label werkingsgebied": getSafeValue(row, "org_werkingsgebied_label"),
      "label OVO nummer": getSafeValue(row, "org_ovo_number"),
      "label KBO nummer": getSafeValue(row, "org_kbo_number"),
      "label digitaal platform": getSafeValue(row, "org_digitaal_platform"),
    }));

    await generateReportFromData(
      data,
      [
        "URI organisatie",
        "label naam",
        "label classificatie",
        "label status",
        "label juridische naam",
        "label alternatieve naam",
        "label werkingsgebied",
        "label OVO nummer",
        "label KBO nummer",
        "label digitaal platform",
      ],
      reportData,
    );
  },
};

function getSafeValue(entry, property) {
  return entry[property] ? wrapInQuote(entry[property].value) : null;
}

// Some values might contain commas; wrapping them in escapes quotes doesn't disrupt the columns.
function wrapInQuote(value) {
  return `\"${value}\"`;
}
