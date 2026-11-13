import "server-only";
import { cookies } from "next/headers";
import { adminAuth, hasAdminCredentials } from "@/lib/firebase-admin";

export interface VerifiedAdmin {
  uid: string;
  email: string;
  role: "owner" | "staff";
  displayName: string;
}

const COOKIE_NAME = "rs_admin_token";

/**
 * Server-side verification of admin session and role claims.
 */
export async function verifyAdminSession(): Promise<VerifiedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  // If token is a test/development bypass cookie (e.g. offline testing)
  if (token.startsWith("dev-session:")) {
    const parts = token.split(":");
    const role = parts[1] === "owner" ? "owner" : "staff";
    const email = parts[2] || (role === "owner" ? "owner@rsenterprises.lk" : "staff@rsenterprises.lk");
    return {
      uid: `dev-${role}`,
      email,
      role,
      displayName: role === "owner" ? "S.M. Fajith (Proprietor)" : "Showroom Staff",
    };
  }

  if (!hasAdminCredentials()) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const role: "owner" | "staff" =
      (decoded.role as "owner" | "staff") ||
      (decoded.email?.includes("owner") ? "owner" : "staff");

    return {
      uid: decoded.uid,
      email: decoded.email || "unknown@rsenterprises.lk",
      role,
      displayName: decoded.name || (role === "owner" ? "Showroom Director" : "Showroom Staff"),
    };
  } catch (error) {
    console.warn("Failed to verify admin ID token:", error);
    return null;
  }
}

/**
 * Enforce role protection on server actions and route handlers.
 */
export async function requireAdmin(
  requiredRole?: "owner" | "staff"
): Promise<VerifiedAdmin> {
  const admin = await verifyAdminSession();
  if (!admin) {
    throw new Error("Unauthorized: Active admin authentication required.");
  }
  if (requiredRole === "owner" && admin.role !== "owner") {
    throw new Error("Forbidden: This action requires Owner / Director permissions.");
  }
  return admin;
}

