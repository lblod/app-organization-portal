;;;;;;;;;;;;;;;;;;;
;;; delta messenger
(in-package :delta-messenger)

(add-delta-logger)
(add-delta-messenger "http://deltanotifier/")

;;;;;;;;;;;;;;;;;
;;; configuration
(in-package :client)
(setf *log-sparql-query-roundtrip* t)
(setf *backend* "http://triplestore:8890/sparql")

(in-package :server)
(setf *log-incoming-requests-p* nil)

;;;;;;;;;;;;;;;;;
;;; access rights
(in-package :acl)

(defparameter *access-specifications* nil
  "All known ACCESS specifications.")

(defparameter *graphs* nil
  "All known GRAPH-SPECIFICATION instances.")

(defparameter *rights* nil
  "All known GRANT instances connecting ACCESS-SPECIFICATION to GRAPH.")

;; Prefixes used in the constraints below (not in the SPARQL queries)
(define-prefixes
    :org "http://www.w3.org/ns/org#"
    :locn "http://www.w3.org/ns/locn#"
    :schema "http://schema.org/"
    :regorg "http://www.w3.org/ns/regorg#"
    :person "http://www.w3.org/ns/person#"
    :adms "http://www.w3.org/ns/adms#"
    :prov "http://www.w3.org/ns/prov#"
    :generiek "https://data.vlaanderen.be/ns/generiek#"
    :mandaat "http://data.vlaanderen.be/ns/mandaat#"
    :besluit "http://data.vlaanderen.be/ns/besluit#"
    :lblodlg "http://data.lblod.info/vocabularies/leidinggevenden/"
    :dc_terms "http://purl.org/dc/terms/"
    :foaf "http://xmlns.com/foaf/0.1/"
    :skos "http://www.w3.org/2004/02/skos/core#"
    :euvoc "http://publications.europa.eu/ontology/euvoc#"
    :ere "http://data.lblod.info/vocabularies/erediensten/"
    :ch "http://data.lblod.info/vocabularies/contacthub/"
    :code "http://lblod.data.gift/vocabularies/organisatie/"
    :ext "http://mu.semte.ch/vocabularies/ext/"
    :time "http://www.w3.org/2006/time#"
    :oasis "https://docs.oasis-open-projects.org/oslc-op/core/v3.0/os/core-vocab.html#"
    :nfo "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#"
    :dcat "http://www.w3.org/ns/dcat#"
    :besluitvorming "https://data.vlaanderen.be/ns/besluitvorming#"
    :reporting "http://lblod.data.gift/vocabularies/reporting/"
    :oslc "http://open-services.net/ns/core#"
    :cogs "http://vocab.deri.ie/cogs#"
  )

(type-cache::add-type-for-prefix "http://mu.semte.ch/sessions/" "http://mu.semte.ch/vocabularies/session/Session")

(define-graph acmidm-lezer ("http://mu.semte.ch/graphs/administrative-unit")
  ("dc_terms:Agent" -> _)
  ("org:Organization" -> _)
  ("regorg:RegisteredOrganization" -> _)
  ("besluit:Besluit" -> _)
  ("besluitvorming:Beslissingsactiviteit" -> _)
  ("org:Site" -> _)
  ("locn:Address" -> _)
  ("person:Person" -> _)
  ("schema:ContactPoint" -> _)
  ("besluit:Bestuurseenheid" -> _)
  ("besluit:Bestuursorgaan" -> _)
  ("adms:Identifier" -> _)
  ("generiek:GestructureerdeIdentificator" -> _)
  ("mandaat:Mandaat" -> _)
  ("mandaat:Mandataris" -> _)
  ("lblodlg:Functionaris" -> _)
  ("lblodlg:Bestuursfunctie" -> _)
  ("code:VeranderingsgebeurtenisResultaat" -> _)
  ("org:Post" -> _)
  ("org:ChangeEvent" -> _)
  ("ch:AgentInPositie" -> _)
  ("ext:KboOrganisatie" -> _)
  ("org:Membership" -> _)
  ("time:ProperInterval" -> _))

