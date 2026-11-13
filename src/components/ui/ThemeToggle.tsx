"use client";

import React, { useEffect, useState } from "react";

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read active theme from document attribute set by the blocking head script
    const currentTheme =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    setTheme(currentTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("rs_theme", nextTheme);
    } catch {
      // Ignore if localStorage is blocked
    }
  };

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme (currently ${theme})`}
      aria-pressed={isLight}
      className={`relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-2 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-luxury cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      
      {/* 
        Refined architectural Sun and Moon glyphs drawn as precision inline SVGs.
        Renders without layout shift even before hydration.
      */}
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun Icon (shown in Dark mode to switch to Light) */}
        <svg
          className={`w-4 h-4 transition-transform duration-500 stroke-current ${
            mounted && isLight ? "hidden" : "block rotate-0"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>

        {/* Moon Icon (shown in Light mode to switch to Dark) */}
        <svg
          className={`w-4 h-4 transition-transform duration-500 stroke-current ${
            mounted && isLight ? "block rotate-0" : "hidden"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>

      <span className="hidden sm:inline-block ml-2 text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
        {mounted ? (isLight ? "Light" : "Dark") : "Theme"}
      </span>
    </button>
  );
}

