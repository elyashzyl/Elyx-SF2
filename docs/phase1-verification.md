# Phase 1 Deployment Verification

Schema and health checks are read-only. The optional authenticated smoke check performs a normal login, which creates a session and may update login metadata; it does not create application records, edit school data, delete rows, or seed data. The isolated Prisma integration test inserts and removes uniquely named test rows in a disposable database.

## 1. Backup the target database

Take and verify a backup before running any deployment check against staging or production:

```bash
npm run db:backup
```

Never run `npm run db:migrate:fresh` against production.

## 2. Apply normal migrations

The deployment entrypoint runs the additive migration command automatically. To run it manually:

```bash
npm run db:migrate
npm run db:migrate:status
```

The migration command does not seed accounts, schools, plans, licenses, payment methods, or sample data.

## 3. Verify the schema without changing data

```bash
npm run db:verify-schema
```

This checks the Phase 1 tables, columns, operational indexes, and migration records. It does not create, update, delete, or seed anything.

## 4. Verify the running service

```bash
PHASE1_BASE_URL=https://your-elytrack-domain.example npm run db:verify-phase1
```

Expected output includes:

```text
[phase1] Health check passed (MySQL, ... ms).
```

For an administrator school-isolation check, use an existing account without storing credentials in the repository:

```bash
PHASE1_BASE_URL=https://your-elytrack-domain.example \
PHASE1_SMOKE_USERNAME=existing-admin \
PHASE1_SMOKE_PASSWORD='password-from-secret-manager' \
npm run db:verify-phase1
```

The smoke check calls `/api/health`, `/api/auth/login`, `/api/auth/me`, and `/api/users`. The login creates a session and may update login metadata; the smoke check does not create, edit, delete, or seed application records.

## 5. Run isolated Prisma integration coverage

Use a disposable MySQL database whose name includes `test`, `testing`, `integration`, `sandbox`, or `ci`:

```bash
PRISMA_MYSQL_INTEGRATION=1 \
PRISMA_TEST_DATABASE_URL=mysql://user:password@host:3306/elytrack_testing \
npm test
```

The test creates uniquely named schools and grade levels, verifies active/archived filtering and ordering, then removes only those rows.

The GitHub Actions `mysql-integration` job provisions MySQL 8, applies migrations, runs schema verification, and executes this test automatically.

## 6. Production completion criteria

Phase 1 can be operationally closed only after all of these are confirmed:

- `/api/health` returns `status: "ok"` and `db: "mysql"`.
- `npm run db:verify-schema` passes against the intended database.
- An administrator sees users only from the administrator's school.
- An administrator cannot access another school's school, users, students, or settings.
- An existing production backup has been verified.
- Exposed provider credentials have been rotated, old values revoked, and `SECRETS_ROTATED=1` set.

Provider credentials and production runtime access are external to this repository; the repository cannot mark those checks as completed automatically.
