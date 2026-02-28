import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { dutyAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const eventId = parseInt(id);

  await db
    .delete(dutyAssignments)
    .where(eq(dutyAssignments.dutyEventId, eventId));

  return NextResponse.json({ message: "כל השיבוצים אופסו בהצלחה" });
}
