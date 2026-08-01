// Local-only migration runner. Reads DATABASE_URL from .env.local and applies
// every .sql file in supabase/migrations in filename order.
// Usage: node scripts/migrate.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL missing from .env.local");
  process.exit(1);
}

const dir = join(__dirname, "..", "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const run = async () => {
  await client.connect();
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf8");
    process.stdout.write(`Applying ${f} ... `);
    await client.query(sql);
    console.log("ok");
  }
  await client.end();
  console.log("All migrations applied.");
};

run().catch((e) => {
  console.error("\nMigration failed:", e.message);
  process.exit(1);
});
