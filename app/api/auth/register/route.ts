import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/handler";
import { rateLimit, createSession, ipKey, passwordHash } from "@/lib/auth";
import { readConfig, sessionCookieName } from "@/lib/config";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest) {
  try {
    const pool = ensureDb();
    const config = readConfig();

    await rateLimit(pool, `register-ip:${ipKey(config, request)}`, 10);

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request." },
        { status: 400 },
      );
    }

    const password = body?.password;
    const name = body?.name;
    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 80 ||
      typeof password !== "string" ||
      password.length < 12 ||
      Buffer.byteLength(password) > 256
    ) {
      return NextResponse.json(
        {
          error:
            "Use a valid email, a name (1–80 characters), and a password of at least 12 characters (maximum 256 bytes).",
        },
        { status: 400 },
      );
    }

    const userId = randomUUID();
    const userName = name.trim();
    const encoded = await passwordHash(password);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)",
        [userId, userName, email, encoded],
      );
      await client.query(
        "INSERT INTO projects(id,user_id,name) VALUES($1,$2,$3)",
        [randomUUID(), userId, "My first project"],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      if ((error as any).code === "23505") {
        return NextResponse.json(
          { error: "Unable to create account with these details. Try signing in." },
          { status: 409 },
        );
      }
      throw error;
    } finally {
      client.release();
    }

    const user = { id: userId, name: userName, email };
    const token = await createSession(pool, config, request, user);
    const response = NextResponse.json({ user }, { status: 201 });
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
  } catch (error: any) {
    const status = error.status || 500;
    const message =
      error.code === "ECONNREFUSED"
        ? "Database connection refused. Ensure PostgreSQL is running on the host/port in DATABASE_URL."
        : error.code === "28P01"
          ? "Database authentication failed. Check username and password in DATABASE_URL."
          : error.code === "3D000"
            ? "Database does not exist. Create the database specified in DATABASE_URL."
            : error.code === "42P01"
              ? "Database tables not found. Run `npm run db:migrate` to create tables."
              : error.message || "Registration failed. Check server configuration.";
    return NextResponse.json({ error: message }, { status });
  }
}

export const dynamic = "force-dynamic";
