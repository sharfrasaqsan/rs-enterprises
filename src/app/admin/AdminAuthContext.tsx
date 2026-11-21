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
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Clean up any legacy dev session cookies or storage
    localStorage.removeItem("rs_admin_session");

    let unsubscribe = () => {};
    try {
      const auth = getFirebaseClientAuth();
      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
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
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    } catch {
      setUser(null);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
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
      const sessionResult = await setAdminSessionAction(idToken);
      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error || "Failed to establish server session.",
        };
      }
      setUser(adminUser);
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: (err as Error)?.message || "Invalid staff credentials. Please check your email and password.",
      };
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
    <AdminAuthContext.Provider value={{ user, loading, signIn, signOut }}>
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

