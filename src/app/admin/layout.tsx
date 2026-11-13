import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AdminAuthProvider } from "./AdminAuthContext";
import { AdminLayoutClient } from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: "Showroom Management CRM | RS Enterprises Polonnaruwa",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-secondary)]">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent animate-spin rounded-full" />
            <span className="text-xs uppercase tracking-widest font-mono">
              Loading Showroom System...
            </span>
          </div>
        </div>
      }
    >
      <AdminAuthProvider>
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </AdminAuthProvider>
    </Suspense>
  );
}

