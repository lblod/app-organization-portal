import { app, errorHandler } from "mu";
import fetch from "node-fetch";
import { CronJob } from "cron";
import {
  getIdentifiers,
  constructOvoStructure,
  updateOvoNumberAndUri,
  getAllOvoAndKboCouples,
  createKboOrganisation,
  createNewKboOrg,
  linkAbbOrgToKboOrg,
} from "./lib/queries";
import { CRON_PATTERN } from "./config";

app.post("/sync-kbo-data/:kboStructuredIdUuid", async function (req, res) {
  try {
    const kboStructuredIdUuid = req.params.kboStructuredIdUuid;
    const identifiers = await getIdentifiers(kboStructuredIdUuid);

    const wegwijsUrl = `https://api.wegwijs.vlaanderen.be/v1/search/organisations?q=kboNumber:${identifiers.kbo}&fields=changeTime,name,ovoNumber,kboNumber,labels,contacts,organisationClassifications,locations,parents)`;

    const response = await fetch(wegwijsUrl);
    const data = await response.json();


    let wegwijsOvo = null;
    if (data.length) {
      // We got a match on the KBO, getting the associated OVO back
      const wegwijsInfo = data[0]; // Wegwijs should only have only one entry per KBO
      let kboObject = getKboFields(wegwijsInfo);
      if (kboObject.ovoNumber) {
        wegwijsOvo = kboObject.ovoNumber;
      }

      let kboOrg = "";
      //console.log(kboObject);
      if (!identifiers.kboOrg) {
        kboOrg = await createNewKboOrg(kboObject, "null");
      }

      await linkAbbOrgToKboOrg(identifiers.adminUnit, kboOrg, identifiers.kbo);
    }

    //Update Ovo Number
    if (wegwijsOvo && wegwijsOvo != identifiers.ovo) {
      console.log(identifiers.ovo);

      let ovoStructuredIdUri = identifiers.ovoStructuredId;

      if (!ovoStructuredIdUri) {
        ovoStructuredIdUri = await constructOvoStructure(
          identifiers.kboStructuredId
        );
      }
      await updateOvoNumberAndUri(ovoStructuredIdUri, wegwijsOvo);
    }

    return res.status(200).send(); // since we await, it should be 200
  } catch (e) {
    console.log("Something went wrong while calling /sync-from-kbo", e);
    return res.status(500).send();
  }
});

function getKboFields(data) {
  console.log(data.organisationClassifications);

  let changeTime = data.changeTime;
  let organisationName = data.name;
  let ovoNumber = data.ovoNumber;
  let kboNumber = data.kboNumber;

  //no lables = undefined
  let formalName = data.labels
    ?.filter((fields) => {
      return fields.labelTypeId === "83c1c22a-6776-0ad6-68d2-819e1c6eec66";
    })
    .pop()?.value;

  let email = data.contacts
    ?.filter((fields) => {
      return (
        fields.contactTypeId === "f611e91d-a811-4519-afa6-08f0e9dcdd9b" &&
        !fields.validity.hasOwnProperty("end")
      );
    })
    .pop()?.value;

  let rechtsvorm = data.organisationClassifications
    ?.filter((fields) => {
      console.log(fields);
      return (
        fields.organisationClassificationTypeId === "9bae7539-64fd-5759-743c-ad9dfa4143d4" ||
        fields.organisationClassificationTypeId === "1131205e-9212-435d-b4cd-b0d955d08bcf" 
      );
    })
    .pop()?.organisationClassificationName;

    console.log(rechtsvorm)

  let phone = data.contacts
    ?.filter((fields) => {
      return (
        fields.contactTypeId === "d792d4ff-8c34-4336-8434-56ecb40f2fa4" &&
        !fields.validity.hasOwnProperty("end")
      );
    })
    .pop()?.value;

  let website = data.contacts
    ?.filter((fields) => {
      return (
        fields.contactTypeId === "6763f372-02c5-478c-b7d7-802dc60a64b9" &&
        !fields.validity.hasOwnProperty("end")
      );
    })
    .pop()?.value;

  let province = data.parents?.parentOrganisationName;

  let formattedAddress = data.locations
    ?.filter((fields) => {
      return (
        fields.isMainLocation === true &&
        !fields.validity?.hasOwnProperty("end")
      );
    })
    .pop()?.formattedAddress;

  let adressComponent = data.locations
    ?.filter((fields) => {
      return (
        fields.isMainLocation === true &&
        !fields.validity?.hasOwnProperty("end")
      );
    })
    .pop()?.components;
   

  return {
    changeTime: (typeof changeTime != 'undefined' ? changeTime : ""),
    organisationName: (typeof organisationName != 'undefined' ? organisationName : ""),
    ovoNumber: (typeof ovoNumber != 'undefined' ? ovoNumber : ""),
    kboNumber: (typeof kboNumber != 'undefined' ? kboNumber : ""),
    formalName: (typeof formalName != 'undefined' ? formalName : ""),
    rechtsvorm: (typeof rechtsvorm != 'undefined' ? rechtsvorm : ""),
    email: (typeof email != 'undefined' ? email : ""),
    phone: (typeof phone != 'undefined' ? phone : ""),
    website: (typeof website != 'undefined' ? website : ""),
    province: (typeof province != 'undefined' ? province : ""),
    formattedAddress: (typeof formattedAddress != 'undefined' ? formattedAddress : ""),
    adressComponent: (typeof adressComponent != 'undefined' ? adressComponent : ""),
  };
}

