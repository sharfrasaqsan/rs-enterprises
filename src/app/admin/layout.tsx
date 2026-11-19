import React from "react";
import type { Metadata } from "next";
import { AdminAuthProvider } from "./AdminAuthContext";
import { AdminLayoutClient } from "./AdminLayoutClient";

export const instant = false;

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
    <AdminAuthProvider>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AdminAuthProvider>
  );
}
