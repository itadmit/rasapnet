import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { dutyEvents, dutyAssignments, dutyTypes, pointsLedger } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const validStatuses = ["planned", "done", "swapped", "canceled", "missed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "סטטוס לא תקין" }, { status: 400 });
  }

  const eventId = parseInt(id);

  const eventRows = await db
    .select()
    .from(dutyEvents)
    .where(eq(dutyEvents.id, eventId));
  const event = eventRows[0];

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  await db
    .update(dutyEvents)
    .set({ status })
    .where(eq(dutyEvents.id, eventId));

  // If marked as done, award points to assigned soldiers
  if (status === "done") {
    const dutyTypeRows = await db
      .select()
      .from(dutyTypes)
      .where(eq(dutyTypes.id, event.dutyTypeId));
    const dutyType = dutyTypeRows[0];

    if (dutyType) {
      const assignments = await db
        .select()
        .from(dutyAssignments)
        .where(eq(dutyAssignments.dutyEventId, eventId));

      const now = new Date();

      for (const assignment of assignments) {
        // Update done_at
        await db
          .update(dutyAssignments)
          .set({ doneAt: now })
          .where(eq(dutyAssignments.id, assignment.id));

        // Award points
        await db.insert(pointsLedger).values({
          soldierId: assignment.soldierId,
          dutyEventId: eventId,
          pointsDelta: dutyType.weightPoints,
          reason: `תורנות: ${dutyType.name}`,
        });
      }
    }
  }

  return NextResponse.json({ message: "סטטוס עודכן בהצלחה" });
}

