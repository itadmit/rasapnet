import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { dutyTypes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();
  const { name, category, weightPoints, defaultRequiredPeople, defaultFrequency, isActive } = body;

  const existingRows = await db
    .select()
    .from(dutyTypes)
    .where(eq(dutyTypes.id, parseInt(id)));
  const existing = existingRows[0];

  if (!existing) {
    return NextResponse.json({ error: "סוג תורנות לא נמצא" }, { status: 404 });
  }

  await db.update(dutyTypes)
    .set({
      ...(name && { name: name.trim() }),
      ...(category && { category: category.trim() }),
      ...(weightPoints !== undefined && { weightPoints }),
      ...(defaultRequiredPeople !== undefined && { defaultRequiredPeople }),
      ...(defaultFrequency && { defaultFrequency }),
      ...(isActive !== undefined && { isActive }),
    })
    .where(eq(dutyTypes.id, parseInt(id)));

  return NextResponse.json({ message: "סוג תורנות עודכן בהצלחה" });
}

