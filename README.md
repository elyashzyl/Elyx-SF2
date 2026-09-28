# ElyTrack — School Attendance & Operations Platform

Web-based daily attendance recording and DepEd Form 2 (SF2) reporting system for schools.

## Features

- **Role-based access** — Superadmin, Administrator, and Teacher accounts
- **Daily attendance sheets** — Period-by-period marking (AM 1–6, PM 1–4) with DepEd status codes (E, T, A, E/T, A/S, NIPS, NIPU subtypes)
- **Automated SF2 reporting** — Auto-computed ADA, % of attendance, and official 10-indicator summary table
- **SARDO Early Warning Radar** — Real-time tracking of students at risk of dropping out
- **Multi-school support** — Superadmin school switcher and per-school data isolation
- **Dual database support** — SQLite (local development/standalone) and MySQL (production)

## Quick Start

```bash
npm install
npm run db:migrate
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001  

The application does not create default accounts, schools, plans, licenses, payment methods, or sample records. Insert those records intentionally through the superadmin UI or the explicit JSON seeder described below. New passwords are stored with bcrypt; legacy plaintext credentials are rehashed after a successful login during the migration period.

---

## Database, Migrations & Seeding

The database setup, migrations, and seeders are fully configurable via environment variables or CLI arguments (no hardcoded credentials or school names).

### Commands

```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Drop all tables and rerun migrations from scratch
npm run db:migrate:fresh

# Create a database backup
npm run db:backup

# Restore a SQLite backup after verifying the file and target path
node scripts/restore.mjs --file ./backups/attendance-backup-YYYY-MM-DD_HH-MM-SS.db --force

# Restore a MySQL SQL dump (requires the mysql client and DATABASE_URL)
DATABASE_URL=mysql://user:password@host:3306/database \\
  node scripts/restore.mjs --file ./backups/elytrack-mysql-database-YYYY-MM-DD_HH-MM-SS.sql --force

# Explicitly import records from a JSON file. The file is never bundled
# with the application and is not read during startup.
node scripts/seed.mjs --data-file ./private/seed-data.json
```

The seed file must provide its own school and administrator credentials. It may also provide plans, licenses, grade levels, payment methods, teachers, and students. Migrations create schema only; they never insert records.

### Backup and restore safety

`npm run db:backup` creates a timestamped SQLite snapshot or MySQL dump and removes backups older than `BACKUP_RETAIN` days. Restore is intentionally a separate, explicit operation and requires `--force`; it never runs during deployment. Before replacing an SQLite database, the restore script creates a `.pre-restore-<timestamp>` safety copy of the active file. Always verify the backup, target environment, and recent backup before restoring production data.

### Secret rotation

Treat any database password, application key, or deployment token shared outside the secret manager as compromised. Generate replacement values with `npm run secrets:generate`, rotate the MySQL credential at the provider, update deployment secrets, redeploy, verify `/api/health`, and revoke the old credential. See [`docs/secret-rotation.md`](docs/secret-rotation.md) for the complete procedure.

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection URL (optional when `DB_*` variables are provided) |
| `DB_CONNECTION` | Database driver; set to `mysql` for production |
| `DB_HOST` | MySQL hostname |
| `DB_PORT` | MySQL port |
| `DB_DATABASE` | MySQL database name |
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_PATH` | SQLite file path |
| `SEED_DATA_FILE` | Explicit JSON seed file path |

## Project Structure

```
routes/          — Express API routes (auth, attendance, students, users)
src/
  stores/        — Pinia stores (auth, attendance)
  views/         — Vue pages (Login, AttendanceSheet, Admin/Teacher Dashboard, etc.)
  router/        — Vue Router config
  style.css      — Global glassmorphism styles
server.js        — Express entry point
db.js            — SQLite schema & helpers
```

## Continuous integration

GitHub Actions runs on pushes to `main`/`master` and on pull requests. The workflow installs dependencies with optional platform packages enabled, checks migration status against an isolated SQLite database, runs the complete test suite, builds the frontend, and checks for whitespace errors.

## Note

This is **not the full LMS**. It is the attendance recording component being developed first. Other LMS modules (assignments, grades, etc.) to follow.
