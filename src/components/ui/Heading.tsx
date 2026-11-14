import React from "react";

export type HeadingLevel = 1 | 2 | 3 | 4;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  children: React.ReactNode;
  className?: string;
  italic?: boolean;
}

export function Heading({
  level = 2,
  as,
  children,
  className = "",
  italic = false,
  ...props
}: HeadingProps) {
  const Component = as || (`h${level}` as const);

  // Fluid serif typography with airy, statuesque letter spacing
  const levelClasses = {
    // H1: Monumental showroom headline: clamp(34px, 5.5vw, 68px)
    1: "font-serif text-[clamp(2.25rem,5.5vw,4.5rem)] font-light leading-[1.08] tracking-[0.01em] text-[var(--text-primary)]",
    // H2: Editorial section title: clamp(26px, 3.8vw, 44px)
    2: "font-serif text-[clamp(1.75rem,3.8vw,2.85rem)] font-light leading-[1.15] tracking-[0.015em] text-[var(--text-primary)]",
    // H3: Feature / model title: clamp(20px, 2.5vw, 30px)
    3: "font-serif text-[clamp(1.35rem,2.5vw,2rem)] font-normal leading-[1.2] tracking-[0.01em] text-[var(--text-primary)]",
    // H4: Spec / subsection header: clamp(17px, 1.8vw, 22px)
    4: "font-serif text-[clamp(1.1rem,1.8vw,1.4rem)] font-normal leading-[1.3] tracking-[0.02em] text-[var(--text-primary)]",
  }[level];

  return (
    <Component
      className={`${levelClasses} ${italic ? "italic" : ""} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

