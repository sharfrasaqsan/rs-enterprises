import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getAdminVehiclesAction } from "@/app/actions/admin";
import { getCompanySettings } from "@/lib/settings";
import fs from "node:fs";
import path from "node:path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "square"; // "square" (1080x1080) or "story" (1080x1920)

  // Fetch vehicle details
  const [vehicles, settings] = await Promise.all([
    getAdminVehiclesAction(),
    getCompanySettings(),
  ]);

  const vehicle = vehicles.find((v) => v.id === id || v.slug === id) || vehicles[0];

  if (!vehicle) {
    return new Response("Vehicle not found", { status: 404 });
  }

  const isSquare = format === "square";
  const width = 1080;
  const height = isSquare ? 1080 : 1920;

  // Prepare vehicle image data URI
  let imageSrc = vehicle.images[0] || "/images/vehicles/sample-prado.svg";
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
      console.warn("Failed to read local image for OG poster:", e);
    }
  }

  // Read self-hosted font if available
  let fontBuffer: ArrayBuffer | null = null;
  const possibleFontPaths = [
    "C:/Windows/Fonts/georgia.ttf",
    "C:/Windows/Fonts/times.ttf",
  ];
  for (const fp of possibleFontPaths) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ fp)) {
        const buf = fs.readFileSync(/*turbopackIgnore: true*/ fp);
        fontBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        break;
      }
    } catch {
      // Continue to next path
    }
  }

  const formattedPrice = vehicle.price
    ? `LKR ${vehicle.price.toLocaleString("en-US")}`
    : "Call for price";

  const statusLabel =
    vehicle.status === "available"
      ? "AVAILABLE IN SHOWROOM"
      : vehicle.status === "incoming"
      ? "INCOMING • DIRECT FROM JAPAN"
      : vehicle.status === "reserved"
      ? "RESERVED"
      : "SOLD";

  const statusBg =
    vehicle.status === "available"
      ? "#15803d"
      : vehicle.status === "incoming"
      ? "#0284c7"
      : vehicle.status === "reserved"
      ? "#b45309"
      : "#374151";

  const branchPhone = settings.mainBranch.mobile || settings.mainBranch.phone;

  // 1. SQUARE POSTER (1080x1080)
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
            backgroundColor: "#0C0C0D",
            color: "#FFFFFF",
            padding: "48px",
            fontFamily: fontBuffer ? "BrandFont" : "serif",
            position: "relative",
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingBottom: "24px",
              borderBottom: "1px solid rgba(184, 155, 98, 0.35)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "30px",
                  letterSpacing: "0.22em",
                  color: "#B89B62",
                  fontWeight: 700,
                }}
              >
                RS ENTERPRISES
              </span>
              <span
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.3em",
                  color: "#A1A1AA",
                  marginTop: "4px",
                }}
              >
                DIRECT JAPANESE IMPORTER • POLONNARUWA
              </span>
            </div>

            {/* Status Ribbon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: statusBg,
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                padding: "8px 18px",
                borderRadius: "2px",
              }}
            >
              {statusLabel}
            </div>
          </div>

          {/* Vehicle Main Image Card */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "560px",
              borderRadius: "4px",
              overflow: "hidden",
              border: "1px solid rgba(184, 155, 98, 0.25)",
              backgroundColor: "#18181B",
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
          </div>

          {/* Bottom Vehicle Dossier Strip */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(184, 155, 98, 0.35)",
            }}
          >
            {/* Title & Grade */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
                <span
                  style={{
                    fontSize: "42px",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    color: "#FFFFFF",
                  }}
                >
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </span>
                {vehicle.grade && (
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#B89B62",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {vehicle.grade}
                  </span>
                )}
              </div>

              {/* Price */}
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#B89B62",
                  fontFamily: "monospace",
                }}
              >
                {formattedPrice}
              </span>
            </div>

            {/* Spec Highlights + Branch Phone */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                fontSize: "15px",
                color: "#A1A1AA",
                letterSpacing: "0.05em",
              }}
            >
              <div style={{ display: "flex", gap: "16px" }}>
                <span>{vehicle.mileage.toLocaleString()} KM</span>
                <span>•</span>
                <span style={{ textTransform: "uppercase" }}>{vehicle.fuel}</span>
                <span>•</span>
                <span style={{ textTransform: "uppercase" }}>{vehicle.transmission}</span>
                <span>•</span>
                <span>{vehicle.engineCC} CC</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#E4E4E7", fontWeight: 600 }}>Kaduruwela: {branchPhone}</span>
                <span>•</span>
                <span style={{ color: "#B89B62" }}>rsenterprises.lk</span>
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

  // 2. STORY POSTER (1080x1920)
  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1920px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0C0C0D",
          color: "#FFFFFF",
          padding: "64px",
          fontFamily: fontBuffer ? "BrandFont" : "serif",
          position: "relative",
        }}
      >
        {/* Top Branding Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            textAlign: "center",
            paddingBottom: "32px",
            borderBottom: "1px solid rgba(184, 155, 98, 0.35)",
          }}
        >
          <span
            style={{
              fontSize: "38px",
              letterSpacing: "0.26em",
              color: "#B89B62",
              fontWeight: 700,
            }}
          >
            RS ENTERPRISES
          </span>
          <span
            style={{
              fontSize: "15px",
              letterSpacing: "0.3em",
              color: "#A1A1AA",
              marginTop: "8px",
            }}
          >
            DIRECT JAPANESE VEHICLE IMPORTER
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: statusBg,
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              padding: "8px 24px",
              borderRadius: "2px",
              marginTop: "20px",
            }}
          >
            {statusLabel}
          </div>
        </div>

        {/* Story Vehicle Photo Card */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "820px",
            borderRadius: "6px",
            overflow: "hidden",
            border: "1px solid rgba(184, 155, 98, 0.35)",
            backgroundColor: "#18181B",
            margin: "32px 0",
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
        </div>

        {/* Detailed Editorial Dossier for Story */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            backgroundColor: "#141416",
            border: "1px solid rgba(184, 155, 98, 0.25)",
            borderRadius: "4px",
            padding: "36px",
            gap: "24px",
          }}
        >
          {/* Headline & Price */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "44px",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.02em",
              }}
            >
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
            {vehicle.grade && (
              <span
                style={{
                  fontSize: "20px",
                  color: "#B89B62",
                  letterSpacing: "0.06em",
                }}
              >
                {vehicle.grade}
              </span>
            )}
            <span
              style={{
                fontSize: "44px",
                fontWeight: 700,
                color: "#B89B62",
                fontFamily: "monospace",
                marginTop: "12px",
              }}
            >
              {formattedPrice}
            </span>
          </div>

          {/* 4-Item Grid of Verified Specs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(184, 155, 98, 0.2)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", color: "#A1A1AA", letterSpacing: "0.1em" }}>
                MILEAGE
              </span>
              <span style={{ fontSize: "20px", color: "#FFFFFF", fontWeight: 600 }}>
                {vehicle.mileage.toLocaleString()} KM
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", color: "#A1A1AA", letterSpacing: "0.1em" }}>
                POWERTRAIN
              </span>
              <span style={{ fontSize: "20px", color: "#FFFFFF", fontWeight: 600, textTransform: "uppercase" }}>
                {vehicle.fuel} • {vehicle.engineCC} CC
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", color: "#A1A1AA", letterSpacing: "0.1em" }}>
                TRANSMISSION
              </span>
              <span style={{ fontSize: "20px", color: "#FFFFFF", fontWeight: 600, textTransform: "uppercase" }}>
                {vehicle.transmission}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", color: "#A1A1AA", letterSpacing: "0.1em" }}>
                EXTERIOR COLOR
              </span>
              <span style={{ fontSize: "20px", color: "#FFFFFF", fontWeight: 600 }}>
                {vehicle.color}
              </span>
            </div>
          </div>
        </div>

        {/* Footer & Contact Strip */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "10px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(184, 155, 98, 0.35)",
          }}
        >
          <span style={{ fontSize: "18px", color: "#E4E4E7", letterSpacing: "0.08em" }}>
            📍 No.37/1, Kaduruwela, Polonnaruwa, Sri Lanka
          </span>
          <span style={{ fontSize: "20px", color: "#B89B62", fontWeight: 600, letterSpacing: "0.06em" }}>
            Hotlines / WhatsApp: {branchPhone}
          </span>
          <span style={{ fontSize: "14px", color: "#71717A", letterSpacing: "0.15em" }}>
            VIEW FULL DOSSIER: rsenterprises.lk/vehicles/{vehicle.slug}
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

