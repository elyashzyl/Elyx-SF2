# ElyTrack Project Plan

## 1. Product Vision

ElyTrack is a multi-school school operations platform focused on reliable attendance recording, DepEd SF2 reporting, school-level data isolation, and subscription-based access.

The product should help schools:

- Record daily attendance quickly and accurately.
- Generate compliant monthly SF2 reports without changing the existing Excel template format.
- Identify students who may need intervention.
- Manage teachers, students, sections, schedules, and school events.
- Handle subscriptions and payment requests through a controlled approval workflow.
- Communicate with the platform superadmin through database-backed support inquiries.

### Core rules

1. Operational data must come from the database.
2. Migrations create schema only and must never insert sample or default records.
3. Seed data may only be added through an explicit, intentional command.
4. School administrators and teachers must only access records belonging to their school.
5. Superadmin-only actions must be enforced by the API, not only hidden in the frontend.
6. Existing SF2 Excel formatting, formulas, glyphs, widths, and worksheet structure must remain unchanged.
7. Production deployments must not use `migrate:fresh`.

---

## 2. Current Platform Scope

The following capabilities already exist or are substantially implemented:

- Role-based accounts: superadmin, administrator, and teacher.
- Multi-school support with school context selection for superadmins.
- School-level access restrictions.
- Daily attendance with DepEd attendance codes.
- Teacher attendance workflow and advisory scoping.
- [x] Monthly SF2 attendance calculations and Excel export.
  - Saturday is configurable per report and defaults off for existing and new reports; Sunday remains disabled.
  - Teacher generation and export now use the authenticated advisory grade/section, reject cross-class requests, and surface scoped API errors instead of silently opening an empty report.
- SARDO early-warning indicators.
- Grade levels and sections.
- Student and user management.
- Teacher schedules and calendar events.
- Database-backed licenses, subscription plans, payment methods, and payment requests.
- Superadmin approval workflow for activation, renewal, and upgrade requests.
- Database-backed support inquiries and messages.
- Landing-page subscription/trial flow.
- Automatic schema migrations during deployment.
- SQLite development support and MySQL production support.
- Health checks, audit logs, database backup tooling, and automated tests.
- One-time per-user onboarding tutorial.

---

## 3. Priority Roadmap

### Phase 0 — Production Safety and Foundation

**Priority: Critical**

- [x] Replace plaintext password handling with bcrypt and finish the legacy migration workflow.
  - Added `lib/passwords.js` using bcryptjs with 12 rounds.
  - New trial, user, school-admin, seed, and reset-account passwords are hashed before storage.
  - Added `npm run passwords:audit` and the explicit transactional `npm run passwords:migrate -- --confirm` command; both avoid printing password values.
  - Production never compares plaintext. Local/test compatibility requires the explicit `ALLOW_LEGACY_PASSWORD_LOGIN=1` flag and immediately rehashes successful compatibility logins.
- [ ] Rotate all previously exposed database credentials, application keys, and deployment secrets.
  - Added `npm run secrets:verify`; it fails until valid database settings are present and `SECRETS_ROTATED=1` is explicitly set. The application logs a warning rather than crashing when the acknowledgement is missing.
  - Provider-side credential replacement, revocation, and setting `SECRETS_ROTATED=1` still require deployment access.
- [x] Add secure session or token handling with expiration and revocation.
  - Added `auth_sessions`, HttpOnly/SameSite cookies, sliding expiration, revocation, logout, and server-side impersonation state.
- [x] Add rate limiting to login, trial signup, password reset, inquiry, and payment endpoints.
  - Added configurable in-process limits; use `RATE_LIMIT_*` variables and enforce limits at the gateway for multi-instance deployments.
- [x] Add request validation for every route using a shared validation layer.
  - Global API validation now rejects malformed nested input, prototype-pollution keys, control characters, oversized values, and invalid JSON before route handlers execute.
  - Domain-specific route validators remain responsible for required fields and allowed business values.
- [x] Add CSRF protection if cookie-based authentication is used.
  - Added Origin validation for state-changing requests carrying the session cookie.
- [x] Add security headers and a production CORS allowlist.
  - Added `ALLOWED_ORIGINS`/`CORS_ORIGINS`, CSP, HSTS, frame, content-type, referrer, and permissions headers.
- [x] Add a documented backup restore procedure, not only backup creation.
  - Added `scripts/restore.mjs` and `npm run db:restore`.
  - SQLite restores validate the file and preserve a `.pre-restore-<timestamp>` safety copy.
  - MySQL restores require an explicit `DATABASE_URL` and the `--force` confirmation.
