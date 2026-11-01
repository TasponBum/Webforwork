
import "server-only";

import { adminAuth } from "@/lib/firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

export async function verifyAuth(
  request: Request
): Promise<DecodedIdToken | null> {
  // อ่าน Authorization Header
  const authorization = request.headers.get("authorization");

  // ตรวจสอบว่ามี Bearer Token หรือไม่
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authorization.slice(7).trim();

  if (!idToken) {
    return null;
  }

  try {
    // ตรวจสอบ Token ด้วย Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return decodedToken;
  } catch (error) {
    console.error("Verify token error:", error);
    return null;
  }
}
