#!/usr/bin/env python3
"""Count the classes of an N-Triples file.

One row per class in classes.tsv: name<TAB>triples<TAB>subjects. Counting the
artifact describes exactly what ships, and one pass over the file is cheaper
than 30 COUNT queries over the store. The same numbers end up in manifest.json,
which the import verifies against.

    counts.py --classes classes.tsv --nt op-rvs.nt
"""
import argparse
import sys

RDF_TYPE = "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>"


def read_classes(path):
    classes = []
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.rstrip("\n")
            if not line:
                continue
            iri, name = line.split("\t")
            classes.append((f"<{iri}>", name))
    return classes


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--classes", required=True)
    parser.add_argument("--nt", required=True)
    args = parser.parse_args()

    classes = read_classes(args.classes)
    iri_to_name = {iri: name for iri, name in classes}
    triples = {name: 0 for _, name in classes}
    subjects = {name: set() for _, name in classes}

    with open(args.nt, encoding="utf-8") as handle:
        for line in handle:
            if not line.strip() or line.startswith("#"):
                continue
            try:
                subject, predicate, obj = line.rstrip("\n").split("\t", 2)
            except ValueError:
                continue
            if predicate != RDF_TYPE:
                continue
            obj = obj.rstrip(" .")
            name = iri_to_name.get(obj)
            if name is None:
                continue
            triples[name] += 1
            subjects[name].add(subject)

    for _, name in classes:
        sys.stdout.write(f"{name}\t{triples[name]}\t{len(subjects[name])}\n")


if __name__ == "__main__":
    main()
