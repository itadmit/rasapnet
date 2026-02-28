import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  attendanceRecords,
  attendanceAuditLog,
  soldiers,
  departments,
  users,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  authenticateRequest,
  isErrorResponse,
} from "@/lib/api-auth";

function requireShlishutOrAdmin(role: string): NextResponse | null {
  if (role !== "admin" && role !== "shlishut") {
    return NextResponse.json(
      { error: "אין הרשאה - נדרשת גישת שלישות" },
      { status: 403 }
    );
  }
  return null;
}

// GET /api/attendance?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const roleCheck = requireShlishutOrAdmin(auth.role);
  if (roleCheck) return roleCheck;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "חובה לציין תאריך" }, { status: 400 });
  }

  // Get all active soldiers with their department
  const allSoldiers = await db
    .select({
      id: soldiers.id,
      fullName: soldiers.fullName,
      departmentId: soldiers.departmentId,
      departmentName: departments.name,
      status: soldiers.status,
    })
    .from(soldiers)
    .innerJoin(departments, eq(soldiers.departmentId, departments.id))
    .where(eq(soldiers.status, "active"));

  // Get attendance records for the date
  const records = await db
    .select({
      id: attendanceRecords.id,
      soldierId: attendanceRecords.soldierId,
      status: attendanceRecords.status,
      notes: attendanceRecords.notes,
      reportedByName: users.name,
      updatedAt: attendanceRecords.updatedAt,
    })
    .from(attendanceRecords)
    .innerJoin(users, eq(attendanceRecords.reportedBy, users.id))
    .where(eq(attendanceRecords.date, date));

  const recordMap = new Map(records.map((r) => [r.soldierId, r]));

  const result = allSoldiers.map((soldier) => {
    const record = recordMap.get(soldier.id);
    return {
      soldierId: soldier.id,
      fullName: soldier.fullName,
      departmentId: soldier.departmentId,
      departmentName: soldier.departmentName,
      attendanceId: record?.id ?? null,
      attendanceStatus: record?.status ?? "unreported",
      notes: record?.notes ?? null,
      reportedByName: record?.reportedByName ?? null,
      updatedAt: record?.updatedAt ?? null,
    };
  });

  return NextResponse.json(result);
}

// POST /api/attendance
export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const roleCheck = requireShlishutOrAdmin(auth.role);
  if (roleCheck) return roleCheck;

  const body = await request.json();
  const { date, records } = body as {
    date: string;
    records: Array<{
      soldierId: number;
      status: string;
      notes?: string;
    }>;
  };

  if (!date || !records?.length) {
    return NextResponse.json(
      { error: "חובה לציין תאריך ורשומות" },
      { status: 400 }
    );
  }

  const now = new Date();
  let created = 0;
  let updated = 0;

  for (const record of records) {
    // Check if record exists
    const existingRows = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.soldierId, record.soldierId),
          eq(attendanceRecords.date, date)
        )
      );
    const existing = existingRows[0];

    if (existing) {
      // Only update if status or notes changed
      if (existing.status !== record.status || existing.notes !== (record.notes ?? null)) {
        // Write audit log
        await db.insert(attendanceAuditLog).values({
          attendanceRecordId: existing.id,
          oldStatus: existing.status,
          newStatus: record.status,
          oldNotes: existing.notes,
          newNotes: record.notes ?? null,
          editedBy: auth.userId,
          editedAt: now,
        });

        // Update record
        await db
          .update(attendanceRecords)
          .set({
            status: record.status as "present" | "leave" | "shabbat" | "compassionate" | "home" | "other",
            notes: record.notes ?? null,
            reportedBy: auth.userId,
            updatedAt: now,
          })
          .where(eq(attendanceRecords.id, existing.id));

        updated++;
      }
    } else {
      // Create new record
      await db.insert(attendanceRecords).values({
        soldierId: record.soldierId,
        date,
        status: record.status as "present" | "leave" | "shabbat" | "compassionate" | "home" | "other",
        notes: record.notes ?? null,
        reportedBy: auth.userId,
        updatedAt: now,
      });

      created++;
    }
  }

  return NextResponse.json({ success: true, created, updated });
}

