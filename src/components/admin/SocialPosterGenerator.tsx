"use client";

import React, { useState } from "react";
import { Vehicle } from "@/types/vehicle";
import { CompanySettings } from "@/types/settings";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export interface SocialPosterGeneratorProps {
  vehicle: Vehicle;
  settings?: CompanySettings;
  onClose?: () => void;
  isModal?: boolean;
}

export function SocialPosterGenerator({
  vehicle,
  settings,
  onClose,
  isModal = false,
}: SocialPosterGeneratorProps) {
  const [activeFormat, setActiveFormat] = useState<"square" | "story">("square");
  const [activeTemplate, setActiveTemplate] = useState<"available" | "sold" | "incoming" | "reserved">(
    (vehicle.status as "available" | "sold" | "incoming" | "reserved") || "available"
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [customBadge, setCustomBadge] = useState<string>(
    vehicle.auctionGrade ? `Grade ${vehicle.auctionGrade} (${vehicle.auctionScore})` : "Direct Japanese Import"
  );
  const [activeCaptionTab, setActiveCaptionTab] = useState<"facebook" | "whatsapp" | "sold" | "bilingual">("facebook");
  const [copiedCaptionKey, setCopiedCaptionKey] = useState<string | null>(null);
  const [isCopyingImage, setIsCopyingImage] = useState<boolean>(false);
  const [copiedImageSuccess, setCopiedImageSuccess] = useState<boolean>(false);

  const phone = settings?.mainBranch.phone || "+94 27 222 0000";
  const mobile = settings?.mainBranch.mobile || "+94 77 123 4567";
  const whatsappDigits = (settings?.mainBranch.whatsapp || "94771234567").replace(/[^0-9]/g, "");
  const address = settings?.mainBranch.address || "No. 37/1, Kaduruwela, Polonnaruwa";
  const companyName = settings?.companyName || "RS Enterprises Company (Pvt) Ltd";
  const vehicleUrl = `https://rsenterprises.lk/vehicles/${vehicle.slug}`;
  const priceDisplay = vehicle.price
    ? `LKR ${vehicle.price.toLocaleString("en-US")}`
    : "Price on Call";

  // URL of the generated poster graphic
  const posterUrl = `/api/admin/og/${vehicle.id}?format=${activeFormat}&template=${activeTemplate}&imageIndex=${selectedImageIndex}&badge=${encodeURIComponent(
    customBadge
  )}&t=${Date.now()}`;

  // Download URL (without cachebuster for clean filename)
  const downloadApiUrl = `/api/admin/og/${vehicle.id}?format=${activeFormat}&template=${activeTemplate}&imageIndex=${selectedImageIndex}&badge=${encodeURIComponent(
    customBadge
  )}`;

  // ==========================================
  // CAPTION TEMPLATES
  // ==========================================

  // 1. Facebook & Instagram Post
  const facebookCaption = `🇯🇵 DIRECT JAPAN IMPORT | ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}
${vehicle.grade ? `✨ Package: ${vehicle.grade}\n` : ""}
${
  activeTemplate === "sold"
    ? "🎉 SOLD & DELIVERED! Congratulations to our valued client on taking delivery of this pristine vehicle from RS Enterprises."
    : activeTemplate === "reserved"
    ? "🔒 UNDER ADVANCE DEPOSIT HOLD. Backup priority inquiries welcome."
    : activeTemplate === "incoming"
    ? "🚢 IN-TRANSIT TO COLOMBO PORT. Direct Tokyo auction allocation. Early booking open."
    : "Now available for physical viewing and test drive at our Kaduruwela Showroom:"
}

KEY SPECIFICATIONS:
• Model Year: ${vehicle.year}
• Mileage: ${vehicle.mileage.toLocaleString()} KM (Genuine Certified Odometer)
• Engine: ${vehicle.engineCC} CC (${vehicle.fuel.toUpperCase()})
• Gearbox: ${vehicle.transmission.toUpperCase()}
• Drive: ${vehicle.driveType} • ${vehicle.seats} Passenger Seating
• Exterior Paint: ${vehicle.color}
• Condition: ${vehicle.registrationStatus === "unregistered" ? "Unregistered • 0 SL Owners" : "Registered Pre-Owned"}
• Japanese Auction Grade: Grade ${vehicle.auctionGrade} (${vehicle.auctionScore})
${vehicle.price && activeTemplate !== "sold" ? `• Showroom Valuation: ${priceDisplay}\n` : ""}
${vehicle.features.length > 0 ? `EQUIPMENT HIGHLIGHTS:\n${vehicle.features.slice(0, 6).map((f) => `• ${f}`).join("\n")}\n` : ""}
🛡️ Certified Japanese export certificate, verified auction inspection sheet, and authentic mileage documentation included.

📍 ${companyName.toUpperCase()}
Main Showroom & Head Office: ${address}
📞 Hotline: ${phone} | Mobile: ${mobile}
📲 WhatsApp: +${whatsappDigits}
🔗 Full specs & inspection sheet:
${vehicleUrl}

#RSEnterprises #JapaneseCarsSriLanka #${vehicle.make} #${vehicle.model.replace(/[\s-]+/g, "")} #Kaduruwela #Polonnaruwa #DirectImport #QualityAutomobiles`;

  // 2. WhatsApp Status / Broadcast
  const whatsappCaption = `🔥 *${companyName.toUpperCase()} | DIRECT JAPAN IMPORT*
🚗 *${vehicle.year} ${vehicle.make} ${vehicle.model}* ${vehicle.grade ? `(${vehicle.grade})` : ""}

${
  activeTemplate === "sold"
    ? "🎉 *STATUS: SOLD & DELIVERED!*"
    : activeTemplate === "reserved"
    ? "🔒 *STATUS: RESERVED (DEPOSIT HOLD)*"
    : activeTemplate === "incoming"
    ? "🚢 *STATUS: INCOMING VESSEL (BOOKING OPEN)*"
    : `💰 *Price: ${priceDisplay}*`
}
📊 *Mileage:* ${vehicle.mileage.toLocaleString()} KM Genuine
⚙️ *Specs:* ${vehicle.engineCC} CC | ${vehicle.fuel.toUpperCase()} | ${vehicle.transmission.toUpperCase()}
📍 *Location:* ${address}
🛡️ *Auction Grade:* ${vehicle.auctionGrade} (${vehicle.auctionScore})

📲 *Direct Call / WhatsApp:*
+${whatsappDigits} / ${phone}

👉 *View Photos & Inspection Sheet:*
${vehicleUrl}`;

  // 3. Celebratory "JUST SOLD" Post
  const soldCaption = `🎉 CONGRATULATIONS TO THE NEW OWNER! 🎉

Another pristine Japanese unit officially delivered from our Kaduruwela Showroom:
🚗 *${vehicle.year} ${vehicle.make} ${vehicle.model}* ${vehicle.grade ? `(${vehicle.grade})` : ""}
✨ Certified Auction Grade ${vehicle.auctionGrade} (${vehicle.auctionScore}) • ${vehicle.mileage.toLocaleString()} KM Genuine

We sincerely thank our valued customer for placing their trust in ${companyName}. Wishing you safe, joyful miles ahead!

Looking for an identical specification directly from Tokyo auctions? We import on order with transparent CIF valuations and duty clearance.

📍 ${companyName} | ${address}
📞 Hotline: ${phone} | WhatsApp: +${whatsappDigits}
🌐 rsenterprises.lk`;

  // 4. Sinhala & English Hybrid Post (Huge for Sri Lankan Auto Market)
  const bilingualCaption = `🇯🇵 ජපානයෙන් සෘජුවම ආනයනය කරන ලද සුපිරි වාහනයක්!
🚗 ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()} ${vehicle.grade ? `(${vehicle.grade})` : ""}

${activeTemplate === "sold" ? "🎉 SOLD & DELIVERED - අලෙවි කර භාර දෙන ලදී!" : `💰 Showroom Price: ${priceDisplay}`}
• Mileage: ${vehicle.mileage.toLocaleString()} KM (ඔරිජිනල් මීටර් වාර්තා සහිතයි)
• Engine: ${vehicle.engineCC} CC • ${vehicle.fuel.toUpperCase()}
• Transmission: ${vehicle.transmission.toUpperCase()}
• Condition: ${vehicle.registrationStatus === "unregistered" ? "Unregistered (ලංකාවේ ලියාපදිංචි නොකළ)" : "Registered"}
• Auction Grade: ${vehicle.auctionGrade} (${vehicle.auctionScore})

ජපන් Export Certificate සහ Auction Inspection Sheet පරීක්ෂා කර මිලදී ගත හැක.

📍 ආර්.එස්. එන්ටර්ප්‍රයිසස් (RS Enterprises)
කදුරුවෙල ප්‍රධාන ප්‍රදර්ශනාගාරය, පොළොන්නරුව
📞 දුරකථන: ${mobile} / ${phone}
📲 WhatsApp: +${whatsappDigits}
🔗 සම්පූර්ණ විස්තර සඳහා: ${vehicleUrl}`;

  const currentCaption =
    activeCaptionTab === "facebook"
      ? facebookCaption
      : activeCaptionTab === "whatsapp"
      ? whatsappCaption
      : activeCaptionTab === "sold"
      ? soldCaption
      : bilingualCaption;

  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(currentCaption);
      setCopiedCaptionKey(activeCaptionTab);
      setTimeout(() => setCopiedCaptionKey(null), 2500);
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }
  }

  async function handleCopyImage() {
    try {
      setIsCopyingImage(true);
      const response = await fetch(downloadApiUrl);
      const blob = await response.blob();
      // Only image/png is supported by ClipboardItem across modern browsers
      const pngBlob = blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": pngBlob,
        }),
      ]);
      setCopiedImageSuccess(true);
      setTimeout(() => setCopiedImageSuccess(false), 2500);
    } catch (err) {
      console.warn("Direct image copy to clipboard not supported on this browser:", err);
      // Fallback: trigger download
      handleDownload();
    } finally {
      setIsCopyingImage(false);
    }
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = downloadApiUrl;
    a.download = `${vehicle.slug}-${activeTemplate}-${activeFormat}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className={`space-y-6 ${isModal ? "p-4 sm:p-6" : "p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px]"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
        <div>
          <div className="flex items-center gap-2">
            <Eyebrow>Showroom Marketing Studio</Eyebrow>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 rounded-[1px] font-semibold uppercase">
              1080p Ultra HD
            </span>
          </div>
          <Heading level={2} className="text-2xl mt-1">
            Social Media Poster Generator
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
            Create branded Facebook, Instagram & WhatsApp posters and copy multi-platform captions with 1-click
          </p>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 inline-flex items-center justify-center rounded-[2px] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer self-end sm:self-auto"
            aria-label="Close Studio"
          >
            ✕
          </button>
        )}
      </div>

      {/* Control Bar: Format & Theme Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px]">
        {/* Aspect Ratio Selector */}
        <div className="sm:col-span-5 space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
            Graphic Aspect Ratio
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFormat("square")}
              className={`min-h-[38px] px-3 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
                activeFormat === "square"
                  ? "bg-[var(--accent)] text-stone-900 border-[var(--accent)] font-bold shadow-sm"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="w-3.5 h-3.5 border border-current rounded-[1px]" />
              <span>Square (1:1 Feed)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat("story")}
              className={`min-h-[38px] px-3 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
                activeFormat === "story"
                  ? "bg-[var(--accent)] text-stone-900 border-[var(--accent)] font-bold shadow-sm"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="w-2.5 h-4 border border-current rounded-[1px]" />
              <span>Story (9:16 Status)</span>
            </button>
          </div>
        </div>

        {/* Poster Theme / Marketing Angle */}
        <div className="sm:col-span-7 space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
            Marketing Campaign Theme
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTemplate("available");
                setActiveCaptionTab("facebook");
              }}
              className={`min-h-[38px] px-2 text-center text-[11px] font-sans uppercase font-medium tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
                activeTemplate === "available"
                  ? "bg-emerald-950/50 text-emerald-300 border-emerald-600 font-bold"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              Showroom Stock
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTemplate("sold");
                setActiveCaptionTab("sold");
              }}
              className={`min-h-[38px] px-2 text-center text-[11px] font-sans uppercase font-medium tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
                activeTemplate === "sold"
                  ? "bg-red-950/60 text-red-300 border-red-600 font-bold"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              🎉 Just Sold!
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTemplate("incoming");
                setActiveCaptionTab("whatsapp");
              }}
              className={`min-h-[38px] px-2 text-center text-[11px] font-sans uppercase font-medium tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
                activeTemplate === "incoming"
                  ? "bg-sky-950/60 text-sky-300 border-sky-600 font-bold"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              🚢 In-Transit
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTemplate("reserved");
                setActiveCaptionTab("whatsapp");
              }}
              className={`min-h-[38px] px-2 text-center text-[11px] font-sans uppercase font-medium tracking-wider rounded-[2px] transition-colors cursor-pointer border ${
                activeTemplate === "reserved"
                  ? "bg-amber-950/60 text-amber-300 border-amber-600 font-bold"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              🔒 Reserved
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (5 cols): Live Canvas & Download Buttons */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
            <span className="uppercase tracking-wider">
              Live Preview &bull; {activeFormat === "square" ? "1080×1080" : "1080×1920"}
            </span>
            <a
              href={downloadApiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline uppercase tracking-wider text-[10px]"
            >
              Open Full Res &rarr;
            </a>
          </div>

          {/* Interactive Poster Display Box */}
          <div
            className={`relative bg-[#0A0A0C] border border-[var(--border-subtle)] rounded-[2px] overflow-hidden flex items-center justify-center p-2 shadow-2xl transition-all ${
              activeFormat === "square" ? "aspect-square w-full" : "aspect-[9/16] max-h-[560px] mx-auto w-full max-w-[340px]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`${activeFormat}-${activeTemplate}-${selectedImageIndex}-${customBadge}`}
              src={posterUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} Poster`}
              className="w-full h-full object-contain select-none"
              loading="eager"
            />
          </div>

          {/* Quick Photo Switcher (if vehicle has multiple images) */}
          {vehicle.images.length > 1 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
                Select Photo Angle for Poster:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={`photo-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-10 rounded-[2px] overflow-hidden border shrink-0 transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40 scale-105"
                        : "border-[var(--border-hairline)] opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Highlight Tagline Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
              Badge Overlay on Poster:
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                placeholder="e.g. Grade 5.0 (A/A) or Zero Mileage in SL"
                className="flex-1 h-9 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            {/* Quick Preset Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                vehicle.auctionGrade ? `Grade ${vehicle.auctionGrade} (${vehicle.auctionScore})` : null,
                vehicle.registrationStatus === "unregistered" ? "Unregistered Direct Import" : null,
                "Genuine Odometer",
                "Duty Concession Unit",
                "Sunroof & 360 Camera",
              ]
                .filter(Boolean)
                .map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomBadge(preset as string)}
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-[1px] border transition-colors cursor-pointer ${
                      customBadge === preset
                        ? "bg-[var(--accent)] text-stone-900 border-[var(--accent)] font-bold"
                        : "bg-[var(--bg-base)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
            </div>
          </div>

          {/* Primary Action Buttons: Copy Image & Download PNG */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              disabled={isCopyingImage}
              onClick={handleCopyImage}
              className={`min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] border transition-all cursor-pointer ${
                copiedImageSuccess
                  ? "bg-green-800 text-white border-green-700 font-bold"
                  : "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
              title="Copy image directly to clipboard to paste into WhatsApp Web or Facebook"
            >
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copiedImageSuccess ? "Image Copied!" : isCopyingImage ? "Copying..." : "Copy Image"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-stone-900 hover:bg-[var(--accent-hover)] font-bold rounded-[2px] transition-colors cursor-pointer shadow-sm"
              title="Download 1080p Ultra-HD PNG file"
            >
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Captions Engine */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-2">
            {/* Caption Format Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveCaptionTab("facebook")}
                className={`min-h-[38px] px-3 text-xs font-sans uppercase font-medium tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
                  activeCaptionTab === "facebook"
                    ? "border-[var(--accent)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                📸 Social Post (FB/IG)
              </button>
              <button
                type="button"
                onClick={() => setActiveCaptionTab("whatsapp")}
                className={`min-h-[38px] px-3 text-xs font-sans uppercase font-medium tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
                  activeCaptionTab === "whatsapp"
                    ? "border-[var(--accent)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                💬 WhatsApp Broadcast
              </button>
              <button
                type="button"
                onClick={() => setActiveCaptionTab("sold")}
                className={`min-h-[38px] px-3 text-xs font-sans uppercase font-medium tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
                  activeCaptionTab === "sold"
                    ? "border-red-500 text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                🎉 Sold Celebration
              </button>
              <button
                type="button"
                onClick={() => setActiveCaptionTab("bilingual")}
                className={`min-h-[38px] px-3 text-xs font-sans uppercase font-medium tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
                  activeCaptionTab === "bilingual"
                    ? "border-[var(--accent)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                🇱🇰 Sinhala &amp; English
              </button>
            </div>

            {/* Copy Caption Button */}
            <button
              type="button"
              onClick={handleCopyCaption}
              className={`min-h-[40px] px-5 inline-flex items-center justify-center gap-1.5 text-xs font-sans uppercase font-medium tracking-wider rounded-[2px] transition-colors cursor-pointer shrink-0 shadow-sm ${
                copiedCaptionKey === activeCaptionTab
                  ? "bg-green-800 text-white font-bold"
                  : "bg-[var(--accent)] text-stone-900 font-bold hover:bg-[var(--accent-hover)]"
              }`}
            >
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copiedCaptionKey === activeCaptionTab ? "Copied!" : "Copy Caption"}</span>
            </button>
          </div>

          {/* Caption Text Box */}
          <div className="relative">
            <textarea
              readOnly
              rows={15}
              value={currentCaption}
              className="w-full p-4 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono rounded-[2px] leading-relaxed resize-none focus:outline-none"
            />
          </div>

          {/* Helpful Tips */}
          <div className="p-3.5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] space-y-1 text-xs font-light text-[var(--text-secondary)]">
            <p className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
              <span>💡</span>
              <span>Pro Showroom Marketing Tip:</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Click <strong>&ldquo;Copy Image&rdquo;</strong>, then open WhatsApp Web or Facebook and press <strong>Ctrl+V</strong> to paste the poster immediately. Then click <strong>&ldquo;Copy Caption&rdquo;</strong> to paste the complete specification and direct website link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
