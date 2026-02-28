import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { dutyTypes } from "@/db/schema";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const allTypes = await db.select().from(dutyTypes);
  return NextResponse.json(allTypes);
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { name, category, weightPoints, defaultRequiredPeople, defaultFrequency } = body;

  if (!name?.trim() || !category?.trim()) {
    return NextResponse.json({ error: "שם וקטגוריה נדרשים" }, { status: 400 });
  }

  const [result] = await db
    .insert(dutyTypes)
    .values({
      name: name.trim(),
      category: category.trim(),
      weightPoints: weightPoints || 1,
      defaultRequiredPeople: defaultRequiredPeople || 1,
      defaultFrequency: defaultFrequency || "daily",
      isActive: true,
    })
    .returning({ id: dutyTypes.id });

  return NextResponse.json({ id: result.id, message: "סוג תורנות נוסף בהצלחה" });
}

