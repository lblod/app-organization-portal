import { uuid, sparqlEscapeUri, sparqlEscapeString } from "mu";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";

export async function getAbbOrganizationInfo(kboStructuredIdUuid) {
  const queryStr = `
    SELECT DISTINCT ?kbo ?kboId ?ovo ?kboStructuredId ?ovoStructuredId ?bestuurseenheid WHERE {
      VALUES ?g {
        <http://mu.semte.ch/graphs/administrative-unit>
        <http://mu.semte.ch/graphs/worship-service>
      }
      GRAPH ?g {
        ?kboStructuredId a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> ;
          <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(
            kboStructuredIdUuid
          )} ;
          <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?kbo .

        ?kboId <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ?kboStructuredId ;
          <http://www.w3.org/2004/02/skos/core#notation> ?kboNotation .

        ?bestuurseenheid <http://www.w3.org/ns/adms#identifier> ?kboId .

        FILTER (?kboNotation IN ("KBO nummer"@nl, "KBO nummer"))

        OPTIONAL {
          ?bestuurseeheid <http://www.w3.org/ns/adms#identifier> ?ovoId .

          ?ovoId <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ?ovoStructuredId ;
            <http://www.w3.org/2004/02/skos/core#notation> ?ovoNotation .

          OPTIONAL { ?ovoStructuredId <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?ovo . 
        }
          
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
      kboId: binding.kboId?.value,
      adminUnit: binding.bestuurseenheid.value,
    };
  }
  return null;
}

export async function getKboOrgnizationInfo(administrativeUnit) {
  const queryStr = `
    SELECT DISTINCT ?kboUnit ?abbUnit ?changeTime ?contactPointUri ?addressUri WHERE {
      VALUES ?g {
        <http://mu.semte.ch/graphs/administrative-unit>
        <http://mu.semte.ch/graphs/worship-service>
      }
      GRAPH ?g {
        ?kboUnit a <http://mu.semte.ch/vocabularies/ext/KboEenheid> ;
        <http://mu.semte.ch/vocabularies/core/uuid> ?uuid ;
        <http://schema.org/contactPoint> ?contactPointUri ;
        <https://data.lblod.info/vocabularies/generiek/geplandeEindDatum> ?changeTime .

        ?contactPointUri <http://www.w3.org/ns/locn#address> ?addressUri .

        ?kboUnit <http://www.w3.org/2002/07/owl#sameAs> ?abbUnit     

        FILTER(?abbUnit = ${sparqlEscapeUri(administrativeUnit)})
      }
    }
  `;

  const result = await query(queryStr);

  if (result.results.bindings.length) {
    const binding = result.results.bindings[0];
    return {
      kboUnit: binding.kboUnit?.value,
      abbUnit: binding.abbUnit?.value,
      changeTime: binding.changeTime?.value,
      contactPointUri: binding.contactPointUri?.value,
      addressUri: binding.addressUri?.value,
    };
  }
  return null;
}

export async function constructOvoStructure(kboStructuredId) {
  const idUuid = uuid();
  const idUri = `http://data.lblod.info/id/identificatoren/${idUuid}`;
  const structuredIdUuid = uuid();
  const structuredIdUri = `http://data.lblod.info/id/gestructureerdeIdentificatoren/${structuredIdUuid}`;

  const updateStr = `
    INSERT {
      GRAPH ?g {
        ?bestuurseenheid <http://www.w3.org/ns/adms#identifier> ${sparqlEscapeUri(
          idUri
        )} .

        ${sparqlEscapeUri(idUri)} a <http://www.w3.org/ns/adms#Identifier> ;
          <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(
            idUuid
          )} ;
          <http://www.w3.org/2004/02/skos/core#notation> "OVO-nummer" ;
          <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ${sparqlEscapeUri(
            structuredIdUri
          )} .

        ${sparqlEscapeUri(
          structuredIdUri
        )} a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> ;
          <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(
            structuredIdUuid
          )} .
      }
    } WHERE {
      VALUES ?g {
        <http://mu.semte.ch/graphs/administrative-unit>
        <http://mu.semte.ch/graphs/worship-service>
      }
      GRAPH ?g {
        ${sparqlEscapeUri(
          kboStructuredId
        )} a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> ;
          <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?kbo .

        ?kboId <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ${sparqlEscapeUri(
          kboStructuredId
        )} ;
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
        ${sparqlEscapeUri(
          ovoStructuredIdUri
        )} <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?ovo .
      }
    }
  `;

  if (wegwijsOvo) {
    updateStr += `
      INSERT {
        GRAPH ?g {
          ?bestuureseenheid <http://www.w3.org/2002/07/owl#sameAs> ${sparqlEscapeUri(
            `http://data.vlaanderen.be/id/organisatie/${wegwijsOvo}`
          )} .
          ${sparqlEscapeUri(
            ovoStructuredIdUri
          )} <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ${sparqlEscapeString(
      wegwijsOvo
    )} .
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

        ${sparqlEscapeUri(
          ovoStructuredIdUri
        )} a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> .

        OPTIONAL {
          ?bestuureseenheid
          <http://www.w3.org/ns/adms#identifier>/<https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ${sparqlEscapeUri(
            ovoStructuredIdUri
          )} ;
          <http://www.w3.org/2002/07/owl#sameAs> ?ovoUri .
        }

        OPTIONAL { ${sparqlEscapeUri(
          ovoStructuredIdUri
        )} <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?ovo . }
      }
    }
  `;

  await update(updateStr);
}

export async function getAllAbbKboOrganizations() {
  let queryStr = `
   SELECT ?kbo ?ovo ?kboStructuredId ?ovoStructuredId ?abbOrg ?kboOrg ?kboId ?changeTime  where {
       VALUES ?g {
         <http://mu.semte.ch/graphs/administrative-unit>
         <http://mu.semte.ch/graphs/worship-service>
       }
       GRAPH ?g {
         ?kboId <https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator> ?kboStructuredId ;
               <http://www.w3.org/2004/02/skos/core#notation> ?kboNotation .
     
         ?kboStructuredId a <https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator> ;
               <https://data.vlaanderen.be/ns/generiek#lokaleIdentificator> ?kbo .
     
         ?abbOrg <http://www.w3.org/ns/adms#identifier> ?kboId .
     
         FILTER (?kboNotation IN ("KBO nummer"@nl, "KBO nummer"))
         FILTER (!regex(?abbOrg, "kboBestuurseenheden","i"))
     
         OPTIONAL{
           ?kboOrg owl:sameAs ?abbOrg .
           ?kboOrg <https://data.lblod.info/vocabularies/generiek/geplandeEindDatum> ?changeTime ;
                    <http://mu.semte.ch/vocabularies/ext/rechtsvorm> ?rechtsVrom ;
                                           <http://mu.semte.ch/vocabularies/ext/shortName> ?shortName ;
                                           <http://mu.semte.ch/vocabularies/ext/startDate> ?startDate ;
                                           <http://www.w3.org/2004/02/skos/core#prefLabel> ?commercialName ;
                                           <http://www.w3.org/2004/02/skos/core#altLabel> ?legalName ;
                                           <http://www.w3.org/ns/regorg#orgStatus> ?activeState ;
                                           <http://schema.org/contactPoint> ?contact .
   
           ?contact <http://schema.org/email> ?email ;
                    <http://schema.org/telephone> ?phone ;
                    <http://schema.org/contactType> ?contactType ;
                    <http://xmlns.com/foaf/0.1/page> ?website ;
                    <http://www.w3.org/ns/locn#address> ?address .
   
           ?address <http://www.w3.org/ns/locn#fullAddress> ?fullAddress.
   
         }
         OPTIONAL{
          ?abbOrg <http://www.w3.org/ns/adms#identifier> ?ovoId .
 
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
    return bindings.map((binding) => {
      return {
        kbo: binding.kbo?.value,
        kboStructuredId: binding.kboStructuredId.value,
        ovo: binding.ovo?.value,
        ovoStructuredId: binding.ovoStructuredId?.value,
        kboOrg: binding.kboOrg?.value,
        abbOrg: binding.abbOrg?.value,
        kboId: binding.kboId?.value,
        changeTime: binding.changeTime?.value,
      };
    });
  }
  return null;
}

export async function createNewKboOrg(kboOrg, kboId) {
  const newKboOrgIdUuId = uuid();
  const newKboIdUri = `http://data.lblod.info/id/kboBestuurseenheden/${newKboOrgIdUuId}`;

  const contactPointUuidId = uuid();
  const contactPointUri = `http://data.lblod.info/id/contact-punten/${contactPointUuidId}`;

  const adressUuidId = uuid();
  const adressUri = `http://data.lblod.info/id/adressen/${adressUuidId}`;

  let updateStr = `
  INSERT {
    GRAPH ?g {
      ${sparqlEscapeUri(adressUri)} a <http://www.w3.org/ns/locn#Address> ;
                                      <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(
                                        adressUuidId
                                      )} `
  if(kboOrg.formattedAddress){
    updateStr += `;
       <http://www.w3.org/ns/locn#fullAddress> ${sparqlEscapeString(
      kboOrg.formattedAddress
    )}`
  }
  updateStr += " ."    
  

  updateStr += `                               
      ${sparqlEscapeUri(contactPointUri)} a <http://schema.org/ContactPoint> ;
                                            <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(
                                              contactPointUuidId)} `
  if(kboOrg.email){
    updateStr += `; <http://schema.org/email> ${sparqlEscapeString(
      kboOrg.email
    )}`
  }
  if(kboOrg.phone){
    updateStr += `; <http://schema.org/telephone> ${sparqlEscapeString(
      kboOrg.phone
    )}`
  }
  if(kboOrg.website){
    updateStr += `; <http://xmlns.com/foaf/0.1/page> ${sparqlEscapeString(
      kboOrg.website
    )}`
  }  
  updateStr += `
    ; <http://schema.org/contactType> ${sparqlEscapeString("Kbocontact")} ;
    <http://www.w3.org/ns/locn#address> ${sparqlEscapeUri(adressUri)}.`                                         



  updateStr +=`    ${sparqlEscapeUri(
        newKboIdUri
      )} a <http://mu.semte.ch/vocabularies/ext/KboEenheid> ;
                                        <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(
                                          newKboOrgIdUuId
                                        )}`

  if(kboOrg.rechtsvorm){
    updateStr += `; <http://mu.semte.ch/vocabularies/ext/rechtsvorm> ${sparqlEscapeString(
      kboOrg.rechtsvorm
    )}` 
  }                                      
  if(kboOrg.shortName){
    updateStr += `; <http://mu.semte.ch/vocabularies/ext/shortName> ${sparqlEscapeString(
      kboOrg.shortName
    )}` 
  }                                      
  if(kboOrg.startDate){
    updateStr += `; <http://mu.semte.ch/vocabularies/ext/startDate> ${sparqlEscapeString(
      kboOrg.startDate
    )}` 
  }                                      
  if(kboOrg.formalName){
    updateStr += `; <http://www.w3.org/2004/02/skos/core#altLabel> ${sparqlEscapeString(
      kboOrg.formalName
    )}` 
  }                                      
  if(kboOrg.organisationName){
    updateStr += `;  <http://www.w3.org/2004/02/skos/core#prefLabel> ${sparqlEscapeString(
      kboOrg.organisationName
    )}` 
  }                                      
  if(kboOrg.changeTime){
    updateStr += `; <https://data.lblod.info/vocabularies/generiek/geplandeEindDatum> ${sparqlEscapeString(
      kboOrg.changeTime
    )}` 
  }                                      
  if(kboId){
    updateStr += `; <http://www.w3.org/ns/adms#identifier> ${sparqlEscapeUri(
      kboId
    )}` 
  }                                      
  if(kboOrg.activeState){
    updateStr += `; <http://www.w3.org/ns/regorg#orgStatus> ${sparqlEscapeUri(
      kboOrg.activeState
    )}` 
  }                                      
  updateStr += `; <http://schema.org/contactPoint> ${sparqlEscapeUri(
          contactPointUri
        )} .    
      }
  }WHERE{
    VALUES ?g {
      <http://mu.semte.ch/graphs/administrative-unit>
    }
  }   
  `;

  await update(updateStr);
  return newKboIdUri;
}

export async function updateKboOrg(newKboInfo, identifiers) {

  //update address
  let updateStr = `
    DELETE{
      GRAPH ?g{
        ?adressUri a <http://www.w3.org/ns/locn#Address> ;
                    <http://www.w3.org/ns/locn#fullAddress> ?fulladdress  .
      }
      INSERT{
        graph ?g{ 
          ?adressUri a <http://www.w3.org/ns/locn#Address> 
  `;      
  if(newKboInfo.formattedAddress){
    updateStr += `
      ;
      <http://www.w3.org/ns/locn#fullAddress> ${sparqlEscapeString(
        newKboInfo.formattedAddress
      )}
    `;
  }                
  updateStr += `                    
            .
          }
        } 
  `;
  updateStr += `
    WHERE{
      VALUES ?g {
        <http://mu.semte.ch/graphs/administrative-unit> 
      }
      GRAPH ?g {
        ?adressUri a <http://www.w3.org/ns/locn#Address> ;
                  <http://www.w3.org/ns/locn#fullAddress> ?fulladdress  .
        
        FILTER(?adressUri = ${sparqlEscapeUri(identifiers.addressUri)})
      }
    }  
  `;
  await update(updateStr);

  //update ContactPoint
  updateStr = `
    DELETE{
      GRAPH ?g{
        ?contact a <http://schema.org/ContactPoint> ;
                  <http://schema.org/email> ?email ;
                  <http://schema.org/telephone> ?phone ;
                  <http://xmlns.com/foaf/0.1/page> ?website .
      }
    }
    INSERT{
      graph ?g{ 
        ?contact a <http://schema.org/ContactPoint> 
  `;
  if(newKboInfo.email){
    updateStr += `; <http://schema.org/email> ${sparqlEscapeString(
      newKboInfo.email
    )}`
  }
  if(newKboInfo.phone){
    updateStr += `; <http://schema.org/telephone> ${sparqlEscapeString(
      newKboInfo.phone
    )}`
  }
  if(newKboInfo.phone){
    updateStr += `; <http://xmlns.com/foaf/0.1/page> ${sparqlEscapeString(
      newKboInfo.website
    )}`
  }
  updateStr += `
      .
    }
  }
  `;
  updateStr += `
  WHERE{
    VALUES ?g {
      <http://mu.semte.ch/graphs/administrative-unit> 
    }
    GRAPH ?g {
      ?contact a <http://schema.org/ContactPoint> ;
                <http://schema.org/email> ?email ;
                <http://schema.org/telephone> ?phone ;
                <http://xmlns.com/foaf/0.1/page> ?website .
      
      FILTER(?contact = ${sparqlEscapeUri(identifiers.contactPointUri)})
    }
  } 
  `;
  await update(updateStr);

  //update kboUnit
  updateStr = `
    DELETE{
      GRAPH ?g{
        ?kboUnit a <http://mu.semte.ch/vocabularies/ext/KboEenheid> ;
                  <http://mu.semte.ch/vocabularies/ext/rechtsvorm> ?rechtsVorm ;
                  <http://mu.semte.ch/vocabularies/ext/shortName> ?shortName ;
                  <http://mu.semte.ch/vocabularies/ext/startDate> ?startDate ;
                  <http://www.w3.org/2004/02/skos/core#prefLabel> ?orgName ;
                  <http://www.w3.org/2004/02/skos/core#altLabel>  ?commercialName ;
                  <https://data.lblod.info/vocabularies/generiek/geplandeEindDatum> ?changeTime ;
                  <http://www.w3.org/ns/regorg#orgStatus> ?activeState .
      }                                
    }
    INSERT{
      graph ?g{ 
        ?kboUnit a <http://mu.semte.ch/vocabularies/ext/KboEenheid> 
  `;
  if(newKboInfo.rechtsvorm){
    updateStr += `
      ;
      <http://mu.semte.ch/vocabularies/ext/rechtsvorm> ${sparqlEscapeString(
        newKboInfo.rechtsvorm
      )}
    `;
  }
  if(newKboInfo.shortName){
    updateStr += `
      ;
      <http://mu.semte.ch/vocabularies/ext/shortName> ${sparqlEscapeString(
        newKboInfo.shortName
      )}
    `;
  }
  if(newKboInfo.startDate){
    updateStr += `
      ;
      <http://mu.semte.ch/vocabularies/ext/startDate> ${sparqlEscapeString(
        newKboInfo.startDate
      )}
    `;
  }
  if(newKboInfo.organisationName){
    updateStr += `
      ;
      <http://www.w3.org/2004/02/skos/core#prefLabel> ${sparqlEscapeString(
        newKboInfo.organisationName
      )} 
    `;
  }
  if(newKboInfo.formalName){
    updateStr += `
      ;
      <http://www.w3.org/2004/02/skos/core#altLabel> ${sparqlEscapeString(
        newKboInfo.formalName
      )} 
    `;
  }
  if(newKboInfo.changeTime){
    updateStr += `
      ;
      <https://data.lblod.info/vocabularies/generiek/geplandeEindDatum> ${sparqlEscapeString(
        newKboInfo.changeTime
      )} 
    `;
  }
  if(newKboInfo.activeState){
    updateStr += `
      ;
      <http://www.w3.org/ns/regorg#orgStatus> ${sparqlEscapeUri(
        newKboInfo.activeState
      )} 
    `;
  }
  updateStr += `          
            .
            }
          }
  `;
  updateStr += `
    WHERE{
      VALUES ?g {
        <http://mu.semte.ch/graphs/administrative-unit> 
      }
      GRAPH ?g {
        ?kboUnit a <http://mu.semte.ch/vocabularies/ext/KboEenheid> ;
                    <http://mu.semte.ch/vocabularies/ext/rechtsvorm> ?rechtsVorm ;
                    <http://mu.semte.ch/vocabularies/ext/shortName> ?shortName ;
                    <http://mu.semte.ch/vocabularies/ext/startDate> ?startDate ;
                    <http://www.w3.org/2004/02/skos/core#prefLabel> ?orgName ;
                    <http://www.w3.org/2004/02/skos/core#altLabel>  ?commercialName ;
                    <https://data.lblod.info/vocabularies/generiek/geplandeEindDatum> ?changeTime ;
                    <http://www.w3.org/ns/regorg#orgStatus> ?activeState .
        
        FILTER(?kboUnit = ${sparqlEscapeUri(identifiers.kboUnit)})
      }
    } 
  `;

  await update(updateStr);
}

export async function linkAbbOrgToKboOrg(abbOrgUri, kboOrgUri) {
  if (abbOrgUri && kboOrgUri) {
    let updateStr = `
  INSERT {
    GRAPH ?g {
      ${sparqlEscapeUri(
        kboOrgUri
      )} <http://www.w3.org/2002/07/owl#sameAs> ${sparqlEscapeUri(abbOrgUri)} .
    }
  }WHERE {
    VALUES ?g {
      <http://mu.semte.ch/graphs/administrative-unit>
    }

    ${sparqlEscapeUri(
      kboOrgUri
    )} a <http://mu.semte.ch/vocabularies/ext/KboEenheid> . 

  } 
  `;

    await update(updateStr);
  }
}

// Update queries: via mu-auth if it comes from the frontend ?
