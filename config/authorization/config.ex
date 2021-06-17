alias Acl.Accessibility.Always, as: AlwaysAccessible
alias Acl.GraphSpec.Constraint.Resource, as: ResourceConstraint
alias Acl.GraphSpec.Constraint.ResourceFormat, as: ResourceFormatConstraint
alias Acl.Accessibility.ByQuery, as: AccessByQuery
alias Acl.GraphSpec, as: GraphSpec
alias Acl.GroupSpec, as: GroupSpec
alias Acl.GroupSpec.GraphCleanup, as: GraphCleanup

defmodule Acl.UserGroups.Config do
  def user_groups do
    [
      %GroupSpec{
        name: "public",
        useage: [:read],
        access: %AlwaysAccessible{}, 
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/public",
                    constraint: %ResourceConstraint{
                      resource_types: [
                          "http://www.w3.org/2004/02/skos/core#Concept",
                          "http://www.w3.org/ns/org#Organization",
                          "http://www.w3.org/ns/org#Site",
                          "http://www.w3.org/ns/locn#Address",
                          "https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator",
                          "http://www.w3.org/ns/adms#Identifier",
                          "http://www.w3.org/ns/person#Person",
                          "http://schema.org/ContactPoint",
                          "http://data.vlaanderen.be/ns/mandaat#Mandataris",
                          "http://data.vlaanderen.be/ns/mandaat#Mandaat",
                          "http://data.lblod.info/vocabularies/leidinggevenden/Bestuursfunctie",
                          "http://data.vlaanderen.be/ns/besluit#Bestuursorgaan",
                          "http://data.vlaanderen.be/ns/besluit#Bestuurseenheid",
                          "http://data.lblod.info/vocabularies/erediensten/BestuurVanDeEredienst",
                          "http://data.lblod.info/vocabularies/erediensten/Eredienstbestuursorgaan",
                          "http://data.lblod.info/vocabularies/erediensten/CentraalBestuurVanDeEredienst",
                          "http://data.lblod.info/vocabularies/erediensten/CentraleBestuursorgaan",
                          "http://data.lblod.info/vocabularies/erediensten/RepresentatiefOrgaan",
                          "http://data.lblod.info/vocabularies/erediensten/EredienstMandataris",
                          "http://www.w3.org/ns/org#ChangeEvent",
                          "http://www.w3.org/ns/org#Role",
                          "http://www.w3.org/ns/org#Post",
                          "http://data.lblod.info/vocabularies/contacthub/AgentInPositie",
                          "http://www.w3.org/ns/prov#Location"
                      ]
                    } } ] },
      %GraphCleanup{
        originating_graph: "http://mu.semte.ch/application",
        useage: [:read, :write],
        name: "clean"
      }
    ]
  end
end