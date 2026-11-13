"use client";

import React, { useState } from "react";
import { CompanySettings } from "@/types/settings";
import { useAdminAuth } from "@/app/admin/AdminAuthContext";
import { updateCompanySettingsAction } from "@/app/actions/admin";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: CompanySettings;
}) {
  const { user } = useAdminAuth();
  const isOwner = user?.role === "owner";

  const [settings, setSettings] = useState<CompanySettings>(initialSettings);
  const [isPending, setIsPending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Kaduruwela Main Branch
  const [kaduAddress, setKaduAddress] = useState(settings.mainBranch.address);
  const [kaduPhone, setKaduPhone] = useState(settings.mainBranch.phone);
  const [kaduMobile, setKaduMobile] = useState(settings.mainBranch.mobile);
  const [kaduWhatsapp, setKaduWhatsapp] = useState(settings.mainBranch.whatsapp);
  const [kaduEmail, setKaduEmail] = useState(settings.mainBranch.email);
  const [kaduHours, setKaduHours] = useState(settings.mainBranch.hours);

  // Trincomalee Coastal Branch
  const [trincoAddress, setTrincoAddress] = useState(settings.coastalBranch.address);
  const [trincoPhone, setTrincoPhone] = useState(settings.coastalBranch.phone);
  const [trincoMobile, setTrincoMobile] = useState(settings.coastalBranch.mobile);
  const [trincoWhatsapp, setTrincoWhatsapp] = useState(settings.coastalBranch.whatsapp);
  const [trincoEmail, setTrincoEmail] = useState(settings.coastalBranch.email);
  const [trincoHours, setTrincoHours] = useState(settings.coastalBranch.hours);
  const [trincoStatus, setTrincoStatus] = useState<"operational" | "coming_soon">(
    settings.coastalBranch.status || "coming_soon"
  );

  // Site-Wide Announcement Banner
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    Boolean(settings.announcement?.enabled)
  );
  const [announcementText, setAnnouncementText] = useState(
    settings.announcement?.text || ""
  );
  const [announcementLink, setAnnouncementLink] = useState(
    settings.announcement?.link || ""
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;

    setIsPending(true);
    setStatusMsg(null);

    const updated: CompanySettings = {
      ...settings,
      mainBranch: {
        ...settings.mainBranch,
        address: kaduAddress,
        phone: kaduPhone,
        mobile: kaduMobile,
        whatsapp: kaduWhatsapp,
        email: kaduEmail,
        hours: kaduHours,
      },
      coastalBranch: {
        ...settings.coastalBranch,
        address: trincoAddress,
        phone: trincoPhone,
        mobile: trincoMobile,
        whatsapp: trincoWhatsapp,
        email: trincoEmail,
        hours: trincoHours,
        status: trincoStatus,
      },
      announcement: {
        enabled: announcementEnabled,
        text: announcementText.trim(),
        link: announcementLink.trim(),
      },
      updatedAt: new Date().toISOString(),
    };

    const res = await updateCompanySettingsAction(updated);
    setIsPending(false);

    if (res.success) {
      setSettings(updated);
      setStatusMsg({
        type: "success",
        text: "Dealership configuration and announcement banner saved. Whole site layout revalidated.",
      });
    } else {
      setStatusMsg({
        type: "error",
        text: res.error || "Failed to update settings.",
      });
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="pb-6 border-b border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Eyebrow>Director Configuration</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            Showroom &amp; Site Settings
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Showroom hotlines, branch addresses, and site-wide announcement broadcast
          </p>
        </div>

        {!isOwner && (
          <span className="text-[10px] font-mono px-3 py-1 bg-amber-950/20 text-amber-400 border border-amber-800 self-start sm:self-auto">
            Staff View &bull; Director permissions required to save changes
          </span>
        )}
      </div>

      {statusMsg && (
        <div
          className={`p-4 text-xs ${
            statusMsg.type === "success"
              ? "bg-green-950/20 border border-green-800 text-green-300"
              : "bg-red-950/20 border border-red-800 text-red-300"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Site-Wide Announcement Banner */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
              01. Site-Wide Announcement Banner
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isOwner}
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)] rounded-[2px]"
              />
              <span className="text-xs font-sans uppercase font-medium tracking-wider text-[var(--text-primary)]">
                {announcementEnabled ? "Banner Active" : "Banner Disabled"}
              </span>
            </label>
          </div>

          <p className="text-xs text-[var(--text-secondary)] font-light">
            When enabled, this marquee banner appears across the very top of all public pages.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label
                htmlFor="banner-text"
                className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
              >
                Announcement Message Text
              </label>
              <input
                id="banner-text"
                type="text"
                disabled={!isOwner || !announcementEnabled}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. Direct Japan Shipment: Priority booking open for Toyota Land Cruiser Prado units arriving at Hambantota Port"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="banner-link"
                className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
              >
                Target URL (Optional)
              </label>
              <input
                id="banner-link"
                type="text"
                disabled={!isOwner || !announcementEnabled}
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="e.g. /incoming or /vehicles"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Kaduruwela Main Showroom (Polonnaruwa) */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
            02. Kaduruwela Main Showroom (Polonnaruwa)
          </span>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="kadu-address"
                className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
              >
                Physical Address *
              </label>
              <input
                id="kadu-address"
                type="text"
                required
                disabled={!isOwner}
                value={kaduAddress}
                onChange={(e) => setKaduAddress(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="kadu-phone"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  Landline Hotline
                </label>
                <input
                  id="kadu-phone"
                  type="text"
                  disabled={!isOwner}
                  value={kaduPhone}
                  onChange={(e) => setKaduPhone(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60 font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="kadu-mobile"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  Mobile Number
                </label>
                <input
                  id="kadu-mobile"
                  type="text"
                  disabled={!isOwner}
                  value={kaduMobile}
                  onChange={(e) => setKaduMobile(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="kadu-whatsapp"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  WhatsApp Number (with Country Code) *
                </label>
                <input
                  id="kadu-whatsapp"
                  type="text"
                  required
                  disabled={!isOwner}
                  value={kaduWhatsapp}
                  onChange={(e) => setKaduWhatsapp(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60 font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="kadu-email"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  Branch Email *
                </label>
                <input
                  id="kadu-email"
                  type="email"
                  required
                  disabled={!isOwner}
                  value={kaduEmail}
                  onChange={(e) => setKaduEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60 font-mono"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="kadu-hours"
                className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
              >
                Showroom Operating Hours *
              </label>
              <input
                id="kadu-hours"
                type="text"
                required
                disabled={!isOwner}
                value={kaduHours}
                onChange={(e) => setKaduHours(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Trincomalee Coastal Branch */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
            03. Trincomalee Coastal Branch
          </span>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="trinco-address"
                className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
              >
                Branch Address (or Location Description)
              </label>
              <input
                id="trinco-address"
                type="text"
                disabled={!isOwner}
                value={trincoAddress}
                onChange={(e) => setTrincoAddress(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="trinco-phone"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  Branch Telephone
                </label>
                <input
                  id="trinco-phone"
                  type="text"
                  disabled={!isOwner}
                  value={trincoPhone}
                  onChange={(e) => setTrincoPhone(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60 font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="trinco-mobile"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  Branch Mobile
                </label>
                <input
                  id="trinco-mobile"
                  type="text"
                  disabled={!isOwner}
                  value={trincoMobile}
                  onChange={(e) => setTrincoMobile(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="trinco-whatsapp"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  WhatsApp Number
                </label>
                <input
                  id="trinco-whatsapp"
                  type="text"
                  disabled={!isOwner}
                  value={trincoWhatsapp}
                  onChange={(e) => setTrincoWhatsapp(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60 font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="trinco-email"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  Branch Email
                </label>
                <input
                  id="trinco-email"
                  type="email"
                  disabled={!isOwner}
                  value={trincoEmail}
                  onChange={(e) => setTrincoEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="trinco-hours"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  Branch Hours
                </label>
                <input
                  id="trinco-hours"
                  type="text"
                  disabled={!isOwner}
                  value={trincoHours}
                  onChange={(e) => setTrincoHours(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="trinco-status"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                >
                  Branch Status
                </label>
                <select
                  id="trinco-status"
                  disabled={!isOwner}
                  value={trincoStatus}
                  onChange={(e) =>
                    setTrincoStatus(e.target.value as "operational" | "coming_soon")
                  }
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60"
                >
                  <option value="operational">Operational Showroom</option>
                  <option value="coming_soon">Coming Soon (Expansion)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Legal Registration Details */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
            04. Entity Legal Registration
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] block">
                Company Legal Name
              </span>
              <p className="text-sm font-serif text-[var(--text-primary)] mt-1">
                {settings.companyName}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.16em] text-[var(--text-secondary)] block">
                Business Registration Number
              </span>
              <p className="text-sm font-mono text-[var(--accent)] font-semibold mt-1">
                {settings.registrationNumber}
              </p>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex justify-end pt-4 border-t border-[var(--border-hairline)]">
            <button
              type="submit"
              disabled={isPending}
              className="min-h-[44px] px-8 inline-flex items-center text-xs font-sans uppercase font-medium tracking-[0.2em] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isPending ? "Saving..." : "Save Settings & Revalidate Site"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