- [x] Add database indexes after reviewing production query performance.
  - Added migration `014_operational_indexes.mjs` for school, enrollment, attendance, inquiry, license, subscription, and payment query paths.
- [x] Add structured server logging with request IDs and environment-safe error messages.
  - Production logs include request ID, route, status, duration, and actor scope without credentials or session tokens.

**Definition of done:** A production deployment can be audited, backed up, restored, and operated without exposing credentials or accepting unsafe account actions.

---

### Phase 1 — Account and School Administration

**Priority: High**

- [x] Add invitation-based account creation for teachers and administrators.
  - Added school-scoped invitation issuance, hashed one-time invitation tokens, configurable expiry, SMTP/log delivery, acceptance, account activation, audit logging, and public acceptance UI.
- [x] Add password reset through an email provider.
  - Added non-enumerating reset requests, hashed one-time reset tokens, configurable expiry, session revocation after reset, SMTP/log delivery, and public reset UI.
- [x] Add email verification for new accounts.
  - Added verification token issuance, one-time confirmation, resend support, email-change invalidation, persistence, SMTP/log delivery, and public verification UI.
- [x] Add account status management: active, invited, disabled, and locked.
  - Added migration `015_user_account_lifecycle`, scoped status endpoint, session revocation, UI status display, and automatic five-failure/15-minute lockout.
- [x] Add last-login, password-changed, and failed-login metadata.
  - Login timestamps, password-change timestamps, failed-login counts, and lock expiry are persisted without exposing password data.
- [x] Add account email and one-time token storage.
  - Migration `016_account_tokens_and_email` adds email fields and the `account_tokens` table without inserting operational records.
- [x] Add profile avatar support using database-backed HTTPS or local relative URLs.
  - Added migration `020_user_avatar_url` without modifying existing user data.
  - Settings and sidebar show the avatar with initials fallback; profile updates preserve role, grade, section, and school.
  - Uploaded files are intentionally not stored in the container; object/file storage can be added later when a persistent provider is configured.
- [x] Add school profile settings:
  - School name and short name.
  - Address and contact information.
  - Division, district, school ID, and principal information.
  - School year and current grading period.
  - Added migration `017_school_profile_fields` with non-destructive MySQL/SQLite columns, scoped API support, validation, audit logging, and Settings UI fields.
- [x] Add school archive functionality before permanent deletion.
  - Added migration `018_school_archive` for reversible archive metadata and migration `019_school_archive_account_status` to preserve each affected account's prior status.
  - Superadmins can archive and restore schools; archived schools are excluded from normal lists, blocked at login/session validation, and historical records remain intact.
- [x] Add a confirmation and dependency preview before deleting a school.
  - School management now shows scoped dependency counts before archive or permanent deletion and refreshes the list immediately after actions.
  - Permanent deletion remains explicit and separate from reversible archive.
- [x] Add export of a school's data before archive or deletion.
  - Superadmins can download a database-backed, school-scoped JSON snapshot, including archived schools.
  - Authentication secrets, passwords, session rows, and one-time account tokens are excluded.
  - Permanent deletion requires a recorded export first, and export actions are audit logged.
- [x] Complete incremental Prisma route migration where it improves maintainability and transaction safety.
  - User listing and public school listing use Prisma on MySQL when available, with the shared SQL adapter retained for SQLite and Prisma failures.
  - School listing, single-school reads, and grade-level/section reads in `routes/schools.js` now use Prisma on MySQL with the same SQL fallback.
  - Added `tests/prisma-read-slices.mysql.test.mjs`, an opt-in integration suite that rejects production mode and non-test database names before importing Prisma.
  - Added focused avatar/session regression coverage and regenerated the Prisma client after adding `avatarUrl`.
  - Authentication writes, sessions, tokens, authorization-sensitive mutations, and operational writes remain on the shared adapter.
  - Run the MySQL integration suite only against an isolated disposable database with `PRISMA_MYSQL_INTEGRATION=1` and `PRISMA_TEST_DATABASE_URL`.

**Definition of done:** Administrators can safely manage their own school and accounts without viewing or modifying another school's data.

**Phase 1 status:** All repository implementation work is complete. Added read-only schema and deployment smoke checks, a GitHub Actions isolated MySQL job, and `docs/phase1-verification.md`. The only remaining closure items require deployment/provider access: run the isolated MySQL job or equivalent, verify `/api/health`, run the school-isolation smoke check against the deployed service, take and verify a backup, and rotate exposed provider credentials with `SECRETS_ROTATED=1`.

