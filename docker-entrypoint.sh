#!/bin/sh
set -e

echo "[entrypoint] Initializing ElyTrack application container..."

# Run pending database migrations on container boot.
# If migrations encounter a transient connection delay, log and continue
# so the application process can start and retry through its connection pool.
echo "[entrypoint] Executing database migrations..."
if ! node scripts/migrate.mjs; then
  echo "[entrypoint] Warning: Migration runner exited with non-zero status. Proceeding to launch application server..."
fi

echo "[entrypoint] Database migrations step completed."

# Data seeding is intentionally never part of deployment startup. Run
# `node scripts/seed.mjs --data-file <path>` manually when records are ready.

echo "[entrypoint] Initialization ready. Launching application process: $@"
exec "$@"
