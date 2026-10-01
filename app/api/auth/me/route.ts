import { NextRequest, NextResponse } from "next/server";
import { ensureDb, json } from "@/lib/handler";
import { authenticate } from "@/lib/auth";
import { readConfig } from "@/lib/config";

export async function GET(request: NextRequest) {
  const pool = ensureDb();
  const config = readConfig();
  const result = await authenticate(pool, config, request);

  if ("status" in result) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  return NextResponse.json({ user: result.user });
}

export const dynamic = "force-dynamic";
