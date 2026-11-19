"use client";

import React, { useState } from "react";
import { SaveSearchModal } from "./SaveSearchModal";

interface SaveSearchButtonProps {
  initialCriteria?: {
    make?: string;
    model?: string;
    keyword?: string;
    maxPrice?: number | null;
    bodyType?: string;
    branch?: string;
  };
  label?: string;
  variant?: "solid" | "outline" | "pill";
  className?: string;
}

export function SaveSearchButton({
  initialCriteria,
  label = "Save Search & Get WhatsApp Alert",
  variant = "outline",
  className = "",
}: SaveSearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const baseStyle =
    "inline-flex items-center justify-center min-h-[44px] px-4 rounded-[2px] text-xs font-sans uppercase font-medium tracking-[0.14em] transition-luxury cursor-pointer";

  let variantStyle = "";
  if (variant === "solid") {
    variantStyle = "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm";
  } else if (variant === "pill") {
    variantStyle =
      "min-h-[36px] px-3 py-1 bg-[var(--bg-base)] text-[var(--accent)] border border-[var(--border-hairline)] hover:border-[var(--accent)] text-[10px] tracking-wider";
  } else {
    variantStyle =
      "border border-[var(--border-subtle)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${baseStyle} ${variantStyle} ${className}`}
        title="Get WhatsApp alert when matching cars land in our showroom"
      >
        <svg
          className="w-4 h-4 mr-2 shrink-0 stroke-current"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        <span>{label}</span>
      </button>

      <SaveSearchModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialCriteria={initialCriteria}
      />
    </>
  );
}

