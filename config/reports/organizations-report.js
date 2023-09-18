import { generateReportFromData, batchedQuery } from '../helpers.js';
import { querySudo as query } from '@lblod/mu-auth-sudo';
import { PREFIXES } from './utils'

export default {
  cronPattern: '0 00 23 * * *',
  name: 'organizations',
  execute: async () => {
    const reportData = {
      title: 'Organizations',
      description: 'List of the Organizations',
      filePrefix: 'organizations'
    };

    console.log('Generating organizations report');

    const queryStringPart1 = `
    ${PREFIXES}

    SELECT DISTINCT ?bestuur ?label ?classification ?typeEredienst
    WHERE {
      VALUES ?type {
        org:Organization
        besluit:Bestuurseenheid
      }

      GRAPH ?g {
        ?bestuur a ?type .
        OPTIONAL { ?bestuur skos:prefLabel ?label. }
      }

      OPTIONAL {
        ?bestuur org:classification ?classificationUri .
        ?classificationUri skos:prefLabel ?classification.
      }

      OPTIONAL {
        ?bestuur ere:typeEredienst ?typeEredienstUri.
        ?typeEredienstUri skos:prefLabel ?typeEredienst.
      }

      FILTER (?g IN ( <http://mu.semte.ch/graphs/administrative-unit>, <http://mu.semte.ch/graphs/worship-service>, <http://mu.semte.ch/graphs/shared>))
    }
    `;

    const queryResponsePart1 = await batchedQuery(queryStringPart1);

    const dataPart1 = queryResponsePart1.results.bindings.reduce( (acc, row) => {
      acc[getSafeValue(row, 'bestuur')] = {
        bestuur: getSafeValue(row, 'bestuur'),
        label: getSafeValue(row, 'label'),
        classification: getSafeValue(row, 'classification'),
        typeEredienst: getSafeValue(row, 'typeEredienst'),
      };
      return acc;
    }, {});

    const queryStringPart2 = `
    ${PREFIXES}

    SELECT DISTINCT ?bestuur ?provincie
    WHERE {
      VALUES ?type {
        org:Organization
        besluit:Bestuurseenheid
      }

      GRAPH ?g {
        ?bestuur a ?type .
      }

      GRAPH ?h {
        OPTIONAL {
          ?bestuur org:hasPrimarySite ?primarySite.

          OPTIONAL {
            ?primarySite organisatie:bestaatUit ?sa.
            OPTIONAL { ?sa locn:adminUnitL2 ?provincie. }
          }
        }
      }

      FILTER (?g IN ( <http://mu.semte.ch/graphs/administrative-unit>, <http://mu.semte.ch/graphs/worship-service>, <http://mu.semte.ch/graphs/shared>))
      FILTER (?h IN ( <http://mu.semte.ch/graphs/administrative-unit>, <http://mu.semte.ch/graphs/worship-service>, <http://mu.semte.ch/graphs/shared>))
    }
    `;

    const queryResponsePart2 = await batchedQuery(queryStringPart2);
    const dataPart2 = queryResponsePart2.results.bindings.reduce( (acc, row) => {
      let dataPart = {
        bestuur: getSafeValue(row, 'bestuur'),
        provincie: getSafeValue(row, 'provincie')
      };

      acc[getSafeValue(row, 'bestuur')] = Object.assign(dataPart, dataPart1[getSafeValue(row, 'bestuur')]);
      return acc;
    }, {});

    await generateReportFromData(Object.values(dataPart2), [
      'bestuur',
      'label',
      'classification',
      'typeEredienst',
      'provincie'
    ], reportData);
  }
};

function getSafeValue(entry, property){
  return entry[property] ? wrapInQuote(entry[property].value) : null;
}

// Some values might contain commas; wrapping them in escapes quotes doesn't disrupt the columns.
function wrapInQuote(value) {
  return `\"${value}\"`;
}
