import { NextRequest, NextResponse } from "next/server";
import { ensureDb, requireAuth, json, errorResponse } from "@/lib/handler";
import { nameOf } from "@/lib/projects";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function PATCH(
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

  let name: string;
  try {
    name = nameOf(body?.name);
  } catch (err: any) {
    return errorResponse(err.status || 400, err.message);
  }

  const result = await pool.query(
    "UPDATE projects SET name=$1 WHERE id=$2 AND user_id=$3 RETURNING id,name",
    [name, projectId, auth.user!.id],
  );

  if (!result.rows.length) {
    return errorResponse(404, "Project not found.");
  }

  return json({ project: result.rows[0] });
}

export async function DELETE(
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
  const result = await pool.query(
    "DELETE FROM projects WHERE id=$1 AND user_id=$2 RETURNING id",
    [projectId, auth.user!.id],
  );

  if (!result.rows.length) {
    return errorResponse(404, "Project not found.");
  }

  return new NextResponse(null, { status: 204 });
}
