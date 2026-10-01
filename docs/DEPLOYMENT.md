# Deploy APT

Two deployables: the **Next.js frontend** and the **Express API**. Both need Node.js 24 and the same PostgreSQL database.

```
browser ──► Next.js (Vercel)  ──►  Express API  ──►  PostgreSQL (Neon)
             serves UI + /api/*     /api/request proxies
             relay (API_URL)        outward traffic
```

## 1. Create a database

Create a Neon PostgreSQL project. Copy its **pooled** connection string with TLS enabled. Keep the full connection string private; do not commit it or paste it in source code. Use a separate Neon branch/database for preview deployments if previews should not share production accounts or requests.

## 2. Initialize the schema

```bash
export DATABASE_URL='YOUR_NEON_CONNECTION_STRING'
npm ci
npm run db:migrate
```

Alternatively, run `server/schema.sql` once in Neon's SQL editor. The migration is idempotent and does not delete existing records. The database user needs schema/table creation privileges for this step.

## 3. Deploy the API

Any Node host that runs a long-lived server works, for example:

```bash
npm run build:api    # optional: syntax-check server/
npm run start:api    # binds 0.0.0.0:$PORT
```

Required environment variables:

| Variable       | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| `DATABASE_URL` | Neon pooled PostgreSQL connection string, including TLS options        |
| `APP_URL`      | The API's own exact HTTPS origin, e.g. `https://apt-api.up.railway.app` |
| `NODE_ENV`     | `production`                                                           |

`APP_URL` must be the origin the API is **served from**, not the frontend's origin. The API compares it against its own `Host` header and rejects mismatches with `503`, so a custom domain must be reflected here and the API redeployed.

Deploying the API to Vercel instead is possible, but the repository's root `vercel.json` now declares the `nextjs` framework for the frontend, so the API needs its own Vercel project with the framework preset overridden to Express, no build command, `server/server.js` as the entrypoint and `maxDuration: 60`. A plain Node host avoids that split-config problem.

## 4. Deploy the frontend

Import this repository into Vercel. Next.js is detected from the root `vercel.json`. Add:

| Variable  | Value                                                            |
| --------- | ---------------------------------------------------------------- |
| `API_URL` | The API origin from step 3, with no trailing slash                |

`API_URL` defaults to `http://127.0.0.1:3001`, which is only correct for local development. Vercel supplies `VERCEL` and `VERCEL_URL` itself; they are unused here.

Deploy after adding the variable. `API_URL` is read per request, but redeploy after changing it so new function instances pick it up.

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
