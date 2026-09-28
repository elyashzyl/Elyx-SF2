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
- Monthly SF2 attendance calculations and Excel export.
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

- [x] Replace plaintext password handling with bcrypt.
  - Added `lib/passwords.js` using bcryptjs with 12 rounds.
  - New trial, user, school-admin, seed, and reset-account passwords are hashed before storage.
  - Existing plaintext accounts remain temporarily compatible and are rehashed after successful login.
  - Remaining follow-up: audit existing records, confirm all accounts have logged in or run an approved migration, then remove plaintext fallback.
- [ ] Rotate all previously exposed database credentials, application keys, and deployment secrets.
- [ ] Add secure session or token handling with expiration and revocation.
- [ ] Add rate limiting to login, trial signup, password reset, inquiry, and payment endpoints.
- [ ] Add request validation for every route using a shared validation layer.
- [ ] Add CSRF protection if cookie-based authentication is used.
- [ ] Add security headers and a production CORS allowlist.
- [x] Add a documented backup restore procedure, not only backup creation.
  - Added `scripts/restore.mjs` and `npm run db:restore`.
  - SQLite restores validate the file and preserve a `.pre-restore-<timestamp>` safety copy.
  - MySQL restores require an explicit `DATABASE_URL` and the `--force` confirmation.
- [ ] Add database indexes after reviewing production query performance.
- [ ] Add structured server logging with request IDs and environment-safe error messages.

**Definition of done:** A production deployment can be audited, backed up, restored, and operated without exposing credentials or accepting unsafe account actions.

---

### Phase 1 — Account and School Administration

**Priority: High**

- [ ] Add invitation-based account creation for teachers and administrators.
- [ ] Add password reset through an email provider.
- [ ] Add email verification for new accounts.
- [ ] Add account status management: active, invited, disabled, and locked.
- [ ] Add last-login, password-changed, and failed-login metadata.
- [ ] Add profile photo or avatar support if needed, stored through a configurable file/object storage provider.
- [ ] Add school profile settings:
  - School name and short name.
  - Address and contact information.
  - Division, district, school ID, and principal information.
  - School year and current grading period.
- [ ] Add school archive functionality before permanent deletion.
- [ ] Add a confirmation and dependency preview before deleting a school.
- [ ] Add export of a school's data before archive or deletion.
- [ ] Complete incremental Prisma route migration where it improves maintainability and transaction safety.

**Definition of done:** Administrators can safely manage their own school and accounts without viewing or modifying another school's data.

---

### Phase 2 — Attendance Reliability and Workflow

**Priority: High**

- [ ] Add attendance locking after a configured cutoff date.
- [ ] Allow authorized administrators to reopen locked attendance with a reason.
- [ ] Add an attendance correction history showing before and after values.
- [ ] Add teacher notes for exceptional attendance cases.
- [ ] Add bulk import of student rosters with validation and a preview step.
- [ ] Add bulk attendance import only if it follows DepEd rules and has a clear audit trail.
- [ ] Add offline-friendly attendance capture with a safe synchronization queue.
- [ ] Add duplicate-submission protection and idempotent attendance saves.
- [ ] Add daily attendance completion indicators for each section and teacher.
- [ ] Add configurable holidays, suspensions, special non-working days, and school events.
- [ ] Add attendance summaries by:
  - School.
  - Grade and section.
  - Teacher.
  - Date range.
  - Gender.
  - Student status.

**Definition of done:** A teacher can record attendance quickly, recover from temporary network failures, and every correction is traceable.

---

### Phase 3 — Student Information and Intervention

**Priority: High**

- [ ] Expand student profiles with guardian contacts and emergency information.
- [ ] Add enrollment history by school year, grade, and section.
- [ ] Add student transfer, promotion, and withdrawal workflows.
- [ ] Preserve historical attendance when a student changes section or grade.
- [ ] Add configurable student risk rules for SARDO instead of fixed thresholds.
- [ ] Add intervention records:
  - Concern type.
  - Assigned staff member.
  - Action taken.
  - Follow-up date.
  - Resolution status.
- [ ] Add guardian contact history and consent tracking where required.
- [ ] Add duplicate student detection using LRN and configurable matching fields.
- [ ] Add printable student lists, class lists, and enrollment summaries.

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
- [ ] Test migration failure behavior before application startup.
- [ ] Never add default accounts, schools, payment methods, licenses, plans, or sample records to a migration.

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
- Attendance locking and correction audit.
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

1. Fix password storage and rotate exposed credentials.
2. Add API-level authorization tests for every school-owned route.
3. Implement attendance lock and correction history.
4. Add enrollment history before adding more LMS features.
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
