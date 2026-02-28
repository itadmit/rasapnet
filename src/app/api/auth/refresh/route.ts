import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json(
        { error: "Refresh token נדרש" },
        { status: 400 }
      );
    }

    const result = await rotateRefreshToken(refreshToken);

    if (!result) {
      return NextResponse.json(
        { error: "טוקן לא תקף או פג תוקף" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        role: result.user.role,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "שגיאת שרת פנימית" },
      { status: 500 }
    );
  }
}
