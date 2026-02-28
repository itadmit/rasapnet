import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { whatsappSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const settingsRows = await db.select().from(whatsappSettings);
  const settings = settingsRows[0];

  if (!settings) {
    return NextResponse.json({
      id: null,
      instanceId: "",
      isEnabled: false,
      hasToken: false,
    });
  }

  return NextResponse.json({
    id: settings.id,
    instanceId: settings.instanceId || "",
    isEnabled: settings.isEnabled,
    hasToken: !!settings.tokenEncrypted,
  });
}

export async function PUT(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  if (auth.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = await request.json();
  const { token, instanceId, isEnabled } = body;

  const existingRows = await db.select().from(whatsappSettings);
  const existing = existingRows[0];

  if (existing) {
    await db
      .update(whatsappSettings)
      .set({
        ...(token !== undefined && { tokenEncrypted: token }),
        ...(instanceId !== undefined && { instanceId }),
        ...(isEnabled !== undefined && { isEnabled }),
        updatedAt: new Date(),
      })
      .where(eq(whatsappSettings.id, existing.id));
  } else {
    await db.insert(whatsappSettings).values({
      tokenEncrypted: token || null,
      instanceId: instanceId || null,
      isEnabled: isEnabled ?? false,
    });
  }

  return NextResponse.json({ message: "הגדרות וואטסאפ נשמרו" });
}

