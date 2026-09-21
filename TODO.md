# ElyTrack — Project TODO & Continuation Roadmap

Tracking pending engineering tasks, production deployment optimizations, and migration milestones.

---

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
    - Runs `npm run db:seed` when `AUTO_SEED=1` or `AUTO_SEED=true` is provided.
  - Updated `Dockerfile` with `ENTRYPOINT ["/app/docker-entrypoint.sh"]` and `CMD ["node", "server.js"]`.
- [x] **SF2 Excel Template Persistence**
  - In `routes/export.js`, user-uploaded templates via `POST /api/export/template` persist to `/data/templates/SF2.xlsx` (or custom `TEMPLATE_DIR`) with automatic fallback to bundled `templates/SF2.xlsx` or `test_final2.xlsx`.
- [x] **Production Database Backup Strategy**
  - Created `scripts/backup.mjs` (`npm run db:backup`) for automated backups:
    - Creates timestamped snapshots for SQLite (`attendance-backup-<timestamp>.db`).
    - Executes `mysqldump` (with fallback table query dump) for MySQL deployments.
    - Implements automated retention policy (cleans backups older than 14 days).

---

## 3. Database Health & Telemetry

- [x] **Enhance Health Check Endpoint (`/api/health`)**
  - Updated `server.js` `/api/health` to execute a lightweight database ping (`SELECT 1 as ping`).
  - Returns `status: "ok"`, active backend mode (`mysql` vs `sqlite`), query roundtrip latency (`latencyMs`), and ISO timestamp.
- [x] **Audit Logging Expansion (`routes/logs.js`)**
  - Connected teacher daily attendance recording in `routes/attendance.js` (`attendance.create`, `attendance.update`) to the `audit_logs` table.
  - Connected monthly SF2 sheet submissions and cell edits in `routes/monthly.js` (`monthly.create`, `monthly.update`, `monthly.entry_edit`) to `audit_logs`.

---

## 4. Automated Testing & Verification

- [x] **API & Calculation Integration Tests**
  - Added test suite using native Node.js test runner (`npm test`):
    - `tests/health-and-plans.test.mjs`: Validates database connectivity, health checks, subscription plans, and license status constraints.
    - `tests/sf2-calculations.test.mjs`: Validates DepEd School Form 2 calculations (ADA, percentage of attendance, gender normalization).
- [x] **Export Regression Test**
  - `tests/export-regression.test.mjs`: Verifies SF2 template existence, workbook structure, and worksheet accessibility.

---

## Completed Milestones (Reference)

- [x] Dynamic database URL resolution supporting Laravel-style `DB_*` variables (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
- [x] Decoupled hardcoded school credentials (`BAGUIO PATRIOTIC HIGH SCHOOL`, `admin123`) to dynamic environment variables (`SCHOOL_*`, `ADMIN_*`).
- [x] Prevented unhandled SQLite fatal crashes in production mode when `DATABASE_URL` is unset.
- [x] Configured Prisma ORM schema (`prisma/schema.prisma`) with all 15 models mapped to MySQL tables.
- [x] Synchronized `process.env.DATABASE_URL` for Prisma when using individual `DB_*` variables in `db.js` and `prisma/client.js`.
- [x] Updated `Dockerfile` Stage 1 (`prisma generate`) and Stage 3 (`COPY prisma`, `scripts`, `migrations`, `@prisma/client`, `.prisma`).
- [x] Validated frontend Vite build and Node syntax compatibility.
