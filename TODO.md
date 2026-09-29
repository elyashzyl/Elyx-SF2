# ElyTrack — Project TODO & Continuation Roadmap

Tracking pending engineering tasks, production deployment optimizations, and migration milestones.

---

## 0. Security and Data Integrity Follow-ups

- [x] **Hash new passwords with bcrypt and migrate on login**
  - Added `lib/passwords.js` using bcryptjs with 12 rounds.
  - Trial signup, user creation/updates, school-admin creation, explicit seeding, and reset-account flows now hash passwords.
  - Existing plaintext passwords remain temporarily compatible and are rehashed after successful login.
- [ ] **Remove legacy plaintext password fallback**
  - Audit and migrate remaining existing records, then remove plaintext comparison support.
  - The login path still rehashes a legacy value after successful authentication; run an approved account audit before removing compatibility.
- [ ] **Rotate exposed database credentials and application keys**
  - Code-side preparation completed: `npm run secrets:generate`, `.env.example` guidance, and [`docs/secret-rotation.md`](docs/secret-rotation.md) are available.
  - Remaining operator action: rotate the MySQL credential and any exposed application/deployment secrets in the provider and revoke the old values.
- [x] **Add server-side sessions and authentication regression coverage**
  - Added `lib/sessions.js`, migration `012_auth_sessions.mjs`, `/api/auth/me`, logout revocation, server-side impersonation state, and `tests/server-authentication.test.mjs`.
- [x] **Add API authorization regression coverage**
  - Added `tests/api-authorization.test.mjs` covering cross-school reads, cross-school mutations, teacher restrictions, superadmin-only license actions, role spoofing, and unauthenticated requests.

---

- [x] **Add production request protections**
  - Added configurable rate limits, production CORS allowlisting, CSRF Origin checks for cookie-authenticated mutations, security headers, request IDs, and structured production request logs.
- [x] **Add deterministic enrollment-event ordering and operational indexes**
  - Added migration `013_enrollment_event_order.mjs` and `014_operational_indexes.mjs`.
  - Same-date events now use an explicit per-student sequence instead of random UUID ordering.
- [ ] **Complete shared request validation for all routes**
  - Added `lib/validation.js` and applied the boundary pattern to critical authentication/enrollment paths; attendance, billing, school, and export payloads still need migration to the shared helpers.

## 1. Prisma ORM Incremental Route Migration

Prisma client (`prisma/client.js`) and schema (`prisma/schema.prisma`) are established and synchronized with the MySQL schema. Currently, Express route handlers in `routes/` still use raw SQL queries via `query()` and `run()` in `db.js`.

- [ ] **Migrate Authentication & Users (`routes/auth.js`, `routes/users.js`)**
  - Replace raw SQL `SELECT` / `INSERT` with `prisma.user.findUnique()`, `prisma.user.findMany()`, `prisma.user.create()`.
  - Maintain bcrypt password hashing compatibility.
- [ ] **Migrate Campus & Grade Level Entities (`routes/schools.js`)**
  - Replace raw SQL queries for `schools`, `grade_levels`, and `sections` with `prisma.school` and `prisma.gradeLevel`.
- [ ] **Migrate Student Enrollment (`routes/students.js`)**
  - Refactor learner CRUD operations, LRN uniqueness validation, and grade/section filtering to Prisma queries.
- [ ] **Migrate Daily & Monthly Attendance (`routes/attendance.js`, `routes/monthly.js`)**
  - Convert `attendance_entries` and `monthly_entries` upserts.
  - Retain transactional batch performance when updating multiple student attendance rows simultaneously.
- [ ] **Migrate Licensing & Subscriptions (`routes/licenses.js`)**
  - Refactor `licenses` and `subscription_plans` queries to `prisma.license` and `prisma.subscriptionPlan`.
- [ ] **Preserve DepEd SF2 Export (`routes/export.js`)**
  - **Rule:** Do not alter cell formatting, column widths, or glyph rendering (`◤`, `◢`, `x`).
  - Keep data aggregation queries compatible with existing export worksheet population logic.

---

## 2. Container & Deployment Automation

- [x] **Automated Startup Migration Entrypoint**
  - Created `docker-entrypoint.sh` script to run before `CMD ["node", "server.js"]`:
    - Automatically runs `npm run db:migrate` on container boot.
    - Does not run a seeder. Deployments only run schema migrations; data seeding requires an explicit private JSON file.
  - Updated `Dockerfile` with `ENTRYPOINT ["/app/docker-entrypoint.sh"]` and `CMD ["node", "server.js"]`.
- [x] **SF2 Excel Template Persistence**
  - In `routes/export.js`, user-uploaded templates via `POST /api/export/template` persist to `/data/templates/SF2.xlsx` (or custom `TEMPLATE_DIR`) with automatic fallback to bundled `templates/SF2.xlsx` or `test_final2.xlsx`.
