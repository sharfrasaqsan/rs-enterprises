import React from "react";
import { getAdminVehiclesAction } from "@/app/actions/admin";
import { VehiclesManagerClient } from "@/components/admin/VehiclesManagerClient";

export default async function AdminVehiclesPage() {
  const vehicles = await getAdminVehiclesAction();

  return <VehiclesManagerClient initialVehicles={vehicles} />;
}

