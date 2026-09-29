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

The application does not create default accounts, schools, plans, licenses, payment methods, or sample records. Insert those records intentionally through the superadmin UI or the explicit JSON seeder described below. New passwords are stored with bcrypt. Production authentication never compares plaintext passwords. Deployment startup runs only additive schema migrations and does not reset, drop, or delete existing operational data.

### Account lifecycle

Public registration is disabled. Authorized administrators can invite teachers and administrators within their school scope. Invitations, password resets, and email verification use expiring, one-time tokens stored as SHA-256 hashes; raw tokens are only placed in outbound links and are never stored or logged. Password resets revoke existing sessions, and invitation acceptance preserves the assigned school, role, grade, and section.

Configure account email delivery with `APP_URL`, `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, and `MAIL_FROM_NAME`. Local development may use `MAIL_MAILER=log`; it logs delivery metadata only and never prints raw links. Production must use configured SMTP delivery. Token durations can be configured with `INVITATION_TOKEN_EXPIRY_HOURS`, `PASSWORD_RESET_TOKEN_EXPIRY_HOURS`, and `EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS`.

Migration `016_account_tokens_and_email` creates only account email/token storage. It does not seed users, schools, plans, licenses, payment methods, or other operational records.

---

## Database, Migrations & Seeding

The database setup, migrations, and seeders are fully configurable via environment variables or CLI arguments (no hardcoded credentials or school names). Production startup runs pending migrations before the server starts, including on Railpack deployments that invoke `npm start`; it never runs a seeder or destructive reset.

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

# Audit password storage without printing usernames or password values.
npm run passwords:audit

# After taking and verifying a backup, explicitly migrate legacy plaintext
# password records to bcrypt. The command requires --confirm.
npm run passwords:migrate -- --confirm
```

The seed file must provide its own school and administrator credentials. It may also provide plans, licenses, grade levels, payment methods, teachers, and students. Migrations create schema only; they never insert operational records. Migration `011_student_enrollment_history` backfills one baseline enrollment event for existing students because historical enrollment dates cannot be recovered when they were never recorded.

### Legacy password audit and migration

Run `npm run passwords:audit` against the intended database before changing account records. It reports only aggregate counts for bcrypt, legacy plaintext candidates, and empty/invalid password values. Take and verify a backup before running `npm run passwords:migrate -- --confirm`; migration is explicit, transactional, and replaces only legacy plaintext candidates with bcrypt hashes. Empty/invalid records require an operator-approved password reset and are not guessed or logged. Re-run the audit and confirm that the legacy count is zero before deploying production.

Legacy plaintext login is disabled by default and is always disabled when `NODE_ENV=production`. If a local/test environment needs temporary compatibility during an approved migration window, set `ALLOW_LEGACY_PASSWORD_LOGIN=1` explicitly; successful compatibility login immediately replaces that account's value with bcrypt. Do not set this flag in production.

### Backup and restore safety

`npm run db:backup` creates a timestamped SQLite snapshot or MySQL dump and removes backups older than `BACKUP_RETAIN` days. Restore is intentionally a separate, explicit operation and requires `--force`; it never runs during deployment. Before replacing an SQLite database, the restore script creates a `.pre-restore-<timestamp>` safety copy of the active file. Always verify the backup, target environment, and recent backup before restoring production data. Never use `npm run db:migrate:fresh` against the production database: normal startup migration is additive and preserves existing schools, users, students, attendance, licenses, and payment records.

### Secret rotation

Treat any database password, application key, or deployment token shared outside the secret manager as compromised. Generate replacement values with `npm run secrets:generate`, rotate the MySQL credential at the provider, update deployment secrets, run `npm run secrets:verify`, set `SECRETS_ROTATED=1`, redeploy, verify `/api/health`, and revoke the old credential. The application logs a warning when the rotation acknowledgement is missing, while `npm run secrets:verify` remains the deployment validation gate. See [`docs/secret-rotation.md`](docs/secret-rotation.md) for the complete procedure.

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
| `API_BODY_LIMIT` | Maximum parsed JSON/form request size; defaults to `50mb` for QR/template compatibility |
| `SECRETS_ROTATED` | Must be `1` in production after provider secrets are replaced and old values revoked |
| `ALLOW_LEGACY_PASSWORD_LOGIN` | Local/test-only temporary plaintext compatibility; never enabled in production |
| `APP_URL` | Public application URL used in account email links and same-origin CORS fallback |
| `ALLOWED_ORIGINS` | Comma-separated public frontend origins allowed to call the API; include the Coolify domain and custom domain if both are used |
| `CORS_ORIGINS` | Alias for `ALLOWED_ORIGINS` |
| `MAIL_MAILER` | `log` for local development or `smtp` for delivery |
| `MAIL_HOST` | SMTP hostname when `MAIL_MAILER=smtp` |
| `MAIL_PORT` | SMTP port when `MAIL_MAILER=smtp` |
| `MAIL_USERNAME` | SMTP username |
| `MAIL_PASSWORD` | SMTP password |
| `MAIL_FROM_ADDRESS` | Sender email address |
| `MAIL_FROM_NAME` | Sender display name |
| `INVITATION_TOKEN_EXPIRY_HOURS` | Invitation token lifetime |
| `PASSWORD_RESET_TOKEN_EXPIRY_HOURS` | Password reset token lifetime |
| `EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS` | Email verification token lifetime |

Student enrollment changes are append-only. Withdrawal keeps historical attendance and monthly entries, while the active roster hides withdrawn students by default. Use `/api/students/:id/enrollment-events` for class changes, promotion, reenrollment, and withdrawal; direct grade/section edits are rejected. Student roster requests support `asOf=YYYY-MM-DD` for historical enrollment snapshots.

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
