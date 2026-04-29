import { generateReportFromData, batchedQuery } from "../helpers.js";
import { PREFIXES } from "./utils";

export default {
  cronPattern: "0 00 23 * * *",
  name: "organizationsWithoutOvo",
  execute: async () => {
    const reportData = {
      title: "organisations in database that have no OVO code",
      description: "List of the Organisations in the database that have no OVO code",
      filePrefix: "exports/organizationsWithoutOvo",
    };

    console.log("Generating organizations without OVO report");

    const queryString = `
    ${PREFIXES}
    PREFIX org: <http://www.w3.org/ns/org#>
    PREFIX adms: <http://www.w3.org/ns/adms#>
    PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX regorg: <http://www.w3.org/ns/regorg#>
    
    select distinct ?bestuur ?label ?classification ?status ?jurdische_naam ?kbo where { 
        ?bestuur a org:Organization .
        OPTIONAL {?bestuur skos:prefLabel ?label}
        OPTIONAL {
            ?bestuur <http://www.w3.org/ns/org#classification> ?org_classification .
            ?org_classification skos:prefLabel ?classification
        }
        OPTIONAL {
            ?bestuur <http://www.w3.org/ns/regorg#orgStatus> ?org_status.
            ?org_status skos:prefLabel ?status.
        }
        OPTIONAL {
            ?bestuur regorg:legalName ?jurdische_naam .
        }
        OPTIONAL {
            ?bestuur adms:identifier ?kbo_identifier .
            ?kbo_identifier
                skos:notation ?kbo_notation;
                generiek:gestructureerdeIdentificator/generiek:lokaleIdentificator ?kbo.
            FILTER (str(?kbo_notation) = "KBO nummer")
        }
        OPTIONAL {
            ?bestuur adms:identifier ?ovo_identifier .
            ?ovo_identifier
                skos:notation ?ovo_notation;
                generiek:gestructureerdeIdentificator/generiek:lokaleIdentificator ?ovo.
            FILTER (str(?ovo_notation) = "OVO-nummer")
        }
        
        FILTER(!BOUND(?ovo))
} 
    `;

    const queryResponse = await batchedQuery(queryString);

    const data = queryResponse.results.bindings.map((row) => ({
        "bestuur": getSafeValue(row, "bestuur"),
        "label": getSafeValue(row, "label"),
        "classification": getSafeValue(row, "classification"),
        "status": getSafeValue(row, "status"),
        "jurdische_naam": getSafeValue(row, "jurdische_naam"),
        "kbo": getSafeValue(row, "kbo"),
    }));

    await generateReportFromData(
        data,
        [
          "bestuur",
          "label",
          "classification",
          "status",
          "jurdische_naam",
          "kbo",
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
