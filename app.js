import { app, errorHandler } from 'mu';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { Delta } from "./lib/delta";
import { isKbo, getIdentifiers, constructOvoStructure, updateOvoNumberAndUri } from "./lib/queries";

app.use(bodyParser.json({
  type: function (req) {
    return /^application\/json/.test(req.get('content-type'));
  }
}));

// TODO update readme with env variables etc at the end

// TODO current issue: when the KBO get updated, it doesn't refresh in the frontend.
// Alternative: endpoint to call in the frontend directly, that way we can trigger a refresh on the OVO ?
app.post('/delta', async function (req, res, next) {
  try {
    const entries = new Delta(req.body).getInsertsFor('https://data.vlaanderen.be/ns/generiek#lokaleIdentificator');

    if (!entries.length) {
      console.log('Delta dit not contain potential KBOs, awaiting the next batch!');
      return res.status(204).send();
    }

    for (let entry of entries) {
      const isEntryKbo = await isKbo(entry)

      if (isEntryKbo) {
        const identifiers = await getIdentifiers(entry);

        const response = await fetch(`https://api.wegwijs.vlaanderen.be/v1/search/organisations?q=kboNumber:${identifiers.kbo}&fields=ovoNumber,kboNumber)`);
        const data = await response.json();

        let wegwijsOvo = null;
        if (data.length) {
          // We got a match on the KBO, getting the associated OVO back
          const wegwijsInfo = data[0]; // Wegwijs should only have only one entry per KBO
          if (wegwijsInfo.ovoNumber)
            wegwijsOvo = wegwijsInfo.ovoNumber;
        }

        if (wegwijsOvo != identifiers.ovo) {
          let ovoStructuredIdUri = identifiers.ovoStructuredId;

          if (!ovoStructuredIdUri) {
            ovoStructuredIdUri = await constructOvoStructure(entry);
          }

          await updateOvoNumberAndUri(ovoStructuredIdUri, wegwijsOvo);
        }
      }
    }

    return res.status(200).send().end();
  } catch (e) {
    console.log(`Something unexpected went wrong while handling delta task!`);
    console.error(e);
    return next(e);
  }
});

// TODO CRON JOB (+ endpoint to easily test it?)
// 1x per day. Query all admin units that have a KBO in our DB, with OVO numbers (optional)
// Then we compare with wegwijs, if possible via one big query to get all the codes at once,
// but if not possible multiple smaller ones
// Then we compare the KBO / OVO couples and as soon as we have a mismatch, we correct it

app.use(errorHandler);
