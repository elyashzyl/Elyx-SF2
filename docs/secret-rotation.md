# Production Secret Rotation

The credentials previously shared in chat or deployment logs are compromised. Rotate them before the next production deployment.

## 1. Generate replacement values

Run locally:

```bash
npm run secrets:generate
```

Store the output in a password manager or the deployment platform's secret manager. Do not commit it, paste it into `README.md`, or add it to `.env.example`.

## 2. Rotate the MySQL credential

In the MySQL provider:

1. Create a new application database user, or generate a new password for the existing application user.
2. Grant that user access only to the ElyTrack database.
3. Update the deployment secret with either:
   - `DATABASE_URL=mysql://user:password@host:3306/database`, or
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`.
4. Verify the URL-encoded password is used when `DATABASE_URL` contains reserved URL characters.
5. Keep the old credential active only long enough to verify the new deployment, then revoke it.

Do not run `migrate:fresh` during this process. The startup entrypoint runs only pending migrations and never seeds records.

## 3. Rotate application secrets

If another ElyTrack service or a Laravel-compatible integration consumes `APP_KEY`, replace it with the generated value. The current Express application does not use `APP_KEY` for login or database access, but the exposed value must still be replaced anywhere it is configured.

If cookie sessions, JWTs, or another token mechanism is introduced later, add its secret as a deployment-only variable and rotate it using a documented invalidation procedure.

## 4. Deploy and verify

After updating the deployment secrets:

```bash
npm run db:migrate:status
npm run build
npm test
```

Then check:

```text
GET /api/health
```

The response should contain `status: "ok"` and the expected production database backend. Log in with a known account, verify school data, and confirm that migrations completed without inserting plans, payment methods, schools, or users.

## 5. Revoke old values and review exposure

After verification:

- Revoke the old MySQL password or delete the old database user.
- Replace any old `APP_KEY` in CI/CD, hosting, local operator machines, and password managers.
- Rotate any deployment token or API key that appeared in logs.
- Review database audit/provider logs for unexpected access.
- Confirm `.env`, backups, database files, and generated secret output are not tracked by Git.

Secret rotation cannot be completed by a code change alone because the provider credentials and deployment secret store are outside this repository. Record the rotation date and responsible operator in the deployment change log.
