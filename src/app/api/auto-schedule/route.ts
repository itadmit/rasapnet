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
  soldierExemptions,
} from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { isExemptFromDuty } from "@/lib/exemptions";

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { fromDate, toDate, dutyTypeIds, excludeCommanders } = body;

  if (!fromDate || !toDate) {
    return NextResponse.json(
      { error: "טווח תאריכים נדרש" },
      { status: 400 }
    );
  }

  // Get active duty types
  let types = await db
    .select()
    .from(dutyTypes)
    .where(eq(dutyTypes.isActive, true));

  if (dutyTypeIds && dutyTypeIds.length > 0) {
    types = types.filter((t) => dutyTypeIds.includes(t.id));
  }

  // Get active soldiers (optionally exclude commanders/deputy commanders)
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

  // Calculate points for each soldier (last 60 days)
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

  // Get constraints
  const constraints = await db.select().from(soldierConstraints);
  const constraintMap = new Map<number, typeof constraints>();
  for (const c of constraints) {
    const list = constraintMap.get(c.soldierId) || [];
    list.push(c);
    constraintMap.set(c.soldierId, list);
  }

  // Get exemptions
  const exemptions = await db.select().from(soldierExemptions);
  const exemptionMap = new Map<number, string[]>();
  for (const e of exemptions) {
    const list = exemptionMap.get(e.soldierId) || [];
    list.push(e.exemptionCode);
    exemptionMap.set(e.soldierId, list);
  }

  // Generate events for each day in range
  const created: { date: string; dutyType: string; soldiers: string[] }[] = [];
  const start = new Date(fromDate);
  const end = new Date(toDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();

    for (const dutyType of types) {
      // Check frequency
      if (dutyType.defaultFrequency === "weekly" && dayOfWeek !== 0) continue;
      if (dutyType.defaultFrequency === "monthly" && d.getDate() !== 1) continue;

      // Find best candidates (lowest points, no constraints, no exemptions for this duty)
      const candidates = activeSoldiers
        .filter((s) => {
          const soldierExempts = exemptionMap.get(s.id) || [];
          if (isExemptFromDuty(soldierExempts, dutyType)) return false;
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

      if (candidates.length === 0) continue;

      const isHourly = dutyType.scheduleType === "hourly";
      const startHour = dutyType.defaultStartHour ?? 8;
      const endHour = dutyType.defaultEndHour ?? 20;
      const intervalHours = dutyType.rotationIntervalHours ?? 2;

      let eventStartAt: Date;
      let eventEndAt: Date | null = null;
      let slots: { slotStart: Date; slotEnd: Date }[] = [];

      if (isHourly) {
        eventStartAt = new Date(`${dateStr}T${String(startHour).padStart(2, "0")}:00:00`);
        eventEndAt = new Date(`${dateStr}T${String(endHour).padStart(2, "0")}:00:00`);
        for (let h = startHour; h < endHour; h += intervalHours) {
          slots.push({
            slotStart: new Date(`${dateStr}T${String(h).padStart(2, "0")}:00:00`),
            slotEnd: new Date(`${dateStr}T${String(Math.min(h + intervalHours, endHour)).padStart(2, "0")}:00:00`),
          });
        }
      } else {
        eventStartAt = new Date(`${dateStr}T08:00:00`);
      }

      const needed = isHourly ? slots.length : dutyType.defaultRequiredPeople;
      const assigned = candidates.slice(0, Math.min(needed, candidates.length));

      const [eventResult] = await db
        .insert(dutyEvents)
        .values({
          dutyTypeId: dutyType.id,
          startAt: eventStartAt,
          endAt: eventEndAt,
          status: "planned",
          createdBy: auth.userId,
        })
        .returning({ id: dutyEvents.id });

      const eventId = eventResult.id;

      if (isHourly) {
        for (let i = 0; i < assigned.length && i < slots.length; i++) {
          const soldier = assigned[i];
          const { slotStart, slotEnd } = slots[i];
          await db.insert(dutyAssignments).values({
            dutyEventId: eventId,
            soldierId: soldier.id,
            slotStartAt: slotStart,
            slotEndAt: slotEnd,
          });
          soldierPoints.set(
            soldier.id,
            (soldierPoints.get(soldier.id) || 0) + dutyType.weightPoints
          );
        }
        created.push({
          date: dateStr,
          dutyType: dutyType.name,
          soldiers: assigned.map((s) => s.fullName),
        });
      } else {
        for (const soldier of assigned) {
          await db.insert(dutyAssignments).values({
            dutyEventId: eventId,
            soldierId: soldier.id,
          });
          soldierPoints.set(
            soldier.id,
            (soldierPoints.get(soldier.id) || 0) + dutyType.weightPoints
          );
        }
        created.push({
          date: dateStr,
          dutyType: dutyType.name,
          soldiers: assigned.map((s) => s.fullName),
        });
      }
    }
  }

  return NextResponse.json({
    message: `נוצרו ${created.length} שיבוצים`,
    created,
  });
}