(define-graph acmidm-vendor ("http://mu.semte.ch/graphs/vendor-management-data")
  ("ext:Vendor" -> _))

(define-graph acmidm-editeerder ("http://mu.semte.ch/graphs/administrative-unit")
  ("oasis:Error" -> _)
  ("dc_terms:Agent" -> _)
  ("org:Organization" -> _)
  ("regorg:RegisteredOrganization" -> _)
  ("besluit:Besluit" -> _)
  ("besluitvorming:Beslissingsactiviteit" -> _)
  ("org:Site" -> _)
  ("locn:Address" -> _)
  ("person:Person" -> _)
  ("schema:ContactPoint" -> _)
  ("besluit:Bestuurseenheid" -> _)
  ("besluit:Bestuursorgaan" -> _)
  ("adms:Identifier" -> _)
  ("generiek:GestructureerdeIdentificator" -> _)
  ("mandaat:Mandaat" -> _)
  ("mandaat:Mandataris" -> _)
  ("lblodlg:Functionaris" -> _)
  ("lblodlg:Bestuursfunctie" -> _)
  ("code:VeranderingsgebeurtenisResultaat" -> _)
  ("org:Post" -> _)
  ("org:ChangeEvent" -> _)
  ("ch:AgentInPositie" -> _)
  ("ext:KboOrganisatie" -> _)
  ("org:Membership" -> _)
  ("time:ProperInterval" -> _))

(define-graph acmidm-worship-lezer ("http://mu.semte.ch/graphs/worship-service")
  ("ere:EredienstMandataris" -> _)
  ("ere:BestuurVanDeEredienst" -> _)
  ("ere:EredienstBestuurseenheid" -> _)
  ("ere:RolBedienaar" -> _)
  ("ere:VoorwaardenBedienaar" -> _)
  ("ere:PositieBedienaar" -> _)
  ("ere:BetrokkenLokaleBesturen" -> _)
  ("ere:VerbondenJuridischeStructuren" -> _)
  ("ere:CentraalBestuurVanDeEredienst" -> _)
  ("ere:RepresentatiefOrgaan" -> _)
  ("dc_terms:Agent" -> _)
  ("org:Organization" -> _)
  ("regorg:RegisteredOrganization" -> _)
  ("besluit:Besluit" -> _)
  ("besluitvorming:Beslissingsactiviteit" -> _)
  ("org:Site" -> _)
  ("locn:Address" -> _)
  ("person:Person" -> _)
  ("schema:ContactPoint" -> _)
  ("besluit:Bestuurseenheid" -> _)
  ("besluit:Bestuursorgaan" -> _)
  ("adms:Identifier" -> _)
  ("generiek:GestructureerdeIdentificator" -> _)
  ("mandaat:Mandaat" -> _)
  ("mandaat:Mandataris" -> _)
  ("lblodlg:Functionaris" -> _)
  ("lblodlg:Bestuursfunctie" -> _)
  ("code:VeranderingsgebeurtenisResultaat" -> _)
  ("org:Post" -> _)
  ("org:ChangeEvent" -> _)
  ("ch:AgentInPositie" -> _)
  ("ext:KboOrganisatie" -> _)
  ("org:Membership" -> _)
  ("time:ProperInterval" -> _))

