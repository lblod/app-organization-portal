import { app, errorHandler } from 'mu';
import fetch from 'node-fetch';
import { CronJob } from 'cron';
import {
  getIdentifiers,
  constructOvoStructure,
  updateOvoNumberAndUri,
  getAllOvoAndKboCouples
} from "./lib/queries";
import { CRON_PATTERN } from './config';

app.post('/sync-from-kbo/:kboStructuredIdUuid', async function(req, res) {
  try {
    const kboStructuredIdUuid = req.params.kboStructuredIdUuid;
    const identifiers = await getIdentifiers(kboStructuredIdUuid);

    const response = await fetch(`https://api.wegwijs.vlaanderen.be/v1/search/organisations?q=kboNumber:${identifiers.kbo}&fields=ovoNumber,kboNumber)`);
    const data = await response.json();

    let wegwijsOvo = null;
    if (data.length) {
      // We got a match on the KBO, getting the associated OVO back
      const wegwijsInfo = data[0]; // Wegwijs should only have only one entry per KBO
      if (wegwijsInfo.ovoNumber)
        wegwijsOvo = wegwijsInfo.ovoNumber;
    }

    if (wegwijsOvo && (wegwijsOvo != identifiers.ovo)) {
      let ovoStructuredIdUri = identifiers.ovoStructuredId;

      if (!ovoStructuredIdUri) {
        ovoStructuredIdUri = await constructOvoStructure(identifiers.kboStructuredId);
      }

      await updateOvoNumberAndUri(ovoStructuredIdUri, wegwijsOvo);
    }

    return res.status(200).send(); // since we await, it should be 200
  } catch (e) {
    console.log("Something went wrong while calling /sync-from-kbo", e);
    return res.status(500).send();
  }
});

new CronJob(CRON_PATTERN, async function() {
  const now = new Date().toISOString();
  console.log(`OVO numbers healing triggered by cron job at ${now}`);
  try {
    await healOvoNumbers();
  } catch (err) {
    console.log(`An error occurred during OVO numbers healing at ${now}: ${err}`)
  }
}, null, true);

async function healOvoNumbers() {
  try {
    console.log('Healing starting...');
    const identifiersCouplesOP = await getAllOvoAndKboCouples();
    const identifiersCouplesWegwijs = await getAllOvoAndKboCouplesWegwijs();
  
    for (const identifiersCoupleOP of identifiersCouplesOP) {
      const wegwijsOvo = identifiersCouplesWegwijs[identifiersCoupleOP.kbo];
      // If a KBO can't be found in wegwijs but we already have an OVO for it in OP, we keep that OVO.
      // It happens especially a lot for worship services that sometimes lack data in Wegwijs
      if (wegwijsOvo && (identifiersCoupleOP.ovo != wegwijsOvo)) {
        // We have a mismatch, let's update the OVO number
        let ovoStructuredIdUri = identifiersCoupleOP.ovoStructuredId;
        if (!ovoStructuredIdUri) {
          ovoStructuredIdUri = await constructOvoStructure(identifiersCoupleOP.kboStructuredId);
        }

        await updateOvoNumberAndUri(ovoStructuredIdUri, wegwijsOvo);
      }
    }
    console.log('Healing complete!');
  } catch (err) {
    console.log(`An error occurred during OVO numbers healing: ${err}`)
  }
}

async function getAllOvoAndKboCouplesWegwijs() {
  let couples = {};

  const response = await fetch(`https://api.wegwijs.vlaanderen.be/v1/search/organisations?q=kboNumber:/.*[0-9].*/&fields=ovoNumber,kboNumber&scroll=true`);
  const scrollId = JSON.parse(response.headers.get('x-search-metadata')).scrollId;
  let data = await response.json();

  do {
    data.forEach(unit => {
      couples[unit.kboNumber] = unit.ovoNumber;
    });

    const response = await fetch(`https://api.wegwijs.vlaanderen.be/v1/search/organisations/scroll?id=${scrollId}`);
    data = await response.json();
  } while (data.length)

  return couples;
}

app.use(errorHandler);
