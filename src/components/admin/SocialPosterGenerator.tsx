"use client";

import React, { useState } from "react";
import { Vehicle } from "@/types/vehicle";
import { CompanySettings } from "@/types/settings";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function SocialPosterGenerator({
  vehicle,
  settings,
}: {
  vehicle: Vehicle;
  settings?: CompanySettings;
}) {
  const [activeFormat, setActiveFormat] = useState<"square" | "story">("square");
  const [activeCaptionTab, setActiveCaptionTab] = useState<"english" | "whatsapp">("english");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const phone = settings?.mainBranch.phone || "+94 27 222 0000";
  const mobile = settings?.mainBranch.mobile || "+94 77 123 4567";
  const whatsappDigits = settings?.mainBranch.whatsapp || "94771234567";
  const vehicleUrl = `https://rsenterprises.lk/vehicles/${vehicle.slug}`;
  const priceDisplay = vehicle.price
    ? `LKR ${vehicle.price.toLocaleString("en-US")}`
    : "Price on Call";

  // Template 1: English Social Caption (Facebook / Instagram)
  const englishCaption = `🇯🇵 DIRECT FROM JAPAN | ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}

Now available for viewing at RS Enterprises Kaduruwela Showroom:
• Model: ${vehicle.year} ${vehicle.make} ${vehicle.model}
• Grade / Package: ${vehicle.grade || "Standard"}
• Mileage: ${vehicle.mileage.toLocaleString()} KM (Auction Certified Original)
• Engine: ${vehicle.engineCC} CC (${vehicle.fuel.toUpperCase()})
• Transmission: ${vehicle.transmission.toUpperCase()}
• Color: ${vehicle.color}
• Price: ${priceDisplay}
${vehicle.features.length > 0 ? `• Highlights: ${vehicle.features.slice(0, 5).join(", ")}\n` : ""}
Authentic Japanese auction unit with verified export certificate and JEVIC inspection.

📍 RS Enterprises Company Pvt Ltd
Main Showroom: No.37/1, Kaduruwela, Polonnaruwa
📞 Hotline: ${phone} | Mobile: ${mobile}
📲 WhatsApp: +${whatsappDigits}
🔗 Full specs & public dossier:
${vehicleUrl}

#RSEnterprises #JapaneseCarsSriLanka #${vehicle.make} #${vehicle.model.replace(/[\s-]+/g, "")} #Kaduruwela #DirectImport`;

  // Template 2: Short WhatsApp Style
  const whatsappCaption = `🔥 *RS Enterprises | Direct Japan Import*
🚗 *${vehicle.year} ${vehicle.make} ${vehicle.model}* ${vehicle.grade ? `(${vehicle.grade})` : ""}
💰 *Price: ${priceDisplay}*
📊 Mileage: ${vehicle.mileage.toLocaleString()} KM | ${vehicle.engineCC} CC ${vehicle.fuel}
📍 Kaduruwela Showroom, Polonnaruwa
📲 Call/WhatsApp: +${whatsappDigits}
👉 Complete Details & Photos:
${vehicleUrl}`;

  const currentCaption = activeCaptionTab === "english" ? englishCaption : whatsappCaption;

  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(currentCaption);
      setCopiedKey(activeCaptionTab);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }
  }

  function handleDownload(fmt: "square" | "story") {
    const downloadUrl = `/api/admin/og/${vehicle.id}?format=${fmt}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${vehicle.slug}-${fmt}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-6 rounded-[2px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <Eyebrow>Marketing &amp; Media Kit</Eyebrow>
          <Heading level={2} className="text-2xl mt-0.5">
            Branded Social Poster Generator
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
            Generate high-resolution PNG graphics and template captions for social media broadcasts
          </p>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFormat("square")}
            className={`min-h-[36px] px-3 text-xs font-sans uppercase font-medium tracking-wider rounded-[1px] transition-colors cursor-pointer ${
              activeFormat === "square"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Square (1080×1080)
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat("story")}
            className={`min-h-[36px] px-3 text-xs font-sans uppercase font-medium tracking-wider rounded-[1px] transition-colors cursor-pointer ${
              activeFormat === "story"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Story (1080×1920)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Poster Preview Card */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
            Generated Graphic Preview ({activeFormat === "square" ? "1:1 Feed" : "9:16 Story"}):
          </span>

          <div
            className={`relative bg-neutral-950 border border-[var(--border-subtle)] rounded-[2px] overflow-hidden flex items-center justify-center p-2 shadow-lg ${
              activeFormat === "square" ? "aspect-square" : "aspect-[9/16] max-h-[520px] mx-auto"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/og/${vehicle.id}?format=${activeFormat}`}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} Social Poster`}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>

          {/* Action Download Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDownload("square")}
              className="min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors rounded-[2px] cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Square</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload("story")}
              className="min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors rounded-[2px] cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Story</span>
            </button>
          </div>
        </div>

        {/* Right Column: Template Captions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCaptionTab("english")}
                className={`text-xs font-sans uppercase font-medium tracking-wider min-h-[38px] px-3 border-b-2 transition-colors cursor-pointer ${
                  activeCaptionTab === "english"
                    ? "border-[var(--accent)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                English Post Caption
              </button>
              <button
                type="button"
                onClick={() => setActiveCaptionTab("whatsapp")}
                className={`text-xs font-sans uppercase font-medium tracking-wider min-h-[38px] px-3 border-b-2 transition-colors cursor-pointer ${
                  activeCaptionTab === "whatsapp"
                    ? "border-[var(--accent)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Short WhatsApp Broadcast
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyCaption}
              className={`min-h-[44px] px-5 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] transition-colors cursor-pointer shadow-sm ${
                copiedKey === activeCaptionTab
                  ? "bg-green-800 text-white"
                  : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{copiedKey === activeCaptionTab ? "Copied!" : "Copy Caption"}</span>
            </button>
          </div>

          {/* Caption Text Box */}
          <div className="relative">
            <textarea
              readOnly
              rows={12}
              value={currentCaption}
              className="w-full p-4 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono rounded-[2px] leading-relaxed resize-none focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] font-light leading-relaxed">
            &bull; Ready to paste directly into Facebook Page, Instagram captions, Threads, or WhatsApp broadcast groups.
            Includes verified vehicle specifications and direct link to the live public dossier.
          </p>
        </div>
      </div>
    </div>
  );
}

