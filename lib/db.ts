import pg from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";

let pool: pg.Pool | null = null;

export function createDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) return null;
  pool = new pg.Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });
  pool.on("error", () => console.error("Idle database connection failed."));
  return pool;
}

export function getPool(): pg.Pool | null {
  return pool;
}

export async function migrate(db: pg.Pool) {
  const schemaPath = path.join(process.cwd(), "server", "schema.sql");
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
