"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollRevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Respect user's motion preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            // Once revealed, unobserve to maintain optimal performance
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -50px 0px", // Trigger when 50px into view
        threshold: 0.05,
      }
    );

    // Observe all scroll reveal elements
    const elements = document.querySelectorAll(".reveal-on-scroll:not(.is-revealed)");
    elements.forEach((el) => {
      // If element is already in the viewport on load, reveal immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-revealed");
      } else {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}

