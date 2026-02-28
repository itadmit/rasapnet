import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { dutyAssignments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id, assignmentId } = await params;
  const eventId = parseInt(id);
  const assignId = parseInt(assignmentId);

  const deleted = await db
    .delete(dutyAssignments)
    .where(
      and(
        eq(dutyAssignments.id, assignId),
        eq(dutyAssignments.dutyEventId, eventId)
      )
    )
    .returning({ id: dutyAssignments.id });

  if (deleted.length === 0) {
    return NextResponse.json(
      { error: "שיבוץ לא נמצא" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "שיבוץ הוסר בהצלחה" });
}
