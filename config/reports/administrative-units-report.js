import { generateReportFromData, batchedQuery } from "../helpers.js";
import { PREFIXES } from "./utils";

export default {
  cronPattern: "0 00 1 * * *",
  name: "administrative units",
  execute: async () => {
    const reportData = {
      title: "administrative units",
      description: "List of the administrative units",
      filePrefix: "exports/administrative-units",
    };

    console.log("Generating administrative units report");

    const queryString = `
    ${PREFIXES}
    
    SELECT DISTINCT
      ?Bestuurseenheid
      ?Classificatie
      ?Status
      ?KBO_nr
      ?OVO_nr
      ?Sharepoint_id
      ?NIS_code
      ?Regio
      ?Provincie
      ?Straat
      ?Huisnummer
      ?Busnummer
      ?Postcode
      ?Gemeente
      (STR(?GrensoverschrijdendBoolean) AS ?Grensoverschrijdend)
      ?TypeEredienst
      ?BestuurseenheidURI
      ?Stekking
    {
      VALUES ?type {
        besluit:Bestuurseenheid
        ere:BestuurVanDeEredienst
        org:Organization
        ere:EredienstBestuurseenheid
        ere:CentraalBestuurVanDeEredienst
      }
    
      ?BestuurseenheidURI 
        a ?type.
      OPTIONAL { ?BestuurseenheidURI skos:prefLabel ?Bestuurseenheid . }
      OPTIONAL { ?BestuurseenheidURI org:classification/skos:prefLabel ?Classificatie. }
    
      OPTIONAL {
        ?BestuurseenheidURI besluit:werkingsgebied ?werkingsgebiedURI.
        ?werkingsgebiedURI rdfs:label ?werkingsgebied.
        OPTIONAL {
          ?werkingsgebiedURI geo:sfWithin ?regionURI.
          ?regionURI 
            ext:werkingsgebiedNiveau "Referentieregio"@nl;
            rdfs:label ?langRegio.
        }
        OPTIONAL {
          ?werkingsgebiedURI skos:exactMatch ?nisArea.
            ?nisArea skos:inScheme ?NISCodeScheme;
            skos:notation ?NIS_code.
    
          FILTER (?NISCodeScheme IN ( <http://vocab.belgif.be/auth/refnis2019>, <http://vocab.belgif.be/auth/refnis2025>))
        }
      }
      OPTIONAL {
        ?BestuurseenheidURI org:hasPrimarySite/organisatie:bestaatUit ?address .
        ?address adres:gemeentenaam ?Gemeente .
    
        ?municipalityRegio a besluit:Bestuurseenheid ;
          skos:prefLabel ?Gemeente ;
          org:classification <http://data.vlaanderen.be/id/concept/BestuurseenheidClassificatieCode/5ab0e9b8a3b2ca7c5e000001> ;
          besluit:werkingsgebied ?werkingsgebiedRegioURI.
    
          ?werkingsgebiedRegioURI geo:sfWithin ?regioViaAddressURI.
          ?regioViaAddressURI 
            ext:werkingsgebiedNiveau "Referentieregio"@nl;
            rdfs:label ?langRegioViaAddress.
      }
    
      BIND(IF(BOUND(?langRegio) && strlen(?langRegio)>0, str(?langRegio), str(?langRegioViaAddress)) AS ?Regio)
    
      OPTIONAL { ?BestuurseenheidURI regorg:orgStatus/skos:prefLabel ?Status. }
      OPTIONAL { ?BestuurseenheidURI ere:typeEredienst ?typeEredienstUri.
        OPTIONAL { ?typeEredienstUri skos:prefLabel ?TypeEredienst. }
      }
      OPTIONAL { ?BestuurseenheidURI ere:grensoverschrijdend ?GrensoverschrijdendBoolean. }
      OPTIONAL { ?BestuurseenheidURI org:hasPrimarySite/organisatie:bestaatUit ?address .
        OPTIONAL { ?address locn:thoroughfare ?Straat }
        OPTIONAL { ?address adres:Adresvoorstelling.huisnummer ?Huisnummer . }
        OPTIONAL { ?address adres:Adresvoorstelling.busnummer ?Busnummer . }
        OPTIONAL { ?address locn:postCode ?Postcode . }
        OPTIONAL { ?address adres:gemeentenaam ?Gemeente . }
        OPTIONAL { ?address locn:adminUnitL2 ?Provincie . }
        OPTIONAL { ?address adres:land ?Land . }
      }
      OPTIONAL {
        ?BestuurseenheidURI adms:identifier ?kbo_identifier .
        ?kbo_identifier
          skos:notation ?kbo_notation;
          generiek:gestructureerdeIdentificator/generiek:lokaleIdentificator ?KBO_nr.
        FILTER (str(?kbo_notation) = "KBO nummer")
      }
      OPTIONAL {
        ?BestuurseenheidURI adms:identifier ?ovo_identifier .
        ?ovo_identifier
          skos:notation ?ovo_notation;
          generiek:gestructureerdeIdentificator/generiek:lokaleIdentificator ?OVO_nr.
        FILTER (str(?ovo_notation) = "OVO-nummer")
      }
      OPTIONAL {
        ?BestuurseenheidURI adms:identifier ?sp_identifier .
        ?sp_identifier
          skos:notation ?sp_notation;
          generiek:gestructureerdeIdentificator/generiek:lokaleIdentificator ?Sharepoint_id.
        FILTER (str(?sp_notation) = "SharePoint identificator")
      }
      OPTIONAL {
        ?changeEvent org:resultingOrganization ?BestuurseenheidURI;
          ch:typeWijziging <http://lblod.data.gift/concepts/e4c3d1ef-a34d-43b0-a18c-f4e60e2c8af3>.
        <http://lblod.data.gift/concepts/e4c3d1ef-a34d-43b0-a18c-f4e60e2c8af3> skos:prefLabel ?stadsTitel
      }
      OPTIONAL { ?BestuurseenheidURI ere:denominatie ?Stekking. }
    } ORDER BY DESC(?Classificatie) ?Bestuurseenheid
    `;

    const queryResponse = await batchedQuery(queryString);

    const data = queryResponse.results.bindings.map((row) => ({
        Bestuurseenheid: getSafeValue(row, "Bestuurseenheid"),
        Classificatie: getSafeValue(row, "Classificatie"),
        Status: getSafeValue(row, "Status"),
        KBO_nr: getSafeValue(row, "KBO_nr"),
        OVO_nr: getSafeValue(row, "OVO_nr"),
        Sharepoint_id: getSafeValue(row, "Sharepoint_id"),
        NIS_code: getSafeValue(row, "NIS_code"),
        Regio: getSafeValue(row, "Regio"),
        Provincie: getSafeValue(row, "Provincie"),
        Straat: getSafeValue(row, "Straat"),
        Huisnummer: getSafeValue(row, "Huisnummer"),
        Busnummer: getSafeValue(row, "Busnummer"),
        Postcode: getSafeValue(row, "Postcode"),
        Gemeente: getSafeValue(row, "Gemeente"),
        Grensoverschrijdend: getSafeValue(row, "Grensoverschrijdend"),
        TypeEredienst: getSafeValue(row, "TypeEredienst"),
        BestuurseenheidURI: getSafeValue(row, "BestuurseenheidURI"),
        Stekking: getSafeValue(row, "Stekking"),
    }));

    await generateReportFromData(
        data,
        [
          "Bestuurseenheid",
          "Classificatie",
          "Status",
          "KBO_nr",
          "OVO_nr",
          "Sharepoint_id",
          "NIS_code",
          "Regio",
          "Provincie",
          "Straat",
          "Huisnummer",
          "Busnummer",
          "Postcode",
          "Gemeente",
          "Grensoverschrijdend",
          "TypeEredienst",
          "BestuurseenheidURI",
          "Stekking",
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
