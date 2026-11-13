import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "text-link";
  size?: "sm" | "md" | "lg";
  href?: string;
  isExternal?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = "solid",
  size = "md",
  href,
  isExternal,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  // Base: rectangular (max 2px radius), uppercase, letter-spaced, min 44px tap target
  const baseClasses =
    "inline-flex items-center justify-center font-sans uppercase font-medium tracking-[0.18em] rounded-[2px] transition-luxury cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "min-h-[44px] px-5 text-xs py-2.5",
    md: "min-h-[48px] px-7 text-xs py-3",
    lg: "min-h-[52px] px-9 text-sm py-3.5",
  }[size];

  const variantClasses = {
    // Solid flat accent button (no gradients, no drop shadows)
    solid:
      "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] active:translate-y-[1px]",
    // Hairline thin rectangular outline
    outline:
      "bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] active:translate-y-[1px]",
    // Elegant text link with hairline border underline on hover
    "text-link":
      "min-h-[44px] px-0 py-2 bg-transparent text-[var(--accent)] hover:text-[var(--accent-hover)] border-b border-transparent hover:border-[var(--accent-hover)] tracking-[0.16em]",
  }[variant];

  const combinedClasses = `${baseClasses} ${variant !== "text-link" ? sizeClasses : ""} ${variantClasses} ${className}`;

  if (href) {
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClasses}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

