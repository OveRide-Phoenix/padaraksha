#!/usr/bin/env bash
# Padaraksha — VPS deploy / update script
# Run from /var/www/padaraksha after pulling latest code.
# Safe to re-run on updates — does not touch kk_v1.
set -e

APP_DIR="/var/www/padaraksha"
DOMAIN="padaraksha-dev.kuteerakitchen.com"   # <-- replace with your domain

echo "==> [1/5] Installing Python dependencies..."
cd "$APP_DIR"
python3 -m venv .venv
source .venv/bin/activate
pip install -q -r backend/requirements.txt

echo "==> [2/5] Running DB migrations..."
# Run each migration only if not already applied — adjust as needed
mysql -u root -p padaraksha_db < backend/migrations/001_initial_schema.sql || true
mysql -u root -p padaraksha_db < backend/migrations/002_costing_engine.sql || true
mysql -u root -p padaraksha_db < backend/migrations/003_wage_and_snacks_fix.sql || true
mysql -u root -p padaraksha_db < backend/migrations/004_tailor_wfh_wage.sql || true

echo "==> [3/5] Installing Node dependencies..."
cd "$APP_DIR/frontend"
npm ci --production=false

echo "==> [4/5] Building Next.js (NEXT_PUBLIC_API_URL baked in)..."
NEXT_PUBLIC_API_URL="https://$DOMAIN/api" npm run build

echo "==> [5/5] Restarting services..."
sudo systemctl restart padaraksha-backend
sudo systemctl restart padaraksha-frontend

echo ""
echo "Done. Check status with:"
echo "  sudo systemctl status padaraksha-backend"
echo "  sudo systemctl status padaraksha-frontend"
