import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { db } from "@/db";
import { soldiers, dutyTypes, dutyEvents, dutyAssignments } from "@/db/schema";
import { eq, and, gte, lt, count, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }

    const payload = verifyAccessToken(authHeader.slice(7));
    if (!payload) {
      return NextResponse.json({ error: "טוקן לא תקף" }, { status: 401 });
    }

    // Total soldiers
    const [totalSoldiersResult] = await db
      .select({ count: count() })
      .from(soldiers);

    // Active soldiers
    const [activeSoldiersResult] = await db
      .select({ count: count() })
      .from(soldiers)
      .where(eq(soldiers.status, "active"));

    // Total active duty types
    const [totalDutyTypesResult] = await db
      .select({ count: count() })
      .from(dutyTypes)
      .where(eq(dutyTypes.isActive, true));

    // Today's date range
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
    const dayAfterStr = new Date(
      tomorrowDate.getTime() + 86400000
    )
      .toISOString()
      .split("T")[0];

    // Today's events
    const todayEvents = await db
      .select({
        id: dutyEvents.id,
        dutyTypeName: dutyTypes.name,
        startAt: dutyEvents.startAt,
        status: dutyEvents.status,
      })
      .from(dutyEvents)
      .innerJoin(dutyTypes, eq(dutyEvents.dutyTypeId, dutyTypes.id))
      .where(
        and(
          gte(dutyEvents.startAt, new Date(todayStr)),
          lt(dutyEvents.startAt, new Date(tomorrowStr))
        )
      );

    // Tomorrow's events
    const tomorrowEvents = await db
      .select({
        id: dutyEvents.id,
        dutyTypeName: dutyTypes.name,
        startAt: dutyEvents.startAt,
        status: dutyEvents.status,
      })
      .from(dutyEvents)
      .innerJoin(dutyTypes, eq(dutyEvents.dutyTypeId, dutyTypes.id))
      .where(
        and(
          gte(dutyEvents.startAt, new Date(tomorrowStr)),
          lt(dutyEvents.startAt, new Date(dayAfterStr))
        )
      );

    // Upcoming events (next 7 days)
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekStr = weekFromNow.toISOString().split("T")[0];

    const [upcomingResult] = await db
      .select({ count: count() })
      .from(dutyEvents)
      .where(
        and(
          gte(dutyEvents.startAt, new Date(todayStr)),
          lt(dutyEvents.startAt, new Date(weekStr))
        )
      );

    // Get assignment counts for today's events
    const enrichEvents = async (
      events: Awaited<typeof todayEvents>
    ) => {
      return Promise.all(
        events.map(async (e) => {
          const [assignCount] = await db
            .select({ count: count() })
            .from(dutyAssignments)
            .where(eq(dutyAssignments.dutyEventId, e.id));
          return { ...e, assignedCount: assignCount?.count ?? 0 };
        })
      );
    };

    return NextResponse.json({
      totalSoldiers: totalSoldiersResult?.count ?? 0,
      activeSoldiers: activeSoldiersResult?.count ?? 0,
      totalDutyTypes: totalDutyTypesResult?.count ?? 0,
      upcomingEvents: upcomingResult?.count ?? 0,
      todayEvents: await enrichEvents(todayEvents),
      tomorrowEvents: await enrichEvents(tomorrowEvents),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "שגיאת שרת פנימית" },
      { status: 500 }
    );
  }
}

