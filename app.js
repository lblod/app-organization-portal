import { app, errorHandler, uuid } from "mu";
import fetch from "node-fetch";
import { CronJob } from "cron";
import {
  getIdentifiers,
  constructOvoStructure,
  updateOvoNumberAndUri,
  getAllOvoAndKboCouples,
  createNewKboOrg,
  linkAbbOrgToKboOrg,
  getKboIdentifiers,
  updateKboOrg,
  getAllAbbKboOrganizations,
} from "./lib/queries";
import { CRON_PATTERN, ORGANIZATION_STATUS } from "./config";

app.post(
  "/sync-kbo-data/:kboStructuredIdUuid/:ovoOrKbo",
  async function (req, res) {
    try {
      const kboStructuredIdUuid = req.params.kboStructuredIdUuid;
      const createKbo = req.params.ovoOrKbo === "kbo" ? true : false;
      const identifiers = await getIdentifiers(kboStructuredIdUuid);
      console.log("create kbo? " + createKbo);

      const wegwijsUrl = `https://api.wegwijs.vlaanderen.be/v1/search/organisations?q=kboNumber:${identifiers.kbo}&fields=changeTime,name,shortName,ovoNumber,kboNumber,labels,contacts,organisationClassifications,locations,parents`;
      console.log("url: " + wegwijsUrl);
      const response = await fetch(wegwijsUrl);
      const data = await response.json();

      let wegwijsOvo = null;
      let kboObject = null;
      if (data.length) {
        // We got a match on the KBO, getting the associated OVO back
        const wegwijsInfo = data[0]; // Wegwijs should only have only one entry per KBO
        kboObject = getKboFields(wegwijsInfo);
        if (kboObject.ovoNumber) {
          wegwijsOvo = kboObject.ovoNumber;
        }
      }

      if (createKbo && kboObject) {
        //create kbo organisation
        let kboOrg = null;
        const kboIdentifiers = await getKboIdentifiers(identifiers.adminUnit);
        let update = false;

        if (kboIdentifiers) {
          update =
            new Date(kboObject.changeTime).getTime() >
            new Date(kboIdentifiers.changeTime).getTime()
              ? true
              : false;
        }

        if (!kboIdentifiers) {
          kboOrg = await createNewKboOrg(kboObject, identifiers.kboId);
          await linkAbbOrgToKboOrg(identifiers.adminUnit, kboOrg);
        }

        if (update) {
          updateKboOrg(kboObject, kboIdentifiers);
        }

        return res.status(200).send();
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
  }
);

function getKboFields(data) {
  let changeTime = data.changeTime;
  //wegwijs naam
  let organisationName = data.name;
  let shortName = data.shortName;
  let ovoNumber = data.ovoNumber;
  let kboNumber = data.kboNumber;

  //no lables = undefined
  //formal naam according to KBO
  let formalName = data.labels
    ?.filter((fields) => {
      return fields.labelTypeId === "83c1c22a-6776-0ad6-68d2-819e1c6eec66";
    })
    .pop()?.value;
  let startDate = data.labels
    ?.filter((fields) => {
      return fields.labelTypeId === "83c1c22a-6776-0ad6-68d2-819e1c6eec66";
    })
    .pop()?.validity?.start;
  let activeState = data.labels?.filter((fields) => {
    return (
      fields.labelTypeId === "83c1c22a-6776-0ad6-68d2-819e1c6eec66" &&
      !fields.validity.hasOwnProperty("end")
    );
  })
    ? ORGANIZATION_STATUS.ACTIVE
    : ORGANIZATION_STATUS.INACTIVE;
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
      return (
        fields.organisationClassificationTypeId ===
          "9bae7539-64fd-5759-743c-ad9dfa4143d4" ||
        fields.organisationClassificationTypeId ===
          "1131205e-9212-435d-b4cd-b0d955d08bcf"
      );
    })
    .pop()?.organisationClassificationName;
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

  //main location according to KBO
  let adressComponent = data.locations
    ?.filter((fields) => {
      return (
        fields.locationTypeId === "537c0b5b-8ab8-fc3d-0b37-f8249cbdd3ba" &&
        !fields.validity?.hasOwnProperty("end")
      );
    })
    .pop()?.components;

  return {
    changeTime: changeTime ? changeTime : " ",
    organisationName: organisationName
      ? organisationName
      : "Geen gegevens opgenomen in KBO",
    shortName: shortName ? shortName : organisationName,
    ovoNumber: ovoNumber ? ovoNumber : "Geen gegevens opgenomen in KBO",
    kboNumber: kboNumber ? kboNumber : "Geen gegevens opgenomen in KBO",
    formalName: formalName ? formalName : "Geen gegevens opgenomen in KBO",
    startDate: startDate ? startDate : "Geen gegevens opgenomen in KBO",
    activeState: activeState,
    rechtsvorm: rechtsvorm ? rechtsvorm : "Geen gegevens opgenomen in KBO",
    email: email ? email : "Geen gegevens opgenomen in KBO",
    phone: phone ? phone : "Geen gegevens opgenomen in KBO",
    website: website ? website : "Geen gegevens opgenomen in KBO",
    province: province ? province : "Geen gegevens opgenomen in KBO",
    formattedAddress: formattedAddress
      ? formattedAddress
      : "Geen gegevens opgenomen in KBO",
    adressComponent: adressComponent
      ? adressComponent
      : "Geen gegevens opgenomen in KBO",
  };
}

