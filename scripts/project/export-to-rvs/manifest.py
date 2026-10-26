#!/usr/bin/env python3
"""Write the manifest that the import verifies against.

Reads counts.tsv and contradictions.tsv from --dir and writes manifest.json to
stdout. A class missing from counts.tsv is recorded as 0, so a zero where an
older dump had a number shows up when you diff two manifests.

counts.py reads counts.tsv too: a change to its columns must be made there as
well. The manifest keeps classes in the order of classes.tsv, as RVS's import
does, so two manifests of the same data are byte-identical.
"""
import argparse
import json
import os
import sys

def read_classes(here):
    """The class list, from classes.tsv: one (iri, name) per line. The same file
    feeds the counts and the manifest, so a new class is added once."""
    classes = []
    with open(os.path.join(here, "classes.tsv"), encoding="utf-8") as handle:
        for line in handle:
            line = line.rstrip("\n")
            if not line:
                continue
            iri, name = line.split("\t")
            classes.append((iri, name))
    return classes


HERE = os.path.dirname(os.path.abspath(__file__))


def read_counts(path):
    # counts.tsv rows: name<TAB>triples<TAB>subjects. One dict per name.
    counts = {name: {"triples": 0, "subjects": 0}
              for _, name in read_classes(HERE)}
    if not os.path.exists(path):
        return counts
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.rstrip("\n")
            if not line:
                continue
            name, triples, subjects = line.split("\t")
            counts[name] = {"triples": int(triples), "subjects": int(subjects)}
    return counts


def read_contradictions(path):
    if not os.path.exists(path):
        return []
    rows = []
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip().strip('"')
            if line:
                rows.append(line)
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stamp", required=True)
    parser.add_argument("--endpoint", required=True)
    parser.add_argument("--sources", required=True)
    parser.add_argument("--triples", type=int, required=True)
    parser.add_argument("--pages", type=int, required=True)
    parser.add_argument("--dry-run", type=int, required=True)
    parser.add_argument("--skipped", type=int, default=0,
                        help="root candidates the scope left out (rows of skipped.tsv)")
    parser.add_argument("--dir", required=True)
    args = parser.parse_args()

    manifest = {
        "ticket": "RVS-40",
        "task": "01",
        "stamp": args.stamp,
        "endpoint": args.endpoint,
        "sourceGraphs": args.sources.split(),
        "targetGraphEnv": "RVS_GRAPH",
        "dryRun": bool(args.dry_run),
        "triples": args.triples,
        "pages": args.pages,
        "skipped": args.skipped,
        "counts": read_counts(os.path.join(args.dir, "counts.tsv")),
        "contradictions": read_contradictions(os.path.join(args.dir, "contradictions.tsv")),
    }
    json.dump(manifest, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
