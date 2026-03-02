import { generateReportFromData, batchedQuery } from "../helpers.js";
import { PREFIXES } from "./utils";

export default {
  cronPattern: "0 00 4 * * *",
  name: "kboOrganizations",
  execute: async () => {
    const reportData = {
      title: "kbo organizations",
      description: "List of KBO Organizations with contact information",
      filePrefix: "exports/kbo-organizations",
    };

    console.log("Generating KBO organizations report");

    const queryString = `
    ${PREFIXES}

    SELECT DISTINCT
      ?org
      ?org_legal_name
      ?org_classification_label
      ?org_status_label
      ?org_kbo_number
      ?org_contact_point
      ?org_full_address
      ?org_email
      ?org_telephone
      ?website
    WHERE {
      ?org <http://purl.org/dc/terms/source> <https://economie.fgov.be/> .
      ?org a <http://mu.semte.ch/vocabularies/ext/KboOrganisatie> .

      OPTIONAL { ?org regorg:legalName ?org_legal_name . }

      OPTIONAL {
        ?org <http://mu.semte.ch/vocabularies/ext/rechtsvorm> ?org_classification_label .
      }

      OPTIONAL {
        ?org regorg:orgStatus ?org_status .
        ?org_status skos:prefLabel ?org_status_label .
      }

      OPTIONAL {
        ?org adms:identifier ?identifier .
        ?identifier skos:notation "KBO nummer" ;
                    generiek:gestructureerdeIdentificator ?id1 .
        ?id1 generiek:lokaleIdentificator ?org_kbo_number .
      }

      OPTIONAL {
        ?org schema:contactPoint ?org_contact_point .

        OPTIONAL {
          ?org_contact_point locn:address ?org_address .
          ?org_address locn:fullAddress ?org_full_address .
        }

        OPTIONAL { ?org_contact_point schema:email ?org_email . }
        OPTIONAL { ?org_contact_point schema:telephone ?org_telephone . }
        OPTIONAL { ?org_contact_point foaf:page ?website . }
      }
    }
    `;

    const queryResponse = await batchedQuery(queryString);

    const data = queryResponse.results.bindings.map((row) => ({
      org: getSafeValue(row, "org"),
      org_legal_name: getSafeValue(row, "org_legal_name"),
      org_classification_label: getSafeValue(row, "org_classification_label"),
      org_status_label: getSafeValue(row, "org_status_label"),
      org_kbo_number: getSafeValue(row, "org_kbo_number"),
      org_contact_point: getSafeValue(row, "org_contact_point"),
      org_full_address: getSafeValue(row, "org_full_address"),
      org_email: getSafeValue(row, "org_email"),
      org_telephone: getSafeValue(row, "org_telephone"),
      website: getSafeValue(row, "website"),
    }));

    await generateReportFromData(
      data,
      [
        "org",
        "org_legal_name",
        "org_classification_label",
        "org_status_label",
        "org_kbo_number",
        "org_contact_point",
        "org_full_address",
        "org_email",
        "org_telephone",
        "website",
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
