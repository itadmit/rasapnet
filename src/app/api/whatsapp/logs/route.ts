import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { whatsappLogs, soldiers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const logs = await db
    .select({
      id: whatsappLogs.id,
      soldierId: whatsappLogs.soldierId,
      soldierName: soldiers.fullName,
      type: whatsappLogs.type,
      success: whatsappLogs.success,
      createdAt: whatsappLogs.createdAt,
    })
    .from(whatsappLogs)
    .innerJoin(soldiers, eq(whatsappLogs.soldierId, soldiers.id))
    .orderBy(desc(whatsappLogs.createdAt))
    .limit(100);

  return NextResponse.json(logs);
}

