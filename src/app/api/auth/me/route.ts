import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "טוקן לא תקף או פג תוקף" },
        { status: 401 }
      );
    }

    const userRows = await db
      .select()
      .from(users)
      .where(and(eq(users.id, payload.userId), isNull(users.deletedAt)));
    const user = userRows[0];

    if (!user) {
      return NextResponse.json(
        { error: "משתמש לא נמצא" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "שגיאת שרת פנימית" },
      { status: 500 }
    );
  }
}
