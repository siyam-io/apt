import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/handler";
import { rateLimit, authenticate, createSession, ipKey, passwordHash, matches, hash } from "@/lib/auth";
import { readConfig, sessionCookieName } from "@/lib/config";

export async function POST(request: NextRequest) {
  const pool = ensureDb();
  const config = readConfig();

  const email =
    typeof (await request.json().catch(() => ({}))).email === "string"
      ? (await request.json()).email.trim().toLowerCase().slice(0, 254)
      : "";

  // Re-read body once; JSON body can only be consumed once.
  let parsed: Record<string, unknown> = {};
  try {
    parsed = await request.json();
  } catch {
    parsed = {};
  }

  const emailFinal =
    typeof parsed.email === "string"
      ? parsed.email.trim().toLowerCase().slice(0, 254)
      : "";
  const password = parsed.password;

  await rateLimit(pool, `login-ip:${ipKey(config, request)}`, 50);
  await rateLimit(pool, `login-email:${emailFinal}`, 10);

  if (typeof password !== "string" || Buffer.byteLength(password) > 256) {
    return NextResponse.json(
      { error: "Invalid login details." },
      { status: 400 },
    );
  }

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [emailFinal],
  );

  const user = result.rows[0];
  const valid = await matches(
    password,
    user?.password_hash || `0`.repeat(32) + ":" + `0`.repeat(128),
  );

  if (!user || !valid) {
    return NextResponse.json(
      { error: "Email or password is incorrect." },
      { status: 401 },
    );
  }

  const userInfo = { id: user.id, name: user.name, email: user.email };
  const token = await createSession(pool, config, request, userInfo);
  const response = NextResponse.json({ user: userInfo });
  response.cookies.set(
    sessionCookieName(config),
    token,
    {
      httpOnly: true,
      secure: config.production,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  );
  return response;
}

export const dynamic = "force-dynamic";
