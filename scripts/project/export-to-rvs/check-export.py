#!/usr/bin/env python3
"""Find contradictions in an N-Triples export.

Reads the artifact and prints check<TAB>count rows, one per check. Every check
should be 0. export.sh fails the run when contradictions.tsv is non-empty;
this script exits 0 either way, so the file is written first.

    check-export.py --classes classes.tsv --nt op-rvs.nt
"""
import argparse
import sys

ERE = "http://data.lblod.info/vocabularies/erediensten/"
RDF_TYPE = "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>"
ORG = "<http://www.w3.org/ns/org#Organization>"
BESLUITEENHEID = "<http://data.vlaanderen.be/ns/besluit#Bestuurseenheid>"
BESTUURSORGAAN = "<http://data.vlaanderen.be/ns/besluit#Bestuursorgaan>"
UUID = "<http://mu.semte.ch/vocabularies/core/uuid>"
MEMBERSHIP = "<http://www.w3.org/ns/org#Membership>"
# OP writes both spellings. 929 memberships use org:organisation (British) and
# carry no org:organization at all, so a check on one spelling reports them as
# broken when they are fine.
MEMBERSHIP_ORG = (
    "<http://www.w3.org/ns/org#organization>",
    "<http://www.w3.org/ns/org#organisation>",
)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--classes", required=True)
    parser.add_argument("--nt", required=True)
    args = parser.parse_args()

    # Subjects by type, built in one pass over the file.
    typed = {}
    has_uuid = set()
    membership_has_org = set()
    worship_type = set()
    worship_subject = set()

    with open(args.nt, encoding="utf-8") as handle:
        for line in handle:
            if not line.strip() or line.startswith("#"):
                continue
            try:
                subject, predicate, obj = line.rstrip("\n").split("\t", 2)
            except ValueError:
                continue
            obj = obj.rstrip(" .")
            if predicate == RDF_TYPE:
                typed.setdefault(obj, set()).add(subject)
                if obj.startswith(f"<{ERE}"):
                    worship_type.add(subject)
            elif predicate == UUID:
                has_uuid.add(subject)
            elif predicate in MEMBERSHIP_ORG:
                membership_has_org.add(subject)
            if subject.startswith(f"<{ERE}"):
                worship_subject.add(subject)

    checks = {
        "worship-type": len(worship_type),
        "worship-subject": len(worship_subject),
        "unit-without-org-type": len(typed.get(BESLUITEENHEID, set()) - typed.get(ORG, set())),
        "body-without-org-type": len(typed.get(BESTUURSORGAAN, set()) - typed.get(ORG, set())),
        "unit-without-uuid": len(typed.get(BESLUITEENHEID, set()) - has_uuid),
        "membership-without-organization": len(typed.get(MEMBERSHIP, set()) - membership_has_org),
    }

    # Exit 0 even with rows: export.sh calls this under `set -e` and decides on
    # the non-empty contradictions.tsv, which is also what the operator reads.
    for name in sorted(checks):
        print(f"{name}\t{checks[name]}")


if __name__ == "__main__":
    main()
