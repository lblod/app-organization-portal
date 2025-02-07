;;;;;;;;;;;;;;;;;;;
;;; delta messenger
(in-package :delta-messenger)

(add-delta-logger)
(add-delta-messenger "http://delta-notifier/")

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

(type-cache::add-type-for-prefix "http://mu.semte.ch/sessions/" "http://mu.semte.ch/vocabularies/session/Session")

;;
;; TODO:
;; - resolve errors concerning sending deltas (cf. `docker compose logs db'), related to search indexing?
;; - Avoid specifying the same type multiple times
;; - remove unneeded resource types, if any
;; - thoroughly test

(defun query-for-role (role)
  (format nil "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
              PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
              SELECT DISTINCT ?session_group ?session_role
              WHERE {
                <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                  ext:activeSessionRole ?session_role.
                FILTER (?session_role = \"~A\")
              }"
          role))

(define-prefixes
    :adms "http://www.w3.org/ns/adms#"
  :besluit "http://data.vlaanderen.be/ns/besluit#"
  :besluitvorming "https://data.vlaanderen.be/ns/besluitvorming"
  :ch "http://data.lblod.info/vocabularies/contacthub/"
  :code "http://lblod.data.gift/vocabularies/organisatie/"
  :dcat "http://www.w3.org/ns/dcat#"
  :dcterms "http://purl.org/dc/terms/"
  :ere "http://data.lblod.info/vocabularies/erediensten/"
  :euvoc "http://publications.europa.eu/ontology/euvoc#"
  :ext "http://mu.semte.ch/vocabularies/ext/"
  :foaf "http://xmlns.com/foaf/0.1/"
  :generiek "https://data.vlaanderen.be/ns/generiek#"
  :lblodlg "http://data.lblod.info/vocabularies/leidinggevenden/"
  :lblodorg "https://data.lblod.info/vocabularies/organisatie/"
  :locn "http://www.w3.org/ns/locn#"
  :mandaat "http://data.vlaanderen.be/ns/mandaat#"
  :nfo "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#"
  :org "http://www.w3.org/ns/org#"
  :oslc-op "https://docs.oasis-open-projects.org/oslc-op/core/v3.0/os/core-vocab.html#"
  :person "http://www.w3.org/ns/person#"
  :prov "http://www.w3.org/ns/prov#"
  :regorg "http://www.w3.org/ns/regorg#"
  :schema "http://schema.org/"
  :skos "http://www.w3.org/2004/02/skos/core#"
  :time "http://www.w3.org/2006/time#")

(define-graph public ("http://mu.semte.ch/graphs/public")
  ;; @public_type
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
  ("code:Rechtsvormtype" -> _))

(define-graph shared ("http://mu.semte.ch/graphs/shared")
  ;; @shared_protected_type
  ("prov:Location" -> _)
  ("foaf:Image" -> _)
  ("nfo:FileDataObject" -> _)
  ;; @org_type
  ("dcterms:Agent" -> _)
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
  ("time:ProperInterval" -> _)) ; TODO: No longer used in OP?

(define-graph administrative-unit ("http://mu.semte.ch/graphs/administrative-unit")
  ;; @org_type
  ("dcterms:Agent" -> _)
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
  ("time:ProperInterval" -> _) ; TODO: No longer used in OP?
  ;; @error_type
  ("oslc-op:Error" -> _))

(define-graph worship-service ("http://mu.semte.ch/graphs/worship-service")
  ;; @worship_type
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
  ;; @org_type
  ("dcterms:Agent" -> _)
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
  ("time:ProperInterval" -> _) ; TODO: No longer used in OP?
  ;; @error_type
  ("oslc-op:Error" -> _))


(supply-allowed-group "public")

(supply-allowed-group "worship-reader"
                      :query (query-for-role "ABBOrganisatiePortaalErediensten-lezer"))

(supply-allowed-group "worship-editor"
                      :query (query-for-role "ABBOrganisatiePortaalErediensten-editeerder"))

(supply-allowed-group "worship-admin"
                      :query (query-for-role "ABBOrganisatiePortaalErediensten-beheerder"))

(supply-allowed-group "unit-reader"
                      :query (query-for-role "ABBOrganisatiePortaalGebruiker-lezer"))

(supply-allowed-group "unit-editor"
                      :query (query-for-role "ABBOrganisatiePortaalGebruiker-editeerder"))

(supply-allowed-group "unit-admin"
                      :query (query-for-role "ABBOrganisatiePortaalGebruiker-beheerder"))

(grant (read)
       :to-graph (public)
       :for-allowed-group "public")

(grant (read)
       :to-graph (shared)
       :for-allowed-group "public")

(grant (read)
       :to-graph (worship-service)
       :for-allowed-group "worship-reader")

(grant (read write)
       :to-graph (worship-service)
       :for-allowed-group "worship-editor")

(grant (read write)
       :to-graph (worship-service)
       :for-allowed-group "worship-admin")

(grant (read)
       :to-graph (administrative-unit)
       :for-allowed-group "unit-reader")

(grant (read write)
       :to-graph (administrative-unit)
       :for-allowed-group "unit-editor")

(grant (read write)
       :to-graph (administrative-unit)
       :for-allowed-group "unit-admin")
