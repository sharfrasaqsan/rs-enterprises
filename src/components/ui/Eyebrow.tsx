import React from "react";

export interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "p" | "div";
}

export function Eyebrow({
  children,
  className = "",
  as: Component = "span",
}: EyebrowProps) {
  return (
    <Component
      className={`inline-block font-sans text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)] ${className}`}
    >
      {children}
    </Component>
  );
}

