import React from "react";
import { notFound } from "next/navigation";
import { getAdminLeadsAction, getAdminVehiclesAction } from "@/app/actions/admin";
import { adminDb } from "@/lib/firebase-admin";
import { leadConverter } from "@/types/lead";
import { LeadDossierClient } from "@/components/admin/LeadDossierClient";

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
  let lead = leads.find((l) => l.id === id);

  if (!lead) {
    try {
      const snap = await adminDb
        .collection("leads")
        .doc(id)
        .withConverter(leadConverter)
        .get();
      if (snap.exists) {
        lead = snap.data();
      }
    } catch {
      // not found
    }
  }

  if (!lead) {
    notFound();
  }

  return <LeadDossierClient initialLead={lead} vehicles={vehicles} />;
}
