export default [
    {
      match: {
        subject: {
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