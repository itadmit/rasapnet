import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { soldiers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();
  const { fullName, phoneE164, departmentId, status, notes } = body;

  const existingRows = await db
    .select()
    .from(soldiers)
    .where(eq(soldiers.id, parseInt(id)));
  const existing = existingRows[0];

  if (!existing) {
    return NextResponse.json({ error: "חייל לא נמצא" }, { status: 404 });
  }

  await db.update(soldiers)
    .set({
      ...(fullName && { fullName: fullName.trim() }),
      ...(phoneE164 && { phoneE164: phoneE164.trim() }),
      ...(departmentId && { departmentId: parseInt(departmentId) }),
      ...(status && { status }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    })
    .where(eq(soldiers.id, parseInt(id)));

  return NextResponse.json({ message: "חייל עודכן בהצלחה" });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  await db.delete(soldiers).where(eq(soldiers.id, parseInt(id)));
  return NextResponse.json({ message: "חייל נמחק בהצלחה" });
}

