import { NextRequest, NextResponse } from "next/server";
import { ensureDb, json, errorResponse } from "@/lib/handler";
import { requireAuth } from "@/lib/handler";
import { nameOf } from "@/lib/projects";
import { randomUUID } from "node:crypto";

export async function GET(request: NextRequest) {
  const ctx = await requireAuth(request);
  if (ctx instanceof Response) return ctx;
  const pool = ensureDb();

  const result = await pool.query(
    "SELECT id,name,created_at FROM projects WHERE user_id=$1 ORDER BY created_at,id",
    [ctx.user!.id],
  );

  return json({ projects: result.rows });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAuth(request);
  if (ctx instanceof Response) return ctx;
  const pool = ensureDb();

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid JSON request.");
  }

  let name: string;
  try {
    name = nameOf(body?.name);
  } catch (err) {
    return errorResponse(400, (err as any).message);
  }

  const count = await pool.query(
    "SELECT count(*)::int AS count FROM projects WHERE user_id=$1",
    [ctx.user!.id],
  );

  if (count.rows[0].count >= 100) {
    return errorResponse(400, "Project limit reached (100).");
  }

  const result = await pool.query(
    "INSERT INTO projects(id,user_id,name) VALUES($1,$2,$3) RETURNING id,name",
    [randomUUID(), ctx.user!.id, name],
  );

  return json({ project: result.rows[0] }, 201);
}

export const dynamic = "force-dynamic";
