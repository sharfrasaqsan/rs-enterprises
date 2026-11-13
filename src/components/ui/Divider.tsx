import React from "react";

export interface DividerProps {
  className?: string;
  variant?: "hairline" | "subtle" | "accent";
  orientation?: "horizontal" | "vertical";
}

export function Divider({
  className = "",
  variant = "hairline",
  orientation = "horizontal",
}: DividerProps) {
  const colorClasses = {
    hairline: "bg-[var(--border-hairline)]",
    subtle: "bg-[var(--border-subtle)]",
    accent: "bg-[var(--accent)]",
  }[variant];

  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`w-[1px] h-full ${colorClasses} ${className}`}
      />
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={`h-[1px] w-full ${colorClasses} ${className}`}
    />
  );
}

