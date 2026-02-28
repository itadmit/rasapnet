import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { soldiers, departments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const url = new URL(request.url);
  const departmentId = url.searchParams.get("department_id");
  const status = url.searchParams.get("status");

  let query = db
    .select({
      id: soldiers.id,
      fullName: soldiers.fullName,
      phoneE164: soldiers.phoneE164,
      departmentId: soldiers.departmentId,
      departmentName: departments.name,
      status: soldiers.status,
      excludeFromAutoSchedule: soldiers.excludeFromAutoSchedule,
      notes: soldiers.notes,
      createdAt: soldiers.createdAt,
    })
    .from(soldiers)
    .innerJoin(departments, eq(soldiers.departmentId, departments.id));

  const conditions = [];
  if (departmentId) {
    conditions.push(eq(soldiers.departmentId, parseInt(departmentId)));
  }
  if (status) {
    conditions.push(eq(soldiers.status, status as "active" | "training" | "exempt" | "vacation"));
  }

  const result =
    conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { fullName, phoneE164, departmentId, status: soldierStatus, notes, excludeFromAutoSchedule } = body;

  if (!fullName?.trim() || !phoneE164?.trim() || !departmentId) {
    return NextResponse.json(
      { error: "שם, טלפון ומחלקה נדרשים" },
      { status: 400 }
    );
  }

  const [result] = await db
    .insert(soldiers)
    .values({
      fullName: fullName.trim(),
      phoneE164: phoneE164.trim(),
      departmentId: parseInt(departmentId),
      status: soldierStatus || "active",
      excludeFromAutoSchedule: excludeFromAutoSchedule === true,
      notes: notes?.trim() || null,
    })
    .returning({ id: soldiers.id });

  return NextResponse.json({ id: result.id, message: "חייל נוסף בהצלחה" });
}

