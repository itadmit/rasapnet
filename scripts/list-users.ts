import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const sql = neon(connectionString);

async function listUsers() {
  const rows = await sql.query(
    "SELECT id, name, phone, role, created_at FROM users ORDER BY id"
  );
  console.log("\n=== משתמשים במערכת ===\n");
  if (Array.isArray(rows) && rows.length > 0) {
    (rows as { id: number; name: string; phone: string; role: string; created_at: string }[]).forEach((r) => {
      console.log(`  ${r.id}. ${r.name}`);
      console.log(`     טלפון: ${r.phone}`);
      console.log(`     תפקיד: ${r.role}`);
      console.log(`     נוצר: ${r.created_at}`);
      console.log("");
    });
  } else {
    console.log("  אין משתמשים.");
  }
}

listUsers().catch((e) => {
  console.error(e);
  process.exit(1);
});
