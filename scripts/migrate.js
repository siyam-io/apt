import { createDatabase, migrate } from "../server/db.js";
const db = createDatabase();
if (!db) throw new Error("Set DATABASE_URL before running migrations.");
try {
  await migrate(db);
  console.log("Database migration complete.");
} finally {
  await db.end();
}
