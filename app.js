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

app.post("/sync-kbo-data/:kboStructuredIdUuid", async function (req, res) {
  try {
    const kboStructuredIdUuid = req.params.kboStructuredIdUuid;
    const identifiers = await getIdentifiers(kboStructuredIdUuid);
    console.log("create kbo? " + createKbo);
    if (!identifiers?.kbo) {
      return throwServer500Error(
        res,
        "no kbo number was found: " + identifiers
      );
    }
    const wegwijsUrl = `${WEGWIJSAPI}?q=kboNumber:${identifiers.kbo}&fields=${WEGWIJSAPIFIELDS}`;
    console.log("url: " + wegwijsUrl);
    const response = await fetch(wegwijsUrl);
    const data = await response.json();

    let wegwijsOvo = null;
    let kboObject = null;
    if (!data.length) {
      return throwServer500Error(
        res,
        "no data has been found, check if KBO number is correct"
      );
    }
    // We got a match on the KBO, getting the associated OVO back
    const wegwijsInfo = data[0]; // Wegwijs should only have only one entry per KBO
    kboObject = getKboFields(wegwijsInfo);
    if (kboObject.ovoNumber) {
      wegwijsOvo = kboObject.ovoNumber;
    }

    if (kboObject) {
      const kboIdentifiers = await getKboIdentifiers(identifiers.adminUnit);

      if (!kboIdentifiers) {
        await createKbo(kboObject, identifiers.kboId, identifiers.adminUnit);
      }

      if (isUpdate(kboObject, kboIdentifiers)) {
        updateKboOrg(kboObject, kboIdentifiers);
      }
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
    return throwServer500Error(res, e);
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

  //no lables = undefined
  //formal naam according to KBO

  let formalName = labels?.findLast((fields) => {
      return fields.labelTypeId === "83c1c22a-6776-0ad6-68d2-819e1c6eec66";
    })?.value;

  let startDate = labels?.findLast((fields) => {
      return fields.labelTypeId === "83c1c22a-6776-0ad6-68d2-819e1c6eec66";
    })?.validity?.start;

  let activeState = labels?.findLast((fields) => {
    return (
      fields.labelTypeId === "83c1c22a-6776-0ad6-68d2-819e1c6eec66" &&
      !fields.validity.hasOwnProperty("end")
    );
  }) ? ORGANIZATION_STATUS.ACTIVE : ORGANIZATION_STATUS.INACTIVE;

  let email = data.contacts?.findLast((fields) => {
      return (
        fields.contactTypeId === "f611e91d-a811-4519-afa6-08f0e9dcdd9b" &&
        !fields.validity.hasOwnProperty("end")
      );
    })?.value;

  let rechtsvorm = organisationClassifications?.findLast((fields) => {
      return (
        fields.organisationClassificationTypeId ===
          "9bae7539-64fd-5759-743c-ad9dfa4143d4" ||
        fields.organisationClassificationTypeId ===
          "1131205e-9212-435d-b4cd-b0d955d08bcf"
      );
    })?.organisationClassificationName;

  let phone = contacts?.findLast((fields) => {
      return (
        fields.contactTypeId === "d792d4ff-8c34-4336-8434-56ecb40f2fa4" &&
        !fields.validity.hasOwnProperty("end")
      );
    })?.value;

  let website = contacts?.findLast((fields) => {
      return (
        fields.contactTypeId === "6763f372-02c5-478c-b7d7-802dc60a64b9" &&
        !fields.validity.hasOwnProperty("end")
      );
    })?.value;

  let formattedAddress = locations?.findLast((fields) => {
      return (
        fields.locationTypeId === "537c0b5b-8ab8-fc3d-0b37-f8249cbdd3ba" &&
        !fields.validity?.hasOwnProperty("end")
      );
    })?.formattedAddress;

  //main location according to KBO
  let adressComponent = locations?.findLast((fields) => {
      return (
        fields.locationTypeId === "537c0b5b-8ab8-fc3d-0b37-f8249cbdd3ba" &&
        !fields.validity?.hasOwnProperty("end")
      );
    })?.components;

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
    console.log(`OVO numbers healing triggered by cron job at ${now}`);
    try {
      await healAbbWithWegWijsData();
    } catch (err) {
      console.log(
        `An error occurred during OVO numbers healing at ${now}: ${err}`
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

        console.log(kboIdentifierOP);
        if (!kboIdentifierOP?.kboOrg) {
          console.log("creating new kboUnit");
          await createKbo(
            wegwijsKboOrg,
            kboIdentifierOP.kboId,
            kboIdentifierOP.abbOrg
          );
        }

        if (isUpdate(wegwijsKboOrg, kboIdentifierOP)) {
          const kboIdentifiers = await getKboIdentifiers(identifiers.adminUnit);
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

function throwServer500Error(res, message) {
  console.log("Something went wrong while calling /sync-from-kbo", message);
  return res.status(500).send();
}

app.use(errorHandler);
