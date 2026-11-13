import React from "react";
import { getAdminLeadsAction } from "@/app/actions/admin";
import { LeadsPipelineClient } from "@/components/admin/LeadsPipelineClient";

export default async function AdminLeadsPage() {
  const leads = await getAdminLeadsAction();

  return <LeadsPipelineClient initialLeads={leads} />;
}

