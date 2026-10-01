import express from "express";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./db.js";
import { readConfig, security } from "./config.js";
import { authRoutes, authenticate } from "./auth.js";
import { projectRoutes } from "./projects.js";
import { proxyHandler } from "./proxy.js";

export function createApp({
  db = createDatabase(),
  config = readConfig(),
  dispatcherFactory,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(security(config));
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/config", (req, res) =>
    res.json({
      configured: Boolean(db),
      hosted: config.production,
      maxTimeout: 45000,
    }),
  );
  app.all("/api/echo", (req, res) =>
    res.json({
      message: "Your API workbench is ready.",
      method: req.method,
      query: req.query,
      body: req.body ?? null,
    }),
  );
  app.use("/api", (req, res, next) =>
    db
      ? next()
      : res.status(503).json({
          error:
            "Database not configured. Set DATABASE_URL and run npm run db:migrate.",
        }),
  );
  if (db) {
    app.use("/api/auth", authRoutes(db, config));
    app.use("/api/projects", authenticate(db, config), projectRoutes(db));
    app.post(
      "/api/request",
      authenticate(db, config),
      proxyHandler(db, config, dispatcherFactory),
    );
  }
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use(express.static(fileURLToPath(new URL("./public", import.meta.url))));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.status === 429) res.set("Retry-After", "900");
    const status =
      error.type === "entity.too.large"
        ? 413
        : error.type === "entity.parse.failed"
          ? 400
          : error.status || 500;
    if (status === 500)
      console.error("Request failed:", error.code || error.name);
    return res.status(status).json({
      error:
        status === 500
          ? "Database or server unavailable. Check configuration and migrations."
          : error.type === "entity.too.large"
            ? "Request exceeds 1 MB limit."
            : error.type === "entity.parse.failed"
              ? "Invalid JSON request."
              : error.message,
    });
  });
  return app;
}
export const app = createApp();
export default app;