(define-graph acmidm-worship-editeerder ("http://mu.semte.ch/graphs/worship-service")
  ("oasis:Error" -> _)
  ("ere:EredienstMandataris" -> _)
  ("ere:BestuurVanDeEredienst" -> _)
  ("ere:EredienstBestuurseenheid" -> _)
  ("ere:RolBedienaar" -> _)
  ("ere:VoorwaardenBedienaar" -> _)
  ("ere:PositieBedienaar" -> _)
  ("ere:BetrokkenLokaleBesturen" -> _)
  ("ere:VerbondenJuridischeStructuren" -> _)
  ("ere:CentraalBestuurVanDeEredienst" -> _)
  ("ere:RepresentatiefOrgaan" -> _)
  ("dc_terms:Agent" -> _)
  ("org:Organization" -> _)
  ("regorg:RegisteredOrganization" -> _)
  ("besluit:Besluit" -> _)
  ("besluitvorming:Beslissingsactiviteit" -> _)
  ("org:Site" -> _)
  ("locn:Address" -> _)
  ("person:Person" -> _)
  ("schema:ContactPoint" -> _)
  ("besluit:Bestuurseenheid" -> _)
  ("besluit:Bestuursorgaan" -> _)
  ("adms:Identifier" -> _)
  ("generiek:GestructureerdeIdentificator" -> _)
  ("mandaat:Mandaat" -> _)
  ("mandaat:Mandataris" -> _)
  ("lblodlg:Functionaris" -> _)
  ("lblodlg:Bestuursfunctie" -> _)
  ("code:VeranderingsgebeurtenisResultaat" -> _)
  ("org:Post" -> _)
  ("org:ChangeEvent" -> _)
  ("ch:AgentInPositie" -> _)
  ("ext:KboOrganisatie" -> _)
  ("org:Membership" -> _)
  ("time:ProperInterval" -> _))

(define-graph public ("http://mu.semte.ch/graphs/public")
  ("org:Role" -> _)
  ("besluit:Bestuurseenheid" -> _)
  ("foaf:Person" -> _)
  ("foaf:OnlineAccount" -> _)
  ("nfo:FileDataObject" -> _)
  ("dcat:Dataset" -> _)
  ("dcat:Distribution" -> _)
  ("dcat:Catalog" -> _)
  ("ext:GeslachtCode" -> _)
  ("lblodlg:FunctionarisStatusCode" -> _)
  ("code:OrganisatieStatusCode" -> _)
  ("code:BestuursfunctieCode" -> _)
  ("code:BestuursorgaanClassificatieCode" -> _)
  ("code:MandatarisStatusCode" -> _)
  ("code:BestuurseenheidClassificatieCode" -> _)
  ("ext:GeregistreerdeOrganisatieClassificatieCode" -> _)
  ("code:TypeEredienst" -> _)
  ("skos:ConceptScheme" -> _)
  ("code:BedienaarFinancieringCode" -> _)
  ("skos:Concept" -> _)
  ("euvoc:Country" -> _)
  ("code:TypeVestiging" -> _)
  ("code:HelftVerkiezing" -> _)
  ("code:Veranderingsgebeurtenis" -> _)
  ("code:TypeBetrokkenheid" -> _)
  ("code:VoorwaardenBedienaarCriterium" -> _)
  ("code:BedienaarCriteriumBewijsstuk" -> _)
  ("code:EredienstBeroepen" -> _)
  ("code:Rechtsvormtype" -> _)
  ("prov:Location" -> _))

(define-graph shared ("http://mu.semte.ch/graphs/shared")
  ("foaf:Image" -> _)
  ("nfo:FileDataObject" -> _)
  ("dc_terms:Agent" -> _)
  ("org:Organization" -> _)
  ("regorg:RegisteredOrganization" -> _)
  ("besluit:Besluit" -> _)
  ("besluitvorming:Beslissingsactiviteit" -> _)
  ("org:Site" -> _)
  ("locn:Address" -> _)
  ("person:Person" -> _)
  ("schema:ContactPoint" -> _)
  ("besluit:Bestuurseenheid" -> _)
  ("besluit:Bestuursorgaan" -> _)
  ("adms:Identifier" -> _)
  ("generiek:GestructureerdeIdentificator" -> _)
  ("mandaat:Mandaat" -> _)
  ("mandaat:Mandataris" -> _)
  ("lblodlg:Functionaris" -> _)
  ("lblodlg:Bestuursfunctie" -> _)
  ("code:VeranderingsgebeurtenisResultaat" -> _)
  ("org:Post" -> _)
  ("org:ChangeEvent" -> _)
  ("ch:AgentInPositie" -> _)
  ("ext:KboOrganisatie" -> _)
  ("org:Membership" -> _)
  ("time:ProperInterval" -> _))

(define-graph reports ("http://mu.semte.ch/graphs/reports")
  ("reporting:Report" -> _)
  ("oslc:Error" -> _)
  ("nfo:DataContainer" -> _)
  ("nfo:FileDataObject" -> _))

