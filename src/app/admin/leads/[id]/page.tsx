import React from "react";
import { notFound } from "next/navigation";
import { getAdminLeadsAction, getAdminVehiclesAction } from "@/app/actions/admin";
import { LeadDossierClient } from "@/components/admin/LeadDossierClient";

export const instant = false;

export async function generateStaticParams() {
  const leads = await getAdminLeadsAction();
  return leads.map((l) => ({ id: l.id }));
}

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [leads, vehicles] = await Promise.all([
    getAdminLeadsAction(),
    getAdminVehiclesAction(),
  ]);
  const lead = leads.find((l) => l.id === id);

  if (!lead) {
    notFound();
  }

  return <LeadDossierClient initialLead={lead} vehicles={vehicles} />;
}
