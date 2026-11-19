import React from "react";
import { Button, ButtonProps } from "@/components/ui/Button";

export interface PhoneLinkProps {
  number: string;
  displayNumber?: string;
  label?: string;
  variant?: "solid" | "outline" | "inline";
  size?: ButtonProps["size"];
  className?: string;
}

export function PhoneLink({
  number,
  displayNumber,
  label,
  variant = "outline",
  size = "md",
  className = "",
}: PhoneLinkProps) {
  const cleanNumber = number.replace(/[^0-9+]/g, "");
  const formattedDisplay = displayNumber || number;

  const telephoneIcon = (
    <svg
      className="w-4 h-4 mr-2 shrink-0 stroke-current"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );

  if (variant === "inline") {
    return (
      <a
        href={`tel:${cleanNumber}`}
        className={`inline-flex items-center min-h-[44px] text-sm font-sans font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-luxury ${className}`}
        aria-label={`Call ${label || formattedDisplay}`}
      >
        {telephoneIcon}
        <span className="tabular-nums tracking-wide">{formattedDisplay}</span>
      </a>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      href={`tel:${cleanNumber}`}
      isExternal
      className={className}
      aria-label={`Direct telephone line: ${label || formattedDisplay}`}
    >
      {telephoneIcon}
      <span>{label || formattedDisplay}</span>
    </Button>
  );
}
