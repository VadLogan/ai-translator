#!/usr/bin/env bash
# API in Docker on http://127.0.0.1:8787, logs in the foreground. Ctrl+C stops and removes it.
set -euo pipefail
cd "$(dirname "$0")"
trap 'docker compose down' EXIT
docker compose up --build
