"use client";

import dynamic from "next/dynamic";

const DynamicCompareTray = dynamic(
  () => import("@/components/vehicles/CompareTray"),
  { ssr: false }
);

export function LazyCompareTray() {
  return <DynamicCompareTray />;
}

