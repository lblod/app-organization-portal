
(in-package :mu-cl-resources)

(defparameter *include-count-in-paginated-responses* t)

; fixes bug in sorting - parameter is a workaround for virtuoso behaviour (see docs) but cause problems for sorting
(defparameter *max-group-sorted-properties* nil)

(read-domain-file "domain.json")