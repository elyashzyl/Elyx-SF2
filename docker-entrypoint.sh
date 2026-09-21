#!/bin/sh
set -e

echo "[entrypoint] Initializing ElyTrack application container..."

# Run database migrations on container boot
echo "[entrypoint] Executing database migrations..."
node scripts/migrate.mjs || {
  echo "[entrypoint] WARNING: Database migration exited with status $?."
}

# Automatically seed initial system data if requested or database is empty
if [ "$AUTO_SEED" = "1" ] || [ "$AUTO_SEED" = "true" ]; then
  echo "[entrypoint] AUTO_SEED flag detected. Running database seeder..."
  node scripts/seed.mjs || {
    echo "[entrypoint] WARNING: Database seeder exited with status $?."
  }
fi

echo "[entrypoint] Initialization ready. Launching application process: $@"
exec "$@"
