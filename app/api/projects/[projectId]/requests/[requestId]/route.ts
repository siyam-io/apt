import { NextRequest, NextResponse } from "next/server";
import { ensureDb, requireAuth, json, errorResponse } from "@/lib/handler";
import { cleanRequest, serialize } from "@/lib/projects";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; requestId: string }> },
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { projectId, requestId } = await context.params;
  if (!uuidRegex.test(projectId) || !uuidRegex.test(requestId)) {
    return errorResponse(404, "Request not found.");
  }

  const pool = ensureDb();
  // Ensure user owns project
  const project = await pool.query(
    "SELECT id FROM projects WHERE id=$1 AND user_id=$2",
    [projectId, auth.user!.id],
  );
  if (!project.rows.length) {
    return errorResponse(404, "Request not found.");
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON request.");
  }

  let cleaned: ReturnType<typeof cleanRequest>;
  try {
    cleaned = cleanRequest(body, false);
  } catch (err: any) {
    return errorResponse(err.status || 400, err.message);
  }

  const result = await pool.query(
    "UPDATE requests SET name=$1,data=$2,updated_at=now() WHERE id=$3 AND project_id=$4 AND kind='saved' RETURNING *",
    [cleaned.name, JSON.stringify(cleaned.data), requestId, projectId],
  );

  if (!result.rows.length) {
    return errorResponse(404, "Request not found.");
  }

  return json({ request: serialize(result.rows[0]) });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; requestId: string }> },
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { projectId, requestId } = await context.params;
  if (!uuidRegex.test(projectId) || !uuidRegex.test(requestId)) {
    return errorResponse(404, "Request not found.");
  }

  const pool = ensureDb();
  // Ensure user owns project
  const project = await pool.query(
    "SELECT id FROM projects WHERE id=$1 AND user_id=$2",
    [projectId, auth.user!.id],
  );
  if (!project.rows.length) {
    return errorResponse(404, "Request not found.");
  }

  const result = await pool.query(
    "DELETE FROM requests WHERE id=$1 AND project_id=$2 AND kind='saved' RETURNING id",
    [requestId, projectId],
  );

  if (!result.rows.length) {
    return errorResponse(404, "Request not found.");
  }

  return new NextResponse(null, { status: 204 });
}
