#!/bin/bash
# Creates multiple databases on first container init from a comma-separated
# POSTGRES_MULTIPLE_DATABASES env var. Each backend service owns its own DB.
set -euo pipefail

create_database() {
  local db="$1"
  echo "Creating database '$db' (if absent)"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE "$db"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
}

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
  IFS=',' read -ra DBS <<< "$POSTGRES_MULTIPLE_DATABASES"
  for db in "${DBS[@]}"; do
    create_database "$(echo "$db" | tr -d '[:space:]')"
  done
fi
