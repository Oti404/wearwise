#!/usr/bin/env bash
# Nightly backup of the database and uploaded images; keeps the last 7 days.
# Installed as a cron job by deploy/setup.sh. These copies live on the same disk, so also
# download them now and then (e.g. with `gcloud compute scp`) for protection against losing the VM.
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-/var/backups/wearwise}"
STAMP="$(date +%F)"
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

"${COMPOSE[@]}" exec -T db pg_dump -U wearwise -d wearwise | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

# The uploads volume belongs to the compose project "wearwise".
docker run --rm -v wearwise_uploads:/data:ro -v "$BACKUP_DIR":/backup alpine \
  tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .

find "$BACKUP_DIR" -type f -mtime +7 -delete
echo "$(date -Is) backup ok: $(du -sh "$BACKUP_DIR" | cut -f1) in $BACKUP_DIR"
