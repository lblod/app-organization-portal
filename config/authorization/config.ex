alias Acl.Accessibility.Always, as: AlwaysAccessible
alias Acl.GraphSpec.Constraint.Resource, as: ResourceConstraint
alias Acl.GraphSpec.Constraint.ResourceFormat, as: ResourceFormatConstraint
alias Acl.Accessibility.ByQuery, as: AccessByQuery
alias Acl.GraphSpec, as: GraphSpec
alias Acl.GroupSpec, as: GroupSpec
alias Acl.GroupSpec.GraphCleanup, as: GraphCleanup

defmodule Acl.UserGroups.Config do
 @protected_resource_type [
                        "http://www.w3.org/ns/org#Organization",
                        "http://data.vlaanderen.be/ns/besluit#Bestuurseenheid",
                        "http://data.lblod.info/vocabularies/erediensten/BestuurVanDeEredienst",
                        "http://data.vlaanderen.be/ns/besluit#Bestuursorgaan",
                        "http://data.lblod.info/vocabularies/erediensten/RolBedienaar",
                        "http://data.lblod.info/vocabularies/erediensten/VoorwaardenBedienaar",
                        "https://data.vlaanderen.be/ns/persoon#Geboorte",
                        "http://mu.semte.ch/vocabularies/ext/GeslachtCode",
                        "http://data.lblod.info/vocabularies/erediensten/PositieBedienaar",
                        "http://www.w3.org/ns/adms#Identifier",
                        "https://data.vlaanderen.be/ns/generiek#GestructureerdeIdentificator",
                        "http://www.w3.org/ns/org#ChangeEvent",
                        "http://data.lblod.info/vocabularies/erediensten/BetrokkenLokaleBesturen",
                        "http://data.lblod.info/vocabularies/erediensten/VerbondenJuridischeStructuren",
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
                        "http://lblod.data.gift/vocabularies/organisatie/VoorwaardenBedienaarCriterium",
                        "http://lblod.data.gift/vocabularies/organisatie/BedienaarCriteriumBewijsstuk",
                        "http://lblod.data.gift/vocabularies/organisatie/EredienstBeroepen",
                        "http://lblod.data.gift/vocabularies/organisatie/BedienaarFinanceringCode",
                        "http://lblod.data.gift/vocabularies/organisatie/TypeVestiging",
                        "http://lblod.data.gift/vocabularies/organisatie/Rechtsvormtype",
                        "http://www.w3.org/2004/02/skos/core#ConceptScheme",
                        "http://www.w3.org/2004/02/skos/core#Concept",
                        "http://xmlns.com/foaf/0.1/Image",
                        "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#FileDataObject",
                        "http://publications.europa.eu/ontology/euvoc#Country"
 ]
  defp access_by_role( group_string ) do
    %AccessByQuery{
#      vars: ["session_group","session_role"], todo we might have to  create multiple graph depending on role
       vars: [],
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
        name: "acmidm-lezer",
        useage: [:read],
        access: access_by_role( "ABBOrganisatiePortaalGebruiker-lezer" ),
        graphs: [
          %GraphSpec{
            graph: "http://mu.semte.ch/graphs/organisatieportaal",
            constraint: %ResourceConstraint{
              resource_types: @protected_resource_type
            }
          }
        ]
      },
       %GroupSpec{
        name: "acmidm-editeerder",
        useage: [:read, :write, :read_for_write],
        access: access_by_role( "ABBOrganisatiePortaalGebruiker-editeerder" ),
        graphs: [
          %GraphSpec{
            graph: "http://mu.semte.ch/graphs/organisatieportaal",
            constraint: %ResourceConstraint{
              resource_types: @protected_resource_type
            }
          }
        ]
      },
       %GroupSpec{
        name: "acmidm-beheerder",
        useage: [:read, :write, :read_for_write],
        access: access_by_role( "ABBOrganisatiePortaalGebruiker-beheerder" ),
        graphs: [
          %GraphSpec{
            graph: "http://mu.semte.ch/graphs/organisatieportaal",
            constraint: %ResourceConstraint{
              resource_types: @protected_resource_type
            }
          }
        ]
      },
           %GroupSpec{
        name: "ch-lezer",
        useage: [:read],
        access: access_by_role( "ABBOrganisatiePortaalGebruiker-lezer" ),
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/organisatieportaal",
                    constraint: %ResourceConstraint{
                      resource_types: @protected_resource_type } } ] },
           %GroupSpec{
        name: "ch-editeerder",
        useage: [:read, :write, :read_for_write],
        access: access_by_role( "ABBOrganisatiePortaalGebruiker-editeerder" ),
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/organisatieportaal",
                    constraint: %ResourceConstraint{
                      resource_types: @protected_resource_type } } ] },
           %GroupSpec{
        name: "ch-beheerder",
        useage: [:read, :write, :read_for_write],
        access: access_by_role( "ABBOrganisatiePortaalGebruiker-beheerder" ),
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/organisatieportaal",
                    constraint: %ResourceConstraint{
                      resource_types: @protected_resource_type } } ] },
      %GroupSpec{
        name: "public",
        useage: [:read],
        access: %AlwaysAccessible{},
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/public", # mock login only
                    constraint: %ResourceConstraint{
                      resource_types: [
                        "http://data.vlaanderen.be/ns/besluit#Bestuurseenheid",
                        "http://xmlns.com/foaf/0.1/Person",
                        "http://xmlns.com/foaf/0.1/OnlineAccount",
                        "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#FileDataObject",
                        "http://www.w3.org/ns/dcat#Dataset",
                        "http://www.w3.org/ns/dcat#Distribution",
                        "http://www.w3.org/ns/dcat#Catalog"
                      ]
                    } }]},

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
