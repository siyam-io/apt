import { NextRequest, NextResponse } from "next/server";
import { ensureDb, requireAuth, json, errorResponse } from "@/lib/handler";
import { cleanRequest, serialize } from "@/lib/projects";
import { randomUUID } from "node:crypto";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { projectId } = await context.params;
  if (!uuidRegex.test(projectId)) {
    return errorResponse(404, "Project not found.");
  }

  const pool = ensureDb();
  // Ensure user owns project
  const project = await pool.query(
    "SELECT id FROM projects WHERE id=$1 AND user_id=$2",
    [projectId, auth.user!.id],
  );
  if (!project.rows.length) {
    return errorResponse(404, "Project not found.");
  }

  const result = await pool.query(
    "SELECT * FROM requests WHERE project_id=$1 AND kind='history' ORDER BY updated_at DESC,id LIMIT 500",
    [projectId],
  );

  return json({ requests: result.rows.map(serialize) });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { projectId } = await context.params;
  if (!uuidRegex.test(projectId)) {
    return errorResponse(404, "Project not found.");
  }

  const pool = ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON request.");
  }

  let cleaned: ReturnType<typeof cleanRequest>;
  try {
    cleaned = cleanRequest(body, true);
  } catch (err: any) {
    return errorResponse(err.status || 400, err.message);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const project = await client.query(
      "SELECT id FROM projects WHERE id=$1 AND user_id=$2 FOR UPDATE",
      [projectId, auth.user!.id],
    );
    if (!project.rows.length) {
      await client.query("ROLLBACK");
      return errorResponse(404, "Project not found.");
    }

    const id = randomUUID();
    const insertResult = await client.query(
      "INSERT INTO requests(id,project_id,kind,name,data) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [id, projectId, "history", cleaned.name, JSON.stringify(cleaned.data)],
    );

    // Prune history to keep only newest 50
    await client.query(
      "DELETE FROM requests WHERE project_id=$1 AND kind='history' AND id IN (SELECT id FROM requests WHERE project_id=$1 AND kind='history' ORDER BY updated_at DESC,id OFFSET 50)",
      [projectId],
    );

    await client.query("COMMIT");
    return json({ request: serialize(insertResult.rows[0]) }, 201);
  } catch (error: any) {
    await client.query("ROLLBACK");
    return errorResponse(error.status || 500, error.message || "Failed to record history.");
  } finally {
    client.release();
  }
}
