import React from "react";
import { redirect } from "next/navigation";
import { getCompanySettings } from "@/lib/settings";
import { SettingsClient } from "@/components/admin/SettingsClient";
import { verifyAdminSession } from "@/lib/admin-auth";

export const instant = false;

export default async function AdminSettingsPage() {
  const session = await verifyAdminSession();
  if (session && session.role !== "owner") {
    redirect("/admin");
  }

  const settings = await getCompanySettings();
  return <SettingsClient initialSettings={settings} />;
}
