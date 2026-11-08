#!/usr/bin/env bash
# Deploy the latest published images (run as root on the server).
#   sudo /opt/wearwise/deploy/update.sh
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

git pull --ff-only
"${COMPOSE[@]}" pull
# Migrations run automatically when the backend container starts.
"${COMPOSE[@]}" up -d --no-build --wait --wait-timeout 600
# Old image layers add up quickly on a 30 GB disk.
docker image prune -f >/dev/null
"${COMPOSE[@]}" ps
