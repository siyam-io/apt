# Deploy APT

A single unified deployable: the **Next.js application** (Frontend + API Routes). Needs Node.js 24 and a PostgreSQL database.

```
browser ──► Next.js (Vercel)  ──►  PostgreSQL (Neon)
              serves UI & API
              /api/*
```

## 1. Create a database

Create a Neon PostgreSQL project. Copy its **pooled** connection string with TLS enabled. Keep the full connection string private; do not commit it or paste it in source code.

## 2. Initialize the schema

```bash
export DATABASE_URL='YOUR_NEON_CONNECTION_STRING'
npm ci
npm run db:migrate
```

Alternatively, run `schema.sql` once in Neon's SQL editor. The migration is idempotent and does not delete existing records.

## 3. Deploy to Vercel

Import this repository into Vercel. Next.js is automatically detected. Add the environment variables:

| Variable       | Value                                                   |
| -------------- | ------------------------------------------------------- |
| `DATABASE_URL` | Neon pooled PostgreSQL connection string with TLS       |
| `APP_URL`      | Your Vercel canonical HTTPS origin (e.g. `https://your-domain.vercel.app`) |
| `NODE_ENV`     | `production`                                            |

Deploy. Next.js serves both the UI and all `/api/*` endpoints natively.

## 5. Check the deployment

1. The login screen loads and the badge reads "cloud workspace".
2. Register an account and create two projects.
3. Save a named request in one project; verify it does not appear in the other.
4. Sign out and back in; verify saved requests return.
5. Send a public HTTP(S) API request; verify status/body and history.
6. Verify localhost/private IP targets return a clear rejection.
7. Verify `/api/config` returns `{"configured":true,"hosted":true,...}`.

Missing migrations or an unreachable database produce a safe server error, not a usable workspace. A 502 with "API server unreachable" means `API_URL` is wrong or the API is down.

## Deployment behavior and limits

- The browser only talks to the Next.js origin. `app/api/[...path]/route.ts` relays `/api/*` to `API_URL`, strips the browser `origin` header and forwards cookies and `Set-Cookie` verbatim, with `cache-control: no-store`.
- Sessions: cookies are HttpOnly, Secure, host-only and SameSite=Lax, with a seven-day session stored as a token hash in PostgreSQL. Logout revokes the session. Because the relay is same-origin to the browser, `SameSite=Lax` still applies normally.
- Hosted proxy requires login. Mutation requests require the `X-APT-Client: web` header, which the relay always sets; cross-origin browser requests to the API are rejected because their `origin` is never forwarded.
- Production DNS results are checked for public addresses and pinned to the outgoing connection. Private, loopback, link-local, multicast and reserved targets are rejected. Redirects are not followed.
- A hosted API cannot reach an API running on your laptop's `localhost`. Run APT locally to test local/private APIs.
- Limits: 1 MB inbound proxy envelope, 2 MB decoded upstream response, 4 MB serialized response, 45-second request timeout (30 seconds default), and a 60-second function budget. These keep ordinary responses below Vercel's 4.5 MB function payload cap. DNS resolution time is included in the timeout.
- Each user can create up to 100 projects; each project holds up to 500 saved requests and the latest 50 history entries. A saved request is limited to 256 KB. Proxy rate limit: 60 requests per minute per user; login/registration have database-backed throttles.
- Saved known credential headers and query fields are removed on the server, and the client strips them again before saving. History omits bodies. Explicitly saved request bodies can contain sensitive data; the UI asks before storing them.
- No password reset email, email verification, social login, team sharing, binary download or multipart upload is included in this version.
- Remove expired sessions and old `rate_limits` rows periodically for long-lived deployments. Do not delete active session rows unless revocation is intended.

## Troubleshooting

- **Database not configured:** Add `DATABASE_URL` to the API, run the migration, redeploy.
- **API server unreachable (502):** The frontend's `API_URL` is unset or wrong, or the API is down.
- **Configure APP_URL (503):** The API's `APP_URL` does not match the host it was reached on. Set it to the API's own HTTPS origin.
- **Cannot reach server:** The frontend deployed but the API host is unreachable from it.
- **Too many attempts:** Wait for the rate-limit window. Do not add an in-memory fallback; it would not enforce limits across function instances.
- **Missing styles or scripts:** Use the default Next.js framework detection. Do not override the output directory.
