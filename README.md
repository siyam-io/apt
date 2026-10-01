# APT — API Workbench

A Postman-style web app with private accounts, project-based named requests and PostgreSQL persistence. The entire stack (frontend UI, auth, project/request management, and proxy execution) is centralized in Next.js (App Router).

## Architecture

| Layer    | Location                      | Stack                                                    |
| -------- | ----------------------------- | -------------------------------------------------------- |
| Frontend | `app/`, `components/`, `lib/` | Next.js (App Router), React, TypeScript, Tailwind CSS v4 |
| API      | `app/api/`                    | Next.js Route Handlers, `pg`, `undici` (Node.js runtime)  |
| Database | `server/schema.sql`           | PostgreSQL                                               |

All API endpoints are native Next.js route handlers (`app/api/*`), unified in a single process. Security headers, CSP, and same-origin protections are enforced globally via `middleware.ts`.

## Design system

The interface implements a cyberpunk / glitch design system. Every color, glow, shadow, font and animation resolves to a token in the `@theme` block of `app/globals.css`; components never hard-code a value.

- **Geometry** — `clip-path` chamfers (`chamfer`, `chamfer-sm`, `chamfer-xs`) instead of border radii. Because `clip-path` clips `box-shadow` and outlines, chamfered surfaces are built as decorative layers inside an **unclipped host**: focus rings, `drop-shadow` glow (`glow-accent*`) and hover transforms live on the host.
- **Texture** — CRT scanlines on `body::after`, a masked circuit grid on `body::before`, and a `tech-grid` utility for section backgrounds.
- **Typography** — Orbitron (display), JetBrains Mono (body/UI), Share Tech Mono (labels), self-hosted via `next/font`.
- **Motion** — `blink`, `glitch`, `rgbShift`, `flicker`, `scanline`, `hue`, all disabled under `prefers-reduced-motion` while static chromatic aberration is preserved.
- **Primitives** — `components/ui/` holds `Button` (default, secondary, outline, ghost, glitch, destructive), `Card` (default, terminal, holographic), `Chamfer`, `Input`/`Textarea`/`Select`/`Checkbox`, `Field`, `GlitchText`, `Dialog` and `Notice`.

## Features

- Email/password registration, login and logout; hashed passwords and database sessions.
- Create, rename, switch and delete private projects.
- Name, save, update and delete requests within each project. Renaming updates the same request ID.
- GET, POST, PUT, PATCH, DELETE, HEAD and OPTIONS; parameters, headers, raw/JSON bodies, bearer tokens and API key headers.
- Response body/headers, formatting, copy, status, timing, size, cancellation and per-project history.
- Explicit import of legacy browser-saved requests; originals remain local and imported bodies are omitted.
- Keyboard shortcuts: `Ctrl`/`⌘` + `Enter` to send, `Alt` + `N` for a new request.

## Local startup

Requires Node.js 24 and PostgreSQL (a Neon connection also works locally). Everything runs as a single unified Next.js process:

```bash
npm ci
export DATABASE_URL='YOUR_POSTGRESQL_CONNECTION_STRING'
npm run db:migrate
npm run dev       # Next.js UI & centralized API on http://localhost:3000
```

Open http://localhost:3000 and create an account. There are no default credentials. Without `DATABASE_URL`, the API reports `configured: false` and the UI shows setup instructions instead of the form.

Local mode allows local development API targets. Production mode requires `APP_URL`, secure cookies and public API targets. All account/project/request data lives in PostgreSQL, not browser storage.

## Verification

```bash
export TEST_DATABASE_URL='YOUR_DISPOSABLE_POSTGRESQL_CONNECTION_STRING'
npm run typecheck   # TypeScript for the Next.js app
npm test            # Express integration tests (Jest + supertest)
npm run build       # Next.js production build
npm run build:api   # syntax-checks server/ and copies legacy assets
npm run lint        # Prettier (npm run format to apply)
```

Integration tests create and drop uniquely named schemas in the specified test database; use a disposable database with schema-creation privileges. They cover real PostgreSQL persistence, login/session lifecycle, ownership isolation, project and request mutations, proxy forwarding, timeouts, limits, HTTPS cookies and hosted private-network rejection. Typecheck and lint cover the TypeScript frontend only; Jest covers the Express API, which is still JavaScript.

Deployment itself requires your Vercel project and database environment variables; local passing tests do not verify a live cloud deployment.

## Storage and scope

Passwords use salted scrypt; session tokens are random, HttpOnly and stored only as hashes server-side. Known credential headers/query parameters are excluded from saved requests, and the client strips them again before sending. History bodies are omitted. Explicitly saved bodies may contain sensitive values; review the confirmation before saving. Credentials in custom field names and URL paths cannot always be recognized.

Limits: 1 MB request envelope, 2 MB decoded response, 4 MB encoded response, timeout up to 45 seconds; 500 saved requests and 50 history items per project. Redirects are returned without following them. Text/JSON responses use UTF-8. Password recovery email, account verification, team sharing, binary downloads and multipart uploads are outside this version.

## Legacy frontend

`server/public/` holds the original vanilla HTML/CSS/JS interface. The Next.js app replaces it; the directory is retained for reference and the API still serves it on its own port, but nothing in the Next.js app depends on it.
