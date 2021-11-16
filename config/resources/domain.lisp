
(in-package :mu-cl-resources)

(defparameter *include-count-in-paginated-responses* t)

; fixes bug in sorting - parameter is a workaround for virtuoso behaviour (see docs) but cause problems for sorting
(defparameter *max-group-sorted-properties* nil)

; Enable caching: https://github.com/mu-semtech/mu-cl-resources/blob/master/README.md#caching
(defparameter *cache-model-properties* t)
(defparameter *cache-count-queries* t)
(defparameter *supply-cache-headers-p* t)

(read-domain-file "domain.json")
(read-domain-file "auth.json")(read-domain-file "files-domain.lisp")
