alias Acl.Accessibility.Always, as: AlwaysAccessible
alias Acl.GraphSpec.Constraint.Resource, as: ResourceConstraint
alias Acl.GraphSpec.Constraint.ResourceFormat, as: ResourceFormatConstraint
alias Acl.Accessibility.ByQuery, as: AccessByQuery
alias Acl.GraphSpec, as: GraphSpec
alias Acl.GroupSpec, as: GroupSpec
alias Acl.GroupSpec.GraphCleanup, as: GraphCleanup

defmodule Acl.UserGroups.Config do
  defp access_by_role( group_string ) do
    %AccessByQuery{
      vars: ["session_group","session_role"],
      query: sparql_query_for_access_role( group_string ) }
  end

  defp sparql_query_for_access_role( group_string ) do
    "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    SELECT ?session_group ?session_role WHERE {
      <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                   ext:sessionRole ?session_role.
      FILTER( ?session_role = \"#{group_string}\" )
    }"
  end

  def user_groups do
    [
            %GroupSpec{
        name: "acmidm",
        useage: [:read, :write, :read_for_write],
        access: %AccessByQuery{
          query: "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
                  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
                  PREFIX musession: <http://mu.semte.ch/vocabularies/session/>
                  SELECT ?s WHERE {
                    ?s ?p ?o.
                    FILTER NOT EXISTS {
                      <SESSION_ID> ext:hasAccount ?account.
                    }
                  } LIMIT 1",
          vars: []
        },
        graphs: [
          %GraphSpec{
            graph: "http://mu.semte.ch/graphs/contacthub/141d9d6b-54af-4d17-b313-8d1c30bc3f5b/ChAdmin",
            constraint: %ResourceConstraint{
              resource_types: [
                        "http://www.w3.org/ns/org#Organization",
                        "http://data.vlaanderen.be/ns/besluit#Bestuurseenheid",
                        "http://data.lblod.info/vocabularies/erediensten/BestuurVanDeEredienst",
                        "http://data.vlaanderen.be/ns/besluit#Bestuursorgaan",
                        "http://data.lblod.info/vocabularies/erediensten/Eredienstbestuursorgaan",
                        "http://www.w3.org/ns/adms#Identifier",
                        "https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator",
                        "http://www.w3.org/ns/org#ChangeEvent",
                        "http://data.lblod.info/vocabularies/erediensten/BetrokkenLokaleBesturen",
                        "http://www.w3.org/ns/prov#Location",
                        "http://www.w3.org/ns/org#Site",
                        "http://www.w3.org/ns/locn#Address",                          
                        "http://www.w3.org/ns/person#Person",
                        "http://data.vlaanderen.be/ns/mandaat#Mandaat",
                        "http://data.vlaanderen.be/ns/mandaat#Mandataris",
                        "http://data.lblod.info/vocabularies/erediensten/EredienstMandataris",
                        "http://schema.org/ContactPoint",                          
                        "http://data.lblod.info/vocabularies/leidinggevenden/Bestuursfunctie",
                        "http://data.lblod.info/vocabularies/erediensten/CentraalBestuurVanDeEredienst",
                        "http://data.lblod.info/vocabularies/erediensten/CentraleBestuursorgaan",
                        "http://data.lblod.info/vocabularies/erediensten/RepresentatiefOrgaan",                          
                        "http://www.w3.org/ns/org#Role",
                        "http://www.w3.org/ns/org#Post",
                        "http://data.lblod.info/vocabularies/contacthub/AgentInPositie",
                        "http://lblod.data.gift/vocabularies/organisatie/OrganisatieStatusCode",
                        "http://lblod.data.gift/vocabularies/organisatie/BestuursfunctieCode",
                        "http://lblod.data.gift/vocabularies/organisatie/BestuursorgaanClassificatieCode",
                        "http://lblod.data.gift/vocabularies/organisatie/TypeEredienst",
                        "http://lblod.data.gift/vocabularies/organisatie/HelftVerkiezing",
                        "http://lblod.data.gift/vocabularies/organisatie/Veranderingsgebeurtenis",
                        "http://lblod.data.gift/vocabularies/organisatie/MandatarisStatusCode",
                        "http://lblod.data.gift/vocabularies/organisatie/BestuurseenheidClassificatieCode",
                        "http://lblod.data.gift/vocabularies/organisatie/TypeBetrokkenheid",
                        "http://www.w3.org/2004/02/skos/core#ConceptScheme",
                        "http://www.w3.org/2004/02/skos/core#Concept",
                        "http://xmlns.com/foaf/0.1/Image",
                        "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#FileDataObject"
              ]
            }
          }
        ]
      },
           %GroupSpec{
        name: "ch-admin",
        useage: [:read, :write, :read_for_write],
        access: access_by_role( "ChAdmin" ),
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/contacthub/",
                    constraint: %ResourceConstraint{
                      resource_types: [
                        "http://www.w3.org/ns/org#Organization",
                        "http://data.vlaanderen.be/ns/besluit#Bestuurseenheid",
                        "http://data.lblod.info/vocabularies/erediensten/BestuurVanDeEredienst",
                        "http://data.vlaanderen.be/ns/besluit#Bestuursorgaan",
                        "http://data.lblod.info/vocabularies/erediensten/Eredienstbestuursorgaan",
                        "http://www.w3.org/ns/adms#Identifier",
                        "https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator",
                        "http://www.w3.org/ns/org#ChangeEvent",
                        "http://data.lblod.info/vocabularies/erediensten/BetrokkenLokaleBesturen",
                        "http://www.w3.org/ns/prov#Location",
                        "http://www.w3.org/ns/org#Site",
                        "http://www.w3.org/ns/locn#Address",                          
                        "http://www.w3.org/ns/person#Person",
                        "http://data.vlaanderen.be/ns/mandaat#Mandaat",
                        "http://data.vlaanderen.be/ns/mandaat#Mandataris",
                        "http://data.lblod.info/vocabularies/erediensten/EredienstMandataris",
                        "http://schema.org/ContactPoint",                          
                        "http://data.lblod.info/vocabularies/leidinggevenden/Bestuursfunctie",
                        "http://data.lblod.info/vocabularies/erediensten/CentraalBestuurVanDeEredienst",
                        "http://data.lblod.info/vocabularies/erediensten/CentraleBestuursorgaan",
                        "http://data.lblod.info/vocabularies/erediensten/RepresentatiefOrgaan",                          
                        "http://www.w3.org/ns/org#Role",
                        "http://www.w3.org/ns/org#Post",
                        "http://data.lblod.info/vocabularies/contacthub/AgentInPositie",
                        "http://lblod.data.gift/vocabularies/organisatie/OrganisatieStatusCode",
                        "http://lblod.data.gift/vocabularies/organisatie/BestuursfunctieCode",
                        "http://lblod.data.gift/vocabularies/organisatie/BestuursorgaanClassificatieCode",
                        "http://lblod.data.gift/vocabularies/organisatie/TypeEredienst",
                        "http://lblod.data.gift/vocabularies/organisatie/HelftVerkiezing",
                        "http://lblod.data.gift/vocabularies/organisatie/Veranderingsgebeurtenis",
                        "http://lblod.data.gift/vocabularies/organisatie/MandatarisStatusCode",
                        "http://lblod.data.gift/vocabularies/organisatie/BestuurseenheidClassificatieCode",
                        "http://lblod.data.gift/vocabularies/organisatie/TypeBetrokkenheid",
                        "http://www.w3.org/2004/02/skos/core#ConceptScheme",
                        "http://www.w3.org/2004/02/skos/core#Concept",
                        "http://xmlns.com/foaf/0.1/Image",
                        "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#FileDataObject" ] } } ] },
      %GroupSpec{
        name: "public",
        useage: [:read],
        access: %AlwaysAccessible{}, 
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/public",
                    constraint: %ResourceConstraint{
                      resource_types: [
                        "http://data.vlaanderen.be/ns/besluit#Bestuurseenheid",
                        "http://xmlns.com/foaf/0.1/Person",
                        "http://xmlns.com/foaf/0.1/OnlineAccount"
                      ]
                    } },
                  %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/sessions",
                    constraint: %ResourceFormatConstraint{
                      resource_prefix: "http://mu.semte.ch/sessions/"
                    } } ] },
  
      %GroupSpec{
        name: "org",
        useage: [:read],
        access: %AccessByQuery{
          vars: ["session_group"],
          query: "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
                  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
                  SELECT ?session_group ?session_role WHERE {
                    <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group.
                    }" },
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/organizations/",
                    constraint: %ResourceConstraint{
                      resource_types: [
                        "http://xmlns.com/foaf/0.1/Person",
                        "http://xmlns.com/foaf/0.1/OnlineAccount",
                        "http://www.w3.org/ns/adms#Identifier",
                      ] } } ] },

                      
      # // CLEANUP
      #
      %GraphCleanup{
        originating_graph: "http://mu.semte.ch/application",
        useage: [:read, :write],
        name: "clean"
      }
    ]
  end
end