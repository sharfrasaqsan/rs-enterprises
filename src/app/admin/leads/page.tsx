import React from "react";
import { getAdminLeadsAction, getAdminVehiclesAction } from "@/app/actions/admin";
import { getSavedSearchesAction } from "@/app/actions/saved-searches";
import { LeadsPipelineClient } from "@/components/admin/LeadsPipelineClient";

export const instant = false;

export default async function AdminLeadsPage() {
  const [leads, vehicles, savedSearches] = await Promise.all([
    getAdminLeadsAction(),
    getAdminVehiclesAction(),
    getSavedSearchesAction(),
  ]);

  return (
    <LeadsPipelineClient
      initialLeads={leads}
      vehicles={vehicles}
      initialSavedSearches={savedSearches}
    />
  );
}
