# ElyTrack — Project TODO & Continuation Roadmap

Tracking pending engineering tasks, production deployment optimizations, and migration milestones.

---

## 0. Security and Data Integrity Follow-ups

- [x] **Hash new passwords and complete the legacy plaintext password migration workflow**
  - Added `lib/passwords.js` using bcryptjs with 12 rounds.
  - Trial signup, user creation/updates, school-admin creation, explicit seeding, and reset-account flows now hash passwords.
  - Added `npm run passwords:audit` and the explicit, transactional `npm run passwords:migrate -- --confirm` workflow; output contains aggregate counts only and leaves empty/invalid values for password reset.
  - Production never uses plaintext fallback. Local/test compatibility requires `ALLOW_LEGACY_PASSWORD_LOGIN=1` and is immediately rehashed after successful login.
- [ ] **Rotate exposed database credentials and application keys**
  - Added `npm run secrets:verify`; it fails until valid database settings are present and `SECRETS_ROTATED=1` is explicitly set. The application logs a warning rather than crashing when the acknowledgement is missing.
  - Remaining operator action: rotate the MySQL credential and any exposed application/deployment secrets in the provider, revoke the old values, then set `SECRETS_ROTATED=1`.
  - This cannot be completed from repository code because provider secrets are external to the project.
- [x] **Add server-side sessions and authentication regression coverage**
  - Added `lib/sessions.js`, migration `012_auth_sessions.mjs`, `/api/auth/me`, logout revocation, server-side impersonation state, and `tests/server-authentication.test.mjs`.
- [x] **Add account status, lockout, and login metadata**
  - Added migration `015_user_account_lifecycle`, active/invited/disabled/locked status handling, five-failure temporary lockout, login/password timestamps, scoped status management, immediate session revocation, and `tests/user-account-lifecycle.test.mjs`.
- [x] **Add account email and one-time token storage**
  - Added migration `016_account_tokens_and_email`.
  - Adds `users.email`, `users.email_verified_at`, and hashed one-time `account_tokens` storage for invitation, reset, and verification workflows.
  - Migration is schema-only and does not create accounts or send email.
- [x] **Implement invitation, password reset, and email verification workflows**
  - Added secure hashed tokens, configurable expiry, one-time consumption, scoped invitation/resend/reset actions, session revocation after password reset, public acceptance/reset/verification pages, and SMTP/log mail delivery.
  - Production requires configured SMTP delivery for account emails; local log delivery never prints raw tokens.
- [x] **Remove implicit legacy plaintext password fallback**
  - Plaintext comparison is disabled by default and unconditionally disabled in production.
  - Existing records can be counted and migrated explicitly with the password audit/migration commands; no password values are logged.
- [x] **Add API authorization regression coverage**
  - Added `tests/api-authorization.test.mjs` covering cross-school reads, cross-school mutations, teacher restrictions, superadmin-only license actions, role spoofing, and unauthenticated requests.

---

- [x] **Add production request protections**
  - Added configurable rate limits, production CORS allowlisting, CSRF Origin checks for cookie-authenticated mutations, security headers, request IDs, and structured production request logs.
- [x] **Add deterministic enrollment-event ordering and operational indexes**
  - Added migration `013_enrollment_event_order.mjs` and `014_operational_indexes.mjs`.
  - Same-date events now use an explicit per-student sequence instead of random UUID ordering.
- [x] **Complete shared request-boundary validation for all API routes**
  - Added global validation for parsed query, body, and request input structures, including depth, field-count, scalar-length, control-character, and prototype-pollution checks.
  - Added strict JSON parsing, configurable `API_BODY_LIMIT` (10 MB default), and explicit 400/413 parser errors. Existing route handlers retain domain-specific validation.

## 1. Phase 1 School Administration Follow-ups

- [x] Add database-backed school profile fields for contact, governance, school year, and grading period.
  - Migration `017_school_profile_fields` is append-only and supports MySQL and SQLite.
  - School-scoped settings and school APIs expose the fields with validation and audit logging.
  - Settings UI allows authorized administrators and superadmins to view or edit them.
- [x] Add school archive functionality before permanent deletion.
  - Added reversible archive/restore controls, archived-school access blocking, and account-status restoration metadata in migrations `018_school_archive` and `019_school_archive_account_status`.
- [x] Add dependency preview before archive or permanent deletion.
  - Superadmin-only scoped dependency counts are displayed in the school management confirmation modal.
