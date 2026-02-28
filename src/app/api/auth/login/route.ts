import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { signAccessToken, createRefreshToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "מספר טלפון נדרש" },
        { status: 400 }
      );
    }

    const normalizedPhone = phone.replace(/[\s\-()]/g, "");

    const userRows = await db
      .select()
      .from(users)
      .where(and(eq(users.phone, normalizedPhone), isNull(users.deletedAt)));
    const user = userRows[0];

    if (!user) {
      return NextResponse.json(
        { error: "מספר טלפון לא רשום במערכת" },
        { status: 404 }
      );
    }

    const accessToken = signAccessToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
    });

    const refreshToken = await createRefreshToken(user.id);

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "שגיאת שרת פנימית" },
      { status: 500 }
    );
  }
}
