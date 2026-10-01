import { Router } from "express";
import { randomUUID } from "node:crypto";

const secret = /authorization|cookie|token|secret|password|api[-_]?key/i;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid = (message) => Object.assign(new Error(message), { status: 400 });
function nameOf(value) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100)
    throw invalid("Name must contain 1–100 characters.");
  return value.trim();
}
function cleanRequest(input, history = false) {
  const name = nameOf(input?.name);
  let url;
  try {
    url = new URL(input.url);
  } catch {
    throw invalid("Enter a valid HTTP(S) URL.");
  }
  if (!["http:", "https:"].includes(url.protocol))
    throw invalid("Only HTTP(S) URLs are supported.");
  url.username = "";
  url.password = "";
  [...url.searchParams.keys()]
    .filter((key) => secret.test(key))
    .forEach((key) => url.searchParams.delete(key));
  const method = input.method || "GET";
  if (
    !["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(
      method,
    )
  )
    throw invalid("Invalid method.");
  const cleanRows = (rows) => {
    if (!Array.isArray(rows) || rows.length > 100)
      throw invalid("Use at most 100 headers or parameters.");
    return rows
      .map((row) => {
        if (
          !row ||
          typeof row.key !== "string" ||
          typeof row.value !== "string" ||
          row.key.length > 256 ||
          row.value.length > 8192
        )
          throw invalid("Invalid header or parameter.");
        return {
          key: row.key.trim(),
          value: row.value,
          enabled: row.enabled !== false,
        };
      })
      .filter((row) => row.key && !secret.test(row.key));
  };
  const timeout = input.timeout ?? 30000;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 45000)
    throw invalid("Timeout must be 1–45000 ms.");
  if (typeof (input.body ?? "") !== "string")
    throw invalid("Request body must be text.");
  const data = {
    method,
    url: url.href,
    headers: cleanRows(input.headers ?? []),
    params: cleanRows(input.params ?? []),
    body: history ? "" : input.body || "",
    timeout,
  };
  if (Buffer.byteLength(JSON.stringify(data)) > 256 * 1024)
    throw invalid("Saved request exceeds 256 KB.");
  return { name, data };
}
const serialize = (row) => ({
  ...row.data,
  id: row.id,
  name: row.name,
  updatedAt: row.updated_at,
});
export function projectRoutes(db) {
  const router = Router();
  router.get("/", async (req, res) =>
    res.json({
      projects: (
        await db.query(
          "SELECT id,name,created_at FROM projects WHERE user_id=$1 ORDER BY created_at,id",
          [req.user.id],
        )
      ).rows,
    }),
  );
  router.post("/", async (req, res) => {
    const name = nameOf(req.body?.name);
    const count = (
      await db.query(
        "SELECT count(*)::int AS count FROM projects WHERE user_id=$1",
        [req.user.id],
      )
    ).rows[0].count;
    if (count >= 100)
      return res.status(400).json({ error: "Project limit reached (100)." });
    const result = await db.query(
      "INSERT INTO projects(id,user_id,name) VALUES($1,$2,$3) RETURNING id,name",
      [randomUUID(), req.user.id, name],
    );
    return res.status(201).json({ project: result.rows[0] });
  });
  router.use("/:projectId", async (req, res, next) => {
    if (!uuid.test(req.params.projectId))
      return res.status(404).json({ error: "Project not found." });
    const project = (
      await db.query(
        "SELECT id,name FROM projects WHERE id=$1 AND user_id=$2",
        [req.params.projectId, req.user.id],
      )
    ).rows[0];
    if (!project) return res.status(404).json({ error: "Project not found." });
    req.project = project;
    return next();
  });
  router.patch("/:projectId", async (req, res) => {
    const result = await db.query(
      "UPDATE projects SET name=$1 WHERE id=$2 AND user_id=$3 RETURNING id,name",
      [nameOf(req.body?.name), req.project.id, req.user.id],
    );
    return res.json({ project: result.rows[0] });
  });
  router.delete("/:projectId", async (req, res) => {
    await db.query("DELETE FROM projects WHERE id=$1 AND user_id=$2", [
      req.project.id,
      req.user.id,
    ]);
    return res.sendStatus(204);
  });
  for (const [path, kind] of [
    ["requests", "saved"],
    ["history", "history"],
  ]) {
    router.get(`/:projectId/${path}`, async (req, res) => {
      const result = await db.query(
        "SELECT * FROM requests WHERE project_id=$1 AND kind=$2 ORDER BY updated_at DESC,id LIMIT 500",
        [req.project.id, kind],
      );
      return res.json({ requests: result.rows.map(serialize) });
    });
    router.post(`/:projectId/${path}`, async (req, res) => {
      const { name, data } = cleanRequest(req.body, kind === "history");
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT id FROM projects WHERE id=$1 FOR UPDATE", [
          req.project.id,
        ]);
        const count = (
          await client.query(
            "SELECT count(*)::int AS count FROM requests WHERE project_id=$1 AND kind=$2",
            [req.project.id, kind],
          )
        ).rows[0].count;
        if (kind === "saved" && count >= 500)
          throw invalid("Request limit reached (500 per project).");
        const result = await client.query(
          "INSERT INTO requests(id,project_id,kind,name,data) VALUES($1,$2,$3,$4,$5) RETURNING *",
          [randomUUID(), req.project.id, kind, name, JSON.stringify(data)],
        );
        if (kind === "history")
          await client.query(
            "DELETE FROM requests WHERE project_id=$1 AND kind='history' AND id IN (SELECT id FROM requests WHERE project_id=$1 AND kind='history' ORDER BY updated_at DESC,id OFFSET 50)",
            [req.project.id],
          );
        await client.query("COMMIT");
        return res.status(201).json({ request: serialize(result.rows[0]) });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    });
    router.delete(`/:projectId/${path}/:requestId`, async (req, res) => {
      if (!uuid.test(req.params.requestId))
        return res.status(404).json({ error: "Request not found." });
      const result = await db.query(
        "DELETE FROM requests WHERE id=$1 AND project_id=$2 AND kind=$3 RETURNING id",
        [req.params.requestId, req.project.id, kind],
      );
      return result.rows.length
        ? res.sendStatus(204)
        : res.status(404).json({ error: "Request not found." });
    });
  }
  router.put("/:projectId/requests/:requestId", async (req, res) => {
    if (!uuid.test(req.params.requestId))
      return res.status(404).json({ error: "Request not found." });
    const { name, data } = cleanRequest(req.body);
    const result = await db.query(
      "UPDATE requests SET name=$1,data=$2,updated_at=now() WHERE id=$3 AND project_id=$4 AND kind='saved' RETURNING *",
      [name, JSON.stringify(data), req.params.requestId, req.project.id],
    );
    return result.rows.length
      ? res.json({ request: serialize(result.rows[0]) })
      : res.status(404).json({ error: "Request not found." });
  });
  return router;
}
