import React from "react";
import type { Metadata } from "next";
import { getAdminVehiclesAction, getAdminLeadsAction } from "@/app/actions/admin";
import { AdminAnalyticsClient } from "@/components/admin/AdminAnalyticsClient";

export const metadata: Metadata = {
  title: "Dealership Profit & Financial Analytics | RS Enterprises Admin",
  description:
    "Executive automotive dealership financial dashboard: calculate gross sales revenue, landed import costs, realized net profit, working capital in inventory, and branch performance.",
};

export const instant = false;

export default async function AdminAnalyticsPage() {
  const [vehicles, leads] = await Promise.all([
    getAdminVehiclesAction(),
    getAdminLeadsAction(),
  ]);

  return (
    <AdminAnalyticsClient
      initialVehicles={vehicles}
      initialLeads={leads}
    />
  );
}
