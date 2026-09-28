#!/bin/sh
set -e

echo "[entrypoint] Initializing ElyTrack application container..."

# Run database migrations on container boot
echo "[entrypoint] Executing database migrations..."
node scripts/migrate.mjs || {
  echo "[entrypoint] WARNING: Database migration exited with status $?."
}

# Data seeding is intentionally never part of deployment startup. Run
# `node scripts/seed.mjs --data-file <path>` manually when records are ready.

echo "[entrypoint] Initialization ready. Launching application process: $@"
exec "$@"