- [x] **Production Database Backup Strategy**
  - Created `scripts/backup.mjs` (`npm run db:backup`) for automated backups:
    - Creates timestamped snapshots for SQLite (`attendance-backup-<timestamp>.db`).
    - Executes `mysqldump` (with fallback table query dump) for MySQL deployments.
    - Implements automated retention policy (cleans backups older than 14 days).
- [x] **Backup Restore Procedure and Verification**
  - Added `scripts/restore.mjs` and `npm run db:restore`.
  - SQLite restores validate the backup and preserve a `.pre-restore-<timestamp>` safety copy.
  - MySQL SQL restores require `DATABASE_URL`, the `mysql` client, and explicit `--force` confirmation.
  - Added `tests/backup-restore.test.mjs` for isolated SQLite backup/restore verification.

---

## 3. Attendance Locking and Correction History

- [x] **Lock daily attendance after a configured cutoff**
  - Added migration `010_attendance_locking_and_corrections.mjs`.
  - Added the school-specific `attendance_lock_cutoff` field.
  - Blank cutoff values leave automatic locking disabled.
  - API mutation endpoints reject locked records with HTTP 423.
- [x] **Reopen locked attendance with authorization**
  - Reopening requires a non-empty reason.
  - Only same-school administrators and superadmins can reopen records.
  - Reopen actions are written to `audit_logs`.
- [x] **Record post-reopen corrections**
  - Added `attendance_corrections` with old/new values, actor metadata, school, reason, and timestamp.
  - Added a scoped correction-history endpoint and attendance UI display.
- [x] **Add regression coverage**
  - `tests/attendance-locking.test.mjs` verifies cutoff locking, mutation rejection, reopen authorization, reason validation, audit logging, and correction persistence.

Remaining attendance follow-ups:

- [x] Add a dedicated administrator reopen modal instead of the current browser prompt.
- [ ] Add correction reason fields to every bulk-edit workflow.
- [ ] Add automatic relocking policy after a defined correction window if required by school policy.

---

## 3.5 Student Enrollment History

- [x] Add append-only enrollment events and backfill existing students.
- [x] Add transfer, promotion, reenrollment, and withdrawal API workflows.
- [x] Keep historical attendance and monthly entries when withdrawing students.
- [x] Add school-scoped enrollment history endpoint and student-management actions.
- [x] Validate attendance entries against the selected school and historical enrollment.

## 3A. Student Enrollment History Follow-ups

- [ ] Add guardian contacts, emergency information, and consent history.
- [ ] Add LRN and duplicate-student matching rules.
- [x] Add historical/as-of roster support to monthly SF2 generation.
- [ ] Add cross-school transfer workflow with paired source/destination events.
- [ ] Add database transaction helpers for atomic roster and enrollment-event writes.

---

## 4. Database Health & Telemetry

- [x] **Enhance Health Check Endpoint (`/api/health`)**
  - Updated `server.js` `/api/health` to execute a lightweight database ping (`SELECT 1 as ping`).
  - Returns `status: "ok"`, active backend mode (`mysql` vs `sqlite`), query roundtrip latency (`latencyMs`), and ISO timestamp.
- [x] **Audit Logging Expansion (`routes/logs.js`)**
  - Connected teacher daily attendance recording in `routes/attendance.js` (`attendance.create`, `attendance.update`) to the `audit_logs` table.
  - Connected monthly SF2 sheet submissions and cell edits in `routes/monthly.js` (`monthly.create`, `monthly.update`, `monthly.entry_edit`) to `audit_logs`.

---

## 5. Automated Testing & Verification

- [x] **API & Calculation Integration Tests**
  - Added test suite using native Node.js test runner (`npm test`):
    - `tests/health-and-plans.test.mjs`: Validates database connectivity, health checks, subscription plans, and license status constraints.
    - `tests/sf2-calculations.test.mjs`: Validates DepEd School Form 2 calculations (ADA, percentage of attendance, gender normalization).
- [x] **Export Regression Test**
  - `tests/export-regression.test.mjs`: Verifies SF2 template existence, workbook structure, and worksheet accessibility.
- [x] **Continuous Integration Verification**
  - Added `.github/workflows/ci.yml` for pushes and pull requests.
  - CI runs migration status, the complete SQLite test suite, the frontend build, and `git diff --check`.

---

## Completed Milestones (Reference)

- [x] Dynamic database URL resolution supporting Laravel-style `DB_*` variables (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
- [x] Removed runtime and deployment data seeding. Accounts, schools, plans, licenses, payment methods, and sample records are created only by explicit API or seed-file actions.
- [x] Prevented unhandled SQLite fatal crashes in production mode when `DATABASE_URL` is unset.
- [x] Configured Prisma ORM schema (`prisma/schema.prisma`) with all 15 models mapped to MySQL tables.
- [x] Synchronized `process.env.DATABASE_URL` for Prisma when using individual `DB_*` variables in `db.js` and `prisma/client.js`.
- [x] Updated `Dockerfile` Stage 1 (`prisma generate`) and Stage 3 (`COPY prisma`, `scripts`, `migrations`, `@prisma/client`, `.prisma`).
- [x] Validated frontend Vite build and Node syntax compatibility.
