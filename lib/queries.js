import { uuid, sparqlEscapeUri, sparqlEscapeString } from "mu";
import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';

export async function getIdentifiers(kboStructuredIdUuid) {
  const queryStr = `
    SELECT DISTINCT ?kbo ?ovo ?kboStructuredId ?ovoStructuredId ?bestuurseenheid ?kboOrganisation WHERE {
      VALUES ?g {
        <http://mu.semte.ch/graphs/administrative-unit>
        <http://mu.semte.ch/graphs/worship-service>
      }
      GRAPH ?g {
        ?kboStructuredId a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> ;
          <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(kboStructuredIdUuid)} ;
          <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?kbo .

        ?kboId <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ?kboStructuredId ;
          <http://www.w3.org/2004/02/skos/core#notation> ?kboNotation .

        ?bestuurseenheid <http://www.w3.org/ns/adms#identifier> ?kboId .

        FILTER (?kboNotation IN ("KBO nummer"@nl, "KBO nummer"))

        OPTIONAL {
          ?bestuurseeheid <http://www.w3.org/ns/adms#identifier> ?ovoId .

          ?ovoId <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ?ovoStructuredId ;
            <http://www.w3.org/2004/02/skos/core#notation> ?ovoNotation .

          OPTIONAL { ?ovoStructuredId <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?ovo . }
          
          ?bestuurseenheid owl:sameAs ?kboOrganisation .

          FILTER (?ovoNotation IN ("OVO-nummer"@nl, "OVO-nummer"))
        }
      }
    }
  `;

  const result = await query(queryStr);

  if (result.results.bindings.length) {
    const binding = result.results.bindings[0]; // We should only have one KBO/OVO couple
    return {
      kbo: binding.kbo.value,
      kboStructuredId: binding.kboStructuredId.value,
      ovo: binding.ovo?.value,
      ovoStructuredId: binding.ovoStructuredId?.value,
      adminUnit: binding.bestuurseenheid.value,
      kboUnit: binding.kboOrganisation?.value
    }
  }
  return null;
}

export async function constructOvoStructure(kboStructuredId) {
  const idUuid = uuid();
  const idUri = `http://data.lblod.info/id/identificatoren/${idUuid}`
  const structuredIdUuid = uuid();
  const structuredIdUri = `http://data.lblod.info/id/gestructureerdeIdentificatoren/${structuredIdUuid}`

  const updateStr = `
    INSERT {
      GRAPH ?g {
        ?bestuurseenheid <http://www.w3.org/ns/adms#identifier> ${sparqlEscapeUri(idUri)} .

        ${sparqlEscapeUri(idUri)} a <http://www.w3.org/ns/adms#Identifier> ;
          <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(idUuid)} ;
          <http://www.w3.org/2004/02/skos/core#notation> "OVO-nummer" ;
          <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ${sparqlEscapeUri(structuredIdUri)} .

        ${sparqlEscapeUri(structuredIdUri)} a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> ;
          <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(structuredIdUuid)} .
      }
    } WHERE {
      VALUES ?g {
        <http://mu.semte.ch/graphs/administrative-unit>
        <http://mu.semte.ch/graphs/worship-service>
      }
      GRAPH ?g {
        ${sparqlEscapeUri(kboStructuredId)} a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> ;
          <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?kbo .

        ?kboId <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ${sparqlEscapeUri(kboStructuredId)} ;
          <http://www.w3.org/2004/02/skos/core#notation> ?notation .

        ?bestuurseenheid <http://www.w3.org/ns/adms#identifier> ?kboId .

        FILTER (?notation IN ("KBO nummer"@nl, "KBO nummer"))
      }
    }
  `;

  await update(updateStr);
  return structuredIdUri;
}

