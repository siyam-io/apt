import pg from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set DATABASE_URL before running migrations.");
}

const pool = new pg.Pool({ connectionString });
try {
  const schemaPath = path.join(process.cwd(), "schema.sql");
  const sql = await readFile(schemaPath, "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(71304219)");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Database migration complete.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
