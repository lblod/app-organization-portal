import ldesTypes from "./ldes-types";
import ldesGraphs from "./ldes-graphs";
import { sparqlEscapeUri } from "mu";

const safeGraphValues = ldesGraphs
  .map((graph) => {
    return sparqlEscapeUri(graph);
  })
  .join("\n");

export const getHealingConfig = async () => {
  const entities = {};
  ldesTypes.forEach((type) => {
    // use default config for each type, just use dct:modified
    entities[type] = {
      healingPredicates: ["http://purl.org/dc/terms/modified"],
      graphFilter: `VALUES ?g { ${safeGraphValues} }`,
    };
  });

  return {
    // only one stream needs to be published, call it ldes
    ldes: {
      entities,
    },
  };
};
