import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import type { Pool, QueryResult } from "pg";
import type { NextRequest } from "next/server";
import { readConfig, sessionCookieName, type Config } from "./config";

type UserRow = {
  id: string;
  name: string;
  email: string;
};

export type RequestContext = {
  user?: UserRow;
  projectId?: string;
  project?: { id: string; name: string };
};

const derive = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N?: number; r?: number; p?: number; maxmem?: number },
) => Promise<Buffer>;
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function passwordHash(password: string, salt = randomBytes(16).toString("hex")) {
  const key = await derive(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt}:${key.toString("hex")}`;
}

export async function matches(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  const actual = (await passwordHash(password, salt)).split(":")[1];
  return (
    key.length === actual.length &&
    timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(actual, "hex"))
  );
}

export function sessionToken(config: Config, request: NextRequest): string | undefined {
  const name = sessionCookieName(config);
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  const found = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return found?.split("=")[1];
}

export async function rateLimit(
  db: Pool,
  key: string,
  limit: number,
  seconds = 900,
) {
  const result = await db.query(
    `INSERT INTO rate_limits(key, window_start, count)
    VALUES ($1, floor(extract(epoch from now())/$2)::bigint, 1)
    ON CONFLICT (key) DO UPDATE SET
      count=CASE WHEN rate_limits.window_start=EXCLUDED.window_start THEN rate_limits.count+1 ELSE 1 END,
      window_start=EXCLUDED.window_start RETURNING count`,
    [key, seconds],
  );
  if (result.rows[0].count > limit)
    throw Object.assign(new Error("Too many attempts. Please try again later."), {
      status: 429,
    });
}

export type AuthError = Error & { status: number; user?: never };

export async function authenticate(
  db: Pool,
  config: Config,
  request: NextRequest,
): Promise<RequestContext | AuthError> {
  const token = sessionToken(config, request);
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    return Object.assign(new Error("Please sign in.") as AuthError, { status: 401 });

  const result = await db.query<UserRow>(
    "SELECT u.id, u.name, u.email FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()",
    [hash(token)],
  );

  if (!result.rows.length)
    return Object.assign(
      new Error("Session expired. Please sign in again.") as AuthError,
      { status: 401 },
    );
  return { user: result.rows[0] };
}

export async function createSession(
  db: Pool,
  config: Config,
  request: NextRequest,
  user: UserRow,
): Promise<string> {
  const old = sessionToken(config, request);
  if (old) {
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [hash(old)]);
  }
  await db.query("DELETE FROM sessions WHERE expires_at < now()");
  const token = randomBytes(32).toString("hex");
  await db.query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
    [hash(token), user.id],
  );
  return token;
}

export function ipKey(
  config: Config,
  request: NextRequest,
): string {
  const hostHeader = request.headers.get("host");
  const forwarded = request.headers.get("x-vercel-forwarded-for");

  if (config.production) {
    const raw = forwarded || hostHeader || "";
    const first = raw.split(",")[0]?.trim() || "";
    return hash(first || "unknown");
  }

  // Local: prefer socket remoteAddress when available, else fallback.
  const addr =
    (request as any).ip ||
    hostHeader?.split(":")[0] ||
    "";
  return hash(addr || "local");
}
