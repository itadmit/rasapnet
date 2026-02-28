import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import {
  soldiers,
  departments,
  pointsLedger,
  dutyAssignments,
  dutyEvents,
  dutyTypes,
} from "@/db/schema";
import { eq, and, gte, sql, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const url = new URL(request.url);
  const range = parseInt(url.searchParams.get("range") || "60");

  const cutoff = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

  const allSoldiers = await db
    .select({
      id: soldiers.id,
      fullName: soldiers.fullName,
      departmentId: soldiers.departmentId,
      departmentName: departments.name,
      status: soldiers.status,
    })
    .from(soldiers)
    .innerJoin(departments, eq(soldiers.departmentId, departments.id));

  const report = await Promise.all(
    allSoldiers.map(async (soldier) => {
      // Total points in range
      const [pointsResult] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${pointsLedger.pointsDelta}), 0)`,
        })
        .from(pointsLedger)
        .where(
          and(
            eq(pointsLedger.soldierId, soldier.id),
            gte(pointsLedger.createdAt, cutoff)
          )
        );

      // Total duties count in range
      const [dutiesResult] = await db
        .select({ count: count() })
        .from(dutyAssignments)
        .innerJoin(dutyEvents, eq(dutyAssignments.dutyEventId, dutyEvents.id))
        .where(
          and(
            eq(dutyAssignments.soldierId, soldier.id),
            gte(dutyEvents.startAt, cutoff)
          )
        );

      // Breakdown by category
      const breakdown = await db
        .select({
          category: dutyTypes.category,
          count: count(),
          points: sql<number>`COALESCE(SUM(${dutyTypes.weightPoints}), 0)`,
        })
        .from(dutyAssignments)
        .innerJoin(dutyEvents, eq(dutyAssignments.dutyEventId, dutyEvents.id))
        .innerJoin(dutyTypes, eq(dutyEvents.dutyTypeId, dutyTypes.id))
        .where(
          and(
            eq(dutyAssignments.soldierId, soldier.id),
            gte(dutyEvents.startAt, cutoff)
          )
        )
        .groupBy(dutyTypes.category);

      return {
        ...soldier,
        totalPoints: pointsResult?.total ?? 0,
        totalDuties: dutiesResult?.count ?? 0,
        breakdown,
      };
    })
  );

  // Sort by points descending (most loaded first)
  report.sort((a, b) => b.totalPoints - a.totalPoints);

  return NextResponse.json(report);
}

