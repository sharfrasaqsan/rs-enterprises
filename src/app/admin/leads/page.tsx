import React from "react";
import { getAdminLeadsAction, getAdminVehiclesAction } from "@/app/actions/admin";
import { LeadsPipelineClient } from "@/components/admin/LeadsPipelineClient";

export default async function AdminLeadsPage() {
  const [leads, vehicles] = await Promise.all([
    getAdminLeadsAction(),
    getAdminVehiclesAction(),
  ]);

  return <LeadsPipelineClient initialLeads={leads} vehicles={vehicles} />;
}
