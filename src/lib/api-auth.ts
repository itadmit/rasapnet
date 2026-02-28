import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, type TokenPayload } from "@/lib/auth";

export function authenticateRequest(
  request: NextRequest
): TokenPayload | NextResponse {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const payload = verifyAccessToken(authHeader.slice(7));
  if (!payload) {
    return NextResponse.json(
      { error: "טוקן לא תקף או פג תוקף" },
      { status: 401 }
    );
  }

  return payload;
}

export function isErrorResponse(
  result: TokenPayload | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