new CronJob(
  CRON_PATTERN,
  async function () {
    const now = new Date().toISOString();
    console.log(`OVO numbers healing triggered by cron job at ${now}`);
    try {
      await healOvoNumbers();
    } catch (err) {
      console.log(
        `An error occurred during OVO numbers healing at ${now}: ${err}`
      );
    }
  },
  null,
  true
);

async function healOvoNumbers() {
  try {
    console.log("Healing starting...");
    const identifiersCouplesOP = await getAllOvoAndKboCouples();
    const identifiersCouplesWegwijs = await getAllOvoAndKboCouplesWegwijs();

    for (const identifiersCoupleOP of identifiersCouplesOP) {
      const wegwijsOvo = identifiersCouplesWegwijs[identifiersCoupleOP.kbo];
      // If a KBO can't be found in wegwijs but we already have an OVO for it in OP, we keep that OVO.
      // It happens especially a lot for worship services that sometimes lack data in Wegwijs
      if (wegwijsOvo && identifiersCoupleOP.ovo != wegwijsOvo) {
        // We have a mismatch, let's update the OVO number
        let ovoStructuredIdUri = identifiersCoupleOP.ovoStructuredId;
        if (!ovoStructuredIdUri) {
          ovoStructuredIdUri = await constructOvoStructure(
            identifiersCoupleOP.kboStructuredId
          );
        }

        await updateOvoNumberAndUri(ovoStructuredIdUri, wegwijsOvo);
      }
    }
    console.log("Healing complete!");
  } catch (err) {
    console.log(`An error occurred during OVO numbers healing: ${err}`);
  }
}

async function getAllOvoAndKboCouplesWegwijs() {
  let couples = {};

  const response = await fetch(
    `https://api.wegwijs.vlaanderen.be/v1/search/organisations?q=kboNumber:/.*[0-9].*/&fields=ovoNumber,kboNumber&scroll=true`
  );
  const scrollId = JSON.parse(
    response.headers.get("x-search-metadata")
  ).scrollId;
  let data = await response.json();

  do {
    data.forEach((unit) => {
      couples[unit.kboNumber] = unit.ovoNumber;
    });

    const response = await fetch(
      `https://api.wegwijs.vlaanderen.be/v1/search/organisations/scroll?id=${scrollId}`
    );
    data = await response.json();
  } while (data.length);

  return couples;
}

app.use(errorHandler);
