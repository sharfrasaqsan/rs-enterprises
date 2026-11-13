import React from "react";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "base" | "surface" | "inverted";
  children: React.ReactNode;
  className?: string;
  id?: string;
  spacing?: "tight" | "normal" | "generous";
}

export function Section({
  variant = "base",
  spacing = "generous",
  children,
  className = "",
  id,
  ...props
}: SectionProps) {
  const variantClasses = {
    base: "bg-[var(--bg-base)] text-[var(--text-primary)]",
    surface: "bg-[var(--bg-surface)] text-[var(--text-primary)]",
    inverted:
      "bg-[var(--bg-inverted)] text-[var(--text-inverted)]",
  }[variant];

  const spacingClasses = {
    tight: "py-8 sm:py-12 lg:py-16",
    normal: "py-12 sm:py-16 lg:py-24",
    generous: "py-16 sm:py-24 lg:py-32",
  }[spacing];

  return (
    <section
      id={id}
      data-section-inverted={variant === "inverted" ? "true" : undefined}
      className={`relative w-full ${variantClasses} ${spacingClasses} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

