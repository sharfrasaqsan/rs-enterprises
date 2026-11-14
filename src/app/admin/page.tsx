import React from "react";
import { getAdminLeadsAction, getAdminVehiclesAction } from "@/app/actions/admin";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const instant = false;

export default async function AdminDashboardPage() {
  const [vehicles, leads] = await Promise.all([
    getAdminVehiclesAction(),
    getAdminLeadsAction(),
  ]);

  return <AdminDashboardClient vehicles={vehicles} leads={leads} />;
}
