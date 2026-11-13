"use client";

import React, { useState } from "react";

export interface CompareToolbarProps {
  vehicleTitles: string[];
  shareUrl: string;
  showDiffOnly: boolean;
  onToggleDiff: (val: boolean) => void;
}

export function CompareToolbar({
  vehicleTitles,
  shareUrl,
  showDiffOnly,
  onToggleDiff,
}: CompareToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(shareUrl || window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const waShareText = encodeURIComponent(
    `Check out this vehicle comparison at RS Enterprises:\n${vehicleTitles.join(" vs ")}\n\n${shareUrl}`
  );
  const waShareUrl = `https://wa.me/?text=${waShareText}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] text-xs font-sans">
      {/* Left: Show Differences Only Toggle */}
      <div className="flex items-center space-x-3">
        <label
          htmlFor="toggle-diff"
          className="inline-flex items-center cursor-pointer select-none text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors min-h-[44px]"
        >
          <span
            className={`w-4 h-4 mr-2.5 rounded-[1px] border flex items-center justify-center transition-colors ${
              showDiffOnly
                ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-contrast)]"
                : "bg-[var(--bg-base)] border-[var(--border-subtle)]"
            }`}
          >
            {showDiffOnly && (
              <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
          <span className="uppercase tracking-wider font-medium text-[11px]">
            Highlight Differences Only
          </span>
        </label>
        <input
          id="toggle-diff"
          type="checkbox"
          checked={showDiffOnly}
          onChange={(e) => onToggleDiff(e.target.checked)}
          className="sr-only"
        />
      </div>

      {/* Right: Share on WhatsApp & Copy Link Actions */}
      <div className="flex items-center space-x-3">
        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center min-h-[44px] px-3.5 py-1.5 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] uppercase tracking-wider font-medium text-[11px] transition-luxury cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <svg className="w-3.5 h-3.5 mr-1.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>{copied ? "Link Copied!" : "Copy Link"}</span>
        </button>

        {/* Share on WhatsApp */}
        <a
          href={waShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center min-h-[44px] px-4 py-1.5 rounded-[2px] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] uppercase tracking-wider font-medium text-[11px] transition-luxury focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          aria-label="Share comparison on WhatsApp"
        >
          <svg className="w-3.5 h-3.5 mr-1.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>Share Comparison</span>
        </a>
      </div>
    </div>
  );
}
