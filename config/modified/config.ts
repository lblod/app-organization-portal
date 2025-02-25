import { Changeset } from "../types";

export const interestingTypes = [
  "http://www.w3.org/ns/org#Organization",
  "http://www.w3.org/ns/org#Post",
  "http://www.w3.org/ns/org#Site",
  "http://www.w3.org/ns/adms#Identifier",
  "https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator",
  "http://data.vlaanderen.be/ns/besluit#Bestuursorgaan",
  "http://schema.org/ContactPoint",
  "http://www.w3.org/ns/locn#Address",
  "http://www.w3.org/ns/org#ChangeEvent",
  "http://www.w3.org/ns/activitystreams#Tombstone",
];

export const filterModifiedSubjects = "";

export async function filterDeltas(changeSets: Changeset[]) {
  const modifiedPred = "http://purl.org/dc/terms/modified";
  const subjectsWithModified = new Set();

  const trackModifiedSubjects = (quad) => {
    if (quad.predicate.value === modifiedPred) {
      subjectsWithModified.add(quad.subject.value);
    }
  };
  changeSets.map((changeSet) => {
    changeSet.inserts.forEach(trackModifiedSubjects);
  });

  const isGoodQuad = (quad) => !subjectsWithModified.has(quad.subject.value);
  return changeSets.map((changeSet) => {
    return {
      inserts: changeSet.inserts.filter(isGoodQuad),
      deletes: changeSet.deletes.filter(isGoodQuad),
    };
  });
}
