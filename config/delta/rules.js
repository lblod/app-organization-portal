export default [
  {
    match: {
      graph: {
        type: "uri",
        value: "http://mu.semte.ch/graphs/administrative-unit"
      }
    },
    callback: {
      url: 'http://search/update',
      method: 'POST'
    },
    options: {
      resourceFormat: "v0.0.1",
      gracePeriod: 10000,
      ignoreFromSelf: true
    }
  },
  {
    match: {
      graph: {
        type: "uri",
        value: "http://mu.semte.ch/graphs/worship-service"
      }
    },
    callback: {
      url: 'http://search/update',
      method: 'POST'
    },
    options: {
      resourceFormat: "v0.0.1",
      gracePeriod: 10000,
      ignoreFromSelf: true
    }
  },

  {
    match: {
      graph: {
        type: "uri",
        value: "http://mu.semte.ch/graphs/administrative-unit"
      }
    },
    callback: {
      url: 'http://resource/.mu/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: "v0.0.1",
      gracePeriod: 250,
      ignoreFromSelf: true
    }
  },

  {
    match: {
      graph: {
        type: "uri",
        value: "http://mu.semte.ch/graphs/worship-service"
      }
    },
    callback: {
      url: 'http://resource/.mu/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: "v0.0.1",
      gracePeriod: 250,
      ignoreFromSelf: true
    }
  },

  {
    match: {
      predicate: {
        type: 'uri',
        value: 'http://www.w3.org/ns/adms#status'
      }
    },
    callback: {
      method: 'POST',
      url: 'http://jobs-controller/delta'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true,
      optOutMuScopeIds: ["http://redpencil.data.gift/id/concept/muScope/deltas/initialSync"]
    }
  },
  {
    match: {
    },
    callback: {
      url: 'http://delta-producer-pub-graph-maintainer-organizations/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true,
      optOutMuScopeIds: [
        "http://redpencil.data.gift/id/concept/muScope/deltas/initialSync",
        "http://redpencil.data.gift/id/concept/muScope/deltas/publicationGraphMaintenance"
      ]
    }
  },
  {
    match: {
    },
    callback: {
      url: 'http://delta-producer-pub-graph-maintainer-organizations-public-info/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true,
      optOutMuScopeIds: [
        "http://redpencil.data.gift/id/concept/muScope/deltas/initialSync",
        "http://redpencil.data.gift/id/concept/muScope/deltas/publicationGraphMaintenance"
      ]
    }
  },
  {
    match: {
    },
    callback: {
      url: 'http://delta-producer-pub-graph-maintainer-public/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true,
      optOutMuScopeIds: [
        "http://redpencil.data.gift/id/concept/muScope/deltas/initialSync",
        "http://redpencil.data.gift/id/concept/muScope/deltas/publicationGraphMaintenance"
      ]
    }
  },
  {
    match: {
      // anything
    },
    callback: {
      url: 'http://delta-producer-pub-graph-maintainer-worship-posts/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true,
      optOutMuScopeIds: [
        "http://redpencil.data.gift/id/concept/muScope/deltas/initialSync",
        "http://redpencil.data.gift/id/concept/muScope/deltas/publicationGraphMaintenance"
      ]
    }
  },
  {
    match: {
      predicate: {
        type: 'uri',
        value: 'http://www.w3.org/ns/adms#status'
      },
      object: {
        type: 'uri',
        value: 'http://redpencil.data.gift/id/concept/JobStatus/scheduled'
      }
    },
    callback: {
      url: 'http://delta-producer-dump-file-publisher/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true,
      optOutMuScopeIds: ["http://redpencil.data.gift/id/concept/muScope/deltas/initialSync"]
    }
  },
  // organizations-sync-with-sharepoint/delta : jobs come from the jobs graph, data from the two main graphs
  {
    match: {
      graph: {
        type: 'uri',
        value: 'http://mu.semte.ch/graphs/jobs'
      }
    },
    callback: {
      url: 'http://organizations-sync-with-sharepoint/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true,
      optOutMuScopeIds: [ "http://redpencil.data.gift/id/concept/muScope/deltas/initialSync" ]
    }
  },
  {
    match: {
      graph: {
        type: 'uri',
        value: 'http://mu.semte.ch/graphs/shared'
      }
    },
    callback: {
      url: 'http://organizations-sync-with-sharepoint/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true,
      optOutMuScopeIds: [ "http://redpencil.data.gift/id/concept/muScope/deltas/initialSync" ]
    }
  },
  {
    match: {
      graph: {
        type: 'uri',
        value: 'http://mu.semte.ch/graphs/administrative-unit'
      }
    },
    callback: {
      url: 'http://organizations-sync-with-sharepoint/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true,
      optOutMuScopeIds: [ "http://redpencil.data.gift/id/concept/muScope/deltas/initialSync" ]
    }
  }
/*
  Commenting ldes rules until ready to go to qa/prod. In the meantime, we override the configuration on dev.
  {
    match: {
      graph: {
        type: 'uri',
        value: 'http://mu.semte.ch/graphs/shared',
      }
    },
    callback: {
      url: 'http://ldes-delta-pusher/publish',
      method: 'POST',
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
    }
  },
  {
    match: {
      graph: {
        type: 'uri',
        value: 'http://mu.semte.ch/graphs/worship-service',
      }
    },
    callback: {
      url: 'http://ldes-delta-pusher/publish',
      method: 'POST',
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
    }
  },
  {
    match: {
      graph: {
        type: 'uri',
        value: 'http://mu.semte.ch/graphs/administrative-unit',
      }
    },
    callback: {
      url: 'http://ldes-delta-pusher/publish',
      method: 'POST',
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
    }
  }
*/
]
