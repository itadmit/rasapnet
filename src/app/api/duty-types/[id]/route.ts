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
  const {
    name,
    category,
    weightPoints,
    defaultRequiredPeople,
    defaultFrequency,
    isActive,
    scheduleType,
    rotationIntervalHours,
    defaultStartHour,
    defaultEndHour,
  } = body;

  const existingRows = await db
    .select()
    .from(dutyTypes)
    .where(eq(dutyTypes.id, parseInt(id)));
  const existing = existingRows[0];

  if (!existing) {
    return NextResponse.json({ error: "סוג תורנות לא נמצא" }, { status: 404 });
  }

  const setObj: Record<string, unknown> = {};
  if (name) setObj.name = name.trim();
  if (category) setObj.category = category.trim();
  if (weightPoints !== undefined) setObj.weightPoints = weightPoints;
  if (defaultRequiredPeople !== undefined) setObj.defaultRequiredPeople = defaultRequiredPeople;
  if (defaultFrequency) setObj.defaultFrequency = defaultFrequency;
  if (isActive !== undefined) setObj.isActive = isActive;
  if (scheduleType) setObj.scheduleType = scheduleType;
  if (rotationIntervalHours !== undefined) setObj.rotationIntervalHours = rotationIntervalHours;
  if (defaultStartHour !== undefined) setObj.defaultStartHour = defaultStartHour;
  if (defaultEndHour !== undefined) setObj.defaultEndHour = defaultEndHour;
  if (scheduleType === "daily") {
    setObj.rotationIntervalHours = null;
    setObj.defaultStartHour = null;
    setObj.defaultEndHour = null;
  }

  await db.update(dutyTypes)
    .set(setObj as typeof dutyTypes.$inferInsert)
    .where(eq(dutyTypes.id, parseInt(id)));

  return NextResponse.json({ message: "סוג תורנות עודכן בהצלחה" });
}

