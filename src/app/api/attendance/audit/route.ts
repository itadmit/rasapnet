import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceAuditLog, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  authenticateRequest,
  isErrorResponse,
} from "@/lib/api-auth";

// GET /api/attendance/audit?recordId=X
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
  const recordId = searchParams.get("recordId");

  if (!recordId) {
    return NextResponse.json(
      { error: "חובה לציין recordId" },
      { status: 400 }
    );
  }

  const logs = await db
    .select({
      id: attendanceAuditLog.id,
      oldStatus: attendanceAuditLog.oldStatus,
      newStatus: attendanceAuditLog.newStatus,
      oldNotes: attendanceAuditLog.oldNotes,
      newNotes: attendanceAuditLog.newNotes,
      editedByName: users.name,
      editedAt: attendanceAuditLog.editedAt,
    })
    .from(attendanceAuditLog)
    .innerJoin(users, eq(attendanceAuditLog.editedBy, users.id))
    .where(eq(attendanceAuditLog.attendanceRecordId, parseInt(recordId)))
    .orderBy(desc(attendanceAuditLog.editedAt));

  return NextResponse.json(logs);
}

