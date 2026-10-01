# Local preview and operations

## Normal startup (Neon or PostgreSQL)

Set `DATABASE_URL` in the shell, run `npm run db:migrate`, then `npm run dev`. For production/Vercel also set `APP_URL` to the canonical HTTPS origin. See `docs/DEPLOYMENT.md`.

## Current development preview

During implementation, a separate local PostgreSQL cluster was created at `.local/test-postgres`, listening only on `127.0.0.1:55432`. It does not modify the machine's existing PostgreSQL service. The `apt_dev` database holds the local preview. A synthetic `browser-check@example.test` account was used for UI verification; create your own account for normal use.

This isolated local cluster uses trust authentication for development/testing only. Never expose it publicly or reuse that authentication configuration on Neon/production. `.local` is ignored by Git.

To restart this preview after stopping it:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D 'D:\pg\web_app\apt\.local\test-postgres' -l 'D:\pg\web_app\apt\.local\postgres.log' -o '-h 127.0.0.1 -p 55432' -w start
$env:DATABASE_URL = 'postgresql://apt_test@127.0.0.1:55432/apt_dev'
npm run dev
```

Skip the `pg_ctl start` command if this cluster is already running. To stop only this test cluster, use `pg_ctl -D 'D:\pg\web_app\apt\.local\test-postgres' -m fast -w stop` after stopping the app.

## Tests

```powershell
$env:TEST_DATABASE_URL = 'postgresql://apt_test@127.0.0.1:55432/postgres'
npm test
npm run build
npm run lint
```

Tests isolate data in unique schemas and remove those schemas afterward. The preview database and other PostgreSQL instances are not cleared. Use a separate disposable database when supplying another test URL.

## Hosted status

Code and deployment configuration are prepared. No Neon project was provisioned and no live Vercel deployment was performed. Hosted smoke checks remain necessary after setting real environment variables.
