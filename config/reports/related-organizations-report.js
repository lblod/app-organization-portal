import { generateReportFromData, batchedQuery } from "../helpers.js";
import { PREFIXES } from "./utils";

export default {
  cronPattern: "0 00 4 * * *",
  name: "relatedOrganizations",
  execute: async () => {
    const reportData = {
      title: "related organizations",
      description: "List of related Organizations and their relationships",
      filePrefix: "exports/related-organizations",
    };

    console.log("Generating related organizations report");

    // Display label per role, read from the org:member side and from the
    // org:organization side. Keep in sync with MEMBERSHIP_ROLES_MAPPING in
    // frontend-organization-portal (app/models/membership-role.js).
    const roleLabels = `
        OPTIONAL {
          VALUES (?role ?member_perspective_label ?organization_perspective_label) {
            (<http://data.lblod.info/id/rollen/4ec7d5c39bdc4e84b4174379b9e22ad8> "Heeft een relatie met" "Heeft een relatie met")
            (<http://data.lblod.info/id/rollen/73d5e1cf250d42fab15926771f07505a> "Is oprichter van" "Werd opgericht door")
            (<http://data.lblod.info/id/rollen/2152eb830b1143bfb97a7dd9596d6c63> "Is lid van" "Heeft als leden")
            (<http://data.lblod.info/id/rollen/d44a34ed-5007-45fe-9adb-43b695740dbc> "Verleent erkenning aan" "Werd erkend door")
            (<http://data.lblod.info/id/rollen/2c0994d0-5e25-4b43-b2e4-12c98028bccb> "Is feitelijk vertegenwoordigd in (niet lidmaatschap)" "Heeft als feitelijke vertegenwoordigers (niet lidmaatschap)")
            (<http://data.lblod.info/id/rollen/de8efef6-8d5c-42aa-90e9-1b9e9d27f395> "Bedient" "Wordt bediend door")
          }
        }`;

    const queryString = `
    ${PREFIXES}

    SELECT DISTINCT
      ?role_label_renamed
      ?organization
      ?organization_label
      ?organization_classification_label
      ?organization_status_label
      ?organization_kbo_number
      ?related_organization
      ?related_organization_label
      ?related_organization_classification_label
      ?related_organization_status_label
      ?related_organization_kbo_number
    WHERE {
      {
        ?membership org:member ?organization ;
                    org:role ?role ;
                    org:organization ?related_organization .
        ?role skos:prefLabel ?role_label .
        ${roleLabels}
        BIND(COALESCE(?member_perspective_label, ?role_label) AS ?role_label_renamed)
      }
      UNION
      {
        ?membership org:member ?related_organization ;
                    org:role ?role ;
                    org:organization ?organization .
        ?role skos:prefLabel ?role_label .
        ${roleLabels}
        BIND(COALESCE(?organization_perspective_label, ?role_label) AS ?role_label_renamed)
      }

      ?organization a org:Organization ;
                    skos:prefLabel ?organization_label ;
                    regorg:orgStatus ?organization_status .

      OPTIONAL { ?organization_status skos:prefLabel ?organization_status_label . }

      ?organization org:classification ?organization_classification .
      ?organization_classification skos:prefLabel ?organization_classification_label .

      ?related_organization skos:prefLabel ?related_organization_label ;
                            regorg:orgStatus ?related_organization_status .

      OPTIONAL { ?related_organization_status skos:prefLabel ?related_organization_status_label . }

      ?related_organization org:classification ?related_organization_classification .
      ?related_organization_classification skos:prefLabel ?related_organization_classification_label .

      OPTIONAL {
        ?organization adms:identifier ?identifier1 .
        ?identifier1 skos:notation "KBO nummer" ;
                     generiek:gestructureerdeIdentificator ?id1 .
        ?id1 generiek:lokaleIdentificator ?organization_kbo_number .
      }
      OPTIONAL {
        ?related_organization adms:identifier ?identifier2 .
        ?identifier2 skos:notation "KBO nummer" ;
                     generiek:gestructureerdeIdentificator ?id2 .
        ?id2 generiek:lokaleIdentificator ?related_organization_kbo_number .
      }
    }
    ORDER BY ?organization
    `;

    const queryResponse = await batchedQuery(queryString);

    const data = queryResponse.results.bindings.map((row) => ({
      role_label_renamed: getSafeValue(row, "role_label_renamed"),
      organization: getSafeValue(row, "organization"),
      organization_label: getSafeValue(row, "organization_label"),
      organization_classification_label: getSafeValue(row, "organization_classification_label"),
      organization_status_label: getSafeValue(row, "organization_status_label"),
      organization_kbo_number: getSafeValue(row, "organization_kbo_number"),
      related_organization: getSafeValue(row, "related_organization"),
      related_organization_label: getSafeValue(row, "related_organization_label"),
      related_organization_classification_label: getSafeValue(row, "related_organization_classification_label"),
      related_organization_status_label: getSafeValue(row, "related_organization_status_label"),
      related_organization_kbo_number: getSafeValue(row, "related_organization_kbo_number"),
    }));

    await generateReportFromData(
      data,
      [
        "role_label_renamed",
        "organization",
        "organization_label",
        "organization_classification_label",
        "organization_status_label",
        "organization_kbo_number",
        "related_organization",
        "related_organization_label",
        "related_organization_classification_label",
        "related_organization_status_label",
        "related_organization_kbo_number",
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