export async function updateOvoNumberAndUri(ovoStructuredIdUri, wegwijsOvo) {
  let updateStr = `
    DELETE {
      GRAPH ?g {
        ?bestuureseenheid <http://www.w3.org/2002/07/owl#sameAs> ?ovoUri .
        ${sparqlEscapeUri(ovoStructuredIdUri)} <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?ovo .
      }
    }
  `;

  if (wegwijsOvo) {
    updateStr += `
      INSERT {
        GRAPH ?g {
          ?bestuureseenheid <http://www.w3.org/2002/07/owl#sameAs> ${sparqlEscapeUri(`http://data.vlaanderen.be/id/organisatie/${wegwijsOvo}`)} .
          ${sparqlEscapeUri(ovoStructuredIdUri)} <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ${sparqlEscapeString(wegwijsOvo)} .
        }
      }
    `;
  }

  updateStr += `
    WHERE {
      VALUES ?g {
        <http://mu.semte.ch/graphs/administrative-unit>
        <http://mu.semte.ch/graphs/worship-service>
      }
      GRAPH ?g {

        ${sparqlEscapeUri(ovoStructuredIdUri)} a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> .

        OPTIONAL {
          ?bestuureseenheid
          <http://www.w3.org/ns/adms#identifier>/<https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ${sparqlEscapeUri(ovoStructuredIdUri)} ;
          <http://www.w3.org/2002/07/owl#sameAs> ?ovoUri .
        }

        OPTIONAL { ${sparqlEscapeUri(ovoStructuredIdUri)} <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?ovo . }
      }
    }
  `;
    
  await update(updateStr);
}

export async function getAllOvoAndKboCouples() {
  const queryStr = `
    SELECT DISTINCT ?kbo ?ovo ?kboStructuredId ?ovoStructuredId WHERE {
      VALUES ?g {
        <http://mu.semte.ch/graphs/administrative-unit>
        <http://mu.semte.ch/graphs/worship-service>
      }
      GRAPH ?g {
        ?kboId <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ?kboStructuredId ;
          <http://www.w3.org/2004/02/skos/core#notation> ?kboNotation .

        ?kboStructuredId a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> ;
          <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?kbo .

        ?bestuurseeheid <http://www.w3.org/ns/adms#identifier> ?kboId .

        FILTER (?kboNotation IN ("KBO nummer"@nl, "KBO nummer"))

        OPTIONAL {
          ?bestuurseeheid <http://www.w3.org/ns/adms#identifier> ?ovoId .

          ?ovoId <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ?ovoStructuredId ;
            <http://www.w3.org/2004/02/skos/core#notation> ?ovoNotation .

          OPTIONAL { ?ovoStructuredId <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?ovo . }

          FILTER (?ovoNotation IN ("OVO-nummer"@nl, "OVO-nummer"))
        }
      }
    }
  `;

  const result = await query(queryStr);

  if (result.results.bindings.length) {
    const bindings = result.results.bindings;
    return bindings.map(binding => {
      return {
        kbo: binding.kbo.value,
        kboStructuredId: binding.kboStructuredId.value,
        ovo: binding.ovo?.value,
        ovoStructuredId: binding.ovoStructuredId?.value,
      }
    });
  }
  return null;
}

export async function createRechtsVormStructure(){

}

export async function createNewKboOrg(kboOrg ,kboNummer){
  const newKboOrgIdUuId = uuid();
  const newKboIdUri = `http://data.lblod.info/id/kboBestuurseenheden/${newKboOrgIdUuId}`;

  const contactPointUuidId = uuid();
  const contactPointUri = `http://data.lblod.info/id/contact-punten/${contactPointUuidId}`;



  let updateStr = `
  INSERT {
    GRAPH ?g {

      ${sparqlEscapeUri(contactPointUri)} a <http://schema.org/ContactPoint> ;
                                            <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(contactPointUuidId)} ;
                                            <http://schema.org/email> ${sparqlEscapeString(kboOrg.email)} ;
                                            <http://schema.org/telephone> ${sparqlEscapeString(kboOrg.phone)} ;
                                            <http://xmlns.com/foaf/0.1/page> ${sparqlEscapeString(kboOrg.website)}.



      ${sparqlEscapeUri(newKboIdUri)} a <http://mu.semte.ch/vocabularies/ext/KboEenheid> ;
                                        <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(newKboOrgIdUuId)} ;
                                        <http://mu.semte.ch/vocabularies/ext/rechtsvorm> ${sparqlEscapeString(kboOrg.rechtsvorm)} ;
                                        <http://www.w3.org/2004/02/skos/core#prefLabel> ${sparqlEscapeString(kboOrg.organisationName)} ;
                                        <http://www.w3.org/2004/02/skos/core#altLabel> ${sparqlEscapeString(kboOrg.formalName)} ;
                                        <https://data.lblod.info/vocabularies/generiek/geplandeEindDatum> ${sparqlEscapeString(kboOrg.changeTime)} ;
                                        <http://schema.org/contactPoint> ${sparqlEscapeUri(contactPointUri)} .
    }
  }WHERE{
    VALUES ?g {
      <http://mu.semte.ch/graphs/administrative-unit>
    }
  }   
  `

  await update(updateStr);
  return newKboIdUri;
}



export async function linkAbbOrgToKboOrg(abbOrgUri ,kboOrgUri){
  let updateStr = `
  INSERT {
    GRAPH ?g {
      ${sparqlEscapeUri(kboOrgUri)} <http://www.w3.org/2002/07/owl#sameAs> ${sparqlEscapeUri(abbOrgUri)} .
    }
  }WHERE {
    VALUES ?g {
      <http://mu.semte.ch/graphs/administrative-unit>
    }
  } 
  `

  await update(updateStr);
}




// Update queries: via mu-auth if it comes from the frontend ?
