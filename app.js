import { app, errorHandler, uuid } from "mu";
import fetch from "node-fetch";
import { CronJob } from "cron";
import {
  getIdentifiers,
  constructOvoStructure,
  updateOvoNumberAndUri,
  createNewKboOrg,
  linkAbbOrgToKboOrg,
  getKboIdentifiers,
  updateKboOrg,
  getAllAbbKboOrganizations,
} from "./lib/queries";
import {
  CRON_PATTERN,
  ORGANIZATION_STATUS,
  WEGWIJSAPI,
  WEGWIJSAPIFIELDS,
} from "./config";
import { API_STATUS_CODES } from "./apiErrorHandler";
import { WEGWIJS_DATA_OBJECT_IDS } from "./wegwijObjectDataIds";

app.post("/sync-kbo-data/:kboStructuredIdUuid", async function (req, res) {
  try {
    const kboStructuredIdUuid = req.params.kboStructuredIdUuid;
    const identifiers = await getIdentifiers(kboStructuredIdUuid);

    if (!identifiers?.kbo) {
      return throwServerError(API_STATUS_CODES.STATUS_403, res);
    }
    const wegwijsUrl = `${WEGWIJSAPI}?q=kboNumber:${identifiers.kbo}&fields=${WEGWIJSAPIFIELDS}`;
    console.log("url: " + wegwijsUrl);

    const response = await fetch(wegwijsUrl);
    const data = await response.json();

    let kboObject = null;
    if (!data.length) {
      return throwServerError(API_STATUS_CODES.STATUS_402, res);
    }
    // We got a match on the KBO, getting the associated OVO back
    const wegwijsInfo = data[0]; // Wegwijs should only have only one entry per KBO
    kboObject = getKboFields(wegwijsInfo);
    const kboIdentifiers = await getKboIdentifiers(identifiers.adminUnit);

    if (!kboIdentifiers && kboObject) {
      await createKbo(kboObject, identifiers.kboId, identifiers.adminUnit);
    }

    if (isUpdate(kboObject, kboIdentifiers)) {
      updateKboOrg(kboObject, kboIdentifiers);
    }

    let wegwijsOvo = kboObject.ovoNumber ?? null;
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

    return throwServerError(API_STATUS_CODES.STATUS_200, res); // since we await, it should be 200
  } catch (e) {
    return throwServerError(API_STATUS_CODES.STATUS_500, res, e);
  }
});

function getKboFields(data) {
  const {
    changeTime,
    name: organisationName,
    shortName,
    ovoNumber,
    kboNumber,
    labels = [],
    contacts = [],
    organisationClassifications = [],
    locations = [],
  } = data;

  //no labels = undefined
  //formal name according to KBO
  let formalName = extractObjectData(labels, WEGWIJS_DATA_OBJECT_IDS.LABELS)?.value;
  let email = extractObjectData(contacts, WEGWIJS_DATA_OBJECT_IDS.CONTACTS.EMAIL)?.value;
  let phone = extractObjectData(contacts, WEGWIJS_DATA_OBJECT_IDS.CONTACTS.PHONE)?.value;
  let website = extractObjectData(contacts, WEGWIJS_DATA_OBJECT_IDS.CONTACTS.WEBSITE)?.value;

  //main location according to KBO
  let formattedAddress = extractObjectData(locations, WEGWIJS_DATA_OBJECT_IDS.ADDRESS)?.formattedAddress;
  let adressComponent = extractObjectData(locations, WEGWIJS_DATA_OBJECT_IDS.ADDRESS)?.components;

  let rechtsvorm = organisationClassifications?.findLast((fields) => {
    return (
      fields[WEGWIJS_DATA_OBJECT_IDS.RECHTSVORM.NAME] ===
        WEGWIJS_DATA_OBJECT_IDS.RECHTSVORM.ID_1 ||
      fields.organisationClassificationTypeId ===
        WEGWIJS_DATA_OBJECT_IDS.RECHTSVORM.ID_2
    );
  })?.organisationClassificationName;

  let startDate = labels?.findLast((fields) => {
    return (
      fields[WEGWIJS_DATA_OBJECT_IDS.LABELS.NAME] ===
      WEGWIJS_DATA_OBJECT_IDS.LABELS.ID
    );
  })?.validity?.start;

  let activeState = labels?.findLast((fields) => {
    return (
      fields[WEGWIJS_DATA_OBJECT_IDS.LABELS.NAME] ===
        WEGWIJS_DATA_OBJECT_IDS.LABELS.ID &&
      !fields.validity.hasOwnProperty("end")
    );
  }) ? ORGANIZATION_STATUS.ACTIVE : ORGANIZATION_STATUS.INACTIVE;

  console.log(formattedAddress);
  console.log(startDate);
  console.log(activeState);

  return {
    changeTime: changeTime ?? "",
    organisationName: organisationName ?? "",
    shortName: shortName ?? organisationName,
    ovoNumber: ovoNumber ?? "",
    kboNumber: kboNumber ?? "",
    formalName: formalName ?? "",
    startDate: startDate ?? "",
    activeState: activeState,
    rechtsvorm: rechtsvorm ?? "",
    email: email ?? "",
    phone: phone ?? "",
    website: website ?? "",
    formattedAddress: formattedAddress ?? "",
    adressComponent: adressComponent ?? "",
  };
}

