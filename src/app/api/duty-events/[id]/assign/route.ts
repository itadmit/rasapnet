import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { dutyAssignments } from "@/db/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();
  const { soldierIds, slotStartAt, slotEndAt } = body;

  if (!soldierIds || !Array.isArray(soldierIds) || soldierIds.length === 0) {
    return NextResponse.json(
      { error: "יש לספק רשימת חיילים" },
      { status: 400 }
    );
  }

  for (const soldierId of soldierIds) {
    await db.insert(dutyAssignments).values({
      dutyEventId: parseInt(id),
      soldierId: parseInt(soldierId),
      slotStartAt: slotStartAt ? new Date(slotStartAt) : null,
      slotEndAt: slotEndAt ? new Date(slotEndAt) : null,
    });
  }

  return NextResponse.json({ message: "חיילים שובצו בהצלחה" });
}

