import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "rectangular" | "rounded" | "circular" | "text";
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  ...props
}: SkeletonProps) {
  const variantClasses = {
    rectangular: "rounded-[2px]",
    rounded: "rounded-md",
    circular: "rounded-full",
    text: "rounded-[1px] h-4",
  }[variant];

  return (
    <div
      aria-hidden="true"
      className={`shimmer-luxury border border-[var(--border-hairline)] ${variantClasses} ${className}`}
      {...props}
    />
  );
}