- [x] Add school data export before permanent deletion.
  - Added superadmin-only `GET /api/schools/:id/export` with school-scoped JSON snapshots, safe user fields, archived-school support, download UI, audit logging, and server-side export-before-delete enforcement.
  - Added `tests/school-export.test.mjs` covering authorization, school isolation, secret exclusion, content headers, audit logging, and archived-school export.

**Next recommended task:** Run the opt-in isolated MySQL integration suite using a disposable test database. The school read-only route migration is implemented with SQL fallback; keep authentication writes, sessions, and token flows on the shared adapter.

- [x] **Add optional avatar support without ephemeral file storage**
  - Added schema-only migration `020_user_avatar_url` and Prisma `avatarUrl` mapping.
  - Avatar URLs are limited to 2048 characters and accept only HTTPS or local relative paths; blank values clear the avatar.
  - Settings and sidebar use the database-backed value with initials fallback.
  - Added migration, API, session, and self-update regression coverage.
- [ ] **Run isolated MySQL integration coverage for Prisma read slices**
  - Added `tests/prisma-read-slices.mysql.test.mjs` as an opt-in suite.
  - The complete local SQLite suite passed: 105 passed, 1 skipped (the opt-in MySQL suite).
  - Run it only with `PRISMA_MYSQL_INTEGRATION=1` and `PRISMA_TEST_DATABASE_URL` pointing to a disposable database whose name includes `test`, `testing`, `integration`, `sandbox`, or `ci`.
  - The suite refuses production mode and skips safely when no isolated database is configured.
  - Keep the shared SQL adapter as the fallback and do not move authentication/token/session writes until transaction behavior is covered.
- [x] **Add read-only production schema verification**
  - Added `npm run db:verify-schema` via `scripts/verify-schema.mjs`.
  - Verifies Phase 1 tables, columns, operational indexes, and migration records without running migrations or changing data.
  - Provider-side execution against an isolated MySQL database remains an operator task.
- [x] **Add read-only Phase 1 deployment smoke checks**
  - Added `npm run db:verify-phase1` via `scripts/verify-phase1.mjs`.
  - Checks `/api/health`, confirms MySQL, optionally validates an existing session, and checks administrator school isolation without modifying data.
- [ ] **Complete Phase 1 deployment verification**
  - Run `PRISMA_MYSQL_INTEGRATION=1 npm test` with `PRISMA_TEST_DATABASE_URL` set to a disposable MySQL database.
  - CI now provisions an isolated MySQL service and runs the Prisma read-slice test plus schema verification automatically.
  - Local migration status verification passed through migration `022_monthly_saturdays` without creating operational records.
  - Run `npm run db:verify-schema` against staging or production after taking a verified backup.
  - Confirm `/api/health` reports `db: "mysql"` and perform a school-isolation smoke test.
  - Rotate provider credentials and set `SECRETS_ROTATED=1` after revoking exposed values.
  - Procedure documented in `docs/phase1-verification.md`; provider access is required to close these checks.

## 2. Prisma ORM Incremental Route Migration

Prisma client (`prisma/client.js`) and schema (`prisma/schema.prisma`) are established and synchronized with the MySQL schema. Currently, Express route handlers in `routes/` still use raw SQL queries via `query()` and `run()` in `db.js`.

- [ ] **Migrate Authentication & Users (`routes/auth.js`, `routes/users.js`)**
  - [x] Migrate the read-only user list to Prisma on MySQL with SQL fallback for SQLite/Prisma unavailability.
  - [x] Migrate the public school list to Prisma on MySQL with SQL fallback.
  - [ ] Replace authentication and account mutation SQL only after transaction/session behavior has dedicated coverage.
  - Maintain bcrypt password hashing compatibility.
- [x] **Migrate Campus & Grade Level read entities (`routes/schools.js`)**
  - School listing, single-school reads, and grade-level/section reads use `prisma.school` and `prisma.gradeLevel` on MySQL.
  - SQLite, unavailable Prisma, and Prisma query failures continue through the existing shared SQL adapter.
  - School creation, updates, grade-level writes, archive/restore, deletion, and export remain on the shared adapter.
- [ ] **Migrate Student Enrollment (`routes/students.js`)**
  - Refactor learner CRUD operations, LRN uniqueness validation, and grade/section filtering to Prisma queries.
