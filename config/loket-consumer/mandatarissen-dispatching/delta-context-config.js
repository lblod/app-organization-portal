
const PREFIXES = `
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX mandaat: <http://data.vlaanderen.be/ns/mandaat#>
PREFIX lblodlg: <http://data.lblod.info/vocabularies/leidinggevenden/>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>`

const contextConfig = {
  addTypes: {
    scope: 'all', // 'inserts, 'deletes', 'all' or none. To add rdf:type to subjects of inserts, deletes or both
    exhausitive: false, // true or false: find all types for a subject, even if one is already present in delta
  },
  contextQueries: [
    // Case Mandatarissen
    // They can be triggered when being inserted or when their link to a mandate is added
    {
      trigger: { // subjectType or predicateValue
        subjectType: "mandaat:Mandataris"
      },
      queryTemplate: (subject) => `
        ${PREFIXES}
        CONSTRUCT {
          ?mandataris org:holds ?mandate ;
            ?p ?o .
          ?orgaanInTime org:hasPost ?mandate ;
            mandaat:isTijdspecialisatieVan ?orgaan .
          ?orgaan besluit:bestuurt ?eenheid .
          ?eenheid besluit:classificatie ?classification .
        } WHERE {
          GRAPH <http://mu.semte.ch/graphs/landing-zone/mandatarissen> {
            VALUES ?mandataris { ${subject} }
            ?mandataris org:holds ?mandate ;
              ?p ?o .
            ?orgaanInTime org:hasPost ?mandate ;
              mandaat:isTijdspecialisatieVan ?orgaan .
            ?orgaan besluit:bestuurt ?eenheid .
            ?eenheid besluit:classificatie ?classification .
          }
        }`
    },
    {
      trigger: {
        predicateValue: "org:holds"
      },
      queryTemplate: (subject) => `
        ${PREFIXES}
        CONSTRUCT {
          ?mandataris org:holds ?mandate ;
            ?p ?o .
          ?orgaanInTime org:hasPost ?mandate ;
            mandaat:isTijdspecialisatieVan ?orgaan .
          ?orgaan besluit:bestuurt ?eenheid .
          ?eenheid besluit:classificatie ?classification .
        } WHERE {
          GRAPH <http://mu.semte.ch/graphs/landing-zone/mandatarissen> {
            VALUES ?mandataris { ${subject} }
            ?mandataris org:holds ?mandate ;
              ?p ?o .
            ?orgaanInTime org:hasPost ?mandate ;
              mandaat:isTijdspecialisatieVan ?orgaan .
            ?orgaan besluit:bestuurt ?eenheid .
            ?eenheid besluit:classificatie ?classification .
          }
        }`
    }
  ]
}

module.exports = {
  contextConfig,
  PREFIXES
};
