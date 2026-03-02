import { generateReportFromData, batchedQuery } from "../helpers.js";
import { PREFIXES } from "./utils";

export default {
  cronPattern: "0 00 4 * * *",
  name: "organizationsDetail",
  execute: async () => {
    const reportData = {
      title: "organizations detail",
      description:
        "List of Organizations with address and contact information",
      filePrefix: "exports/organizations-detail",
    };

    console.log("Generating organizations detail report");

    const queryString = `
    ${PREFIXES}

     SELECT DISTINCT ?org
       ?org_pref_label ?org_classification_label ?org_status_label ?org_kbo_number

       ?primary_email
       ?website
       ?primary_telephone
       ?secondary_telephone

       ?full_address
       ?land
       ?gemeente
       ?straat
       ?huisnummer
       ?busnummer
       ?postcode
       ?province

     WHERE {
       ?org a org:Organization .
       OPTIONAL { ?org regorg:legalName ?org_legal_name . }
       OPTIONAL { ?org skos:prefLabel ?org_pref_label . }
       OPTIONAL {
         ?org org:classification ?org_classification .
         ?org_classification skos:prefLabel ?org_classification_label .
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
         ?org org:hasPrimarySite ?org_site .
         ?org_site organisatie:bestaatUit ?org_address .
         ?org_site org:siteAddress ?org_contact_point .

         OPTIONAL {
           ?org_contact_point schema:email ?primary_email .
           ?org_contact_point schema:contactType "primary" .
         }
         OPTIONAL {
           ?org_contact_point schema:telephone ?primary_telephone .
           ?org_contact_point schema:contactType "primary" .
         }
         OPTIONAL {
           ?org_contact_point schema:telephone ?secondary_telephone .
           ?org_contact_point schema:contactType "secondary" .
         }

         OPTIONAL {
           ?org_contact_point foaf:page ?website .
           ?org_contact_point schema:contactType "primary" .
         }

         OPTIONAL { ?org_contact_point schema:contactType ?contact_type . }

         OPTIONAL { ?org_address locn:fullAddress ?full_address . }
         OPTIONAL { ?org_address adres:land ?land . }
         OPTIONAL { ?org_address adres:gemeentenaam ?gemeente . }
         OPTIONAL { ?org_address locn:thoroughfare ?straat . }
         OPTIONAL { ?org_address adres:Adresvoorstelling.huisnummer ?huisnummer . }
         OPTIONAL { ?org_address adres:Adresvoorstelling.busnummer ?busnummer . }
         OPTIONAL { ?org_address locn:postCode ?postcode . }
         OPTIONAL { ?org_address locn:adminUnitL2 ?province . }
       }
     }
    `;

    const queryResponse = await batchedQuery(queryString);

    const data = queryResponse.results.bindings.map((row) => ({
      org: getSafeValue(row, "org"),
      org_pref_label: getSafeValue(row, "org_pref_label"),
      org_classification_label: getSafeValue(row, "org_classification_label"),
      org_status_label: getSafeValue(row, "org_status_label"),
      org_kbo_number: getSafeValue(row, "org_kbo_number"),
      primary_email: getSafeValue(row, "primary_email"),
      website: getSafeValue(row, "website"),
      primary_telephone: getSafeValue(row, "primary_telephone"),
      secondary_telephone: getSafeValue(row, "secondary_telephone"),
      full_address: getSafeValue(row, "full_address"),
      land: getSafeValue(row, "land"),
      gemeente: getSafeValue(row, "gemeente"),
      straat: getSafeValue(row, "straat"),
      huisnummer: getSafeValue(row, "huisnummer"),
      busnummer: getSafeValue(row, "busnummer"),
      postcode: getSafeValue(row, "postcode"),
      province: getSafeValue(row, "province"),
    }));

    await generateReportFromData(
      data,
      [
        "org",
        "org_pref_label",
        "org_classification_label",
        "org_status_label",
        "org_kbo_number",
        "primary_email",
        "website",
        "primary_telephone",
        "secondary_telephone",
        "full_address",
        "land",
        "gemeente",
        "straat",
        "huisnummer",
        "busnummer",
        "postcode",
        "province",
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
