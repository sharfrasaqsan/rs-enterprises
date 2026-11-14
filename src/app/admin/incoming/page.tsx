import React from "react";
import { getAdminVehiclesAction } from "@/app/actions/admin";
import { IncomingManagerClient } from "@/components/admin/IncomingManagerClient";

export const instant = false;

export default async function AdminIncomingPage() {
  const vehicles = await getAdminVehiclesAction();
  return <IncomingManagerClient initialVehicles={vehicles} />;
}

