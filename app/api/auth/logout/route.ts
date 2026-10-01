import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { readConfig, sessionCookieName } from "@/lib/config";
import { sessionToken, hash } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const pool = getPool();
  const config = readConfig();
  const token = sessionToken(config, request);

  if (token) {
    if (pool) {
      await pool.query("DELETE FROM sessions WHERE token_hash=$1", [hash(token)]);
    }
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(
    sessionCookieName(config),
    "",
    {
      httpOnly: true,
      secure: config.production,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    },
  );
  return response;
}

export const dynamic = "force-dynamic";
