"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Vehicle,
  VehicleStatus,
  FuelType,
  TransmissionType,
  ImportStage,
  IMPORT_STAGES,
  normalizeImportStage,
  BodyType,
  DriveType,
  RegistrationStatus,
  DealershipBranch,
  getHoldExpiryStatus,
} from "@/types/vehicle";
import { CompanySettings } from "@/types/settings";
import { SavedSearch } from "@/types/saved-search";
import { saveVehicleAction, archiveVehicleAction } from "@/app/actions/admin";
import { useAdminAuth } from "@/app/admin/AdminAuthContext";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SocialPosterGenerator } from "@/components/admin/SocialPosterGenerator";

export function VehicleFormClient({
  initialVehicle,
  settings,
}: {
  initialVehicle?: Vehicle | null;
  settings?: CompanySettings;
}) {
  const router = useRouter();
  const { user } = useAdminAuth();
  const isEditing = Boolean(initialVehicle?.id);

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  // Form States
  const [make, setMake] = useState(initialVehicle?.make || "Toyota");
  const [model, setModel] = useState(initialVehicle?.model || "");
  const [year, setYear] = useState(initialVehicle?.year || 2024);
  const [grade, setGrade] = useState(initialVehicle?.grade || "Standard");
  const [slug, setSlug] = useState(initialVehicle?.slug || "");
  const [isSlugManual, setIsSlugManual] = useState(Boolean(initialVehicle?.slug));
  const [color, setColor] = useState(initialVehicle?.color || "Pearl White");
  const [price, setPrice] = useState(
    initialVehicle?.price ? String(initialVehicle.price) : ""
  );
  const [costPrice, setCostPrice] = useState(
    initialVehicle?.costPrice ? String(initialVehicle.costPrice) : ""
  );
  const [mileage, setMileage] = useState(
    initialVehicle?.mileage !== undefined ? String(initialVehicle.mileage) : "0"
  );
  const [fuel, setFuel] = useState<FuelType>(initialVehicle?.fuel || "petrol");
  const [transmission, setTransmission] = useState<TransmissionType>(
    initialVehicle?.transmission || "automatic"
  );
  const [engineCC, setEngineCC] = useState(
    initialVehicle?.engineCC ? String(initialVehicle.engineCC) : "1500"
  );
  const [status, setStatus] = useState<VehicleStatus>(
    initialVehicle?.status || "available"
  );
  // Rich Vehicle Specifications
  const [bodyType, setBodyType] = useState<BodyType>(initialVehicle?.bodyType || "suv");
  const [driveType, setDriveType] = useState<DriveType>(initialVehicle?.driveType || "2WD");
  const [seats, setSeats] = useState<number>(initialVehicle?.seats || 5);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>(
    initialVehicle?.registrationStatus || "unregistered"
  );
  const [owners, setOwners] = useState<number>(
    initialVehicle?.owners !== undefined ? initialVehicle.owners : 0
  );
  const [auctionGrade, setAuctionGrade] = useState(initialVehicle?.auctionGrade || "4.5");
  const [auctionScore, setAuctionScore] = useState(initialVehicle?.auctionScore || "A");
  const [chassisNumber, setChassisNumber] = useState(initialVehicle?.chassisNumber || "");
  const [branch, setBranch] = useState<DealershipBranch>(initialVehicle?.branch || "polonnaruwa");

  // Showroom Deposit & Reservation Hold States
  const [depositAmount, setDepositAmount] = useState<string>(
    initialVehicle?.reservation?.depositAmount ? String(initialVehicle.reservation.depositAmount) : ""
  );
  const [depositDate, setDepositDate] = useState<string>(
    initialVehicle?.reservation?.depositDate || (initialVehicle?.status === "reserved" ? new Date().toISOString().split("T")[0] : "")
  );
  const [holdExpiryDate, setHoldExpiryDate] = useState<string>(() => {
    if (initialVehicle?.reservation?.holdExpiryDate) {
      try {
        const exp = new Date(initialVehicle.reservation.holdExpiryDate);
        return new Date(exp.getTime() - exp.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch {
        return "";
      }
    }
    return "";
  });
  const [customerName, setCustomerName] = useState<string>(
    initialVehicle?.reservation?.customerName || ""
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    initialVehicle?.reservation?.customerPhone || ""
  );
  const [reservationNotes, setReservationNotes] = useState<string>(
    initialVehicle?.reservation?.notes || ""
  );

  const [importStage, setImportStage] = useState<ImportStage>(
    initialVehicle?.importStage || null
  );
  const [expectedArrival, setExpectedArrival] = useState(
    initialVehicle?.expectedArrival || ""
  );
  const [published, setPublished] = useState(
    initialVehicle?.published !== undefined ? initialVehicle.published : true
  );
  const [features, setFeatures] = useState(
    initialVehicle?.features
      ? initialVehicle.features.join(", ")
      : "Sunroof, 360 Camera, Leather Interior, Apple CarPlay, Push Start"
  );
  const [description, setDescription] = useState(
    initialVehicle?.description ||
      "Verified Japanese auction unit with certified mileage and JEVIC / JAAI inspection certificate."
  );

  // Multi-image list
  const [images, setImages] = useState<string[]>(
    initialVehicle?.images && initialVehicle.images.length > 0
      ? initialVehicle.images
      : ["/images/vehicles/sample-prado.svg"]
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Back-in-stock matched alerts
  const [matchedAlerts, setMatchedAlerts] = useState<
    {
      search: SavedSearch;
      whatsappUrl: string;
      messageText: string;
    }[]
  >([]);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate editable slug whenever year, make, model or grade change (unless manually edited)
  useEffect(() => {
    if (!isSlugManual) {
      const timer = setTimeout(() => {
        const generated = `${year} ${make} ${model} ${grade}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        setSlug(generated);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [year, make, model, grade, isSlugManual]);

  // Browser-side WebP compression (max 1600px dimension)
  async function compressFileToWebP(
    file: File
  ): Promise<{ blob: Blob; dataUrl: string; originalSize: number; compressedSize: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1600;

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
                  blob,
                  dataUrl: reader2.result as string,
                  originalSize: file.size,
                  compressedSize: blob.size,
                });
              };
            },
            "image/webp",
            0.85
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  // Handle multi-image file selection with browser compression & optional Firebase Storage upload
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadStatus("Compressing images with browser WebP engine (max 1600px)...");
    const newUrls: string[] = [];
    let totalOrig = 0;
    let totalComp = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const { blob, dataUrl, originalSize, compressedSize } = await compressFileToWebP(file);
        totalOrig += originalSize;
        totalComp += compressedSize;

        // Attempt upload to Firebase Storage if available
        let finalUrl = dataUrl;
        try {
          const { getFirebaseClientApp } = await import("@/lib/firebase-client");
          const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const app = getFirebaseClientApp();
          if (app) {
            const storage = getStorage(app);
            const path = `vehicles/${slug || "draft"}/${Date.now()}_${i}.webp`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, blob, { contentType: "image/webp" });
            finalUrl = await getDownloadURL(storageRef);
          }
        } catch (storageErr) {
          console.warn("Storage upload fallback to compressed dataUrl:", storageErr);
        }

        newUrls.push(finalUrl);
      }

      const savingPercent = Math.round(((totalOrig - totalComp) / totalOrig) * 100);
      setUploadStatus(
        `Added ${newUrls.length} photo(s). Compressed from ${(totalOrig / 1024 / 1024).toFixed(
          1
        )} MB to ${(totalComp / 1024).toFixed(0)} KB (-${savingPercent}%).`
      );

      // Append to images list (filter out sample placeholder if replacing)
      setImages((prev) => {
        const withoutPlaceholder = prev.filter(
          (u) =>
            !u.includes("placeholder-coming-soon") &&
            !u.includes("sample-prado") &&
            !u.includes("sample-vezel")
        );
        return [...withoutPlaceholder, ...newUrls];
      });
    } catch (err) {
      console.error("Image processing failed:", err);
      setError("Failed to process selected images. Please verify image files.");
      setUploadStatus(null);
    }
  }

  // Drag and drop reordering
  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(targetIndex: number) {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const reordered = [...images];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setImages(reordered);
    setDraggedIndex(null);
  }

  // 1-Tap move controls
  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const updated = [...images];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setImages(updated);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function setAsHero(index: number) {
    moveImage(index, 0);
  }

  function handleAddImageUrl() {
    if (newImageUrl.trim()) {
      setImages((prev) => {
        const withoutPlaceholder = prev.filter(
          (u) =>
            !u.includes("placeholder-coming-soon") &&
            !u.includes("sample-prado") &&
            !u.includes("sample-vezel")
        );
        return [...withoutPlaceholder, newImageUrl.trim()];
      });
      setNewImageUrl("");
    }
  }

  async function handleArchive() {
    if (!initialVehicle?.id) return;
    setIsPending(true);
    const updatedBy = user?.displayName || "Showroom Staff";
    const res = await archiveVehicleAction(initialVehicle.id, updatedBy);
    setIsPending(false);
    if (res.success) {
      router.push("/admin/vehicles");
      router.refresh();
    } else {
      setError(res.error || "Failed to archive vehicle.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const featureList = features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const cleanSlug =
      slug.trim() ||
      `${year}-${make.toLowerCase()}-${model.toLowerCase()}`.replace(/[^a-z0-9]+/g, "-");

    const vehiclePayload: Partial<Vehicle> & { make: string; model: string; year: number } = {
      id: initialVehicle?.id,
      slug: cleanSlug,
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      grade: grade.trim() || "Standard",
      color: color.trim() || "Pearl White",
      price: price.trim() ? Number(price) : null,
      costPrice: costPrice.trim() ? Number(costPrice) : null,
      mileage: Number(mileage) || 0,
      fuel,
      transmission,
      engineCC: Number(engineCC) || 1500,
      status,
      bodyType,
      driveType,
      seats: Number(seats) || 5,
      registrationStatus,
      owners: Number(owners) || 0,
      auctionGrade: auctionGrade.trim() || "4.5",
      auctionScore: auctionScore.trim() || "A",
      chassisNumber: chassisNumber.trim(),
      branch,
      reservation: status === "reserved" ? {
        depositAmount: Number(depositAmount) || 0,
        depositDate: depositDate || new Date().toISOString().split("T")[0],
        holdExpiryDate: holdExpiryDate ? new Date(holdExpiryDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: reservationNotes.trim() || undefined,
        reservedBy: initialVehicle?.reservation?.reservedBy || user?.displayName || "Showroom Staff",
        reservedAt: initialVehicle?.reservation?.reservedAt || new Date().toISOString(),
      } : null,
      importStage: status === "incoming" ? (importStage ? (normalizeImportStage(importStage) || "purchased") : "purchased") : null,
      expectedArrival: status === "incoming" && expectedArrival ? expectedArrival : null,
      published,
      features: featureList,
      description: description.trim(),
      images: images.length > 0 ? images : ["/images/vehicles/sample-prado.svg"],
      updatedBy: user?.displayName || "Showroom Staff",
      createdAt: initialVehicle?.createdAt,
    };

    const res = await saveVehicleAction(vehiclePayload);
    setIsPending(false);

    if (res.success) {
      if (res.matchedAlerts && res.matchedAlerts.length > 0) {
        setMatchedAlerts(res.matchedAlerts);
      } else {
        router.push("/admin/vehicles");
        router.refresh();
      }
    } else {
      setError(res.error || "Failed to save vehicle. Please check input values.");
    }
  }

  function formatDateTime(iso?: string) {
    if (!iso) return "Not recorded";
    try {
      return new Date(iso).toLocaleDateString("en-LK", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/vehicles"
          className="text-xs uppercase tracking-wider text-[var(--accent)] hover:underline min-h-[44px] inline-flex items-center"
        >
          &larr; Back to Inventory Fleet
        </Link>
      </div>

      <div className="pb-6 border-b border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Eyebrow>{isEditing ? "Modify Stock Record" : "New Showroom Stock Intake"}</Eyebrow>
          <Heading level={1} className="text-3xl sm:text-4xl mt-1">
            {isEditing
              ? `Edit ${initialVehicle?.year} ${initialVehicle?.make} ${initialVehicle?.model}`
              : "Register New Vehicle"}
          </Heading>
          <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
            Enter Japanese specification details, pricing, multi-image gallery, and live visibility
          </p>
        </div>

        {isEditing && (
          <div className="text-left sm:text-right text-[10px] font-mono text-[var(--text-secondary)]">
            <span>Last updated by: </span>
            <span className="text-[var(--text-primary)] font-semibold">
              {initialVehicle?.updatedBy || "Staff"}
            </span>
            <span className="block">{formatDateTime(initialVehicle?.updatedAt)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 badge-status-danger text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Identification & Slug */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
            01. Identification &amp; Model
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                <label
                  htmlFor="veh-make"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Make (Manufacturer) *
                </label>
              </div>
              <input
                id="veh-make"
                type="text"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Toyota / Honda / Nissan"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                <label
                  htmlFor="veh-model"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Model Name *
                </label>
              </div>
              <input
                id="veh-model"
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Land Cruiser Prado / Vezel"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                <label
                  htmlFor="veh-grade"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Grade / Trim Package
                </label>
              </div>
              <input
                id="veh-grade"
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. TX-L Package / Z Play"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                <label
                  htmlFor="veh-year"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Manufacturing Year *
                </label>
              </div>
              <input
                id="veh-year"
                type="number"
                min="1990"
                max="2030"
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                <label
                  htmlFor="veh-slug"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  SEO URL Slug (Auto-generated) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsSlugManual(!isSlugManual)}
                  className="text-[9px] font-mono text-[var(--accent)] hover:underline uppercase cursor-pointer"
                >
                  {isSlugManual ? "Reset to Auto" : "Customize Slug"}
                </button>
              </div>
              <input
                id="veh-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManual(true);
                }}
                placeholder="e.g. 2024-toyota-land-cruiser-prado-tx-l"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
              <span className="text-[10px] text-[var(--text-secondary)] font-mono block mt-1">
                Public URL: /vehicles/{slug || "slug-placeholder"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Technical Specs & Price */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
            02. Japanese Specs &amp; Valuation
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-price"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Retail Price (LKR)
                </label>
              </div>
              <input
                id="veh-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 28500000"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-cost"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Purchase / Landed Cost (LKR)
                </label>
                <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold badge-status-warning rounded">
                  Admin Only
                </span>
              </div>
              <input
                id="veh-cost"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="e.g. 25200000"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-mileage"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Mileage (KM) *
                </label>
              </div>
              <input
                id="veh-mileage"
                type="number"
                required
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="e.g. 14500"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-engine"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Engine Displacement (CC) *
                </label>
              </div>
              <input
                id="veh-engine"
                type="number"
                required
                value={engineCC}
                onChange={(e) => setEngineCC(e.target.value)}
                placeholder="e.g. 2800"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-fuel"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Fuel Powertrain *
                </label>
              </div>
              <select
                id="veh-fuel"
                value={fuel}
                onChange={(e) => setFuel(e.target.value as FuelType)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-transmission"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Transmission *
                </label>
              </div>
              <select
                id="veh-transmission"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as TransmissionType)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="automatic">Automatic</option>
                <option value="cvt">e-CVT</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-color"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Exterior Color *
                </label>
              </div>
              <input
                id="veh-color"
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Pearl White / Attitude Black"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Section 2.5: Provenance, Registration & Branch Routing (Rich Vehicle Data) */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
              03. Origin, Body &amp; Dealership Routing
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
              Buyer Decision Attributes
            </span>
          </div>

          {/* Row 1: Chassis Number (Admin Only) & Branch Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px]">
            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-chassis"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Chassis / VIN Number *
                </label>
                <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold badge-status-warning rounded">
                  Admin Only &bull; Hidden From Public
                </span>
              </div>
              <input
                id="veh-chassis"
                type="text"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                placeholder="e.g. FJA300-0018472 / GDJ150-0092814"
                className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
              <span className="text-[10px] text-[var(--text-secondary)] font-mono block mt-1.5 min-h-[28px] leading-snug">
                Used for internal customs assessment, inspection clearance, and title transfer.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-branch"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Holding Showroom Branch *
                </label>
              </div>
              <select
                id="veh-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value as DealershipBranch)}
                className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="polonnaruwa">
                  {settings?.mainBranch.name || "Kaduruwela Main Showroom"} (Polonnaruwa)
                </option>
                <option value="trincomalee">
                  {settings?.coastalBranch.name || "Trincomalee Branch Showroom"}
                </option>
              </select>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono block mt-1.5 min-h-[28px] leading-snug">
                Determines branch inquiry routing and customer viewing location.
              </span>
            </div>
          </div>

          {/* Row 2: Body Type, Drive Type, Seating Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-body"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Body Type *
                </label>
              </div>
              <select
                id="veh-body"
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as BodyType)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="suv">SUV</option>
                <option value="sedan">Sedan</option>
                <option value="hatchback">Hatchback</option>
                <option value="mpv">MPV / Mini Van</option>
                <option value="crossover">Crossover</option>
                <option value="wagon">Station Wagon</option>
                <option value="van">Van</option>
                <option value="coupe">Coupe</option>
                <option value="pickup">Pickup Truck</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-drive"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Drive Type (Drivetrain) *
                </label>
              </div>
              <select
                id="veh-drive"
                value={driveType}
                onChange={(e) => setDriveType(e.target.value as DriveType)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="2WD">2WD (FWD / RWD)</option>
                <option value="4WD">4WD (Four-Wheel Drive)</option>
                <option value="AWD">AWD (All-Wheel Drive)</option>
                <option value="FWD">FWD (Front-Wheel Drive)</option>
                <option value="RWD">RWD (Rear-Wheel Drive)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-seats"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Seating Capacity *
                </label>
              </div>
              <input
                id="veh-seats"
                type="number"
                min="1"
                max="15"
                required
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                placeholder="e.g. 5 or 7"
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
          </div>

          {/* Row 3: Registration Status, Owners, Japanese Auction Grade & Score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-reg"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Registration Status *
                </label>
              </div>
              <select
                id="veh-reg"
                value={registrationStatus}
                onChange={(e) => {
                  const val = e.target.value as RegistrationStatus;
                  setRegistrationStatus(val);
                  if (val === "unregistered") setOwners(0);
                  else if (owners === 0) setOwners(1);
                }}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="unregistered">Unregistered (Direct Import)</option>
                <option value="registered">Registered (Pre-Owned in SL)</option>
              </select>
              <span className="text-[9px] text-[var(--text-secondary)] font-mono block mt-1 min-h-[16px]">
                Imported directly from Japan / SL registered
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label
                  htmlFor="veh-owners"
                  className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  Previous Owners in SL
                </label>
              </div>
              <input
                id="veh-owners"
                type="number"
                min="0"
                max="10"
                value={owners}
                onChange={(e) => setOwners(Number(e.target.value))}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
              <span className="text-[9px] text-[var(--text-secondary)] font-mono block mt-1 min-h-[16px]">
                {registrationStatus === "unregistered" ? "0 for brand new/unregistered in SL" : "Registered owner count"}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between min-h-[22px] mb-1.5">
                <label className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Japanese Auction Grade &amp; Score *
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    id="veh-auction-grade"
                    type="text"
                    value={auctionGrade}
                    onChange={(e) => setAuctionGrade(e.target.value)}
                    placeholder="Grade (5.0)"
                    title="Japanese Auction Grade"
                    aria-label="Japanese Auction Grade"
                    className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
                  />
                </div>
                <div>
                  <input
                    id="veh-auction-score"
                    type="text"
                    value={auctionScore}
                    onChange={(e) => setAuctionScore(e.target.value)}
                    placeholder="Score (A/A)"
                    title="Auction Score (Interior/Exterior)"
                    aria-label="Auction Score (Interior/Exterior)"
                    className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] font-mono"
                  />
                </div>
              </div>
              <span className="text-[9px] text-[var(--text-secondary)] font-mono block mt-1 min-h-[16px]">
                Official auction inspection grade &amp; condition
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Multi-Image Gallery with WebP Compression & Drag Reorder */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
                04. Multi-Image Gallery
              </span>
              <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5">
                Upload smartphone photos (auto-compressed to WebP max 1600px). Drag thumbnails to reorder.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-4 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-base)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
            >
              + Upload Vehicle Photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {uploadStatus && (
            <div className="p-3 badge-status-info text-xs font-mono">
              {uploadStatus}
            </div>
          )}

          {/* Image Thumbnail Grid with Drag & Drop */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">
              Gallery Images ({images.length} photos &bull; First photo is Primary Cover):
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((imgUrl, idx) => (
                <div
                  key={`${imgUrl}-${idx}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={`group relative p-1.5 bg-[var(--bg-base)] border rounded-[2px] transition-all cursor-move ${
                    idx === 0
                      ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                      : "border-[var(--border-subtle)] hover:border-[var(--accent)]"
                  }`}
                >
                  {/* Badge */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 uppercase rounded-[1px] shadow ${
                        idx === 0
                          ? "bg-[var(--accent)] text-white font-bold"
                          : "bg-black/70 text-white"
                      }`}
                    >
                      {idx === 0 ? "01. Hero Cover" : `0${idx + 1}`}
                    </span>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="aspect-[4/3] bg-neutral-900 rounded-[1px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Controls below thumbnail */}
                  <div className="flex items-center justify-between pt-1.5 px-0.5 text-[10px]">
                    <div className="flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx - 1)}
                          className="min-h-[32px] px-1.5 bg-[var(--bg-surface)] hover:text-[var(--accent)] text-[var(--text-secondary)] border border-[var(--border-hairline)]"
                          title="Move left"
                        >
                          &larr;
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx + 1)}
                          className="min-h-[32px] px-1.5 bg-[var(--bg-surface)] hover:text-[var(--accent)] text-[var(--text-secondary)] border border-[var(--border-hairline)]"
                          title="Move right"
                        >
                          &rarr;
                        </button>
                      )}
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => setAsHero(idx)}
                          className="min-h-[32px] px-1.5 text-[9px] font-sans uppercase tracking-wider text-[var(--accent)] hover:underline"
                        >
                          Set Hero
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="min-h-[32px] px-1.5 text-status-danger hover:opacity-80 font-bold"
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick URL Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or paste an image URL directly..."
                className="flex-1 h-10 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px]"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="h-10 px-4 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent)]"
              >
                + Add URL
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Status & Website Publication */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
            04. Showroom Status &amp; Visibility
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="veh-status"
                className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
              >
                Inventory Availability *
              </label>
              <select
                id="veh-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="available">Available (In Showroom)</option>
                <option value="incoming">Incoming (Direct Japan Transit)</option>
                <option value="reserved">Reserved (Customer Deposit)</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Showroom Reservation & Deposit Note Configuration */}
            {status === "reserved" && (
              <div className="sm:col-span-3 p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold block">
                      Reservation with Deposit Note
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] font-light">
                      Record customer deposit amount, date, buyer contact, and hold expiry with active countdown alert.
                    </p>
                  </div>

                  {(() => {
                    const holdStatus = getHoldExpiryStatus(holdExpiryDate);
                    return holdStatus ? (
                      <span className={`px-2.5 py-1 text-[10px] font-mono uppercase font-semibold rounded-[1px] ${holdStatus.badgeClass}`}>
                        {holdStatus.label}
                      </span>
                    ) : null;
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Deposit Amount (LKR) *
                    </label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Deposit Received Date *
                    </label>
                    <input
                      type="date"
                      value={depositDate}
                      onChange={(e) => setDepositDate(e.target.value)}
                      className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--accent)]">
                        Hold Expiry Date &amp; Time *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">Set Hold:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 3);
                            d.setHours(18, 0, 0, 0);
                            setHoldExpiryDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                          }}
                          className="px-2 py-0.5 text-[9px] font-mono uppercase bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent)] text-[var(--text-primary)] cursor-pointer"
                        >
                          +3 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 7);
                            d.setHours(18, 0, 0, 0);
                            setHoldExpiryDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                          }}
                          className="px-2 py-0.5 text-[9px] font-mono uppercase bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent)] text-[var(--text-primary)] cursor-pointer"
                        >
                          +7 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 14);
                            d.setHours(18, 0, 0, 0);
                            setHoldExpiryDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                          }}
                          className="px-2 py-0.5 text-[9px] font-mono uppercase bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--accent)] text-[var(--text-primary)] cursor-pointer"
                        >
                          +14 Days
                        </button>
                      </div>
                    </div>
                    <input
                      type="datetime-local"
                      value={holdExpiryDate}
                      onChange={(e) => setHoldExpiryDate(e.target.value)}
                      className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Customer / Buyer Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Dr. K. Jayasundara"
                      className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Customer Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 077 123 4567"
                      className="w-full h-11 px-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] rounded-[2px]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      Deposit Note / Receipt Ref / Payment Conditions
                    </label>
                    <textarea
                      rows={2}
                      value={reservationNotes}
                      onChange={(e) => setReservationNotes(e.target.value)}
                      placeholder="e.g. Cash advance received at Kaduruwela showroom. Balance upon registration."
                      className="w-full p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("available");
                      setDepositAmount("");
                      setDepositDate("");
                      setHoldExpiryDate("");
                      setCustomerName("");
                      setCustomerPhone("");
                      setReservationNotes("");
                    }}
                    className="text-xs text-status-danger hover:opacity-80 font-sans uppercase font-medium tracking-wider transition-colors cursor-pointer"
                  >
                    Release Hold (Return to Available)
                  </button>
                </div>
              </div>
            )}

            {status === "incoming" && (
              <>
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                    Import Logistics Stage (Purchased &rarr; Shipped &rarr; At Port &rarr; Clearing &rarr; Ready)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {IMPORT_STAGES.map((stg) => {
                      const currentNorm = normalizeImportStage(importStage) || "purchased";
                      const isCurrent = currentNorm === stg.key;
                      return (
                        <button
                          key={stg.key}
                          type="button"
                          onClick={() => setImportStage(stg.key)}
                          className={`min-h-[44px] p-2.5 text-left border rounded-[2px] transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                              : "bg-[var(--bg-base)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-sans uppercase font-semibold tracking-wider block">
                              {stg.stepNumber}. {stg.label}
                            </span>
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-light leading-tight block mt-0.5 line-clamp-1 ${
                              isCurrent ? "text-white/80" : "text-[var(--text-secondary)]"
                            }`}
                          >
                            {stg.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="veh-eta"
                    className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
                  >
                    Expected Arrival Month
                  </label>
                  <input
                    id="veh-eta"
                    type="text"
                    value={expectedArrival}
                    onChange={(e) => setExpectedArrival(e.target.value)}
                    placeholder="e.g. Late March 2025"
                    className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <input
              id="veh-published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent)] rounded-[2px]"
            />
            <label
              htmlFor="veh-published"
              className="text-xs text-[var(--text-primary)] font-medium cursor-pointer"
            >
              Show on website immediately (Published Live)
            </label>
          </div>
        </div>

        {/* Section 5: Features & Description */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block">
            05. Features &amp; Vehicle Page Details
          </span>

          <div>
            <label
              htmlFor="veh-features"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Key Vehicle Features (Comma-separated)
            </label>
            <input
              id="veh-features"
              type="text"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="e.g. Modellista Bodykit, Sunroof, 360 Camera, Heated Seats"
              className="w-full h-11 px-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label
              htmlFor="veh-desc"
              className="block text-[10px] font-sans uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-1"
            >
              Editorial Vehicle Description
            </label>
            <textarea
              id="veh-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] rounded-[2px] focus:outline-none focus:border-[var(--accent)] leading-relaxed"
            />
          </div>
        </div>

        {/* Action Buttons: Save & Archive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[var(--border-hairline)]">
          {isEditing ? (
            archiveConfirm ? (
              <div className="flex items-center gap-2 p-2 badge-status-warning rounded-[2px]">
                <span className="text-xs text-status-warning font-semibold">
                  Archive this vehicle from showroom?
                </span>
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isPending}
                  className="min-h-[44px] px-4 bg-amber-700 text-white text-xs uppercase font-medium tracking-wider hover:bg-amber-600 rounded-[2px]"
                >
                  Confirm Archive
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveConfirm(false)}
                  className="min-h-[44px] px-3 text-xs uppercase text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setArchiveConfirm(true)}
                className="min-h-[44px] px-4 text-xs font-sans uppercase font-medium tracking-wider badge-status-warning hover:opacity-90 transition-opacity cursor-pointer self-start sm:self-auto"
              >
                Archive Vehicle Record
              </button>
            )
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Link
              href="/admin/vehicles"
              className="min-h-[44px] px-5 inline-flex items-center text-xs font-sans uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-[44px] px-8 inline-flex items-center justify-center text-xs font-sans uppercase font-medium tracking-[0.2em] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isPending ? "Saving..." : isEditing ? "Save & Revalidate" : "Publish Vehicle"}
            </button>
          </div>
        </div>
      </form>

      {/* Social Poster Generator (Admin Media Kit) */}
      {isEditing && initialVehicle && (
        <div id="marketing" className="pt-4 border-t border-[var(--border-hairline)]">
          <SocialPosterGenerator vehicle={initialVehicle} settings={settings} />
        </div>
      )}

      {/* Back-in-Stock Matches Notification Modal */}
      {matchedAlerts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-amber-500/60 shadow-2xl p-6 sm:p-8 space-y-6 text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <span className="text-3xl">🎉</span>
              <h3 className="font-serif text-2xl font-medium">
                {matchedAlerts.length} Waiting Buyer{matchedAlerts.length === 1 ? "" : "s"} Matched!
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                This newly saved vehicle matches active visitor alerts. You can dispatch an immediate WhatsApp alert directly to the buyer(s) below.
              </p>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {matchedAlerts.map(({ search, whatsappUrl }) => (
                <div
                  key={search.id}
                  className="p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-[2px] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-serif font-medium text-base text-[var(--text-primary)]">
                        {search.customerName}
                      </p>
                      <p className="text-xs font-mono text-[var(--text-secondary)]">
                        {search.customerPhone}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 badge-status-warning font-semibold">
                      &ldquo;{search.queryTitle}&rdquo;
                    </span>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[42px] px-4 inline-flex items-center justify-center gap-2 text-xs font-sans uppercase font-medium tracking-wider bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors rounded-[2px]"
                  >
                    <span>📱 Send WhatsApp Alert Now</span>
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setMatchedAlerts([]);
                  router.push("/admin/vehicles");
                  router.refresh();
                }}
                className="min-h-[44px] px-6 text-xs font-sans uppercase font-medium tracking-wider border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Continue to Inventory Manager &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
