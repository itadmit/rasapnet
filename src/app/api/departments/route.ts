import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { departments } from "@/db/schema";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const allDepts = await db.select().from(departments);
  return NextResponse.json(allDepts);
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "שם מחלקה נדרש" }, { status: 400 });
  }

  const [result] = await db
    .insert(departments)
    .values({ name: name.trim() })
    .returning({ id: departments.id });
  return NextResponse.json({ id: result.id, name: name.trim() });
}

