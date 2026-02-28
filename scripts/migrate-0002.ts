import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const sql = neon(connectionString);

async function run() {
  const content = readFileSync(
    join(process.cwd(), "drizzle/0002_exclude_commanders.sql"),
    "utf-8"
  );
  let statements = content
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  if (statements.length === 0) {
    statements = [content.trim()];
  }
  for (const stmt of statements) {
    try {
      await sql.query(stmt);
      console.log("✓", stmt.slice(0, 70).replace(/\n/g, " ") + "...");
    } catch (e) {
      if (String(e).includes("already exists")) {
        console.log("⊘ skipped (already exists)");
      } else {
        throw e;
      }
    }
  }
  console.log("✅ Migration 0002 completed");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
