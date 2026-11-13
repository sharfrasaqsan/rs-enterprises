import React from "react";

export interface NumeralProps {
  value: string | number;
  prefix?: string;
  suffix?: string;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Numeral({
  value,
  prefix,
  suffix,
  label,
  size = "md",
  className = "",
}: NumeralProps) {
  const sizeClasses = {
    sm: "text-lg sm:text-xl font-light",
    md: "text-2xl sm:text-3xl font-light",
    lg: "text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight",
    xl: "text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight",
  }[size];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-baseline font-serif tabular-nums text-[var(--text-primary)]">
        {prefix && (
          <span className="font-sans text-xs uppercase tracking-widest text-[var(--text-muted)] mr-1.5 font-normal">
            {prefix}
          </span>
        )}
        <span className={sizeClasses}>{value}</span>
        {suffix && (
          <span className="font-sans text-xs uppercase tracking-wider text-[var(--text-muted)] ml-1.5 font-normal">
            {suffix}
          </span>
        )}
      </div>
      {label && (
        <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">
          {label}
        </span>
      )}
    </div>
  );
}

