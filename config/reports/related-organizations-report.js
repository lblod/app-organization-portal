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
        BIND(
          IF(?role_label = "participant", "Participeert in",
            IF(?role_label = "stichtend lid", "Is oprichter van",
              IF(?role_label = "gerelateerd", "Heeft een relatie met",
                 ?role_label)))
          AS ?role_label_renamed
        )
      }
      UNION
      {

        ?membership org:member ?related_organization ;
                    org:role ?role ;
                    org:organization ?organization .
        ?role skos:prefLabel ?role_label .
        BIND(
          IF(?role_label = "participant", "Heeft als participanten",
            IF(?role_label = "stichtend lid", "Werd opgericht door",
              IF(?role_label = "gerelateerd", "Heeft een relatie met",
                 ?role_label)))
          AS ?role_label_renamed
        )
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