- [ ] **Migrate Daily & Monthly Attendance (`routes/attendance.js`, `routes/monthly.js`)**
  - Teacher monthly SF2 generation/export authorization, configurable per-report Saturdays, and calendar regression coverage are complete; Prisma migration remains a separate future task.
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
  - Updated the Railpack-compatible `npm start` command to run `node scripts/migrate.mjs` before `node server.js`, covering deployments that bypass the Docker entrypoint.
  - Added additive migration `021_repair_user_avatar_url` for databases where migration tracking says the avatar migration ran but the column is absent.
  - Startup migration does not run `migrate:fresh`, seed records, or delete operational data.
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
- [x] Add teacher notes for exceptional attendance cases (`attendance_records.teacher_notes`, sheet UI, correction history tracking).
- [x] Add daily roll call completion tracking on admin and teacher dashboards (`todayAttendanceCompletion`, progress tracker, section pills).
- [x] Integrate configurable school calendar events, holidays, and suspensions with monthly SF2 calculations (`sync-calendar`, automatic excluded dates).
- [x] Add duplicate-submission protection and idempotent roll call saves (`Idempotency-Key`, in-flight save deduplication, single audit trail).
- [x] Add offline-friendly attendance capture and sync queue (`useOfflineAttendance`, local roster caching, auto-sync on reconnect).
- [x] Add bulk roster import with live validation and preview (`POST /api/students/bulk-validate`, `POST /api/students/bulk-import`, sample Excel template, preview table).
- [x] Fix UI overlap and theme consistency across sticky header, dynamic sidebar height, and modals using semantic theme tokens.
- [x] Add correction reason fields to every bulk-edit workflow (`correctionReason` supported across batch roll call, single entries, teacher notes, and bulk actions).
- [x] Add automatic relocking policy after a defined correction window if required by school policy (48-hour window auto-relocks expired records with `system:window_expired`).
- [x] Add a database-backed per-report Saturday setting for monthly SF2.
  - Migration `022_monthly_saturdays` defaults existing reports to Monday-Friday; users can enable Saturdays per report and Sunday remains disabled.
  - Monthly totals, entry recalculation, and SF2 export honor the setting without changing the existing workbook layout.

---

## 3.5 Student Enrollment History

- [x] Add append-only enrollment events and backfill existing students.
- [x] Add transfer, promotion, reenrollment, and withdrawal API workflows.
- [x] Keep historical attendance and monthly entries when withdrawing students.
- [x] Add school-scoped enrollment history endpoint and student-management actions.
- [x] Validate attendance entries against the selected school and historical enrollment.

## 3A. Student Enrollment History Follow-ups

- [x] Add guardian contacts, emergency information, and consent history (migration `024_student_profiles_and_interventions`, guardian contact tracking, consent fields, and student profile drawer).
- [x] Add LRN and duplicate-student matching rules (`POST /api/students/check-duplicates`, duplicate LRN prevention on create/update/import).
- [x] Add historical/as-of roster support to monthly SF2 generation.
- [x] Add cross-school transfer workflow with paired source/destination events (`transfer_school` action, paired `transfer_out` / `transfer_in` events with shared `transfer_group_id`, historical attendance retention, UI transfer modal, and `tests/cross-school-transfer.test.mjs`).
- [x] Add database transaction helpers for atomic roster and enrollment-event writes (`withTransaction` in `db.js` supporting both MySQL connection transactions and SQLite transactions).

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

## 6. Phase 4 Reports, Analytics, and Exports

- [x] **Dashboard Date-Range Filters & Saved Report Views**
  - Added `startDate` and `endDate` query handling in `routes/dashboard.js` to bound attendance rates and grade/section aggregates.
  - Added `saved_report_views` table (migration `025_reports_and_analytics.mjs`), API endpoints in `routes/reports.js`, and quick preset picker in `src/views/AdminDashboard.vue`.
- [x] **Section Comparison & Attendance Trajectory**
  - Added `GET /api/reports/section-comparison` computing ranking, attendance rates, session totals, and SARDO risk counts.
  - Interactive Section Comparison tab in `src/views/Reports.vue`.
- [x] **DepEd Form 2 Quarterly & Monthly Summaries**
  - Added `GET /api/reports/quarterly-summary` calculating official quarterly ADA, enrolment, and attendance percentages across Q1 to Q4.
  - Quarterly Consolidation tab in `src/views/Reports.vue`.
- [x] **Downloadable CSV/PDF Reports**
  - Added `GET /api/reports/export/csv` generating formatted CSVs with UTF-8 BOM for section comparisons, quarterly summaries, and operational records.
- [x] **Report Archive & Async Generation Status**
  - Added `report_archives` table (migration `025_reports_and_analytics.mjs`), API endpoints `GET/POST /api/reports/archive` and download route `GET /api/reports/archive/:id/download`.
  - Added `POST /api/reports/jobs` and `GET /api/reports/jobs/:id` for asynchronous export lifecycle tracking (`pending`, `completed`, `failed`).
