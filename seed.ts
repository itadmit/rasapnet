import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./src/db/schema";
import {
  users,
  departments,
  soldiers,
  dutyTypes,
} from "./src/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle({ client: sql, schema });

console.log("🌱 Seeding database...");

async function seed() {
  // ─── Admin user ─────────────────────────────────────────────────
  await db.insert(users).values({
    name: 'רס"פ ראשי',
    phone: "0501234567",
    role: "admin",
  }).onConflictDoNothing({ target: users.phone });

  // ─── Shlishut user ──────────────────────────────────────────────
  await db.insert(users).values({
    name: "שלישות",
    phone: "0509999999",
    role: "shlishut",
  }).onConflictDoNothing({ target: users.phone });

  // ─── Departments ────────────────────────────────────────────────
  await db.insert(departments).values([
    { name: "מחלקה א" },
    { name: "מחלקה ב" },
    { name: "מחלקה ג" },
  ]).onConflictDoNothing({ target: departments.name });

  // ─── Soldiers ───────────────────────────────────────────────────
  const deptRows = await db.select().from(departments);
  const deptA = deptRows.find((d) => d.name === "מחלקה א");
  const deptB = deptRows.find((d) => d.name === "מחלקה ב");
  const deptC = deptRows.find((d) => d.name === "מחלקה ג");

  if (deptA && deptB && deptC) {
    const soldiersData = [
      { name: "יוסי כהן", phone: "972501111111", deptId: deptA.id },
      { name: "דני לוי", phone: "972501111112", deptId: deptA.id },
      { name: "אבי מזרחי", phone: "972501111113", deptId: deptA.id },
      { name: "רון אברהם", phone: "972501111114", deptId: deptB.id },
      { name: "עומר דוד", phone: "972501111115", deptId: deptB.id },
      { name: "תומר שלום", phone: "972501111116", deptId: deptB.id },
      { name: "אורי בן-דוד", phone: "972501111117", deptId: deptC.id },
      { name: "גל פרץ", phone: "972501111118", deptId: deptC.id },
      { name: "נועם ישראלי", phone: "972501111119", deptId: deptC.id },
    ];

    for (const s of soldiersData) {
      await db.insert(soldiers).values({
        fullName: s.name,
        phoneE164: s.phone,
        departmentId: s.deptId,
        status: "active",
      });
    }
  }

  // ─── Duty Types ─────────────────────────────────────────────────
  await db.insert(dutyTypes).values([
    { name: "מטבח בוקר", category: "מטבח", weightPoints: 2, defaultRequiredPeople: 2, defaultFrequency: "daily", isActive: true },
    { name: "מטבח צהריים", category: "מטבח", weightPoints: 2, defaultRequiredPeople: 2, defaultFrequency: "daily", isActive: true },
    { name: "מטבח ערב", category: "מטבח", weightPoints: 3, defaultRequiredPeople: 2, defaultFrequency: "daily", isActive: true },
    { name: "שירותים", category: "שירותים", weightPoints: 2, defaultRequiredPeople: 1, defaultFrequency: "daily", isActive: true },
    { name: "ניקיון יחידה", category: "ניקיון", weightPoints: 4, defaultRequiredPeople: 3, defaultFrequency: "weekly", isActive: true },
    { name: "שמירה לילה", category: "שמירות", weightPoints: 5, defaultRequiredPeople: 2, defaultFrequency: "daily", isActive: true },
    { name: "שמירה יום", category: "שמירות", weightPoints: 3, defaultRequiredPeople: 1, defaultFrequency: "daily", isActive: true },
    { name: "תורנות שבת", category: "אחר", weightPoints: 6, defaultRequiredPeople: 2, defaultFrequency: "weekly", isActive: true },
  ]);

  console.log("✅ Seed completed successfully!");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
