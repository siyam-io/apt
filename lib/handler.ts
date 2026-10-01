import { NextRequest, NextResponse } from "next/server";
import type { Pool } from "pg";
import { getPool } from "./db";
import { readConfig, sessionCookieName } from "./config";
import { authenticate, type RequestContext, type AuthError } from "./auth";

const config = readConfig();

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

export function ensureDb(): Pool {
  const pool = getPool();
  if (!pool) {
    throw new HttpError(
      503,
      "Database not configured. Set DATABASE_URL and run npm run db:migrate.",
    );
  }
  return pool;
}

export async function requireAuth(
  request: NextRequest,
): Promise<RequestContext | NextResponse> {
  let pool: Pool;
  try {
    pool = ensureDb();
  } catch (err: any) {
    return errorResponse(err.status || 503, err.message);
  }
  const result = await authenticate(pool, config, request);
  if ("status" in result) {
    return errorResponse(result.status, result.message);
  }
  return result as RequestContext;
}

export function sessionCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: config.production,
    sameSite: "lax",
    path: "/",
    ...(maxAge != null ? { maxAge } : {}),
  } as const;
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  maxAge?: number,
) {
  response.cookies.set(sessionCookieName(config), token, sessionCookieOptions(maxAge));
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(
    sessionCookieName(config),
    "",
    { ...sessionCookieOptions(), maxAge: 0, expires: new Date(0) },
  );
  return response;
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
