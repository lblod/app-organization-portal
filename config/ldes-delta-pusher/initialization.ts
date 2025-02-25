import ldesGraphs from "./ldes-graphs";
import ldesTypes from "./ldes-types";
import { sparqlEscapeUri } from "mu";

export const initialization = {
  // only one stream needs to be published, call it ldes
  ldes: {},
};

const safeGraphValues = ldesGraphs
  .map((graph) => {
    return sparqlEscapeUri(graph);
  })
  .join("\n");

ldesTypes.forEach((type) => {
  // use default config for each type, no extra filters
  initialization.ldes[type] = {
    graphFilter: `VALUES ?g {
      ${safeGraphValues}
    }`,
  };
});
