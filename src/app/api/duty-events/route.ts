import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { dutyEvents, dutyTypes, dutyAssignments, soldiers } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const conditions = [];
  if (from) conditions.push(gte(dutyEvents.startAt, new Date(from)));
  if (to) conditions.push(lte(dutyEvents.startAt, new Date(to)));

  const events = await db
    .select({
      id: dutyEvents.id,
      dutyTypeId: dutyEvents.dutyTypeId,
      dutyTypeName: dutyTypes.name,
      dutyTypeCategory: dutyTypes.category,
      weightPoints: dutyTypes.weightPoints,
      scheduleType: dutyTypes.scheduleType,
      rotationIntervalHours: dutyTypes.rotationIntervalHours,
      startAt: dutyEvents.startAt,
      endAt: dutyEvents.endAt,
      status: dutyEvents.status,
      notes: dutyEvents.notes,
      createdAt: dutyEvents.createdAt,
    })
    .from(dutyEvents)
    .innerJoin(dutyTypes, eq(dutyEvents.dutyTypeId, dutyTypes.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(dutyEvents.startAt);

  // Get assignments for each event
  const eventsWithAssignments = await Promise.all(
    events.map(async (event) => {
      const assignments = await db
      .select({
        id: dutyAssignments.id,
        soldierId: dutyAssignments.soldierId,
        soldierName: soldiers.fullName,
        roleLabel: dutyAssignments.roleLabel,
        slotStartAt: dutyAssignments.slotStartAt,
        slotEndAt: dutyAssignments.slotEndAt,
        isConfirmed: dutyAssignments.isConfirmed,
        doneAt: dutyAssignments.doneAt,
      })
      .from(dutyAssignments)
      .innerJoin(soldiers, eq(dutyAssignments.soldierId, soldiers.id))
      .where(eq(dutyAssignments.dutyEventId, event.id));

      return { ...event, assignments };
    })
  );

  return NextResponse.json(eventsWithAssignments);
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { dutyTypeId, startAt, endAt, notes } = body;

  if (!dutyTypeId || !startAt) {
    return NextResponse.json(
      { error: "סוג תורנות ותאריך נדרשים" },
      { status: 400 }
    );
  }

  const [result] = await db
    .insert(dutyEvents)
    .values({
      dutyTypeId: parseInt(dutyTypeId),
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      notes: notes?.trim() || null,
      createdBy: auth.userId,
    })
    .returning({ id: dutyEvents.id });

  return NextResponse.json({
    id: result.id,
    message: "אירוע תורנות נוצר בהצלחה",
  });
}

