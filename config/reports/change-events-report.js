import {generateReportFromData, batchedQuery} from "../helpers.js";
import {PREFIXES} from "./utils";

export default {
    cronPattern: "0 00 3 * * *",
    name: "changeEvents",
    execute: async () => {
        const reportData = {
            title: "change events",
            description:
                "List of change events",
            filePrefix: "exports/change-events",
        };

        console.log("Generating change events report");

        const queryString = `
    ${PREFIXES}

PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX regorg: <http://www.w3.org/ns/regorg#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX m8g: <http://data.europa.eu/m8g/>
PREFIX eli: <http://data.europa.eu/eli/ontology#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
PREFIX ch: <http://data.lblod.info/vocabularies/contacthub/>

SELECT DISTINCT
   ?organisatie
   ?organisatieLabel
   ?classificatieLabel
   ?statusLabel
   ?resulterendeOrganisatie
   ?resulterendeOrganisatieLabel
   ?resulterendeClassificatieLabel
   ?resulterendeStatusLabel
   ?veranderingsgebeurtenisTypeLabel
   ?beschrijving
   ?linkNaarBesluit
   ?datumMinisterieelBesluit
   ?datumPublicatieBS
   ?datumVeranderingsgebeurtenis
WHERE {
  {
    SELECT DISTINCT ?organisatie ?organisatieLabel ?veranderingsgebeurtenis
    WHERE {
      ?organisatie a <http://data.vlaanderen.be/ns/besluit#Bestuurseenheid> ;
        skos:prefLabel ?organisatieLabel .

      ?veranderingsgebeurtenis a org:ChangeEvent ;
        org:originalOrganization ?organisatie .
    }
  }

  OPTIONAL { ?organisatie org:classification/skos:prefLabel ?classificatieLabel . }
  OPTIONAL { ?organisatie regorg:orgStatus/skos:prefLabel ?statusLabel . }

  OPTIONAL {
    ?veranderingsgebeurtenis org:resultingOrganization ?resulterendeOrganisatie .
    OPTIONAL { ?resulterendeOrganisatie skos:prefLabel ?resulterendeOrganisatieLabel . }
    OPTIONAL { ?resulterendeOrganisatie org:classification/skos:prefLabel ?resulterendeClassificatieLabel . }
    OPTIONAL { ?resulterendeOrganisatie regorg:orgStatus/skos:prefLabel ?resulterendeStatusLabel . }
  }

  OPTIONAL { ?veranderingsgebeurtenis ch:typeWijziging/skos:prefLabel ?veranderingsgebeurtenisTypeLabel . }
  OPTIONAL { ?veranderingsgebeurtenis dct:description ?beschrijving . }
  OPTIONAL { ?veranderingsgebeurtenis dct:date ?datumVeranderingsgebeurtenis . }

 OPTIONAL {
     ?veranderingsgebeurtenis m8g:hasFormalFramework ?besluit .
     OPTIONAL { ?besluit foaf:page ?linkNaarBesluit . }
     OPTIONAL { ?besluit eli:date_publication ?datumPublicatieBS . }
     OPTIONAL {
       ?beslissingsactiviteit prov:generated ?besluit ;
         dossier:Activiteit.einddatum ?datumMinisterieelBesluit .
     }
   }

}
ORDER BY ?organisatieLabel ?datumVeranderingsgebeurtenis
    `;

        const queryResponse = await batchedQuery(queryString);

        const data = queryResponse.results.bindings.map((row) => ({
            organisatie: getSafeValue(row, "organisatie"),
            organisatieLabel: getSafeValue(row, "organisatieLabel"),
            classificatieLabel: getSafeValue(row, "classificatieLabel"),
            statusLabel: getSafeValue(row, "statusLabel"),
            resulterendeOrganisatie: getSafeValue(row, "resulterendeOrganisatie"),
            resulterendeOrganisatieLabel: getSafeValue(row, "resulterendeOrganisatieLabel"),
            resulterendeClassificatieLabel: getSafeValue(row, "resulterendeClassificatieLabel"),
            resulterendeStatusLabel: getSafeValue(row, "resulterendeStatusLabel"),
            veranderingsgebeurtenisTypeLabel: getSafeValue(row, "veranderingsgebeurtenisTypeLabel"),
            beschrijving: getSafeValue(row, "beschrijving"),
            linkNaarBesluit: getSafeValue(row, "linkNaarBesluit"),
            datumMinisterieelBesluit: getSafeValue(row, "datumMinisterieelBesluit"),
            datumPublicatieBS: getSafeValue(row, "datumPublicatieBS"),
            datumVeranderingsgebeurtenis: getSafeValue(row, "datumVeranderingsgebeurtenis"),
        }));

        await generateReportFromData(
            data,
            [
                "organisatie",
                "organisatieLabel",
                "classificatieLabel",
                "statusLabel",
                "resulterendeOrganisatie",
                "resulterendeOrganisatieLabel",
                "resulterendeClassificatieLabel",
                "resulterendeStatusLabel",
                "veranderingsgebeurtenisTypeLabel",
                "beschrijving",
                "linkNaarBesluit",
                "datumMinisterieelBesluit",
                "datumPublicatieBS",
                "datumVeranderingsgebeurtenis",
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
