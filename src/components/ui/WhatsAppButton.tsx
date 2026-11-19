import React from "react";
import { buildWhatsAppUrl } from "@/lib/phone";
import { Button, ButtonProps } from "@/components/ui/Button";

export interface WhatsAppButtonProps {
  number?: string; // Standard Sri Lankan mobile e.g. "94771234567" or "+94 77 123 4567"
  message?: string;
  label?: string;
  vehicleTitle?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}

export function WhatsAppButton({
  number = "94770000000",
  message,
  label = "WhatsApp Inquiry",
  vehicleTitle,
  variant = "solid",
  size = "md",
  className = "",
}: WhatsAppButtonProps) {
  // Construct art-directed default inquiry message
  const defaultText = vehicleTitle
    ? `Hello RS Enterprises, I am inquiring regarding the ${vehicleTitle} listed on your showroom website. Could you please share the inspection sheet and latest availability?`
    : `Hello RS Enterprises, I would like to inquire about your imported Japanese vehicles and available stock.`;

  const waUrl = buildWhatsAppUrl(number, message || defaultText);

  return (
    <Button
      variant={variant}
      size={size}
      href={waUrl}
      isExternal
      className={className}
      aria-label={`${label} on WhatsApp`}
    >
      {/* Precision drawn inline SVG WhatsApp mark */}
      <svg
        className="w-4 h-4 mr-2 shrink-0 stroke-current"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      <span>{label}</span>
    </Button>
  );
}
