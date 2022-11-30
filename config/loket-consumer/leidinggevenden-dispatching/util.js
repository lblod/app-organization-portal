async function batchedDbUpdate(muUpdate,
  graph,
  triples,
  extraHeaders,
  endpoint,
  batchSize,
  maxAttempts,
  sleepBetweenBatches = 1000,
  sleepTimeOnFail = 1000,
  operation = 'INSERT'
) {

  for (let i = 0; i < triples.length; i += batchSize) {
    console.log(`Inserting triples in batch: ${i}-${i + batchSize}`);

    const batch = triples.slice(i, i + batchSize).join('\n');

    const insertCall = async () => {
      await muUpdate(`
${operation} DATA {
GRAPH <${graph}> {
${batch}
}
}
`, extraHeaders, endpoint);
    };

    await dbOperationWithRetry(insertCall, 0, maxAttempts, sleepTimeOnFail);

    console.log(`Sleeping before next query execution: ${sleepBetweenBatches}`);
    await new Promise(r => setTimeout(r, sleepBetweenBatches));
  }
}

async function dbOperationWithRetry(callback,
  attempt,
  maxAttempts,
  sleepTimeOnFail) {
  try {
    return await callback();
  }
  catch (e) {
    console.log(`Operation failed for ${callback.toString()}, attempt: ${attempt} of ${maxAttempts}`);
    console.log(`Error: ${e}`);
    console.log(`Sleeping ${sleepTimeOnFail} ms`);

    if (attempt >= maxAttempts) {
      console.log(`Max attempts reached for ${callback.toString()}, giving up`);
      throw e;
    }

    await new Promise(r => setTimeout(r, sleepTimeOnFail));
    return dbOperationWithRetry(callback, ++attempt, maxAttempts, sleepTimeOnFail);
  }
}

/**
 * Splits an array into two parts, a part that passes and a part that fails a predicate function.
 * Credits: https://github.com/benjay10
 * @public
 * @function partition
 * @param {Array} arr - Array to be partitioned
 * @param {Function} fn - Function that accepts single argument: an element of the array, and should return a truthy or falsy value.
 * @returns {Object} Object that contains keys passes and fails, each representing an array with elemets that pass or fail the predicate respectively
 */
function partition(arr, fn) {
  let passes = [], fails = [];
  arr.forEach((item) => (fn(item) ? passes : fails).push(item));
  return { passes, fails };
}


/**
 * Send triples to reasoning service for conversion
 *
 */
function transformGraph(fetch, triples) {
  return preProcess(fetch, triples)
          .then(preprocessed => mainConversion(fetch, preprocessed));
}


function preProcess(fetch, triples) {
  let formdata = new URLSearchParams();
  formdata.append("data", triples);

  let requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
  };

  // console.log('!!! Input\n' + triples)

  return fetch("http://reasoner/reason/dl2op/preprocess", requestOptions)
    .then(response => response.text())
    // .then(result => {
    //   console.log(`!!! PREPROCESS\n${result}`)
    //   return result
    // })
    .catch(error => console.log('error', error));
}

function mainConversion(fetch, triples) {
  let formdata = new URLSearchParams();
  formdata.append("data", triples);

  let requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
  };

  return fetch("http://reasoner/reason/dl2op/main", requestOptions)
    .then(response => response.text())
    // .then(result => {
    //   console.log(`!!! MAIN\n${result}`)
    //   return result
    // })
    .catch(error => console.log('error', error));
}

function transformStatements(fetch, triples) {
  return transformGraph(fetch, triples.join('\n')).then(
    graph => {
      statements = graph.replace(/\n{2,}/g, '').split('\n')
      console.log(`CONVERSION: FROM ${triples.length} triples to ${statements.length}`)
      return statements
    }
  )
}

module.exports = {
  batchedDbUpdate,
  partition,
  transformStatements
};