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

- [ ] **Automated Startup Migration Entrypoint**
  - Create a `docker-entrypoint.sh` script to run before `CMD ["node", "server.js"]`:
    - Automatically run `npm run db:migrate` or `npx prisma db push --skip-generate` on container boot if `DB_HOST` or `DATABASE_URL` is set.
    - Optionally seed initial school administrator account if table is empty.
  - Update `Dockerfile` to use `ENTRYPOINT ["/app/docker-entrypoint.sh"]`.
- [ ] **SF2 Excel Template Persistence**
  - In `routes/export.js`, user-uploaded templates via `POST /export/template` write to `templates/SF2.xlsx`.
  - In multi-container or ephemeral environments, relocate custom uploaded templates to persistent storage (`/data/templates/SF2.xlsx` or S3/MinIO bucket) with fallback to default `templates/SF2.xlsx`.
- [ ] **Production Database Backup Strategy**
  - Add scheduled backup script or Coolify cron job for automated `mysqldump` of the `edupulse` database to persistent storage.

---

## 3. Database Health & Telemetry

- [ ] **Enhance Health Check Endpoint (`/api/health`)**
  - Update `server.js` `/api/health` to execute a lightweight database ping (`SELECT 1` or `prisma.$queryRaw` SELECT 1``).
  - Return database latency and active backend status (`mysql` vs `sqlite`).
- [ ] **Audit Logging Expansion (`routes/logs.js`)**
  - Connect teacher attendance alterations, grade level additions, and license status toggles to `audit_logs` table via Prisma.

---

## 4. Automated Testing & Verification

- [ ] **API Integration Tests**
  - Add test runner (e.g. `vitest` or `supertest`) to validate:
    - User authentication (`/api/auth/login`) and session validation.
    - Daily attendance recording and calculation of Absent, Tardy, Excused codes.
    - Monthly SF2 summary calculation (Total Male/Female Absent, Total ADA, Percentage of Attendance).
    - License suspension lockout middleware (`src/App.vue` and API routes).
- [ ] **Export Regression Test**
  - Add integration test verifying `GET /api/export/sf2` produces a valid XLSX buffer matching DepEd template cell requirements.

---

## Completed Milestones (Reference)

- [x] Dynamic database URL resolution supporting Laravel-style `DB_*` variables (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
- [x] Decoupled hardcoded school credentials (`BAGUIO PATRIOTIC HIGH SCHOOL`, `admin123`) to dynamic environment variables (`SCHOOL_*`, `ADMIN_*`).
- [x] Prevented unhandled SQLite fatal crashes in production mode when `DATABASE_URL` is unset.
- [x] Configured Prisma ORM schema (`prisma/schema.prisma`) with all 15 models mapped to MySQL tables.
- [x] Synchronized `process.env.DATABASE_URL` for Prisma when using individual `DB_*` variables in `db.js` and `prisma/client.js`.
- [x] Updated `Dockerfile` Stage 1 (`prisma generate`) and Stage 3 (`COPY prisma`, `scripts`, `migrations`, `@prisma/client`, `.prisma`).
- [x] Validated frontend Vite build and Node syntax compatibility.
