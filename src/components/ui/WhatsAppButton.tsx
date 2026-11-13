import React from "react";

export interface WhatsAppButtonProps {
  number?: string; // Standard Sri Lankan mobile e.g. "94771234567"
  message?: string;
  label?: string;
  vehicleTitle?: string;
  variant?: "solid" | "outline";
  className?: string;
}

export function WhatsAppButton({
  number = "94770000000",
  message,
  label = "WhatsApp Inquiry",
  vehicleTitle,
  variant = "solid",
  className = "",
}: WhatsAppButtonProps) {
  // Construct art-directed default inquiry message
  const defaultText = vehicleTitle
    ? `Hello RS Enterprises, I am inquiring regarding the ${vehicleTitle} listed on your showroom website. Could you please share the inspection sheet and latest availability?`
    : `Hello RS Enterprises, I would like to inquire about your imported Japanese vehicles and available stock.`;

  const encodedMessage = encodeURIComponent(message || defaultText);
  const cleanNumber = number.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

  const variantClasses =
    variant === "solid"
      ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
      : "bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)]";

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center min-h-[48px] px-6 rounded-[2px] font-sans text-xs uppercase font-medium tracking-[0.16em] transition-luxury cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${variantClasses} ${className}`}
      aria-label={`${label} on WhatsApp`}
    >
      {/* Precision drawn inline SVG WhatsApp mark */}
      <svg
        className="w-4 h-4 mr-2.5 shrink-0 stroke-current"
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
    </a>
  );
}

