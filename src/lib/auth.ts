import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "@/db";
import { refreshTokens, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "rasap-dev-secret-change-in-prod";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_DAYS = 7;

export interface TokenPayload {
  userId: number;
  phone: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function createRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
  );

  await db.insert(refreshTokens).values({ userId, token, expiresAt });

  return token;
}

export async function rotateRefreshToken(
  oldToken: string
): Promise<{ accessToken: string; refreshToken: string; user: typeof users.$inferSelect } | null> {
  const now = new Date();

  const existingRows = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, oldToken),
        gt(refreshTokens.expiresAt, now)
      )
    );
  const existing = existingRows[0];

  if (!existing) return null;

  // Delete old token
  await db.delete(refreshTokens).where(eq(refreshTokens.id, existing.id));

  // Get user
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, existing.userId));
  const user = userRows[0];

  if (!user || user.deletedAt) return null;

  // Issue new tokens
  const accessToken = signAccessToken({
    userId: user.id,
    phone: user.phone,
    role: user.role,
  });
  const newRefreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken, user };
}
