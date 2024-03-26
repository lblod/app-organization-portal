import { app, errorHandler } from "mu";
import fetch from "node-fetch";
import { CronJob } from "cron";
import {
  getAbbOrganizationInfo,
  constructOvoStructure,
  updateOvoNumberAndUri,
  createNewKboOrg,
  linkAbbOrgToKboOrg,
  getKboOrganizationInfo,
  updateKboOrg,
  getAllAbbKboOrganizations,
} from "./lib/queries";
import {
  CRON_PATTERN,
  ORGANIZATION_STATUS,
  WEGWIJS_API,
  WEGWIJS_API_FIELDS,
} from "./config";
import { API_STATUS_CODES } from "./api-error-handler";
import { WEGWIJS_DATA_OBJECT_IDS } from "./wegwijs-object-data-ids";

app.post("/sync-kbo-data/:kboStructuredIdUuid", async function (req, res) {
  try {
    const kboStructuredIdUuid = req.params.kboStructuredIdUuid;
    const abbOrganizationInfo = await getAbbOrganizationInfo(
      kboStructuredIdUuid
    );

    if (!abbOrganizationInfo?.kbo) {
      return setServerStatus(API_STATUS_CODES.STATUS_NO_DATA_OP, res);
    }
    const wegwijsUrl = `${WEGWIJS_API}?q=kboNumber:${abbOrganizationInfo.kbo}&fields=${WEGWIJS_API_FIELDS}`;
    console.log("url: " + wegwijsUrl);

    const response = await fetch(wegwijsUrl);
    const data = await response.json();

    if (!data.length) {
      return setServerStatus(API_STATUS_CODES.ERROR_NO_DATA_WEGWIJS, res);
    }
    // We got a match on the KBO, getting the associated OVO back
    const wegwijsInfo = data[0]; // Wegwijs should only have only one entry per KBO
    const kboObject = getKboFields(wegwijsInfo);
    const kboIdentifiers = await getKboOrganizationInfo(
      abbOrganizationInfo.adminUnit
    );

    if (!kboIdentifiers && kboObject) {
      await createKbo(
        kboObject,
        abbOrganizationInfo.kboId,
        abbOrganizationInfo.adminUnit
      );

    }
    
    if (isUpdateNeeded(kboObject, kboIdentifiers)) {
      await updateKboOrg(kboObject, kboIdentifiers);
    }

    let wegwijsOvo = kboObject.ovoNumber ?? null;

    //Update Ovo Number
    if (wegwijsOvo && wegwijsOvo != abbOrganizationInfo.ovo) {
      let ovoStructuredIdUri = abbOrganizationInfo.ovoStructuredId;

      if (!ovoStructuredIdUri) {
        ovoStructuredIdUri = await constructOvoStructure(
          abbOrganizationInfo.kboStructuredId
        );
      }
      await updateOvoNumberAndUri(ovoStructuredIdUri, wegwijsOvo);
    }
     
    return setServerStatus(API_STATUS_CODES.OK, res); // since we await, it should be 200
  } catch (e) {
    return setServerStatus(API_STATUS_CODES.CUSTOM_SERVER_ERROR, res, e);
  }
});

function getKboFields(data) {
  const {
    changeTime,
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
  let formalName = extractObjectData(
    labels,
    WEGWIJS_DATA_OBJECT_IDS.LABELS
  )?.value;
  let email = extractObjectData(
    contacts,
    WEGWIJS_DATA_OBJECT_IDS.CONTACTS.EMAIL
  )?.value;
  let phone = extractObjectData(
    contacts,
    WEGWIJS_DATA_OBJECT_IDS.CONTACTS.PHONE
  )?.value;
  let website = extractObjectData(
    contacts,
    WEGWIJS_DATA_OBJECT_IDS.CONTACTS.WEBSITE
  )?.value;

  //main location according to KBO
  let formattedAddress = extractObjectData(
    locations,
    WEGWIJS_DATA_OBJECT_IDS.ADDRESS
  )?.formattedAddress;
  let adressComponent = extractObjectData(
    locations,
    WEGWIJS_DATA_OBJECT_IDS.ADDRESS
  )?.components;

  let rechtsvorm = organisationClassifications?.find((fields) => {
    return (
      fields[WEGWIJS_DATA_OBJECT_IDS.RECHTSVORM.NAME] ===
        WEGWIJS_DATA_OBJECT_IDS.RECHTSVORM.ID_1 ||
      fields.organisationClassificationTypeId ===
        WEGWIJS_DATA_OBJECT_IDS.RECHTSVORM.ID_2
    );
  })?.organisationClassificationName;

  let startDate = labels?.find((fields) => {
    return (
      fields[WEGWIJS_DATA_OBJECT_IDS.LABELS.NAME] ===
      WEGWIJS_DATA_OBJECT_IDS.LABELS.ID
    );
  })?.validity?.start;

  let activeState = labels?.find((fields) => {
    return (
      fields[WEGWIJS_DATA_OBJECT_IDS.LABELS.NAME] ===
        WEGWIJS_DATA_OBJECT_IDS.LABELS.ID &&
      !fields.validity.hasOwnProperty("end")
    );
  })
    ? ORGANIZATION_STATUS.ACTIVE
    : ORGANIZATION_STATUS.INACTIVE;

  //currently no commercial name available
  return {
    changeTime,
    shortName,
    ovoNumber,
    kboNumber,
    formalName,
    startDate,
    activeState,
    rechtsvorm,
    email,
    phone,
    website,
    formattedAddress,
    adressComponent,
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

        if (wegwijsOvo && kboIdentifierOP.ovo != wegwijsOvo) {
          // We have a mismatch, let's update the OVO number
          let ovoStructuredIdUri = kboIdentifierOP.ovoStructuredId;

          console.log(ovoStructuredIdUri);

          if (!ovoStructuredIdUri) {
            ovoStructuredIdUri = await constructOvoStructure(
              kboIdentifierOP.kboStructuredId
            );
          }

          await updateOvoNumberAndUri(ovoStructuredIdUri, wegwijsOvo);
        }

        if (!kboIdentifierOP?.kboOrg) {
          await createKbo(
            wegwijsKboOrg,
            kboIdentifierOP.kboId,
            kboIdentifierOP.abbOrg
          );
        }

        if (isUpdateNeeded(wegwijsKboOrg, kboIdentifierOP)) {
          const kboIdentifiers = await getKboOrganizationInfo(
            kboIdentifierOP.abbOrg
          );
          await updateKboOrg(wegwijsKboOrg, kboIdentifiers);
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
    `${WEGWIJS_API}?q=kboNumber:/.*[0-9].*/&fields=${WEGWIJS_API_FIELDS},parents&scroll=true`
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

    const response = await fetch(`${WEGWIJS_API}/scroll?id=${scrollId}`);
    data = await response.json();
  } while (data.length);

  return couples;
}

function isUpdateNeeded(kboWegwijs, kboAbb) {
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

function setServerStatus(statusCode, res, message) {
  if (statusCode.CODE === 500) {
    console.log("Something went wrong while calling /sync-from-kbo", message);
  }
  return res.status(statusCode.CODE).send(statusCode.STATUS);
}

function extractObjectData(array, field) {
  return array?.find((fields) => {
    return fields[field.NAME] === field.ID;
  });
}

app.use(errorHandler);
