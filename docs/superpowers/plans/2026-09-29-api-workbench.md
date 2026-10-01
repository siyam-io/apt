# API Workbench Implementation Plan

> Execution: use superpowers:executing-plans inline, task by task.

**Goal:** Deliver a working local Postman-style API tester.

**Architecture:** Express serves static browser assets and a bounded HTTP proxy. Browser state stores sanitized saved requests and history. No database dependency.

**Tech Stack:** Node.js ES modules, Express, browser JavaScript, Jest, Supertest, Prettier.

- [x] Create package scripts and tests in `tests/proxy.test.js`. Exercise real HTTP forwarding, query strings, headers, body, invalid schemes, malformed JSON, timeout, redirect and response size rejection. Run `npm test` and confirm missing implementation fails.
- [x] Implement `src/app.js` and `src/server.js`: loopback listener, same-origin checks, JSON input validation, abortable fetch, streamed response limits. Run `npm test` until green.
- [x] Implement `src/public/index.html`, `style.css`, `app.js`: collections/history sidebar, request editor, query/header rows, auth fields, response tabs, save/load/delete, timeout and cancellation. Use DOM textContent for untrusted output.
- [x] Document startup and persistence in `README.md`. Run Prettier, `npm run build`, `npm run lint`, `npm test`; launch local server and verify browser workflow when browser tooling is available.
