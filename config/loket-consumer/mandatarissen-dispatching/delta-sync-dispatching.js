const {
  transformStatements,
  deleteFromTargetGraph,
  insertIntoTargetGraph,
} = require('./util');

/**
* Dispatch the fetched information to a target graph.
* Note: <share://file/data> will be ADDED to it's own graph.
*   We take only care of adding them, not updating triples, this is a TODO
* @param { mu, muAuthSudo } lib - The provided libraries from the host service.
* @param { termObjectChangeSets: { deletes, inserts } } data - The fetched changes sets, which objects of serialized Terms
*          [ {
*              graph: "<http://foo>",
*              subject: "<http://bar>",
*              predicate: "<http://baz>",
*              object: "<http://boom>^^<http://datatype>"
*            }
*         ]
* @return {void} Nothing
*/
async function dispatch(lib, data) {
  const { mu, fetch } = lib;
  let { termObjectChangeSets, termObjectChangeSetsWithContext } = data;

  // Both arrays are the same length, so we can zip them together for easier processing
  zippedChangeSets = termObjectChangeSets.map((o, i) => ({
    original: o,
    withContext: termObjectChangeSetsWithContext[i]
  }));

  console.log(`Received ${zippedChangeSets.length} change sets`)

  for (let { original, withContext } of zippedChangeSets) {
    let originalDeletes, originalInserts, insertsWithContext, deletesWithContext;
    try {
      originalInserts = original.inserts.map(o => `${o.subject} ${o.predicate} ${o.object}.`);
      originalDeletes = original.deletes.map(o => `${o.subject} ${o.predicate} ${o.object}.`);
    } catch (e) {
      console.log(`Error while processing change set: ${e}`);
      console.log(`Original change set: ${JSON.stringify(original)}`);
      throw e;
    }

    // Extra context needed for mapping from DL to OP model and filtering based on type.
    try {
      insertsWithContext = withContext.inserts.map(o => `${o.subject} ${o.predicate} ${o.object}.`);
      deletesWithContext = withContext.deletes.map(o => `${o.subject} ${o.predicate} ${o.object}.`);
    } catch (e) {
      console.log(`Error while processing change set with context: ${e}`);
      console.log(`Change set with context: ${JSON.stringify(withContext)}`);
      throw e;
    }

    if (originalDeletes.length) {
      // Map deletes from DL to OP model
      const transformedDeletes = await transformStatements(fetch, deletesWithContext);

      if (!transformedDeletes.length) {
        console.log(`Warn: Delete statements mapped to empty result.`);
        console.log(`Input: ${deletesWithContext}`);
        console.log(`Output: ${transformedDeletes}`);
      } else {
        await deleteFromTargetGraph(lib, transformedDeletes);
      }
    }

    if (originalInserts.length) {
      // Map inserts from DL to OP model
      const transformedInserts = await transformStatements(fetch, insertsWithContext);

      if (!transformedInserts.length) {
        console.log(`Warn: Insert statements mapped to empty result.`);
        console.log(`Input: ${insertsWithContext}`);
        console.log(`Output: ${transformedInserts}`);
      } else {
        await insertIntoTargetGraph(lib, transformedInserts);
      }
    }
  }
}

module.exports = {
  dispatch
};
