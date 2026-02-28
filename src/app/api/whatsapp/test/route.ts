import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, isErrorResponse } from "@/lib/api-auth";
import { db } from "@/db";
import { whatsappSettings } from "@/db/schema";

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request);
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { phone, message } = body;

  if (!phone || !message) {
    return NextResponse.json(
      { error: "טלפון והודעה נדרשים" },
      { status: 400 }
    );
  }

  const settingsRows = await db.select().from(whatsappSettings);
  const settings = settingsRows[0];

  if (!settings || !settings.tokenEncrypted || !settings.instanceId) {
    return NextResponse.json(
      { error: "הגדרות וואטסאפ לא מוגדרות" },
      { status: 400 }
    );
  }

  if (!settings.isEnabled) {
    return NextResponse.json(
      { error: "וואטסאפ לא מופעל" },
      { status: 400 }
    );
  }

  // Format phone: 0501234567 -> 972501234567
  const jid = phone.replace(/^0/, "972") + "@s.whatsapp.net";

  const url = `https://true-story.net/api/v1/send-text?token=${settings.tokenEncrypted}&instance_id=${settings.instanceId}&jid=${jid}&msg=${encodeURIComponent(message)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    return NextResponse.json({
      success: res.ok,
      response: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "שגיאה בשליחת הודעה",
      },
      { status: 500 }
    );
  }
}

