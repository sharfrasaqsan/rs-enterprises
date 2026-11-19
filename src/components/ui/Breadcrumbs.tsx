import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumbs" className="w-full text-xs font-sans text-[var(--text-muted)]">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 py-0.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isHome = index === 0 && item.label.toLowerCase() === "home" && items.length > 2;

          return (
            <li
              key={index}
              className={`inline-flex items-center min-w-0 ${isHome ? "hidden sm:inline-flex" : ""}`}
            >
              {index > 0 && (
                <span
                  className={`mr-1.5 text-[var(--border-subtle)] select-none ${
                    index === 1 && isHome ? "hidden sm:inline" : ""
                  }`}
                  aria-hidden="true"
                >
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className="font-medium text-[var(--text-primary)] truncate max-w-[240px] sm:max-w-none"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[var(--accent)] transition-colors uppercase tracking-wider text-[11px] shrink-0"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
