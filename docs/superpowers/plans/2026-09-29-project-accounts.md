# Project Accounts Implementation Plan

**Goal:** Add persistent private projects and login with a Vercel-compatible deployment.

**Architecture:** Modular Express app, pg database pool, SQL migrations, native scrypt session authentication, public-target proxy and browser workspace UI.

- [x] Add failing integration tests against isolated PostgreSQL schemas: registration, login/logout, sessions, ownership, named request update, history and rate limiting. Extend proxy tests for unauthenticated access and private target rejection.
- [x] Implement `src/db.js`, `src/auth.js`, `src/projects.js`, `src/proxy.js`, `src/network.js` and `src/config.js`; assemble in `src/app.js`. Provide `scripts/migrate.js` and `src/schema.sql`.
- [x] Add login/register screen, project selector/create/rename/delete, account/logout UI and database-backed request/history persistence. Preserve editor features and explicitly import old localStorage data.
- [x] Add `vercel.json`, asset-copy build, environment documentation and readiness checks. Run integration tests, syntax checks, formatting and browser workflows. Record production configuration limitations.
