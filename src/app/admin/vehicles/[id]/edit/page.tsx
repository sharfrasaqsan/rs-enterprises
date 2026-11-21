import React from "react";
import { notFound } from "next/navigation";
import { getAdminVehiclesAction } from "@/app/actions/admin";
import { getCompanySettings } from "@/lib/settings";
import { adminDb } from "@/lib/firebase-admin";
import { vehicleConverter } from "@/types/vehicle";
import { VehicleFormClient } from "@/components/admin/VehicleFormClient";

export default async function AdminEditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicles, settings] = await Promise.all([
    getAdminVehiclesAction(),
    getCompanySettings(),
  ]);
  let vehicle = vehicles.find((v) => v.id === id);

  if (!vehicle) {
    try {
      const snap = await adminDb
        .collection("vehicles")
        .doc(id)
        .withConverter(vehicleConverter)
        .get();
      if (snap.exists) {
        vehicle = snap.data();
      }
    } catch {
      // not found
    }
  }

  if (!vehicle) {
    notFound();
  }

  return <VehicleFormClient initialVehicle={vehicle} settings={settings} />;
}

