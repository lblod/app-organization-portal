export default [
  {
    match: {
      graph: {
        type: "uri",
        value: "http://mu.semte.ch/graphs/organisatieportaal"
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
        value: "http://mu.semte.ch/graphs/organisatieportaal"
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
      url: 'http://delta-producer-pub-graph-maintainer-administrative-units/delta',
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
      graph: {
        type: 'uri',
        value: 'http://redpencil.data.gift/id/deltas/producer/administrative-units'
      }
    },
    callback: {
      url: 'http://delta-producer-json-diff-publisher-administrative-units/delta',
      method: 'POST'
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
      graph: {
        type: 'uri',
        value: 'http://redpencil.data.gift/id/deltas/producer/organizations'
      }
    },
    callback: {
      url: 'http://delta-producer-json-diff-publisher-organizations/delta',
      method: 'POST'
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
      graph: {
        type: 'uri',
        value: 'http://redpencil.data.gift/id/deltas/producer/public'
      }
    },
    callback: {
      url: 'http://delta-producer-json-diff-publisher-public/delta',
      method: 'POST'
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
  {
    match: {
      graph: {
        type: 'uri',
        value: 'http://mu.semte.ch/graphs/ingest'
      }
    },
    callback: {
      url: 'http://consumer-dispatcher/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: "v0.0.1",
      gracePeriod: 10000,
      ignoreFromSelf: true
    }
  }
]