(define-graph system-jobs ("http://mu.semte.ch/graphs/system/jobs")
  ("cogs:Job" -> _)
  ("nfo:DataContainer" -> _)
  ("nfo:FileDataObject" -> _))

(define-graph jobs ("http://mu.semte.ch/graphs/jobs")
  ("cogs:Job" -> _)
  ("nfo:DataContainer" -> _)
  ("nfo:FileDataObject" -> _))

(supply-allowed-group "public")

(supply-allowed-group "o-admin-rwf"
  :parameters ()
  :query "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    SELECT DISTINCT ?session WHERE {
      <SESSION_ID> ext:sessionRole \"LoketLB-AdminDashboardOrganisatiePortaalGebruiker\" .
    }")

(supply-allowed-group "ABBOrganisatiePortaalGebruiker-lezer"
  :parameters ()
  :query "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    SELECT DISTINCT ?session_group ?session_role WHERE {
      <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                   ext:activeSessionRole ?session_role.
      FILTER( ?session_role = \"ABBOrganisatiePortaalGebruiker-lezer\" )
    }")

(supply-allowed-group "ABBOrganisatiePortaalGebruiker-editeerder"
  :parameters ()
  :query "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    SELECT DISTINCT ?session_group ?session_role WHERE {
      <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                   ext:activeSessionRole ?session_role.
      FILTER( ?session_role = \"ABBOrganisatiePortaalGebruiker-editeerder\" )
    }")

(supply-allowed-group "ABBOrganisatiePortaalGebruiker-beheerder"
  :parameters ()
  :query "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    SELECT DISTINCT ?session_group ?session_role WHERE {
      <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                   ext:activeSessionRole ?session_role.
      FILTER( ?session_role = \"ABBOrganisatiePortaalGebruiker-beheerder\" )
    }")


(supply-allowed-group "ABBOrganisatiePortaalErediensten-lezer"
  :parameters ()
  :query "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    SELECT DISTINCT ?session_group ?session_role WHERE {
      <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                   ext:activeSessionRole ?session_role.
      FILTER( ?session_role = \"ABBOrganisatiePortaalErediensten-lezer\" )
    }")

(supply-allowed-group "ABBOrganisatiePortaalErediensten-editeerder"
  :parameters ()
  :query "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    SELECT DISTINCT ?session_group ?session_role WHERE {
      <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                   ext:activeSessionRole ?session_role.
      FILTER( ?session_role = \"ABBOrganisatiePortaalErediensten-editeerder\" )
    }")

(supply-allowed-group "ABBOrganisatiePortaalErediensten-beheerder"
  :parameters ()
  :query "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    SELECT DISTINCT ?session_group ?session_role WHERE {
      <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                   ext:activeSessionRole ?session_role.
      FILTER( ?session_role = \"ABBOrganisatiePortaalErediensten-beheerder\" )
    }")

(grant (read)
  :to-graph (acmidm-lezer acmidm-vendor)
  :for-allowed-group "ABBOrganisatiePortaalGebruiker-lezer")

(grant (read write)
  :to-graph (acmidm-editeerder acmidm-vendor)
  :for-allowed-group "ABBOrganisatiePortaalGebruiker-editeerder")

(grant (read write)
  :to-graph (acmidm-editeerder acmidm-vendor)
  :for-allowed-group "ABBOrganisatiePortaalGebruiker-beheerder")

(grant (read)
  :to-graph (acmidm-worship-lezer acmidm-vendor)
  :for-allowed-group "ABBOrganisatiePortaalErediensten-lezer")

(grant (read write)
  :to-graph (acmidm-worship-editeerder acmidm-vendor)
  :for-allowed-group "ABBOrganisatiePortaalErediensten-editeerder")

(grant (read write)
  :to-graph (acmidm-worship-editeerder acmidm-vendor)
  :for-allowed-group "ABBOrganisatiePortaalErediensten-beheerder")

(grant (read)
  :to-graph (public shared)
  :for-allowed-group "public")

(grant (read write)
  :to-graph (reports jobs system-jobs)
  :for-allowed-group "o-admin-rwf")