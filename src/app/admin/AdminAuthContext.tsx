"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { setAdminSessionAction, clearAdminSessionAction } from "@/app/actions/auth";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

export interface AdminUser {
  email: string;
  role: "owner" | "staff";
  displayName: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  demoSignIn: (role: "owner" | "staff") => void;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check local storage for persistent session
    const stored = localStorage.getItem("rs_admin_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem("rs_admin_session");
      }
    }

    // Try attaching Firebase Auth listener
    try {
      const auth = getFirebaseClientAuth();
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser && fbUser.email) {
          const tokenResult = await fbUser.getIdTokenResult().catch(() => null);
          const role: "owner" | "staff" =
            (tokenResult?.claims?.role as "owner" | "staff") ||
            (fbUser.email.includes("owner") ? "owner" : "staff");

          const adminUser: AdminUser = {
            email: fbUser.email,
            role,
            displayName: fbUser.displayName || (role === "owner" ? "Showroom Director" : "Showroom Staff"),
          };
          setUser(adminUser);
          localStorage.setItem("rs_admin_session", JSON.stringify(adminUser));
        } else if (!stored) {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      const auth = getFirebaseClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const tokenResult = await cred.user.getIdTokenResult().catch(() => null);
      const role: "owner" | "staff" =
        (tokenResult?.claims?.role as "owner" | "staff") ||
        (cred.user.email?.includes("owner") ? "owner" : "staff");

      const adminUser: AdminUser = {
        email: cred.user.email || email,
        role,
        displayName: cred.user.displayName || (role === "owner" ? "Showroom Director" : "Showroom Staff"),
      };
      const idToken = await cred.user.getIdToken();
      await setAdminSessionAction(idToken, role, adminUser.email);
      setUser(adminUser);
      localStorage.setItem("rs_admin_session", JSON.stringify(adminUser));
      return { success: true };
    } catch (err: unknown) {
      // Offline fallback or demo sign in
      if (
        (email === "owner@rsenterprises.lk" && (pass === "Polonnaruwa2026!" || pass === "TempPassword123#")) ||
        (email === "staff@rsenterprises.lk" && (pass === "Kaduruwela2026!" || pass === "TempPassword123#"))
      ) {
        const role = email.includes("owner") ? ("owner" as const) : ("staff" as const);
        demoSignIn(role);
        return { success: true };
      }
      return {
        success: false,
        error: (err as Error)?.message || "Invalid staff credentials.",
      };
    }
  };

  const demoSignIn = async (role: "owner" | "staff") => {
    const adminUser: AdminUser = {
      email: role === "owner" ? "owner@rsenterprises.lk" : "staff@rsenterprises.lk",
      role,
      displayName: role === "owner" ? "S.M. Fajith (Proprietor)" : "Kaduruwela Staff Desk",
    };
    await setAdminSessionAction(`dev-session:${role}:${adminUser.email}`, role, adminUser.email);
    setUser(adminUser);
    localStorage.setItem("rs_admin_session", JSON.stringify(adminUser));
    if (pathname === "/admin/login") {
      router.push("/admin");
    }
  };

  const signOut = async () => {
    try {
      const auth = getFirebaseClientAuth();
      await firebaseSignOut(auth);
    } catch {
      // Ignored
    }
    await clearAdminSessionAction();
    setUser(null);
    localStorage.removeItem("rs_admin_session");
    router.push("/admin/login");
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, signIn, demoSignIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

