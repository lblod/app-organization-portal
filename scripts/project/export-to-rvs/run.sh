#!/usr/bin/env bash
# mu entry point: write the dump under the mounted project folder.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
OP_DUMP_ROOT=${OP_DUMP_ROOT:-/app/data/dumps}
export OP_DUMP_ROOT
exec bash "$here/export.sh" "$@"