new CronJob(
  CRON_PATTERN,
  async function () {
    const now = new Date().toISOString();
    console.log(`OVO numbers healing triggered by cron job at ${now}`);
    try {
      await healOvoNumbers();
      await healKboUnits();
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
    console.log("Healing ovo starting...");
    const identifiersCouplesOP = await getAllOvoAndKboCouples();
    const identifiersCouplesWegwijs = await getAllOvoAndKboCouplesWegwijs(
      false
    );

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

async function healKboUnits() {
  try {
    console.log("Healing kbo starting...");
    const kboIdentifiersOP = await getAllAbbKboOrganizations();
    const kboIdentifiersWegwijs = await getAllOvoAndKboCouplesWegwijs(true);

    let update = false;

    for (const kboIdentifierOP of kboIdentifiersOP) {
      const wegwijsKboOrg = kboIdentifiersWegwijs[kboIdentifierOP.kbo];

      if (wegwijsKboOrg) {
        if (!kboIdentifierOP.kboOrg) {

          let newKboOrgUri = await createNewKboOrg(wegwijsKboOrg, kboIdentifierOP.kboId);
          await linkAbbOrgToKboOrg(kboIdentifierOP.abbOrg, newKboOrgUri);
        }

        if (kboIdentifierOP.changeTime) {
          update = new Date(kboObject.changeTime).getTime() > new Date(kboIdentifiers.changeTime).getTime() ? true : false;
        }

        if (update) {
          const kboIdentifiers = await getKboIdentifiers(identifiers.adminUnit);
          updateKboOrg(wegwijsKboOrg, kboIdentifiers);
        }
      }
    }
    console.log("Healing complete!");
  } catch (err) {
    console.log(`An error occurred during KBO organization healing: ${err}`);
  }
}

async function getAllOvoAndKboCouplesWegwijs(healKboUnit) {
  let couples = {};

  const response = await fetch(
    `https://api.wegwijs.vlaanderen.be/v1/search/organisations?q=kboNumber:/.*[0-9].*/&changeTime,name,shortName,ovoNumber,kboNumber,labels,contacts,organisationClassifications,locations,parents&scroll=true`
  );
  const scrollId = JSON.parse(
    response.headers.get("x-search-metadata")
  ).scrollId;
  let data = await response.json();

  do {
    data.forEach((unit) => {
      const wegwijsUnit = getKboFields(unit);
      if (healKboUnit) {
        couples[wegwijsUnit.kboNumber] = wegwijsUnit;
      } else {
        couples[wegwijsUnit.kboNumber] = wegwijsUnit.ovoNumber;
      }
    });

    const response = await fetch(
      `https://api.wegwijs.vlaanderen.be/v1/search/organisations/scroll?id=${scrollId}`
    );
    data = await response.json();
  } while (data.length);

  return couples;
}

app.use(errorHandler);