---

### Phase 2 — Attendance Reliability and Workflow

**Priority: High**

- [x] Add attendance locking after a configured school-specific cutoff date.
  - Administrators configure the cutoff in School Information; blank disables automatic locking.
  - Locked records are enforced by the API and surfaced in the attendance UI.
- [x] Allow authorized administrators to reopen locked attendance with a required reason.
  - Same-school administrators and superadmins only; cross-school requests are rejected.
  - Reopen actions are written to audit logs.
- [x] Add an attendance correction history showing before and after values.
  - Post-reopen entry and record changes store actor, role, school, reason, and old/new values.
- [x] Add teacher notes for exceptional attendance cases.
  - Database-backed `teacher_notes` column in `attendance_records` across MySQL and SQLite.
  - Surface notes card on daily attendance sheet with auto-save and blur triggers.
  - Track changes in post-reopen correction history with reasons and actor metadata.
- [x] Add bulk import of student rosters with validation and a preview step.
  - Endpoints `/api/students/bulk-validate` and `/api/students/bulk-import` for Excel (.xlsx/.xls) and CSV rosters.
  - Client-side parser with live validation preview, duplicate detection, and license capacity limits.
- [x] Add bulk attendance import only if it follows DepEd rules and has a clear audit trail.
  - Added endpoints `/api/attendance/bulk-import-validate` and `/api/attendance/bulk-import`.
  - Enforces cutoff locks, validates learner roster existence, and records `attendance.bulk_import` audit logs.
- [x] Add offline-friendly attendance capture with a safe synchronization queue.
  - Composable `useOfflineAttendance` caching rosters locally in `localStorage` and queueing offline roll call saves.
  - Offline mode banner and manual sync button on `AttendanceSheet.vue`.
  - Automatic synchronization on window `online` reconnection.
- [x] Add duplicate-submission protection and idempotent attendance saves.
  - Server-side `idempotencyStore` caching responses by `Idempotency-Key` or payload fingerprint to prevent duplicate saves and duplicate audit records.
  - Client-side in-flight deduplication in `src/stores/attendance.js`.
- [x] Add daily attendance completion indicators for each section and teacher.
  - Daily roll call completion computation in `/api/dashboard/stats` comparing active sections against today's records.
  - Visual roll call tracker widget on Admin Dashboard with completion rate, progress bar, and section status pills.
  - Today's Roll Call Status card on Teacher Dashboard for instant visibility and 1-click attendance taking.
- [x] Add configurable holidays, suspensions, special non-working days, and school events.
  - Monthly SF2 integrates with school `calendar_events` table for holidays and suspensions.
  - 1-click calendar sync endpoint `/api/monthly/:recordId/sync-calendar` recalculating attendance totals and auto-excluding non-working days.
- [x] Add attendance summaries by:
  - School.
  - Grade and section.
  - Teacher.
  - Date range.
  - Gender.
  - Student status.
  - Verified via multi-dimensional analytics endpoint `/api/attendance/summaries`, sheet analytics modal, and automated integration suite `tests/phase2-summaries.test.mjs`.

**Definition of done:** A teacher can record attendance quickly, recover from temporary network failures, and every correction is traceable.

---

### Phase 3 — Student Information and Intervention

**Priority: High**

- [x] Expand student profiles with guardian contacts and emergency information.
  - Added schema migration `024_student_profiles_and_interventions.mjs` with LRN, birth date, address, guardian contact details, emergency contacts, and DepEd/medical consent tracking.
  - Full CRUD in `routes/students.js` and expanded edit modal in `src/views/StudentManagement.vue`.
- [x] Add append-only enrollment history by effective date, grade, and section.
- [x] Add student transfer, promotion, reenrollment, and withdrawal workflows.
- [x] Preserve historical attendance entries when a student changes section or grade or is withdrawn.
  - Current roster rows are retained; withdrawal is a status transition instead of destructive deletion.
  - Attendance saves validate student school ownership and historical enrollment class.
- [x] Add configurable student risk rules for SARDO instead of fixed thresholds.
  - Database-backed `sardo_consecutive_absences` and `sardo_cumulative_absences` on `schools` table.
  - School settings UI in `src/views/Settings.vue` allows configuring alert thresholds.
  - Dynamic SARDO retention watchlist calculation in `routes/dashboard.js` and `src/views/AdminDashboard.vue`.
