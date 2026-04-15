import { generateReportFromData, batchedQuery } from "../helpers.js";
import { PREFIXES } from "./utils";

export default {
  cronPattern: "0 00 23 * * *",
  name: "organizations",
  execute: async () => {
    const reportData = {
      title: "organisations in database",
      description: "List of the Organisations in the database",
      filePrefix: "exports/organizations",
    };

    console.log("Generating organizations report");

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
            ?typeEredienst
            ?provincie
            ?status
    WHERE {
          ?bestuur a org:Organization .
          OPTIONAL {
              ?bestuur <http://www.w3.org/ns/org#hasPrimarySite> ?site.
              ?site <https://data.vlaanderen.be/ns/organisatie#bestaatUit> ?address.
              ?address <http://www.w3.org/ns/locn#adminUnitL2> ?provincie
          }
          OPTIONAL {?bestuur <http://data.lblod.info/vocabularies/erediensten/typeEredienst> ?typeEredienst.}
          OPTIONAL {?bestuur skos:prefLabel ?label}
                OPTIONAL {
                    ?bestuur <http://www.w3.org/ns/org#classification> ?org_classification .
                    ?org_classification skos:prefLabel ?classification
                }
                OPTIONAL {
                    ?bestuur <http://www.w3.org/ns/regorg#orgStatus> ?org_status.
                    ?org_status skos:prefLabel ?status.
                }
    }
    `;

    const queryResponse = await batchedQuery(queryString);

    const data = queryResponse.results.bindings.map((row) => ({
        "bestuur": getSafeValue(row, "bestuur"),
        "label": getSafeValue(row, "label"),
        "classification": getSafeValue(row, "classification"),
        "typeEredienst": getSafeValue(row, "typeEredienst"),
        "provincie": getSafeValue(row, "provincie"),
        "status": getSafeValue(row, "status"),
    }));

    await generateReportFromData(
        data,
        [
          "bestuur",
          "label",
          "classification",
          "typeEredienst",
          "provincie",
          "status",
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