- [x] **Template Version Tracking & Export Pre-Flight Checker**
  - Added `GET /api/export/template/version` calculating SHA-256 hash, file size, template source, and sheets count.
  - Added `POST /api/export/validate` verifying required student names, 12-digit LRN syntax, recognized attendance glyphs, unassigned genders, and date continuity.
  - "SF2 Export Pre-Check" tab in `src/views/Reports.vue` and pre-validation modal in `src/views/MonthlyAttendance.vue`.
- [x] **Automated Regression Test Suite**
  - Added `tests/phase4-reports-and-exports.test.mjs` covering all Phase 4 endpoints.
  - Enhanced `tests/export-regression.test.mjs` verifying template structure, sheet naming, cell glyphs (`◤`, `◢`, `x`), learner rows, and ADA formulas.

---

## 7. Phase 5 Communication and Notifications

- [x] **Support Inquiries Enhancements & Priority Handling**
  - Added `priority` ('low', 'medium', 'high', 'urgent') and expanded categories in `inquiries`.
  - Added attachment upload and validation (image/doc types, 5MB ceiling, dangerous script exclusion) in `inquiry_messages`.
  - Added anti-spam rate limiting and duplicate-message submission protection.
- [x] **Staff Assignment & Status Audit History**
  - Added `inquiry_status_history` table (migration `026_communication_and_notifications.mjs`) tracking every status and assignment transition.
  - Added `PATCH /api/inquiries/:id/assign` for superadmins to assign staff with notes.
  - Added `GET /api/inquiries/:id/history` endpoint and interactive audit timeline in `SupportChatModal.vue`.
- [x] **Targeted Campus Announcements & Read Tracking**
  - Added `announcements` and `announcement_reads` tables (migration `026_communication_and_notifications.mjs`).
  - Added `routes/announcements.js` supporting targeting by school, role (`all`, `admin`, `teacher`), grade, and section.
  - Implemented read state tracking (`POST /api/announcements/:id/read`, `POST /api/announcements/mark-all-read`, `GET /api/announcements/unread-count`).
  - Added announcement cleanup endpoint `POST /api/announcements/cleanup` for retention management.
  - Added announcements broadcast banner and post modal in `AdminDashboard.vue` and `TeacherDashboard.vue`.
  - Connected header notification bell in `App.vue` via `useNotifications.js`.
- [x] **Configurable Platform Support Email & User Notification Preferences**
  - Added `support_email` database-backed setting with format validation in `routes/settings.js`.
  - Added `user_notification_preferences` table with `GET/PUT /api/users/me/notification-preferences`.
  - Added dedicated "Notifications & Alerts" preferences tab in `Settings.vue`.
  - Integrated transactional email alerts via `sendAccountEmail` for urgent announcements and ticket status changes.
- [x] **Automated Regression Test Suite**
  - `tests/phase5-communication.test.mjs` verifying inquiries, attachments, staff assignment, status history, notification preferences, support email, and targeted announcements.

- [x] **Protect public landing data**
  - Public landing responses expose only database-backed subscription plan fields and aggregate product metrics.
  - Learner rosters, risk records, school identity, attendance marks, LRNs, payment methods, account numbers, and QR data remain unavailable before sign-in.
  - Added authorization regression coverage for the privacy contract.

- [x] **Complete shared UI privacy and responsiveness audit**
  - Updated `App.vue`, `UserManagement.vue`, `GradeLevels.vue`, `ActivityLogs.vue`, `SupportChatModal.vue`, and `Landing.vue` for shared theme tokens, responsive layout, and safe public preview copy.

---

## Completed Milestones (Reference)

- [x] Dynamic database URL resolution supporting Laravel-style `DB_*` variables (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
- [x] Removed runtime and deployment data seeding. Accounts, schools, plans, licenses, payment methods, and sample records are created only by explicit API or seed-file actions.
- [x] Prevented unhandled SQLite fatal crashes in production mode when `DATABASE_URL` is unset.
- [x] Configured Prisma ORM schema (`prisma/schema.prisma`) with all 15 models mapped to MySQL tables.
- [x] Synchronized `process.env.DATABASE_URL` for Prisma when using individual `DB_*` variables in `db.js` and `prisma/client.js`.
- [x] Updated `Dockerfile` Stage 1 (`prisma generate`) and Stage 3 (`COPY prisma`, `scripts`, `migrations`, `@prisma/client`, `.prisma`).
- [x] Validated frontend Vite build and Node syntax compatibility.
