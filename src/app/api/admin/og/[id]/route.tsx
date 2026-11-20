import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getAdminVehiclesAction } from "@/app/actions/admin";
import { getCompanySettings } from "@/lib/settings";
import { adminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { vehicleConverter } from "@/types/vehicle";
import fs from "node:fs";
import path from "node:path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "square"; // "square" (1080x1080) or "story" (1080x1920)
  const templateParam = searchParams.get("template"); // "available" | "sold" | "incoming" | "reserved"
  const imageIndexParam = parseInt(searchParams.get("imageIndex") || "0", 10);
  const customBadge = searchParams.get("badge") || "";

  // Fetch vehicle details & settings
  const [vehicles, settings] = await Promise.all([
    getAdminVehiclesAction(),
    getCompanySettings(),
  ]);

  let vehicle = vehicles.find((v) => v.id === id || v.slug === id);
  if (!vehicle && hasAdminCredentials()) {
    try {
      const snap = await adminDb
        .collection("vehicles")
        .withConverter(vehicleConverter)
        .doc(id)
        .get();
      if (snap.exists) {
        vehicle = snap.data();
      }
    } catch {
      // Ignore
    }
  }
  if (!vehicle) {
    vehicle = vehicles[0];
  }

  if (!vehicle) {
    return new Response("Vehicle not found", { status: 404 });
  }

  const effectiveStatus = templateParam || vehicle.status;
  const isSquare = format === "square";
  const width = 1080;
  const height = isSquare ? 1080 : 1920;

  // Selected vehicle image
  const selectedIndex = isNaN(imageIndexParam) || imageIndexParam < 0
    ? 0
    : Math.min(imageIndexParam, Math.max(0, vehicle.images.length - 1));

  let imageSrc = vehicle.images[selectedIndex] || vehicle.images[0] || "/images/vehicles/placeholder-coming-soon.png";

  // Convert local path to data URI
  if (imageSrc.startsWith("/")) {
    try {
      const localFilePath = path.join(process.cwd(), "public", imageSrc);
      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        const ext = path.extname(localFilePath).toLowerCase();
        const mime =
          ext === ".svg"
            ? "image/svg+xml"
            : ext === ".webp"
            ? "image/webp"
            : ext === ".png"
            ? "image/png"
            : "image/jpeg";
        imageSrc = `data:${mime};base64,${fileBuffer.toString("base64")}`;
      }
    } catch (e) {
      console.warn("Failed to read local image for poster:", e);
    }
  }

  // Load premier modern sans-serif font (Segoe UI Bold / Arial Bold)
  let fontBuffer: ArrayBuffer | null = null;
  const possibleFontPaths = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
  ];
  for (const fp of possibleFontPaths) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ fp)) {
        const buf = fs.readFileSync(/*turbopackIgnore: true*/ fp);
        fontBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        break;
      }
    } catch {
      // Continue
    }
  }

  // Price formatting
  const formattedPrice =
    effectiveStatus === "sold"
      ? "SOLD & DELIVERED"
      : vehicle.price
      ? `LKR ${vehicle.price.toLocaleString("en-US")}`
      : "Call for Price";

  // Status visual identity configuration
  const statusConfig = {
    available: {
      label: "AVAILABLE IN SHOWROOM",
      subLabel: "READY FOR IMMEDIATE REGISTRATION",
      bg: "#064E3B",
      border: "#10B981",
      badgeText: "IN STOCK",
      accent: "#34D399",
    },
    incoming: {
      label: "IN TRANSIT • DIRECT IMPORT",
      subLabel: "TOKYO AUCTION DIRECT ALLOCATION",
      bg: "#0C4A6E",
      border: "#0284C7",
      badgeText: "INCOMING",
      accent: "#38BDF8",
    },
    reserved: {
      label: "RESERVED • ADVANCE DEPOSIT",
      subLabel: "HOLD ACTIVE • BACKUP INQUIRIES OPEN",
      bg: "#78350F",
      border: "#D97706",
      badgeText: "ON HOLD",
      accent: "#FBBF24",
    },
    sold: {
      label: "SOLD & DELIVERED",
      subLabel: "CONGRATULATIONS TO THE NEW OWNER",
      bg: "#7F1D1D",
      border: "#DC2626",
      badgeText: "DELIVERED",
      accent: "#F87171",
    },
  }[effectiveStatus as "available" | "incoming" | "reserved" | "sold"] || {
    label: "AVAILABLE IN SHOWROOM",
    subLabel: "DIRECT JAPANESE IMPORT",
    bg: "#064E3B",
    border: "#10B981",
    badgeText: "IN STOCK",
    accent: "#34D399",
  };

  const isTrinco = vehicle.branch === "trincomalee";
  const branchName = isTrinco ? "Trincomalee Showroom" : "Kaduruwela Main Showroom";
  const branchPhone = isTrinco
    ? settings.coastalBranch.phone || settings.mainBranch.phone
    : settings.mainBranch.mobile || settings.mainBranch.phone;
  const branchAddress = isTrinco
    ? settings.coastalBranch.address
    : settings.mainBranch.address || "No. 37/1, Kaduruwela, Polonnaruwa";

  // Badge priority
  const displayBadge =
    customBadge ||
    (vehicle.auctionGrade ? `Grade ${vehicle.auctionGrade} (${vehicle.auctionScore})` : "") ||
    (vehicle.registrationStatus === "unregistered" ? "Unregistered Direct Import" : "Genuine SL Registered");

  // ==========================================
  // 1. SQUARE POSTER (1080 x 1080)
  // ==========================================
  if (isSquare) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1080px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0B0B0E",
            color: "#FFFFFF",
            padding: "36px",
            fontFamily: fontBuffer ? "BrandFont" : "sans-serif",
            position: "relative",
          }}
        >
          {/* Outer Metallic Luxury Hairline Frame */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              right: "14px",
              bottom: "14px",
              border: "1px solid rgba(184, 155, 98, 0.35)",
              pointerEvents: "none",
            }}
          />

          {/* Top Dealership Brand Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(184, 155, 98, 0.35)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "28px",
                    letterSpacing: "0.22em",
                    color: "#D4AF37",
                    fontWeight: 800,
                  }}
                >
                  RS ENTERPRISES
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.25em",
                    color: "#9CA3AF",
                    padding: "2px 7px",
                    border: "1px solid rgba(156, 163, 175, 0.3)",
                    borderRadius: "1px",
                  }}
                >
                  EST. 2018
                </span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.26em",
                  color: "#9CA3AF",
                  marginTop: "3px",
                }}
              >
                DIRECT JAPANESE AUTOMOTIVE IMPORTERS • POLONNARUWA
              </span>
            </div>

            {/* Status Ribbon Pill */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: statusConfig.bg,
                  border: `1px solid ${statusConfig.border}`,
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  padding: "7px 16px",
                  borderRadius: "2px",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: statusConfig.accent,
                  }}
                />
                <span>{statusConfig.label}</span>
              </div>
              <span
                style={{
                  fontSize: "9px",
                  color: "#9CA3AF",
                  letterSpacing: "0.18em",
                  marginTop: "3px",
                }}
              >
                {statusConfig.subLabel}
              </span>
            </div>
          </div>

          {/* Central Hero Vehicle Photo Frame */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "560px",
              borderRadius: "3px",
              overflow: "hidden",
              border: "1px solid rgba(184, 155, 98, 0.4)",
              backgroundColor: "#121214",
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {/* Floating Top-Left Auction / Condition Badge */}
            {displayBadge && (
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "rgba(11, 11, 14, 0.9)",
                  border: "1px solid rgba(212, 175, 55, 0.6)",
                  padding: "6px 14px",
                  borderRadius: "2px",
                }}
              >
                <span style={{ color: "#D4AF37", fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em" }}>
                  ★ {displayBadge.toUpperCase()}
                </span>
              </div>
            )}

            {/* Floating Top-Right Japanese Import Seal */}
            <div
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(11, 11, 14, 0.9)",
                border: "1px solid rgba(156, 163, 175, 0.4)",
                padding: "6px 12px",
                borderRadius: "2px",
              }}
            >
              <span style={{ color: "#E5E7EB", fontSize: "10px", letterSpacing: "0.2em", fontWeight: 600 }}>
                日本直輸入 • 厳選車両
              </span>
            </div>
          </div>

          {/* Bottom Vehicle Dossier Strip */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(184, 155, 98, 0.35)",
            }}
          >
            {/* Title & Valuation Row: Dedicated separate containers to guarantee ZERO overlap */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: "20px",
              }}
            >
              {/* Left Column: Full-width vehicle title */}
              <div style={{ display: "flex", flexDirection: "column", maxWidth: "620px" }}>
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    color: "#FFFFFF",
                    lineHeight: 1.2,
                  }}
                >
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </span>
                {vehicle.grade && (
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#D4AF37",
                      letterSpacing: "0.1em",
                      fontWeight: 700,
                      marginTop: "3px",
                    }}
                  >
                    {vehicle.grade.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Right Column: Encapsulated Price Tag */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  flexShrink: 0,
                  padding: "8px 16px",
                  backgroundColor: "#16161A",
                  border: "1px solid rgba(184, 155, 98, 0.35)",
                  borderRadius: "2px",
                }}
              >
                <span
                  style={{
                    fontSize: effectiveStatus === "sold" ? "24px" : "30px",
                    fontWeight: 800,
                    color: effectiveStatus === "sold" ? "#F87171" : "#D4AF37",
                    fontFamily: "monospace",
                  }}
                >
                  {formattedPrice}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    color: "#9CA3AF",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    marginTop: "2px",
                  }}
                >
                  {effectiveStatus === "sold" ? "Unit Delivered" : "Walk-in Valuation"}
                </span>
              </div>
            </div>

            {/* Spec Highlights Grid */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "9px 14px",
                backgroundColor: "#141417",
                border: "1px solid rgba(184, 155, 98, 0.22)",
                borderRadius: "2px",
                fontSize: "12px",
                color: "#E5E7EB",
                letterSpacing: "0.05em",
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>{vehicle.mileage.toLocaleString()} KM</span>
                <span style={{ color: "rgba(184, 155, 98, 0.5)" }}>•</span>
                <span style={{ textTransform: "uppercase" }}>{vehicle.fuel}</span>
                <span style={{ color: "rgba(184, 155, 98, 0.5)" }}>•</span>
                <span style={{ textTransform: "uppercase" }}>{vehicle.transmission}</span>
                <span style={{ color: "rgba(184, 155, 98, 0.5)" }}>•</span>
                <span>{vehicle.engineCC} CC</span>
                <span style={{ color: "rgba(184, 155, 98, 0.5)" }}>•</span>
                <span>{vehicle.color}</span>
              </div>

              <span style={{ color: "#D4AF37", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em" }}>
                GENUINE ODOMETER
              </span>
            </div>

            {/* Showroom Direct Contact Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                fontSize: "12px",
                color: "#9CA3AF",
                letterSpacing: "0.04em",
                paddingTop: "2px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#D4AF37" }}>📍</span>
                <span style={{ color: "#F3F4F6", fontWeight: 600 }}>{branchName}</span>
                <span>•</span>
                <span>{branchAddress}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#D4AF37", fontWeight: 700 }}>📞 {branchPhone}</span>
                <span>•</span>
                <span style={{ color: "#D4AF37", fontWeight: 600 }}>rsenterprises.lk</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width,
        height,
        ...(fontBuffer
          ? {
              fonts: [
                {
                  name: "BrandFont",
                  data: fontBuffer,
                  style: "normal",
                  weight: 600,
                },
              ],
            }
          : {}),
      }
    );
  }

  // ==========================================
  // 2. STORY POSTER (1080 x 1920)
  // ==========================================
  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1920px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0B0B0E",
          color: "#FFFFFF",
          padding: "52px 48px",
          fontFamily: fontBuffer ? "BrandFont" : "sans-serif",
          position: "relative",
        }}
      >
        {/* Outer Metallic Luxury Hairline Frame */}
        <div
          style={{
            position: "absolute",
            top: "18px",
            left: "18px",
            right: "18px",
            bottom: "18px",
            border: "1px solid rgba(184, 155, 98, 0.35)",
            pointerEvents: "none",
          }}
        />

        {/* Top Branding Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            textAlign: "center",
            paddingBottom: "22px",
            borderBottom: "1px solid rgba(184, 155, 98, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                fontSize: "40px",
                letterSpacing: "0.25em",
                color: "#D4AF37",
                fontWeight: 800,
              }}
            >
              RS ENTERPRISES
            </span>
          </div>
          <span
            style={{
              fontSize: "13px",
              letterSpacing: "0.3em",
              color: "#9CA3AF",
              marginTop: "5px",
            }}
          >
            DIRECT JAPANESE AUTOMOBILE IMPORTERS • POLONNARUWA
          </span>

          {/* Status Ribbon Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: statusConfig.bg,
              border: `1px solid ${statusConfig.border}`,
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              padding: "9px 26px",
              borderRadius: "2px",
              marginTop: "16px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: statusConfig.accent,
              }}
            />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Story Vehicle Photo Card */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "880px",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid rgba(184, 155, 98, 0.4)",
            backgroundColor: "#121214",
            margin: "20px 0",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Floating Top-Left Auction Badge */}
          {displayBadge && (
            <div
              style={{
                position: "absolute",
                top: "18px",
                left: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(11, 11, 14, 0.92)",
                border: "1px solid rgba(212, 175, 55, 0.6)",
                padding: "8px 18px",
                borderRadius: "2px",
              }}
            >
              <span style={{ color: "#D4AF37", fontSize: "12px", fontWeight: 700, letterSpacing: "0.14em" }}>
                ★ {displayBadge.toUpperCase()}
              </span>
            </div>
          )}

          {/* Floating Top-Right Seal */}
          <div
            style={{
              position: "absolute",
              top: "18px",
              right: "18px",
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(11, 11, 14, 0.92)",
              border: "1px solid rgba(156, 163, 175, 0.4)",
              padding: "8px 16px",
              borderRadius: "2px",
            }}
          >
            <span style={{ color: "#E5E7EB", fontSize: "11px", letterSpacing: "0.18em", fontWeight: 600 }}>
              日本直輸入 • 厳選オークション車両
            </span>
          </div>
        </div>

        {/* Detailed Spec & Price Card - Restructured so Title & Price NEVER collide */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            backgroundColor: "#121215",
            border: "1px solid rgba(184, 155, 98, 0.35)",
            borderRadius: "4px",
            padding: "24px 28px",
            gap: "14px",
          }}
        >
          {/* Section 1: Full-width Vehicle Title & Grade */}
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <span
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.02em",
                lineHeight: 1.2,
              }}
            >
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
            {vehicle.grade && (
              <span
                style={{
                  fontSize: "16px",
                  color: "#D4AF37",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  marginTop: "3px",
                }}
              >
                {vehicle.grade.toUpperCase()}
              </span>
            )}
          </div>

          {/* Section 2: Illuminated Valuation Bar (Dedicated standalone row) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "12px 18px",
              backgroundColor: "#18181D",
              border: "1px solid rgba(184, 155, 98, 0.28)",
              borderRadius: "2px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                {effectiveStatus === "sold" ? "Delivered Vehicle Record" : "Showroom Direct Valuation"}
              </span>
              <span
                style={{
                  fontSize: effectiveStatus === "sold" ? "28px" : "34px",
                  fontWeight: 800,
                  color: effectiveStatus === "sold" ? "#F87171" : "#D4AF37",
                  fontFamily: "monospace",
                }}
              >
                {formattedPrice}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: statusConfig.bg,
                border: `1px solid ${statusConfig.border}`,
                padding: "6px 14px",
                borderRadius: "2px",
              }}
            >
              <span style={{ color: "#FFFFFF", fontSize: "11px", fontWeight: 800, letterSpacing: "0.15em" }}>
                {statusConfig.badgeText}
              </span>
            </div>
          </div>

          {/* Section 3: 6-Item Spec Grid (Structured Flex rows) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              width: "100%",
              paddingTop: "6px",
              borderTop: "1px solid rgba(184, 155, 98, 0.2)",
            }}
          >
            {/* Top Row: Mileage, Powertrain, Transmission */}
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", width: "32%" }}>
                <span style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.15em" }}>MILEAGE</span>
                <span style={{ fontSize: "17px", color: "#FFFFFF", fontWeight: 700, marginTop: "2px" }}>
                  {vehicle.mileage.toLocaleString()} KM
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "32%" }}>
                <span style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.15em" }}>POWERTRAIN</span>
                <span style={{ fontSize: "17px", color: "#FFFFFF", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>
                  {vehicle.engineCC} CC • {vehicle.fuel}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "32%" }}>
                <span style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.15em" }}>TRANSMISSION</span>
                <span style={{ fontSize: "17px", color: "#FFFFFF", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>
                  {vehicle.transmission}
                </span>
              </div>
            </div>

            {/* Bottom Row: Exterior Color, Seats & Body, Registration */}
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", width: "32%" }}>
                <span style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.15em" }}>EXTERIOR COLOR</span>
                <span style={{ fontSize: "16px", color: "#FFFFFF", fontWeight: 600, marginTop: "2px" }}>
                  {vehicle.color}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "32%" }}>
                <span style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.15em" }}>SEATS &amp; BODY</span>
                <span style={{ fontSize: "16px", color: "#FFFFFF", fontWeight: 600, textTransform: "uppercase", marginTop: "2px" }}>
                  {vehicle.seats} Seats • {vehicle.bodyType}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "32%" }}>
                <span style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.15em" }}>REGISTRATION</span>
                <span style={{ fontSize: "16px", color: "#34D399", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>
                  {vehicle.registrationStatus === "unregistered" ? "Unregistered" : "Registered"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Direct Hotline Strip */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "6px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(184, 155, 98, 0.35)",
          }}
        >
          <span style={{ fontSize: "16px", color: "#F3F4F6", letterSpacing: "0.08em" }}>
            📍 {branchAddress}
          </span>
          <span style={{ fontSize: "20px", color: "#D4AF37", fontWeight: 800, letterSpacing: "0.08em" }}>
            Hotlines &amp; WhatsApp: {branchPhone}
          </span>
          <span style={{ fontSize: "12px", color: "#9CA3AF", letterSpacing: "0.18em" }}>
            ONLINE INVENTORY: rsenterprises.lk/vehicles/{vehicle.slug}
          </span>
        </div>
      </div>
    ),
    {
      width,
      height,
      ...(fontBuffer
        ? {
            fonts: [
              {
                name: "BrandFont",
                data: fontBuffer,
                style: "normal",
                weight: 600,
              },
            ],
          }
        : {}),
    }
  );
}
