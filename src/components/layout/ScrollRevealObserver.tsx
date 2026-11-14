"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollRevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // If native CSS scroll-driven animations are supported, let CSS handle it with 0 JS overhead
    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("animation-timeline", "view()")) {
      return;
    }

    // Respect reduced motion accessibility preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
        el.setAttribute("data-revealed", "true");
      });
      return;
    }

    // Delay observer setup until after React initial hydration is 100% complete
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-revealed", "true");
              observer.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -40px 0px",
          threshold: 0.08,
        }
      );

      const elements = document.querySelectorAll(".reveal-on-scroll:not([data-revealed='true'])");
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // If already above the fold, reveal immediately without animation
        if (rect.top < window.innerHeight) {
          el.setAttribute("data-revealed", "true");
        } else {
          observer.observe(el);
        }
      });

      return () => observer.disconnect();
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
