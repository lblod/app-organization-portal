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

(defun query-for-role (role)
  (format nil "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
              PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
              SELECT distinct ?session_group ?session_role WHERE {
                <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                  ext:activeSessionRole ?session_role.
                FILTER (?session_role = \"~A\")
              }"
          role))

(define-prefixes
    :ere "http://data.lblod.info/vocabularies/erediensten/"
  :org "http://www.w3.org/ns/org#"
  :besluit "http://data.vlaanderen.be/ns/besluit#")

(define-graph public ("http://mu.semte.ch/graphs/public")
  (_ -> _))

(define-graph shared ("http://mu.semte.ch/graphs/shared")
  (_ -> _))

(define-graph administrative-unit ("http://mu.semte.ch/graphs/administrative-unit")
  (_ -> _))

(define-graph worship-service ("http://mu.semte.ch/graphs/worship-service")
  (_ -> _))

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
