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
npm run db:setup
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001  

Default seed credentials:
- Superadmin: `admin` / `ElyTrack2026!`
- Teachers: `msantos`, `jdelacruz`, `rmendoza`, `creyes` / `teacher123`

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

# Seed database with configurable credentials and sample data
npm run db:seed

# Run migrations then seed database
npm run db:setup
```

### Custom Seeder Execution (No Hardcoded Values)

All values can be customized through CLI arguments or environment variables:

```bash
node scripts/seed.mjs \
  --admin-user myadmin \
  --admin-pass "MySecretPass2026!" \
  --admin-name "Principal John Doe" \
  --school-name "Manila Science High School" \
  --school-short "MSHS" \
  --school-id "300456" \
  --school-address "Manila, Philippines" \
  --students-per-section 20 \
  --sample
```

To seed only the essential school and admin accounts without sample data:

```bash
npm run db:seed -- --no-sample
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | MySQL connection URL (if unset, SQLite is used) | `(unset)` |
| `DB_PATH` | SQLite file path | `attendance.db` |
| `ADMIN_USERNAME` | Superadmin username | `admin` |
| `ADMIN_PASSWORD` | Superadmin password | `ElyTrack2026!` |
| `ADMIN_NAME` | Superadmin display name | `System Administrator` |
| `SCHOOL_NAME` | Primary school name | `Baguio Patriotic High School` |
| `SCHOOL_SHORT` | School short code | `BPHS` |
| `SCHOOL_ID` | DepEd School ID | `406219` |
| `SCHOOL_ADDRESS` | School address | `Baguio City, Philippines` |
| `SEED_SAMPLE_DATA` | Seed sample faculty, students & records | `true` |
| `STUDENTS_PER_SECTION` | Number of students per section | `15` |
| `TEACHER_PASSWORD` | Default password for sample teachers | `teacher123` |

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

## Note

This is **not the full LMS**. It is the attendance recording component being developed first. Other LMS modules (assignments, grades, etc.) to follow.