new CronJob(
  CRON_PATTERN,
  async function () {
    const now = new Date().toISOString();
    console.log(`Wegwijs data healing triggered by cron job at ${now}`);
    try {
      await healAbbWithWegWijsData();
    } catch (err) {
      console.log(
        `An error occurred during wegwijs data healing at ${now}: ${err}`
      );
    }
  },
  null,
  true
);

async function healAbbWithWegWijsData() {
  try {
    console.log("Healing wegwijs info starting...");
    const kboIdentifiersOP = await getAllAbbKboOrganizations();
    const kboIdentifiersWegwijs = await getAllOvoAndKboCouplesWegwijs();

    for (const kboIdentifierOP of kboIdentifiersOP) {
      const wegwijsKboOrg = kboIdentifiersWegwijs[kboIdentifierOP.kbo];
      if (wegwijsKboOrg) {
        const wegwijsOvo = wegwijsKboOrg.ovoNumber;
        // If a KBO can't be found in wegwijs but we already have an OVO for it in OP, we keep that OVO.
        // It happens especially a lot for worship services that sometimes lack data in Wegwijs
        if (wegwijsOvo && kboIdentifiersOP.ovo != wegwijsOvo) {
          // We have a mismatch, let's update the OVO number
          let ovoStructuredIdUri = kboIdentifiersOP.ovoStructuredId;
          if (!ovoStructuredIdUri) {
            ovoStructuredIdUri = await constructOvoStructure(
              kboIdentifierOP.kboStructuredId
            );
          }

          await updateOvoNumberAndUri(ovoStructuredIdUri, wegwijsOvo);
        }

        if (!kboIdentifierOP?.kboOrg) {
          console.log("creating new kboUnit");
          await createKbo(
            wegwijsKboOrg,
            kboIdentifierOP.kboId,
            kboIdentifierOP.abbOrg
          );
        }

        if (isUpdate(wegwijsKboOrg, kboIdentifierOP)) {
          const kboIdentifiers = await getKboIdentifiers(kboIdentifierOP.abbOrg);
          updateKboOrg(wegwijsKboOrg, kboIdentifiers);
        }
      }
    }
    console.log("Healing complete!");
  } catch (err) {
    console.log(`An error occurred during wegwijs info healing: ${err}`);
  }
}

async function getAllOvoAndKboCouplesWegwijs() {
  let couples = {};

  const response = await fetch(
    `${WEGWIJSAPI}?q=kboNumber:/.*[0-9].*/&fields=${WEGWIJSAPIFIELDS},parents&scroll=true`
  );
  const scrollId = JSON.parse(
    response.headers.get("x-search-metadata")
  ).scrollId;
  let data = await response.json();

  do {
    data.forEach((unit) => {
      const wegwijsUnit = getKboFields(unit);
      couples[wegwijsUnit.kboNumber] = wegwijsUnit;
    });

    const response = await fetch(`${WEGWIJSAPI}/scroll?id=${scrollId}`);
    data = await response.json();
  } while (data.length);

  return couples;
}

function isUpdate(kboWegwijs, kboAbb) {
  let update = false;
  if (kboWegwijs?.changeTime && kboAbb?.changeTime) {
    update =
      new Date(kboWegwijs.changeTime).getTime() >
      new Date(kboAbb.changeTime).getTime();
  }
  return update;
}

async function createKbo(wegwijsKboOrg, kboId, abbOrg) {
  let newKboOrgUri = await createNewKboOrg(wegwijsKboOrg, kboId);
  await linkAbbOrgToKboOrg(abbOrg, newKboOrgUri);
}

function throwServerError(statusCode, res, message) {
  if (statusCode.CODE === 500) {
    console.log("Something went wrong while calling /sync-from-kbo", message);
  }
  return res.status(statusCode.CODE).send(statusCode.STATUS);
}

function extractObjectData(object, field) {
  let test = object?.findLast((fields) => {
    return fields[field.NAME] === field.ID;
  });


  console.log(test);
  return test;
}

app.use(errorHandler);
