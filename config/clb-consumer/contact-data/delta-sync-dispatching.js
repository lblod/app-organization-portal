const {
  deleteFromPublicGraph,
  insertIntoPublicGraph,
  deleteFromSpecificGraphs,
  insertIntoSpecificGraphs
} = require('./util');

const {
  LANDING_ZONE_GRAPH
} = require('./config')

const publicTypes = [
  '<http://lblod.data.gift/vocabularies/organisatie/TypeVestiging>'
]

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
  let { termObjectChangeSets, termObjectChangeSetsWithContext } = data;

  // Both arrays are the same length, so we can zip them together for easier processing
  zippedChangeSets = termObjectChangeSets.map((o, i) => ({
    original: o,
    withContext: termObjectChangeSetsWithContext && termObjectChangeSetsWithContext[i]
  }));

  console.log(`Received ${zippedChangeSets.length} change sets`)

  for (let { original, withContext } of zippedChangeSets) {
    
    const {public: insertsOnPublic, target: insertsOnGraphs} = separateBetweenTargetAndPublic(original.inserts, withContext.inserts)
    const {public: deletesOnPublic, target: deletesOnGraphs} = separateBetweenTargetAndPublic(original.deletes, withContext.deletes)

    await deleteFromPublicGraph(lib, deletesOnPublic);
    await deleteFromSpecificGraphs(lib, deletesOnGraphs);
    await insertIntoPublicGraph(lib, insertsOnPublic);
    await insertIntoSpecificGraphs(lib, insertsOnGraphs);

  }
}

function separateBetweenTargetAndPublic(changes, context) {
  const changesOnPublic = new Set();
  const changesOnGraphs = {};
  for(let change of changes) {
    const subject = change.subject;
    const contextTriples = context.filter((context) => context.subject === subject);
    const graphTriple = contextTriples.find(
      (context) => context.predicate === '<http://mu.semte.ch/vocabularies/ext/goesInGraph>' 
        && context.object !== `<${LANDING_ZONE_GRAPH}>`
    )
    const otherContextTriples = context.filter(
      (context) => context.predicate !== '<http://mu.semte.ch/vocabularies/ext/goesInGraph>' 
        && context.predicate !== '<http://mu.semte.ch/vocabularies/ext/contextDataGoesInGraph>' 
        && !(context.subject === subject && context.predicate === '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>')
    );
    if(graphTriple) {
      const graph = graphTriple.object.slice(1,-1); // We have to slice it to remove the "<" and ">"
      if(change.object !== '') {
        if(!changesOnGraphs[graph]) {
          changesOnGraphs[graph] = new Set();
        }  
        changesOnGraphs[graph].add(`${change.subject} ${change.predicate} ${change.object}.`)
      }                    
      for(let triple of otherContextTriples) {
        if(triple.object === '') continue;
        if(!changesOnGraphs[graph]) {
          changesOnGraphs[graph] = new Set();
        }  
        changesOnGraphs[graph].add(`${triple.subject} ${triple.predicate} ${triple.object}.`)                                       
      }
    }
    const typeTriple = contextTriples.find(
      (context) => context.subject === subject 
        && context.predicate === '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>'
    );
    if(!typeTriple) continue;
    const type = typeTriple.object;
    if(publicTypes.includes(type)) {
      changesOnPublic.add(`${change.subject} ${change.predicate} ${change.object}.`)
      for(let triple of otherContextTriples) {
        changesOnPublic.add(`${triple.subject} ${triple.predicate} ${triple.object}.`)
      }
    }
  }
  return {public: changesOnPublic, target: changesOnGraphs}
}

module.exports = {
  dispatch
};