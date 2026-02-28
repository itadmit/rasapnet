import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { dutyAssignments, dutyEvents, soldiers } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ImportRow {
  soldierName: string;
  slotStart: string;
  slotEnd: string;
  roleLabel?: string;
}

function parseTimeToMinutes(timeStr: string): number {
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function buildSlotDate(baseDate: Date, timeStr: string, addDay = false): Date {
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  const h = m ? parseInt(m[1], 10) : 0;
  const min = m ? parseInt(m[2], 10) : 0;
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setHours(h, min, 0, 0);
  if (addDay) d.setDate(d.getDate() + 1);
  return d;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const eventId = parseInt(id);
  const body = await request.json();
  const { rows } = body as { rows: ImportRow[] };

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "יש לספק רשימת שיבוצים (rows)" },
      { status: 400 }
    );
  }

  const [event] = await db
    .select()
    .from(dutyEvents)
    .where(eq(dutyEvents.id, eventId));

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const baseDate = new Date(event.startAt);
  baseDate.setHours(0, 0, 0, 0);
  const allSoldiers = await db.select().from(soldiers);

  function findSoldierByName(name: string): (typeof allSoldiers)[0] | null {
    const n = name.trim();
    const exact = allSoldiers.find(
      (s) => s.fullName === n || s.fullName.trim() === n
    );
    if (exact) return exact;
    const contains = allSoldiers.find(
      (s) => s.fullName.includes(n) || n.includes(s.fullName)
    );
    return contains ?? null;
  }

  const errors: string[] = [];
  const inserted: { soldierName: string; slot: string }[] = [];

  for (const row of rows) {
    const soldier = findSoldierByName(row.soldierName);
    if (!soldier) {
      errors.push(`חייל לא נמצא: ${row.soldierName}`);
      continue;
    }

    const startMins = parseTimeToMinutes(row.slotStart);
    const endMins = parseTimeToMinutes(row.slotEnd);
    const startIsEarlyMorning = startMins < 360; // לפני 06:00 = יום הבא
    const endIsEarlyMorning = endMins < 360;
    const crossesMidnight = endMins <= startMins;

    const slotStart = buildSlotDate(baseDate, row.slotStart, startIsEarlyMorning);
    const slotEnd = buildSlotDate(
      baseDate,
      row.slotEnd,
      endIsEarlyMorning || crossesMidnight
    );

    await db.insert(dutyAssignments).values({
      dutyEventId: eventId,
      soldierId: soldier.id,
      slotStartAt: slotStart,
      slotEndAt: slotEnd,
      roleLabel: row.roleLabel?.trim() || null,
    });
    inserted.push({
      soldierName: soldier.fullName,
      slot: `${row.slotStart}-${row.slotEnd}`,
    });
  }

  return NextResponse.json({
    message: `הוזנו ${inserted.length} שיבוצים`,
    inserted,
    errors: errors.length > 0 ? errors : undefined,
  });
}
