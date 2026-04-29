import { generateReportFromData, batchedQuery } from "../helpers.js";
import { PREFIXES } from "./utils";

export default {
  cronPattern: "0 00 23 * * *",
  name: "organizationsNoAddressregister",
  execute: async () => {
    const reportData = {
      title: "organisations in database with no link to Addressregister",
      description: "List of the Organisations in the database with no link to Addressregister",
      filePrefix: "exports/organizations-no-addressregister",
    };

    console.log("Generating organizationsNoAddressregister report");

    const queryString = `
    ${PREFIXES}
    PREFIX org: <http://www.w3.org/ns/org#>
    PREFIX adms: <http://www.w3.org/ns/adms#>
    PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT DISTINCT 
            ?bestuur
            ?label
            ?classification
            ?status
            ?street
            ?number
            ?bus
            ?postal
            ?location
    WHERE {
          ?bestuur a org:Organization .
          
          OPTIONAL {
              ?bestuur <http://www.w3.org/ns/org#hasPrimarySite> ?site .
              ?site <https://data.vlaanderen.be/ns/organisatie#bestaatUit> ?address .
              OPTIONAL{?address <https://data.vlaanderen.be/ns/adres#verwijstNaar> ?adressenregister .}
              OPTIONAL{?address <http://www.w3.org/ns/locn#thoroughfare> ?street . }
              OPTIONAL{?address <https://data.vlaanderen.be/ns/adres#Adresvoorstelling.huisnummer> ?number . }
              OPTIONAL{?address <https://data.vlaanderen.be/ns/adres#Adresvoorstelling.busnummer> ?bus . }
              OPTIONAL{?address <http://www.w3.org/ns/locn#postCode> ?postal . }
              OPTIONAL{?address <https://data.vlaanderen.be/ns/adres#gemeentenaam> ?location . }
          }
  
          OPTIONAL {?bestuur skos:prefLabel ?label}
                OPTIONAL {
                    ?bestuur <http://www.w3.org/ns/org#classification> ?org_classification .
                    ?org_classification skos:prefLabel ?classification .
                }
                OPTIONAL {
                    ?bestuur <http://www.w3.org/ns/regorg#orgStatus> ?org_status .
                    ?org_status skos:prefLabel ?status .
                }
          FILTER(!BOUND(?adressenregister))
    }
    `;

    const queryResponse = await batchedQuery(queryString);

    const data = queryResponse.results.bindings.map((row) => ({
        "bestuur": getSafeValue(row, "bestuur"),
        "label": getSafeValue(row, "label"),
        "classification": getSafeValue(row, "classification"),
        "status": getSafeValue(row, "status"),
        "street": getSafeValue(row, "street"),
        "number": getSafeValue(row, "number"),
        "bus": getSafeValue(row, "bus"),
        "postal": getSafeValue(row, "postal"),
        "location": getSafeValue(row, "location"),
    }));

    await generateReportFromData(
        data,
        [
            "bestuur",
            "label",
            "classification",
            "status",
            "street",
            "number",
            "bus",
            "postal",
            "location",
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
