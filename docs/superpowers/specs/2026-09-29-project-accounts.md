# Project accounts and Vercel support

User-approved scope: email/password accounts, named editable requests grouped by private projects, PostgreSQL persistence compatible with Neon, and Vercel deployment configuration.

Keep Express and browser JavaScript. Store users, opaque hashed sessions, projects, requests and per-project history in PostgreSQL. Enforce ownership in every database query. Use scrypt password hashing, HttpOnly SameSite cookies, origin checks and database rate limits. Registration creates a default project. Request names are mandatory; updates use IDs rather than names. Secrets in recognized headers/query fields are removed on the server. History omits request bodies. Offer an explicit import of old browser data into the selected project.

Production requires DATABASE_URL and APP_URL; there is no ephemeral production fallback. Use explicit idempotent database migration. Build copies source assets into public for Vercel CDN delivery. Public proxy calls require authentication, limit request/response sizes and duration, reject private/reserved DNS answers and pin validated addresses during connection. Local execution can access local development APIs. Vercel cannot reach the user's machine's localhost.

No social login, password recovery email, account verification or collaboration is included. No deployment is requested; prepare and verify code, document required hosted configuration, and report live deployment as unverified unless subsequently authorized and performed.
