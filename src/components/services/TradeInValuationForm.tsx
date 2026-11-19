"use client";

import React, { useState, useRef } from "react";
import { createLeadAction, CreateLeadResult } from "@/app/actions/leads";
import { CompanySettings } from "@/types/settings";
import { buildWhatsAppUrl } from "@/lib/phone";

const COMMON_MAKES = [
  "Toyota",
  "Honda",
  "Nissan",
  "Mitsubishi",
  "Suzuki",
  "Land Rover",
  "Mercedes-Benz",
  "BMW",
  "Hyundai",
  "Kia",
  "Mazda",
  "Subaru",
  "Other",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 27 }, (_, i) => CURRENT_YEAR - i);

interface PhotoItem {
  id: string;
  dataUrl: string;
  name: string;
  sizeKb: number;
}

export function TradeInValuationForm({
  settings,
}: {
  settings?: CompanySettings;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [make, setMake] = useState("Toyota");
  const [customMake, setCustomMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(2018);
  const [expectedPrice, setExpectedPrice] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuel, setFuel] = useState("petrol");
  const [transmission, setTransmission] = useState("automatic");
  const [regStatus, setRegStatus] = useState("registered");
  const [regPlate, setRegPlate] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [tradeIntent, setTradeIntent] = useState("trade_for_showroom");

  // Contact Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState<"polonnaruwa" | "trincomalee">("polonnaruwa");

  // Photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Submission State
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<CreateLeadResult | null>(null);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);

  // Compress selected files to WebP (max 1200px) so payloads remain light
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 8) {
      setUploadError("Maximum 8 photos can be submitted per valuation request.");
      return;
    }

    setIsCompressing(true);
    setUploadError(null);

    const newItems: PhotoItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const compressed = await compressImageToWebp(file);
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dataUrl: compressed.dataUrl,
          name: file.name,
          sizeKb: Math.round(compressed.size / 1024),
        });
      }

      setPhotos((prev) => [...prev, ...newItems]);
    } catch {
      setUploadError("Unable to process one or more images. Please check your image format.");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemovePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setResult(null);

    const activeMake = make === "Other" && customMake.trim() ? customMake.trim() : make;
    const cleanModel = model.trim();
    const cleanPrice = expectedPrice.trim();

    if (!cleanModel) {
      setResult({ success: false, error: "Please enter your vehicle model (e.g. Premio 1.5, Vezel Z)." });
      setIsPending(false);
      return;
    }
    if (!cleanPrice) {
      setResult({ success: false, error: "Please enter your expected trade-in valuation price." });
      setIsPending(false);
      return;
    }
    if (!name.trim()) {
      setResult({ success: false, error: "Please enter your full name." });
      setIsPending(false);
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setResult({ success: false, error: "Please enter a valid Sri Lankan mobile number (e.g. 077 123 4567)." });
      setIsPending(false);
      return;
    }

    const tradeIntentLabel =
      tradeIntent === "trade_for_showroom"
        ? "Exchange towards an available showroom car"
        : tradeIntent === "direct_import"
        ? "Exchange against a custom Tokyo auction import"
        : "Outright sale for showroom acquisition";

    const fullSpecs = [
      `[TRADE-IN VALUATION REQUEST]`,
      `Vehicle: ${year} ${activeMake} ${cleanModel}`,
      `Expected Price: LKR ${cleanPrice}`,
      `Mileage: ${mileage ? `${mileage.trim()} km` : "Not specified"}`,
      `Powertrain: ${fuel.toUpperCase()} | ${transmission.toUpperCase()}`,
      `Registration: ${regStatus.toUpperCase()}${regPlate ? ` (${regPlate.trim()})` : ""}`,
      `Trade Intent: ${tradeIntentLabel}`,
      `Preferred Showroom Branch: ${branch === "trincomalee" ? "Trincomalee Branch" : "Kaduruwela Main Showroom"}`,
      conditionNotes.trim() ? `Condition & Options: ${conditionNotes.trim()}` : "",
      photos.length > 0 ? `Photos Attached: ${photos.length} photo(s) submitted` : "Photos: None attached",
    ]
      .filter(Boolean)
      .join("\n");

    const submissionData = new FormData();
    submissionData.append("name", name.trim());
    submissionData.append("phone", phone.trim());
    if (email.trim()) submissionData.append("email", email.trim());
    submissionData.append("branch", branch);
    submissionData.append("source", "trade_in");
    submissionData.append("vehicleTitle", `Trade-In: ${year} ${activeMake} ${cleanModel} (Exp: LKR ${cleanPrice})`);
    submissionData.append("requestDetails", fullSpecs);
    submissionData.append("initialNote", fullSpecs);

    // Attach compressed photos
    const photoDataUrls = photos.map((p) => p.dataUrl);
    if (photoDataUrls.length > 0) {
      submissionData.append("photos", JSON.stringify(photoDataUrls));
    }

    // Honeypot trap
    const hp = (e.currentTarget.elements.namedItem("_hp_verify") as HTMLInputElement)?.value || "";
    submissionData.append("_hp_verify", hp);

    try {
      const res = await createLeadAction(submissionData);
      setResult(res);
      if (res.success) {
        setSubmittedLeadId(res.leadId || null);
      }
    } catch {
      setResult({
        success: false,
        error: "A network error occurred. Please contact our Kaduruwela showroom directly on WhatsApp.",
      });
    } finally {
      setIsPending(false);
    }
  }

  function handleReset() {
    setResult(null);
    setSubmittedLeadId(null);
    setModel("");
    setExpectedPrice("");
    setMileage("");
    setRegPlate("");
    setConditionNotes("");
    setPhotos([]);
  }

  // Pre-formatted WhatsApp follow-up link
  const activeMake = make === "Other" && customMake.trim() ? customMake.trim() : make;
  const showroomPhone =
    branch === "trincomalee"
      ? settings?.coastalBranch.whatsapp || "94770000000"
      : settings?.mainBranch.whatsapp || "94770000000";

  const waFollowUpUrl = buildWhatsAppUrl(
    showroomPhone,
    `Hello RS Enterprises, I just submitted an online trade-in valuation request for my ${year} ${activeMake} ${model} (Expected: LKR ${expectedPrice})${
      submittedLeadId ? ` [Ref: ${submittedLeadId}]` : ""
    }. Could you please confirm inspection availability?`
  );

  return (
    <div id="valuation-form" className="w-full max-w-4xl mx-auto scroll-mt-20">
      {result?.success ? (
        <div className="p-8 sm:p-10 bg-[var(--bg-surface)] border border-[var(--accent)] rounded-[2px] shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
              Trade-In Request Received &bull; Ref: {submittedLeadId || "CRM Intake"}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-3xl text-[var(--text-primary)]">
              Trade-In Request Submitted Successfully
            </h3>
            <p className="text-sm font-light text-[var(--text-secondary)] leading-relaxed">
              Thank you, <strong className="text-[var(--text-primary)] font-medium">{name}</strong>. Our vehicle
              valuation team has received the details for your{" "}
              <strong className="text-[var(--text-primary)] font-medium">
                {year} {activeMake} {model}
              </strong>
              {photos.length > 0 && ` along with ${photos.length} photo(s)`}.
            </p>
          </div>

          <div className="p-5 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] text-xs space-y-2 font-mono text-[var(--text-secondary)]">
            <p className="text-[var(--text-primary)] font-semibold uppercase tracking-wider">
              ✦ Next Valuation Steps:
            </p>
            <p>&bull; Current Sri Lankan market price comparison.</p>
            <p>&bull; Rapid response within 24 business hours.</p>
            <p>
              &bull; Free vehicle inspection scheduled at our{" "}
              <span className="text-[var(--accent)]">
                {branch === "trincomalee" ? "Trincomalee Branch" : "Kaduruwela Main Showroom"}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href={waFollowUpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[48px] px-6 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.16em] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-luxury shadow-md"
            >
              Confirm on WhatsApp &rarr;
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[48px] px-6 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.16em] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              Submit Another Vehicle
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-10 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] shadow-2xl space-y-8"
        >
          {/* Honeypot Trap */}
          <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
            <input type="text" name="_hp_verify" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>

          {/* Form Header */}
          <div className="border-b border-[var(--border-hairline)] pb-6 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] block">
              Showroom Trade-In &bull; Instant Vehicle Valuation
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)]">
              Your Vehicle Information
            </h3>
            <p className="text-xs font-light text-[var(--text-secondary)] leading-relaxed pt-1">
              Provide your vehicle details and photographs. We will benchmark against current retail market
              transactions to offer a competitive trade-in valuation.
            </p>
          </div>

          {result?.error && (
            <div className="p-4 bg-red-950/20 border border-red-800 text-xs text-red-300 rounded-[2px]">
              {result.error}
            </div>
          )}

          {/* SECTION 1: VEHICLE SPECIFICATIONS */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-[1px]" />
              <span className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[var(--text-primary)]">
                1. Vehicle Specifications
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Make */}
              <div>
                <label
                  htmlFor="ti-make"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Vehicle Make *
                </label>
                <select
                  id="ti-make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  required
                >
                  {COMMON_MAKES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {make === "Other" && (
                  <input
                    type="text"
                    value={customMake}
                    onChange={(e) => setCustomMake(e.target.value)}
                    placeholder="Specify Make..."
                    className="w-full h-10 px-3 mt-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                    required
                  />
                )}
              </div>

              {/* Model */}
              <div>
                <label
                  htmlFor="ti-model"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Model &amp; Trim *
                </label>
                <input
                  id="ti-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Premio F-EX, Vezel Z, Axio"
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              {/* Year */}
              <div>
                <label
                  htmlFor="ti-year"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Manufacture Year *
                </label>
                <select
                  id="ti-year"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  required
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Price */}
              <div>
                <label
                  htmlFor="ti-price"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Expected Price (LKR) *
                </label>
                <input
                  id="ti-price"
                  type="text"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  placeholder="e.g. 14,500,000 or 14.5M"
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
            </div>

            {/* Secondary Vehicle Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Current Mileage */}
              <div>
                <label
                  htmlFor="ti-mileage"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Current Mileage (km)
                </label>
                <input
                  id="ti-mileage"
                  type="number"
                  min={0}
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g. 64000"
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Fuel Type */}
              <div>
                <label
                  htmlFor="ti-fuel"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Powertrain / Fuel
                </label>
                <select
                  id="ti-fuel"
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="petrol">Petrol</option>
                  <option value="hybrid">Petrol Hybrid</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric (EV)</option>
                </select>
              </div>

              {/* Transmission */}
              <div>
                <label
                  htmlFor="ti-transmission"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Transmission
                </label>
                <select
                  id="ti-transmission"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="automatic">Automatic</option>
                  <option value="cvt">CVT Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {/* Registration Status */}
              <div>
                <label
                  htmlFor="ti-reg-status"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Registration Status
                </label>
                <select
                  id="ti-reg-status"
                  value={regStatus}
                  onChange={(e) => setRegStatus(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="registered">Registered (Number Plate)</option>
                  <option value="unregistered">Unregistered (Permit / Direct)</option>
                </select>
              </div>

              {/* Number Plate / Registration */}
              <div>
                <label
                  htmlFor="ti-reg"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  {regStatus === "registered" ? "Number Plate (e.g. WP CAA-xxxx)" : "Chassis / Import Ref"}
                </label>
                <input
                  id="ti-reg"
                  type="text"
                  value={regPlate}
                  onChange={(e) => setRegPlate(e.target.value)}
                  placeholder={regStatus === "registered" ? "e.g. WP CAA-8291" : "e.g. FJA300-xxxx"}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {/* Condition Notes */}
            <div>
              <label
                htmlFor="ti-condition"
                className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                Condition, Ownership &amp; Options
              </label>
              <textarea
                id="ti-condition"
                rows={2}
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                placeholder="e.g. 1st owner, company maintained with records, hybrid battery replaced in 2024, new tyres, zero major accidents."
                className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION 2: VEHICLE PHOTOGRAPHS */}
          <div className="space-y-4 pt-4 border-t border-[var(--border-hairline)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-[1px]" />
                <span className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[var(--text-primary)]">
                  2. Vehicle Photographs
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                Up to 8 photos &bull; Exterior, Interior &amp; Odometer
              </span>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-[2px] text-center cursor-pointer transition-colors bg-[var(--bg-base)] group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center space-y-2">
                <svg
                  className="w-8 h-8 stroke-[var(--text-muted)] group-hover:stroke-[var(--accent)] transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-xs font-sans uppercase tracking-[0.16em] text-[var(--text-primary)] group-hover:text-[var(--accent)] font-medium">
                  {isCompressing ? "Optimizing & Compressing Images..." : "Click or Drag to Upload Photos"}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] font-light">
                  Recommended: Front 3/4 angle, Rear, Interior cockpit, Odometer reading (JPG, PNG, WebP)
                </span>
              </div>
            </div>

            {uploadError && (
              <p className="text-[11px] text-red-400 font-mono">{uploadError}</p>
            )}

            {/* Thumbnail Preview Grid */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                  <span>
                    {photos.length} photo(s) selected &bull; Total size:{" "}
                    {photos.reduce((acc, p) => acc + p.sizeKb, 0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhotos([])}
                    className="text-red-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group relative aspect-video rounded-[2px] overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-base)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.dataUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-black/75 px-1 py-0.5 text-[8px] font-mono text-white rounded-[1px]">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(item.id);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/80 hover:bg-red-900 text-white flex items-center justify-center rounded-[1px] text-xs transition-colors"
                        title="Remove photo"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: CONTACT & HANDOVER PREFERENCES */}
          <div className="space-y-5 pt-4 border-t border-[var(--border-hairline)]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-[1px]" />
              <span className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[var(--text-primary)]">
                3. Customer Contact &amp; Next Step
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="ti-name"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Full Name *
                </label>
                <input
                  id="ti-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priyantha Jayasundara"
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="ti-phone"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Mobile / WhatsApp *
                </label>
                <input
                  id="ti-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 077 123 4567"
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="ti-email"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Email Address (Optional)
                </label>
                <input
                  id="ti-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Trade Intent */}
              <div>
                <label
                  htmlFor="ti-intent"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Valuation Objective
                </label>
                <select
                  id="ti-intent"
                  value={tradeIntent}
                  onChange={(e) => setTradeIntent(e.target.value)}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="trade_for_showroom">Trade-in towards an available showroom car</option>
                  <option value="direct_import">Trade-in against a custom Japanese auction import</option>
                  <option value="outright_sale">Sell for Cash (Direct Sale to Showroom)</option>
                </select>
              </div>

              {/* Preferred Branch */}
              <div>
                <label
                  htmlFor="ti-branch"
                  className="block text-[10px] font-sans uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Preferred Inspection Showroom
                </label>
                <select
                  id="ti-branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value as "polonnaruwa" | "trincomalee")}
                  className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="polonnaruwa">Kaduruwela Main Showroom (Polonnaruwa)</option>
                  <option value="trincomalee">Trincomalee Branch Showroom</option>
                </select>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[11px] font-light text-[var(--text-secondary)]">
              Valuation estimates are indicative until physical on-site technical inspection.
            </p>

            <button
              type="submit"
              disabled={isPending || isCompressing}
              className="min-h-[48px] px-8 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.2em] bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-luxury disabled:opacity-50 cursor-pointer shadow-lg"
            >
              {isPending ? "Submitting Valuation Request..." : "Get Trade-In Valuation →"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Client-side WebP compression helper
function compressImageToWebp(
  file: File
): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1200;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context creation failed"));

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("WebP compression failed"));
            const reader2 = new FileReader();
            reader2.readAsDataURL(blob);
            reader2.onload = () => {
              resolve({
                dataUrl: reader2.result as string,
                size: blob.size,
              });
            };
          },
          "image/webp",
          0.82
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
