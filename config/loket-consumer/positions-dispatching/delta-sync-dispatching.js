const { transformStatements, batchedDbUpdate, deleteFromAllGraphs } = require('./util');
const {
  BATCH_SIZE,
  MAX_DB_RETRY_ATTEMPTS,
  SLEEP_BETWEEN_BATCHES,
  SLEEP_TIME_AFTER_FAILED_DB_OPERATION,
  INGEST_GRAPH,
  PRIVACY_SENSITIVE_GRAPH,
  UNFILTERED_MAPPING,
  MAIN_INFO_MAPPING,
  PRIVATE_INFO_MAPPING,
} = require('./config');

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
  const { mu, muAuthSudo, fetch } = lib;
  const { termObjectChangeSets } = data;

  for (let { deletes, inserts } of termObjectChangeSets) {
    const deleteStatements = deletes.map(o => `${o.subject} ${o.predicate} ${o.object}.`);
    const insertStatements = inserts.map(o => `${o.subject} ${o.predicate} ${o.object}.`);

    if (deleteStatements.length) {
      const transformedStatementsToDelete = await transformStatements(fetch, deleteStatements, UNFILTERED_MAPPING);
      if (transformedStatementsToDelete.length) {
        await deleteFromAllGraphs(
          muAuthSudo.updateSudo,
          transformedStatementsToDelete,
          { 'mu-call-scope-id': 'http://redpencil.data.gift/id/concept/muScope/deltas/write-for-dispatch' },
          process.env.MU_SPARQL_ENDPOINT, //Note: this is the default endpoint through auth
          MAX_DB_RETRY_ATTEMPTS,
          SLEEP_BETWEEN_BATCHES,
          SLEEP_TIME_AFTER_FAILED_DB_OPERATION,
        );
      }
    }

    if (insertStatements.length) {
      const transformedStatementsToInsert = await transformStatements(fetch, insertStatements, MAIN_INFO_MAPPING);
      if (transformedStatementsToInsert.length) {
        await batchedDbUpdate(
          muAuthSudo.updateSudo,
          INGEST_GRAPH,
          transformedStatementsToInsert,
          { 'mu-call-scope-id': 'http://redpencil.data.gift/id/concept/muScope/deltas/write-for-dispatch' },
          process.env.MU_SPARQL_ENDPOINT, //Note: this is the default endpoint through auth
          BATCH_SIZE,
          MAX_DB_RETRY_ATTEMPTS,
          SLEEP_BETWEEN_BATCHES,
          SLEEP_TIME_AFTER_FAILED_DB_OPERATION
        );
      }

      const transformedStatementsToInsertPrivate = await transformStatements(fetch, insertStatements, PRIVATE_INFO_MAPPING);
      if (transformedStatementsToInsertPrivate.length) {
        await batchedDbUpdate(
          muAuthSudo.updateSudo,
          PRIVACY_SENSITIVE_GRAPH,
          transformedStatementsToInsertPrivate,
          { 'mu-call-scope-id': 'http://redpencil.data.gift/id/concept/muScope/deltas/write-for-dispatch' },
          process.env.MU_SPARQL_ENDPOINT, // Note: this is the default endpoint through auth
          BATCH_SIZE,
          MAX_DB_RETRY_ATTEMPTS,
          SLEEP_BETWEEN_BATCHES,
          SLEEP_TIME_AFTER_FAILED_DB_OPERATION
        );
      }
    }
  }
}

module.exports = {
  dispatch
};
