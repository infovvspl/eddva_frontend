#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Frontend directory setup — run once on App Server after setup-app-server.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e
mkdir -p /var/www/eddva-frontend/dist
chown -R ubuntu:ubuntu /var/www/eddva-frontend
echo "Frontend directory ready."
