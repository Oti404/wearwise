#!/usr/bin/env bash
# WearWise one-time server setup (Ubuntu 22.04/24.04, run as root).
#
#   curl -fsSL https://raw.githubusercontent.com/Oti404/wearwise/main/deploy/setup.sh | sudo bash -s -- wearwise.example.com
#
# Safe to run again: existing swap, Docker, checkout and .env are kept.
set -euo pipefail

DOMAIN="${1:-}"
APP_DIR="/opt/wearwise"
REPO_URL="https://github.com/Oti404/wearwise.git"
BRANCH="main"
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run as root (use sudo)."
[ -n "$DOMAIN" ] || fail "Usage: setup.sh <domain>   e.g. setup.sh wearwise.example.com"

log "Swap file (2 GB) — the 1 GB e2-micro needs headroom while containers start"
if ! swapon --show | grep -q '^/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
# Prefer RAM; only spill to swap under real pressure.
echo 'vm.swappiness=10' > /etc/sysctl.d/99-wearwise.conf
sysctl -q -p /etc/sysctl.d/99-wearwise.conf

log "Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null

log "Code (compose files and scripts; images are prebuilt, so Git LFS is not needed)"
apt-get install -y -qq git openssl >/dev/null
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

log "Configuration (.env)"
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i \
    -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" \
    -e "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 48)|" \
    -e "s|^SEED_PASSWORD=.*|SEED_PASSWORD=$(openssl rand -hex 8)|" \
    -e "s|^PUBLIC_URL=.*|PUBLIC_URL=https://${DOMAIN}|" \
    -e "s|^TRUST_PROXY=.*|TRUST_PROXY=2|" \
    .env
  printf '\n# Production (written by deploy/setup.sh)\nDOMAIN=%s\n' "$DOMAIN" >> .env
  chmod 600 .env
else
  echo ".env already exists — keeping it (secrets are not regenerated)."
fi

log "Pulling images"
"${COMPOSE[@]}" pull

log "Starting WearWise (first start loads the AI models, ~1–3 minutes)"
"${COMPOSE[@]}" up -d --no-build --wait --wait-timeout 600 || {
  "${COMPOSE[@]}" ps
  fail "Some services are not healthy yet. Inspect with: cd $APP_DIR && ${COMPOSE[*]} logs --tail 50"
}

log "Nightly backups (03:15, kept 7 days in /var/backups/wearwise)"
chmod +x deploy/*.sh
cat > /etc/cron.d/wearwise-backup <<EOF
15 3 * * * root $APP_DIR/deploy/backup.sh >> /var/log/wearwise-backup.log 2>&1
EOF

"${COMPOSE[@]}" ps
cat <<EOF

WearWise is running.
  • Site:      https://${DOMAIN}  (HTTPS works once the DNS A record points to this server)
  • Demo data: cd $APP_DIR && sudo ${COMPOSE[*]} exec backend npm run seed
               password for demo@wearwise.app: sudo grep SEED_PASSWORD $APP_DIR/.env
  • Update:    sudo $APP_DIR/deploy/update.sh
  • Logs:      cd $APP_DIR && sudo ${COMPOSE[*]} logs -f backend
EOF
