import React from "react";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow" | "full";
}

export function Container({
  children,
  className = "",
  size = "default",
  ...props
}: ContainerProps) {
  const sizeClasses = {
    // Narrow: perfect for longform editorial / lead forms / focus content
    narrow: "max-w-4xl",
    // Default: 1280px standard container
    default: "max-w-7xl",
    // Wide: 1440px full editorial grid
    wide: "max-w-[1440px]",
    // Full: 100% width with gutter padding
    full: "max-w-full",
  }[size];

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-12 ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Editorial 12-column grid container for asymmetric vehicle and spec compositions
 */
export function EditorialGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-8 sm:gap-y-12 ${className}`}
    >
      {children}
    </div>
  );
}

