import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const sql = neon(connectionString);

async function migrate() {
  const migrationSql = readFileSync(
    join(process.cwd(), "drizzle/0000_natural_warpath.sql"),
    "utf-8"
  );
  // Fix invalid "sequence name" syntax for PostgreSQL
  const fixedSql = migrationSql.replace(
    /GENERATED ALWAYS AS IDENTITY \(sequence name "[^"]+" INCREMENT BY \d+ MINVALUE \d+ MAXVALUE \d+ START WITH \d+ CACHE \d+\)/g,
    "GENERATED ALWAYS AS IDENTITY"
  );
  const statements = fixedSql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    if (stmt) {
      await sql.query(stmt);
      console.log("✓", stmt.slice(0, 80).replace(/\n/g, " ") + "...");
    }
  }
  console.log("✅ Migration completed");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
