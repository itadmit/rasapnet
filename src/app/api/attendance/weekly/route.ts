import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  attendanceRecords,
  soldiers,
  departments,
} from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import {
  authenticateRequest,
  isErrorResponse,
} from "@/lib/api-auth";

// GET /api/attendance/weekly?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  if (auth.role !== "admin" && auth.role !== "shlishut") {
    return NextResponse.json(
      { error: "אין הרשאה - נדרשת גישת שלישות" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "חובה לציין from ו-to" },
      { status: 400 }
    );
  }

  // Get all active soldiers
  const allSoldiers = await db
    .select({
      id: soldiers.id,
      fullName: soldiers.fullName,
      departmentId: soldiers.departmentId,
      departmentName: departments.name,
    })
    .from(soldiers)
    .innerJoin(departments, eq(soldiers.departmentId, departments.id))
    .where(eq(soldiers.status, "active"));

  // Get all attendance records in range
  const records = await db
    .select({
      soldierId: attendanceRecords.soldierId,
      date: attendanceRecords.date,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
      id: attendanceRecords.id,
    })
    .from(attendanceRecords)
    .where(
      and(
        gte(attendanceRecords.date, from),
        lte(attendanceRecords.date, to)
      )
    );

  // Build a map: soldierId -> { date -> record }
  const recordMap = new Map<number, Map<string, typeof records[0]>>();
  for (const r of records) {
    if (!recordMap.has(r.soldierId)) {
      recordMap.set(r.soldierId, new Map());
    }
    recordMap.get(r.soldierId)!.set(r.date, r);
  }

  // Generate date range
  const dates: string[] = [];
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }

  // Build result matrix
  const result = allSoldiers.map((soldier) => {
    const soldierRecords = recordMap.get(soldier.id);
    const attendance: Record<string, { status: string; notes: string | null; recordId: number | null }> = {};

    for (const date of dates) {
      const record = soldierRecords?.get(date);
      attendance[date] = {
        status: record?.status ?? "unreported",
        notes: record?.notes ?? null,
        recordId: record?.id ?? null,
      };
    }

    return {
      soldierId: soldier.id,
      fullName: soldier.fullName,
      departmentId: soldier.departmentId,
      departmentName: soldier.departmentName,
      attendance,
    };
  });

  return NextResponse.json({ dates, soldiers: result });
}

