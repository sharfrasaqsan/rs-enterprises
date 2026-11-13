import React from "react";

export type VehicleStatusType = "available" | "reserved" | "sold" | "incoming";

export interface StatusLabelProps {
  status: VehicleStatusType;
  customLabel?: string;
  className?: string;
}

export function StatusLabel({
  status,
  customLabel,
  className = "",
}: StatusLabelProps) {
  const config: Record<
    VehicleStatusType,
    { text: string; borderColor: string; textColor: string; markColor: string }
  > = {
    available: {
      text: "Available",
      borderColor: "border-[var(--status-available)]",
      textColor: "text-[var(--status-available)]",
      markColor: "bg-[var(--status-available)]",
    },
    incoming: {
      text: "In Transit",
      borderColor: "border-[var(--status-incoming)]",
      textColor: "text-[var(--status-incoming)]",
      markColor: "bg-[var(--status-incoming)]",
    },
    reserved: {
      text: "Reserved",
      borderColor: "border-[var(--status-reserved)]",
      textColor: "text-[var(--status-reserved)]",
      markColor: "bg-[var(--status-reserved)]",
    },
    sold: {
      text: "Sold",
      borderColor: "border-[var(--status-sold)]",
      textColor: "text-[var(--status-sold)]",
      markColor: "bg-[var(--status-sold)]",
    },
  };

  const current = config[status] || config.available;
  const label = customLabel || current.text;

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-sans font-medium uppercase tracking-[0.2em] rounded-[2px] border ${current.borderColor} ${current.textColor} bg-[var(--bg-surface)] select-none ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-[1px] ${current.markColor}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

