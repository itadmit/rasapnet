import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { dutyEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const eventId = parseInt(id);

  const [existing] = await db
    .select()
    .from(dutyEvents)
    .where(eq(dutyEvents.id, eventId));

  if (!existing) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  await db.delete(dutyEvents).where(eq(dutyEvents.id, eventId));

  return NextResponse.json({ message: "אירוע נמחק בהצלחה" });
}