- [x] Add intervention records:
  - Concern type (attendance, academic, behavioral, health, other).
  - Assigned staff member.
  - Action taken.
  - Follow-up date.
  - Resolution status (open, in_progress, resolved, escalated).
  - Backed by `student_interventions` table, API endpoints in `routes/students.js`, and interactive management drawer in `src/views/StudentManagement.vue`.
- [x] Add guardian contact history and consent tracking where required.
  - `student_guardian_contacts` table logging calls, SMS, home visits, in-person conferences, and letters with dates, guardians, topics, and outcomes.
- [x] Add duplicate student detection using LRN and configurable matching fields.
  - `POST /api/students/check-duplicates` and duplicate LRN prevention on create, update, and bulk import.
- [x] Add printable student lists, class lists, and enrollment summaries.
  - Print Class Roster with official DepEd Form 2 layout, adviser and principal signatures, and printable CSS.
  - Print Enrollment Master Summary breakdown by grade, section, and gender.
  - Verified in `tests/phase3-students.test.mjs`.

**Definition of done:** Schools can follow a learner's enrollment and intervention history without losing historical attendance or exposing records across schools.

---

### Phase 4 — Reports, Analytics, and Exports

**Priority: High**

- [ ] Add dashboard date-range filters and saved report views.
- [ ] Add attendance trend charts and section comparison reports.
- [ ] Add monthly and quarterly summary reports.
- [ ] Add downloadable CSV/PDF reports for operational summaries.
- [ ] Add report generation status for large exports.
- [ ] Add a report archive with creator, date, school, and report type.
- [ ] Add automated regression tests for every SF2 export change.
- [ ] Add template version tracking while preserving the current SF2 formatting.
- [ ] Add an export validation page that checks missing students, invalid codes, and incomplete dates before generating the workbook.

**Definition of done:** Administrators can identify attendance trends and produce validated reports while the existing SF2 workbook remains visually compatible.

---

### Phase 5 — Communication and Notifications

**Priority: Medium**

- [ ] Improve support inquiries with categories, priority, attachments, and status history.
- [ ] Add superadmin assignment of inquiries to support staff.
- [ ] Add email notifications for new inquiries, replies, and finished requests.
- [ ] Add in-app notification preferences per user.
- [ ] Add announcements targeted by school, role, grade, or section.
- [ ] Add read/unread tracking and notification retention rules.
- [ ] Add configurable support email address from database-backed platform settings.
- [ ] Add message spam protection and attachment size/type validation.

**Definition of done:** Users receive clear, database-backed updates for support cases, approvals, and important school announcements.

---

### Phase 6 — Subscription and Payment Operations

**Priority: High for monetization**

- [ ] Add subscription status history, including pending, approved, rejected, expired, suspended, and cancelled states.
- [ ] Add approval notes and timestamps for every subscription decision.
- [ ] Add payment reference numbers and proof-of-payment uploads.
- [ ] Add configurable payment instructions, QR codes, and bank accounts managed by superadmin.
- [ ] Add payment method active/inactive status and display ordering.
- [ ] Add automatic reminders before trial or subscription expiration.
- [ ] Add grace-period handling after expiration.
- [ ] Add invoice or receipt records after approval.
- [ ] Add webhook integration only when a supported payment provider is selected.
- [ ] Add protection against duplicate payment submissions.
- [ ] Add subscription analytics for active schools, churn, trials, renewals, and revenue.
- [ ] Ensure no payment method or plan is automatically inserted during deployment.

**Definition of done:** Subscription changes are transparent, approval-controlled, auditable, and fully database-backed.

---

### Phase 7 — School Operations Modules

**Priority: Medium**

These modules should be added only after attendance and subscription workflows are stable:

- [ ] Assignment and lesson tracking.
- [ ] Grade recording and grading-period management.
- [ ] Class schedules with conflict detection.
- [ ] Room and facility scheduling.
- [ ] School calendar and academic-year setup.
- [ ] Document repository for school forms and policies.
- [ ] Inventory and equipment tracking.
- [ ] Basic procurement and expense records.
- [ ] Staff leave and substitute-teacher tracking.
- [ ] Parent or guardian portal with tightly scoped access.

**Definition of done:** New modules reuse the same roles, school isolation, audit logging, migration rules, and notification system instead of adding separate one-off implementations.

---

## 4. Technical Work Plan

### Backend

- [ ] Establish shared authorization helpers for role, school, and resource ownership checks.
- [ ] Establish shared request validation and error response formats.
- [ ] Use database transactions for multi-table operations such as school deletion, enrollment changes, and subscription approval.
- [ ] Add pagination, filtering, and sorting to all large list endpoints.
- [ ] Add consistent soft-delete or archive rules where historical records must be retained.
- [ ] Add idempotency keys for payment and bulk attendance requests.
- [ ] Continue Prisma migration only when it does not compromise the dual SQLite/MySQL behavior.
- [ ] Keep migration files append-only; create a new migration instead of editing an applied migration.

