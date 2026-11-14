import React from "react";
import Image, { ImageProps } from "next/image";

export interface VehicleImageProps {
  src: string;
  alt: string;
  aspectRatio?: "16/9" | "16/10" | "4/3" | "1/1" | "21/9";
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  quality?: number;
}

export function VehicleImage({
  src,
  alt,
  aspectRatio = "16/10",
  priority = false,
  className = "",
  imageClassName = "",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 85,
}: VehicleImageProps) {
  const aspectClasses = {
    "16/9": "aspect-[16/9]",
    "16/10": "aspect-[16/10]",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "21/9": "aspect-[21/9]",
  }[aspectRatio];

  // Resolve placeholders to real high-resolution luxury automotive photography
  const resolvedSrc =
    !src || src.includes("sample-prado.svg")
      ? "/images/vehicles/land-cruiser-300.jpg"
      : src.includes("sample-vezel.svg")
      ? "/images/vehicles/vezel-hybrid.jpg"
      : src;

  return (
    <div
      className={`relative overflow-hidden rounded-[2px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] group ${aspectClasses} ${className}`}
    >
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes={sizes}
        quality={quality}
        className={`object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${imageClassName}`}
      />
      {/* Subtle showroom gradient overlay for atmospheric depth and contrast */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[var(--bg-base)]/40 via-transparent to-transparent opacity-60"
        aria-hidden="true"
      />
    </div>
  );
}

