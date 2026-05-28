#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/root/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/tippspiel_prod-$TIMESTAMP.sql.gz"
TMP_FILE="$BACKUP_FILE.tmp"

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"

docker compose exec -T postgres sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges' \
  | gzip -9 > "$TMP_FILE"

mv "$TMP_FILE" "$BACKUP_FILE"
find "$BACKUP_DIR" -type f -name 'tippspiel_prod-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

echo "Backup created: $BACKUP_FILE"
