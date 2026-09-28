#!/bin/sh
set -e

echo "[entrypoint] Initializing ElyTrack application container..."

# Run pending database migrations on container boot. Because `set -e` is
# enabled, a migration failure stops the container and causes the deployment
# to fail instead of starting the application with an incomplete schema.
echo "[entrypoint] Executing database migrations..."
node scripts/migrate.mjs

echo "[entrypoint] Database migrations completed successfully."

# Data seeding is intentionally never part of deployment startup. Run
# `node scripts/seed.mjs --data-file <path>` manually when records are ready.

echo "[entrypoint] Initialization ready. Launching application process: $@"
exec "$@"
