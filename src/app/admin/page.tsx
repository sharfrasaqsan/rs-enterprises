import React from "react";
import { getAdminLeadsAction, getAdminVehiclesAction } from "@/app/actions/admin";
import { getSavedSearchesAction } from "@/app/actions/saved-searches";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const instant = false;

export default async function AdminDashboardPage() {
  const [vehicles, leads, savedSearches] = await Promise.all([
    getAdminVehiclesAction(),
    getAdminLeadsAction(),
    getSavedSearchesAction(),
  ]);

  return (
    <AdminDashboardClient
      vehicles={vehicles}
      leads={leads}
      savedSearches={savedSearches}
    />
  );
}
