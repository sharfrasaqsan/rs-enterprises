import React from "react";
import { notFound } from "next/navigation";
import { getAdminVehiclesAction } from "@/app/actions/admin";
import { getCompanySettings } from "@/lib/settings";
import { VehicleFormClient } from "@/components/admin/VehicleFormClient";

export async function generateStaticParams() {
  const vehicles = await getAdminVehiclesAction();
  return vehicles.map((v) => ({ id: v.id }));
}

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
  const vehicle = vehicles.find((v) => v.id === id);

  if (!vehicle) {
    notFound();
  }

  return <VehicleFormClient initialVehicle={vehicle} settings={settings} />;
}

