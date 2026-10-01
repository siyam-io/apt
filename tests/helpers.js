import { randomUUID } from "node:crypto";
import pg from "pg";
import { migrate } from "../server/db.js";
import { createApp } from "../server/app.js";

export async function fixture(overrides = {}) {
  if (!process.env.TEST_DATABASE_URL)
    throw new Error(
      "Set TEST_DATABASE_URL to a disposable PostgreSQL database before running integration tests.",
    );
  const schema = `test_${randomUUID().replaceAll("-", "")}`;
  const admin = new pg.Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const db = new pg.Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    options: `-c search_path=${schema}`,
  });
  await migrate(db);
  const app = createApp({
    db,
    config: { production: false, appUrl: "", allowPrivate: true, ...overrides },
  });
  return {
    app,
    db,
    close: async () => {
      await db.end();
      await admin.query(`DROP SCHEMA ${schema} CASCADE`);
      await admin.end();
    },
  };
}

export async function register(agent, email = "owner@example.test") {
  const result = await agent
    .post("/api/auth/register")
    .set("X-APT-Client", "web")
    .send({ email, password: "test-password-2026", name: "Test owner" });
  if (result.status !== 201)
    throw new Error(
      `Registration failed: ${result.status} ${JSON.stringify(result.body)}`,
    );
  return result.body;
}

export function mutation(agent, method, url, body) {
  return agent[method](url).set("X-APT-Client", "web").send(body);
}
