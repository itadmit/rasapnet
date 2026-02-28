import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { users, departments, soldiers } from "../src/db/schema";
import { inArray } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const client = neon(connectionString);
const db = drizzle({ client, schema });

function toE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) return "972" + cleaned.slice(1);
  if (cleaned.startsWith("972")) return cleaned;
  return "972" + cleaned;
}

async function run() {
  console.log("🔄 מתחיל עדכון מסד נתונים...\n");

  // 1. Create departments
  const deptNames = [
    "מחלקת מחשוב",
    "מפקדה מ״פ",
    "מחלקת קשר",
    "מחלקת רכב",
    "מפקדה",
    "שלישות",
    "מחלקת שלישות",
    "מחלקת מטבח",
    "מחלקת חימוש",
    "כללי",
  ];

  for (const name of deptNames) {
    await db.insert(departments).values({ name }).onConflictDoNothing({ target: departments.name });
  }
  console.log("✓ מחלקות נוצרו");

  const allDepts = await db.select().from(departments);
  const getDeptId = (name: string) => allDepts.find((d) => d.name === name)?.id;

  // 2. Delete old users (seed users) and add new ones
  await db.delete(users).where(inArray(users.phone, ["0501234567", "0509999999"]));
  console.log("✓ משתמשים ישנים נמחקו");

  await db.insert(users).values([
    { name: "סהר פנקר", phone: "0506760071", role: "admin" },
    { name: "יוגב אביטן", phone: "0542284283", role: "admin" },
    { name: "ניסים חדד", phone: "0527320191", role: "admin" },
  ]).onConflictDoNothing({ target: users.phone });
  console.log("✓ משתמשים חדשים נוספו (רס״פ + סופר אדמין)");

  // 3. Delete all soldiers
  await db.delete(soldiers);
  console.log("✓ כל החיילים הישנים נמחקו");

  // 4. Soldiers with phones and departments
  const soldiersWithPhone: { name: string; phone: string; dept: string }[] = [
    { name: "יוגב אביטן", phone: "0542284283", dept: "מחלקת מחשוב" },
    { name: "ניסים חדד", phone: "0527320191", dept: "מפקדה מ״פ" },
    { name: "ולרי שניידר", phone: "0548014650", dept: "מחלקת קשר" },
    { name: "ירמי מזרחי", phone: "0505381000", dept: "מחלקת רכב" },
    { name: "מיכל הרשקוביץ", phone: "0546543498", dept: "מפקדה" },
    { name: "נוען מלול", phone: "0528765594", dept: "שלישות" },
    { name: "נועה גריבי", phone: "0543218124", dept: "מחלקת שלישות" },
    { name: "דוד עמיאל", phone: "0506780152", dept: "מחלקת מטבח" },
    { name: "דן קהני", phone: "0526632544", dept: "מחלקת חימוש" },
  ];

  const deptAll = getDeptId("כללי")!;
  for (const s of soldiersWithPhone) {
    const deptId = getDeptId(s.dept) ?? deptAll;
    await db.insert(soldiers).values({
      fullName: s.name,
      phoneE164: toE164(s.phone),
      departmentId: deptId,
      status: "active",
    });
  }
  console.log(`✓ ${soldiersWithPhone.length} חיילים עם טלפונים נוספו`);

  // 5. Soldiers without phones (placeholder phone for DB constraint)
  const soldiersNoPhone = [
    "אלינור פיין", "אמונה גלבוע", "בנימין זר", "גיא גרוסמן", "דוד מזרחי",
    "דוד סלמאן", "דודו ביטון", "יניב דובינסקי", "יצחק רצבי", "יצחק אדרי",
    "ישראל חיון", "לב צצלסון", "לביא נובליל", "לונה בן עמי", "מיכל מזרחי",
    "מעיין סבא", "נויה כהן", "סרגיי שוסטרמן", "עדן חסון", "קרינה בלינזון",
    "רוני גרקרוב", "רוסלן קבסנסקי", "רותם אורן", "רפאל יונתנוב", "שחר אברהם",
    "שי כהן", "שי קצב", "תומר זאדה",
  ];

  for (let i = 0; i < soldiersNoPhone.length; i++) {
    await db.insert(soldiers).values({
      fullName: soldiersNoPhone[i],
      phoneE164: `9725000000${String(i + 1).padStart(2, "0")}`,
      departmentId: deptAll,
      status: "active",
      notes: "ללא טלפון - לשיבוץ בלבד",
    });
  }
  console.log(`✓ ${soldiersNoPhone.length} חיילים ללא טלפון נוספו`);

  console.log("\n✅ העדכון הושלם בהצלחה!");
  console.log("\nמשתמשים להתחברות (הטלפון = הסיסמה):");
  console.log("  • סהר פנקר (רס״פ): 0506760071");
  console.log("  • יוגב אביטן (סופר אדמין): 0542284283");
  console.log("  • ניסים חדד (סופר אדמין): 0527320191");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
