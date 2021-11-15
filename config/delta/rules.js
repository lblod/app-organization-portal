export default [
    {
      match: {
        graph: {
          type: "uri",
          value: "http://mu.semte.ch/graphs/contacthub/141d9d6b-54af-4d17-b313-8d1c30bc3f5b/ChAdmin"
        }
      },
      callback: {
        url: "http://kalliope-api/delta", method: "POST"
      },
      options: {
        resourceFormat: "v0.0.1",
        gracePeriod: 1000,
        ignoreFromSelf: true
      }
    }
  ]