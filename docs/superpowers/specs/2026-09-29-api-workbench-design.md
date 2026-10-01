# API Workbench

Approved scope: local browser app backed by an Express HTTP proxy. Request editor supports methods, query parameters, headers, bearer/API-key authentication and raw JSON bodies. Response viewer displays text/JSON, headers, HTTP status, duration and byte size. Collections and history persist in localStorage; no database or login is required.

Bind to 127.0.0.1. Accept same-origin JSON proxy requests only. Allow HTTP(S) targets, including local development APIs. Enforce a 30-second default timeout (maximum 120 seconds), a 2 MB request limit and a 5 MB response limit. Cancellation aborts upstream work. Redirect responses remain visible rather than forwarding credentials to another origin.

Use a responsive dark workbench layout, semantic controls, keyboard shortcuts, visible loading/error states and a local echo example. Saved credentials remain only in memory; persist sanitized requests. Warn before exporting request content. Validate forwarding and failure handling with Jest/Supertest against an ephemeral local HTTP server.
