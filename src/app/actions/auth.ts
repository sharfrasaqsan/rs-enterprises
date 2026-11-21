"use server";

import { cookies } from "next/headers";
import { adminAuth, hasAdminCredentials } from "@/lib/firebase-admin";

const COOKIE_NAME = "rs_admin_token";

export async function setAdminSessionAction(
  idToken: string
): Promise<{ success: boolean; role?: "owner" | "staff"; error?: string }> {
  try {
    const cookieStore = await cookies();

    if (!hasAdminCredentials()) {
      return {
        success: false,
        error: "Server configuration missing: Firebase Admin credentials not found.",
      };
    }

    // Strictly verify token cryptographically
    const decoded = await adminAuth.verifyIdToken(idToken);
    const role: "owner" | "staff" =
      (decoded.role as "owner" | "staff") ||
      (decoded.email?.includes("owner") ? "owner" : "staff");

    cookieStore.set(COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true, role };
  } catch (error) {
    console.error("Failed to establish admin session:", error);
    return {
      success: false,
      error: "Authentication token verification failed.",
    };
  }
}

export async function clearAdminSessionAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return { success: true };
  } catch {
    return { success: true };
  }
}

