# ⚡ APT — Minimalist Postman Alternative & API Workbench

> A razor-sharp, zero-bloat API testing workbench built with Next.js App Router, Tailwind CSS, PostgreSQL, and Undici. Designed with high-contrast cyberpunk HUD aesthetics, instant guest testing (no account required), and Postman-style URL variable interpolation.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.7-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-00ff88?style=for-the-badge)](LICENSE)

---


live link - [https://apt-eight-gold.vercel.app]

## 🌟 Why APT?

Modern API clients often take 10–20 seconds to launch, consume hundreds of megabytes of RAM, and lock fundamental developer testing behind mandatory cloud sign-ins.

**APT fixes that:**
1. **Guest-Ready (No Forced Login)**: Hit endpoints immediately without signing in or registering. Your drafts and history persist locally in `localStorage`.
2. **Postman-Style Variables**: Use `{baseUrl}` or `{{baseUrl}}` in URLs, headers, parameters, and request bodies with live resolution.
3. **Dedicated Multi-Page Experience**: Includes a rich Home page with an embedded **Interactive Quick Tester**, Architecture Features page, Interactive Documentation, and an About manifesto.
4. **Centralized Next.js Engine**: All frontend UI, backend route handlers (`app/api/*`), proxy dispatching, and security guards live in a single unified process.
5. **SSRF & Network Shield**: Built-in IP address filtering prevents SSRF vulnerabilities in hosted mode while allowing private development locally.

---

## 🚀 Pages Overview

| Route | Page | Purpose & Highlights |
|---|---|---|
| **`/`** | **Home** | Hero glitch typography, **Interactive Quick Tester** console, APT vs. Postman speed matrix, and core platform metrics. |
| **`/workbench`** | **API Workbench** | Standalone Postman-like workbench with Request Builder, Method selector, Header/Param editor, Response Inspector, and History panel. |
| **`/features`** | **Features** | Deep dive into Zero Latency proxying, SSRF protection engine, Local Drafts & Cloud sync, and keyboard shortcut matrix. |
| **`/docs`** | **Documentation** | Quick start guide, interactive cURL / Undici / Node.js code snippets, and full REST API specification. |
| **`/about`** | **About** | Anti-Bloat Manifesto, privacy principles, and system stack metrics. |

---

## 🧩 Key Features

- **Guest Mode & Cloud Sync**: Test APIs anonymously with `localStorage` persistence, or create a private account to sync named projects in PostgreSQL.
- **Environment & URL Variables**: Define custom variables (`baseUrl`, `token`, `apiUrl`) in the workbench. Type `{baseUrl}/api/echo` or `{{baseUrl}}/api/echo` with live URL preview.
- **HTTP Methods**: Full support for `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, and `OPTIONS`.
- **Headers & Parameters**: Key-value row editors with active checkboxes and automatic URL query construction.
- **Authorization**: Supports Bearer tokens and custom API Key headers (`X-API-Key`).
- **Response Inspector**: View response status, latency (ms), payload size, formatted JSON/text, and response headers with 1-click copy.
- **Cyberpunk HUD Design System**: Chamfered geometries, CRT scanlines, circuit matrix background, and glowing accent states.

---

## 📐 Architecture

```
apt/
├── app/
│   ├── layout.tsx            # Global Root Layout (Fonts, Metadata)
│   ├── page.tsx              # Home Page with Live Quick Tester
│   ├── workbench/page.tsx    # Standalone API Workbench
│   ├── features/page.tsx     # Technical Features Page
│   ├── docs/page.tsx         # Interactive Documentation Page
│   ├── about/page.tsx        # Manifesto & About Page
│   └── api/                  # Unified Next.js Route Handlers
│       ├── auth/             # Login, Register, Logout, Me
│       ├── request/          # Proxied HTTP execution with Undici
│       ├── projects/         # Project & Saved Request CRUD
│       ├── echo/             # Built-in test reflection endpoint
│       └── config/           # Server configuration & status
├── components/
│   ├── home/                 # QuickTester interactive console
│   ├── layout/               # Cyberpunk Navbar & Footer
│   ├── workspace/            # Sidebar, RequestEditor, ResponsePanel, VariablesEditor
│   └── ui/                   # Chamfered buttons, cards, inputs, dialogs
├── lib/
│   ├── workspace.tsx         # React Context for workbench state & guest storage
│   ├── network.ts            # Undici public dispatcher & SSRF guard
│   ├── auth.ts               # scrypt password hashing & cookie sessions
│   ├── db.ts                 # PostgreSQL connection pool with cloud SSL support
│   └── types.ts              # Data contracts & variable interpolation utilities
└── schema.sql                # PostgreSQL relational database schema
```

---

## ☁️ Deploying to Vercel

APT is optimized for zero-configuration deployment to **Vercel**.

### Step 1: Push your code to GitHub
Ensure all code is committed to your repository:
```bash
git push origin master
```

### Step 2: Set up a PostgreSQL Database
You can use any cloud PostgreSQL database provider:
- **Neon** (Recommended - Free serverless PostgreSQL)
- **Supabase**
- **Vercel Postgres**
- **Railway** / **Render** / **Aiven**

Run the database schema once on your database:
```bash
# Connect with psql or your cloud database query editor:
psql "YOUR_POSTGRESQL_CONNECTION_STRING" -f schema.sql
```
*(Or run `npm run db:migrate` locally with your cloud `DATABASE_URL`)*.

### Step 3: Import Project to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **Add New Project** and select your `apt` repository.
3. Configure Environment Variables:

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | Cloud PostgreSQL connection string | `postgresql://user:pass@ep-cool-db.neon.tech/neondb?sslmode=require` |
| `APP_URL` | **Yes** | Your live production domain | `https://your-apt-app.vercel.app` |
| `NODE_ENV` | Optional | Environment mode | `production` |

4. Click **Deploy**. Vercel will build and launch your application in under 60 seconds!

---

## 💻 Local Development

### Prerequisites
- **Node.js**: v20+ (v24 recommended)
- **PostgreSQL**: Local service or remote cloud connection

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/siyam-io/apt.git
   cd apt
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apt
   NODE_ENV=development
   ```

4. **Initialize Database**:
   ```bash
   npm run db:migrate
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl` / `⌘` + `Enter` | Send current API request |
| `Alt` + `N` | Open a new blank request draft |
| `Tab` | Seamless keyboard navigation between input controls |

---

## 🔒 Security & Privacy

- **No Corporate Telemetry**: Zero tracking scripts, zero third-party analytics.
- **Passkeys & Passwords**: Passwords hashed using Node's cryptographic `scrypt` with unique per-user salts.
- **HTTP-Only Cookies**: Secure session cookies protected with `SameSite=Lax` and cryptographic CSRF headers (`X-APT-Client: web`).
- **SSRF Defense**: Network resolver dynamically validates target IP addresses against private and loopback subnets before proxying outbound traffic.

---

## 📜 License

MIT © [siyam-io](https://github.com/siyam-io)