### Frontend

- [ ] Standardize loading, empty, error, and permission-denied states.
- [ ] Add reusable table, modal, form, confirmation, and toast components.
- [ ] Improve keyboard navigation and screen-reader labels.
- [ ] Verify light and dark themes across every new screen.
- [ ] Add responsive layouts for tablets used during classroom attendance.
- [ ] Avoid putting operational values in Vue constants when they belong in the database.
- [ ] Keep the manual tutorial button while preserving one-time automatic onboarding.

### Database and migrations

- [ ] Document every new table, ownership relationship, and retention rule.
- [ ] Add foreign keys and indexes consistently for MySQL and SQLite-compatible migrations.
- [ ] Add migration tests for fresh databases and upgrade paths from existing deployments.
- [x] Test migration failure behavior before application startup.
  - The migration runner exits non-zero on failure, and both the Docker entrypoint and Railpack-compatible `npm start` stop before launching the server.
- [x] Never add default accounts, schools, payment methods, licenses, plans, or sample records to a migration.
  - Startup runs schema migrations only; operational data requires an explicit seed command or UI workflow.

### Quality assurance

- [ ] Maintain unit tests for attendance and SF2 calculations.
- [ ] Add API tests for every role boundary.
- [ ] Add cross-school access regression tests for every school-owned resource.
- [ ] Add subscription approval and rejection integration tests.
- [ ] Add school deletion and archive tests with dependent records.
- [ ] Add browser-based smoke tests for login, attendance, export, support, and payment flows.
- [ ] Run build, tests, migration status, and `git diff --check` in CI.

---

## 5. Suggested Release Milestones

### Release 1 — Secure Attendance Core

- Password hashing and secret rotation.
- Authorization and input validation review.
- Attendance locking and correction audit. **Completed in code; provider-side secret rotation remains pending.**
- Backup restore verification.
- Role and cross-school integration tests.

### Release 2 — School Operations

- Enrollment history.
- Student intervention records.
- School profile and academic-year settings.
- Improved reports and attendance analytics.

### Release 3 — Subscription Product

- Payment proof and receipt records.
- Expiration reminders and grace periods.
- Subscription analytics.
- Complete approval history and operational dashboards.

### Release 4 — Communication and Expansion

- Complete support notification workflow.
- Announcements.
- Offline attendance support.
- Carefully selected LMS or school operations modules.

---

## 6. Recommended Immediate Next Steps

1. Rotate exposed credentials. **Password hashing, explicit legacy password audit/migration, server sessions, account lifecycle controls, and rotation preparation completed; provider-side secret replacement remains pending.**
2. Complete Phase 1 account lifecycle work. **Initial status, lockout, and login metadata slice completed; invitations, email reset/verification, and school archive workflows remain.**
2. Add API-level authorization tests for every school-owned route. **Completed for the current users, students, schools, and license authorization boundaries; extend coverage when new school-owned routes are added.**
  - Added `tests/api-authorization.test.mjs` covering cross-school reads, cross-school mutations, teacher restrictions, superadmin-only license actions, role spoofing, and unauthenticated requests.
3. Implement attendance lock and correction history. **Completed:** migration 010, API enforcement, school cutoff settings, reopen authorization, audit logging, correction history, UI status controls, and regression tests.
4. Add enrollment history before adding more LMS features. **Completed:** migration 011, backfill, school-scoped history, transfer/promotion/reenrollment/withdrawal workflows, non-destructive roster status, historical attendance validation, and UI actions.
5. Add payment proof, receipts, and expiration reminders.
6. Add database backup restore testing. **Completed:** restore tooling, safety checks, and documented commands are now available; production restore drills remain a recurring operational task.
7. Add CI to run migrations, tests, frontend build, and export regression checks. **Completed:** `.github/workflows/ci.yml` runs migration status, the full SQLite test suite, the frontend build, and `git diff --check` on pushes and pull requests.
8. Review and update `TODO.md` as items in this plan are completed.

## 7. Out of Scope Until the Core Is Stable

- Full learning management system functionality.
- Real-money payment automation without a selected provider and reconciliation process.
- Parent portal access without a clear identity-verification model.
- Destructive schema resets in production.
- Automatic seed data during deployment.
- Replacing the existing SF2 workbook format without an approved template migration plan.
