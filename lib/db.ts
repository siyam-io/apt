import pg from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";

declare global {
  // eslint-disable-next-line no-var
  var __apt_pool: pg.Pool | undefined;
}

export function createDatabase(connectionString = process.env.DATABASE_URL): pg.Pool | null {
  if (!connectionString) return null;
  if (!globalThis.__apt_pool) {
    const isRemote =
      !connectionString.includes("localhost") &&
      !connectionString.includes("127.0.0.1") &&
      !connectionString.includes("::1");

    const pool = new pg.Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
      ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    pool.on("error", () => console.error("Idle database connection failed."));
    globalThis.__apt_pool = pool;
  }
  return globalThis.__apt_pool;
}

export function getPool(): pg.Pool | null {
  if (!globalThis.__apt_pool && process.env.DATABASE_URL) {
    return createDatabase(process.env.DATABASE_URL);
  }
  return globalThis.__apt_pool ?? null;
}

export async function migrate(db: pg.Pool) {
  const schemaPath = path.join(process.cwd(), "schema.sql");
  const sql = await readFile(schemaPath, "utf8");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(71304219)");
    await client.query(sql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
