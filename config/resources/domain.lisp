(in-package :mu-cl-resources)

(defparameter *include-count-in-paginated-responses* t)

; fixes bug in sorting - parameter is a workaround for virtuoso behaviour (see docs) but cause problems for sorting
(defparameter *max-group-sorted-properties* nil)

; Enable caching: https://github.com/mu-semtech/mu-cl-resources/blob/master/README.md#caching
(defparameter *cache-model-properties* t)
(defparameter *cache-count-queries* t)
(defparameter *supply-cache-headers-p* t)
(defparameter sparql:*experimental-no-application-graph-for-sudo-select-queries* t)

; use xsd:boolean instead of custom datatype
(defparameter *use-custom-boolean-type-p* nil)

(read-domain-file "domain.json")
(read-domain-file "auth.json")
(read-domain-file "change-events.json")
(read-domain-file "file.json")
(read-domain-file "dcat.json")
(read-domain-file "privacy-centric-service.json")
(read-domain-file "job.json")
(read-domain-file "report.json")
(read-domain-file "log.json")
(read-domain-file "harvest.json")
