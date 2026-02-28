import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import {
  soldiers,
  dutyTypes,
  dutyEvents,
  dutyAssignments,
  pointsLedger,
  soldierConstraints,
} from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const eventId = parseInt(id);
  const body = await request.json().catch(() => ({}));
  const { excludeCommanders = true } = body;

  const [event] = await db
    .select()
    .from(dutyEvents)
    .where(eq(dutyEvents.id, eventId));

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const [dutyType] = await db
    .select()
    .from(dutyTypes)
    .where(eq(dutyTypes.id, event.dutyTypeId));

  if (!dutyType) {
    return NextResponse.json({ error: "סוג תורנות לא נמצא" }, { status: 404 });
  }

  let activeSoldiers = await db
    .select()
    .from(soldiers)
    .where(eq(soldiers.status, "active"));

  if (excludeCommanders) {
    activeSoldiers = activeSoldiers.filter((s) => !s.excludeFromAutoSchedule);
  }

  if (activeSoldiers.length === 0) {
    return NextResponse.json(
      { error: "אין חיילים פעילים לשיבוץ" },
      { status: 400 }
    );
  }

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const soldierPoints = new Map<number, number>();

  for (const soldier of activeSoldiers) {
    const [points] = await db
      .select({ total: sql<number>`COALESCE(SUM(${pointsLedger.pointsDelta}), 0)` })
      .from(pointsLedger)
      .where(
        and(
          eq(pointsLedger.soldierId, soldier.id),
          gte(pointsLedger.createdAt, sixtyDaysAgo)
        )
      );
    soldierPoints.set(soldier.id, points?.total ?? 0);
  }

  const constraints = await db.select().from(soldierConstraints);
  const constraintMap = new Map<number, (typeof constraints)[number][]>();
  for (const c of constraints) {
    const list = constraintMap.get(c.soldierId) || [];
    list.push(c);
    constraintMap.set(c.soldierId, list);
  }

  const dateStr = event.startAt.toISOString().split("T")[0];
  const dayOfWeek = new Date(event.startAt).getDay();

  const existingAssignments = await db
    .select()
    .from(dutyAssignments)
    .where(eq(dutyAssignments.dutyEventId, eventId));

  const alreadyAssignedIds = new Set(existingAssignments.map((a) => a.soldierId));
  for (const a of existingAssignments) {
    soldierPoints.set(
      a.soldierId,
      (soldierPoints.get(a.soldierId) || 0) + dutyType.weightPoints
    );
  }

  const candidates = activeSoldiers
    .filter((s) => !alreadyAssignedIds.has(s.id))
    .filter((s) => {
      const sc = constraintMap.get(s.id) || [];
      return !sc.some(
        (c) =>
          c.constraintType === "no_assign" &&
          (c.dayOfWeek === dayOfWeek ||
            (c.dateFrom && c.dateTo && dateStr >= c.dateFrom && dateStr <= c.dateTo))
      );
    })
    .sort((a, b) => {
      const pa = soldierPoints.get(a.id) || 0;
      const pb = soldierPoints.get(b.id) || 0;
      return pa - pb;
    });

  const isHourly = dutyType.scheduleType === "hourly";
  const intervalHours = dutyType.rotationIntervalHours ?? 2;

  let slots: { slotStart: Date; slotEnd: Date }[] = [];
  if (isHourly && event.endAt) {
    const evStart = new Date(event.startAt);
    const evEnd = new Date(event.endAt);
    const intervalMs = intervalHours * 60 * 60 * 1000;
    for (let t = evStart.getTime(); t < evEnd.getTime(); t += intervalMs) {
      const slotStart = new Date(t);
      const slotEnd = new Date(Math.min(t + intervalMs, evEnd.getTime()));
      const hasAssignment = existingAssignments.some(
        (a) =>
          a.slotStartAt &&
          Math.abs(new Date(a.slotStartAt).getTime() - slotStart.getTime()) < 60000
      );
      if (!hasAssignment) {
        slots.push({ slotStart, slotEnd });
      }
    }
  } else {
    const needed = dutyType.defaultRequiredPeople - existingAssignments.length;
    for (let i = 0; i < needed; i++) {
      slots.push({
        slotStart: event.startAt,
        slotEnd: (event.endAt || event.startAt) as Date,
      });
    }
  }

  const toAssign = Math.min(slots.length, candidates.length);
  const assigned: string[] = [];

  for (let i = 0; i < toAssign; i++) {
    const soldier = candidates[i];
    const slot = slots[i];
    await db.insert(dutyAssignments).values({
      dutyEventId: eventId,
      soldierId: soldier.id,
      slotStartAt: slot?.slotStart ?? null,
      slotEndAt: slot?.slotEnd ?? null,
    });
    assigned.push(soldier.fullName);
  }

  return NextResponse.json({
    message: toAssign > 0 ? `שובצו ${toAssign} חיילים: ${assigned.join(", ")}` : "אין מקומות פנויים לשיבוץ",
    assigned: toAssign,
    soldiers: assigned,
  });
}
