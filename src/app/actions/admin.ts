"use server";

import { revalidateTag, revalidatePath, unstable_cache } from "next/cache";
import { adminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { Vehicle, vehicleConverter, VehicleStatus, ImportStage, VehicleReservation } from "@/types/vehicle";
import {
  Lead,
  leadConverter,
  LeadStage,
  DealershipBranch,
  LeadSource,
  LeadInquiry,
  LeadNote,
} from "@/types/lead";
import { CompanySettings, settingsConverter } from "@/types/settings";
import { SavedSearch } from "@/types/saved-search";
import { checkAndNotifySavedSearchesAction } from "@/app/actions/saved-searches";
import { SEED_VEHICLES, SEED_LEADS } from "@/lib/seed-data";
import {
  normalizePhoneNumber,
  formatPhoneDisplay,
  isSamePhoneNumber,
} from "@/lib/phone";

// In-memory state for development fallback when Firestore credentials aren't active
let inMemoryVehicles: Vehicle[] = [...SEED_VEHICLES];
let inMemoryLeads: Lead[] = [...SEED_LEADS];

/**
 * Fetch all vehicles for staff management (including unpublished drafts & archived).
 */
export const getAdminVehiclesAction = unstable_cache(
  async (): Promise<Vehicle[]> => {
    if (!hasAdminCredentials()) {
      return inMemoryVehicles;
    }
    try {
      const snap = await adminDb
        .collection("vehicles")
        .withConverter(vehicleConverter)
        .orderBy("createdAt", "desc")
        .get();
      return snap.docs.map((d) => d.data());
    } catch (err) {
      console.warn("getAdminVehiclesAction fallback:", err);
      return inMemoryVehicles;
    }
  },
  ["admin-vehicles-cache"],
  {
    revalidate: 60,
    tags: ["vehicles", "admin-vehicles"],
  }
);

/**
 * 1-Tap toggle for published / hidden status.
 */
export async function toggleVehiclePublishedAction(
  vehicleId: string,
  published: boolean,
  updatedBy: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    if (hasAdminCredentials()) {
      await adminDb.collection("vehicles").doc(vehicleId).update({
        published,
        updatedAt: now,
        updatedBy,
      });
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) =>
        v.id === vehicleId ? { ...v, published, updatedAt: now, updatedBy } : v
      );
    }
    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    revalidatePath("/vehicles");
    revalidatePath("/incoming");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("toggleVehiclePublishedAction failed:", err);
    return { success: false, error: "Failed to update publication status." };
  }
}

/**
 * 1-Tap status switcher (available, reserved, sold, incoming).
 */
export async function updateVehicleStatusAction(
  vehicleId: string,
  status: VehicleStatus,
  importStage?: ImportStage,
  updatedBy: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status,
      updatedAt: now,
      updatedBy,
    };
    if (importStage !== undefined) {
      updatePayload.importStage = importStage;
    } else if (status === "available" || status === "sold") {
      updatePayload.importStage = "ready";
    }
    if (status !== "reserved") {
      updatePayload.reservation = null;
    }

    if (hasAdminCredentials()) {
      await adminDb.collection("vehicles").doc(vehicleId).update(updatePayload);
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              status,
              reservation: status !== "reserved" ? null : v.reservation,
              importStage:
                importStage !== undefined
                  ? importStage
                  : status === "available" || status === "sold"
                  ? "ready"
                  : v.importStage,
              updatedAt: now,
              updatedBy,
            }
          : v
      );
    }
    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    revalidatePath("/admin");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin/incoming");
    revalidatePath("/vehicles");
    revalidatePath("/incoming");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("updateVehicleStatusAction failed:", err);
    return { success: false, error: "Failed to update status." };
  }
}

/**
 * Reserve vehicle with deposit note and hold expiry.
 */
export async function reserveVehicleAction(params: {
  vehicleId: string;
  depositAmount: number;
  depositDate: string;
  holdExpiryDate: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  reservedBy?: string;
}): Promise<{ success: boolean; error?: string; vehicle?: Vehicle }> {
  try {
    const {
      vehicleId,
      depositAmount,
      depositDate,
      holdExpiryDate,
      customerName,
      customerPhone,
      notes,
      reservedBy = "Showroom Staff",
    } = params;

    if (!vehicleId) {
      return { success: false, error: "Vehicle ID is required." };
    }
    if (!depositAmount || depositAmount <= 0) {
      return { success: false, error: "Please enter a valid deposit amount in LKR." };
    }
    if (!depositDate) {
      return { success: false, error: "Deposit date is required." };
    }
    if (!holdExpiryDate) {
      return { success: false, error: "Hold expiry date & time is required." };
    }

    const normalizedPhone = customerPhone ? normalizePhoneNumber(customerPhone) : undefined;
    const now = new Date().toISOString();

    const reservation: VehicleReservation = {
      depositAmount: Number(depositAmount),
      depositDate,
      holdExpiryDate,
      customerName: customerName?.trim() || undefined,
      customerPhone: normalizedPhone,
      notes: notes?.trim() || undefined,
      reservedBy,
      reservedAt: now,
    };

    let updatedVehicle: Vehicle | undefined;

    if (hasAdminCredentials()) {
      const docRef = adminDb.collection("vehicles").doc(vehicleId);
      await docRef.update({
        status: "reserved",
        reservation,
        updatedAt: now,
        updatedBy: reservedBy,
      });
      const snap = await docRef.withConverter(vehicleConverter).get();
      updatedVehicle = snap.data();
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) => {
        if (v.id === vehicleId) {
          const uv: Vehicle = {
            ...v,
            status: "reserved",
            reservation,
            updatedAt: now,
            updatedBy: reservedBy,
          };
          updatedVehicle = uv;
          return uv;
        }
        return v;
      });
    }

    // Auto-create or merge lead dossier if customer contact is provided
    if (normalizedPhone && customerName) {
      try {
        await registerOrMergeLeadCoreAction({
          name: customerName,
          phone: normalizedPhone,
          source: "walk_in",
          branch: updatedVehicle?.branch || "polonnaruwa",
          vehicleId: vehicleId,
          vehicleTitle: updatedVehicle
            ? `${updatedVehicle.year} ${updatedVehicle.make} ${updatedVehicle.model}`
            : "Reserved Vehicle",
          requestDetails: `Deposit Paid: LKR ${Number(depositAmount).toLocaleString("en-US")}`,
          note: `Vehicle reserved with deposit LKR ${Number(depositAmount).toLocaleString("en-US")} on ${depositDate}. Hold expiry: ${new Date(holdExpiryDate).toLocaleDateString("en-LK")}. Note: ${notes || "None recorded"}`,
        });
      } catch (leadErr) {
        console.warn("Could not auto-link reservation to leads pipeline:", leadErr);
      }
    }

    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    revalidatePath("/admin");
    revalidatePath("/admin/vehicles");
    revalidatePath(`/admin/vehicles/${vehicleId}/edit`);
    revalidatePath("/vehicles");
    revalidatePath("/incoming");
    revalidatePath("/");
    if (updatedVehicle?.slug) {
      revalidatePath(`/vehicles/${updatedVehicle.slug}`);
    }

    return { success: true, vehicle: updatedVehicle };
  } catch (err) {
    console.error("reserveVehicleAction failed:", err);
    return { success: false, error: "Failed to reserve vehicle." };
  }
}

/**
 * Release a vehicle reservation hold back to Available stock.
 */
export async function releaseVehicleReservationAction(
  vehicleId: string,
  reason?: string,
  releasedBy: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    let vehicleSlug = "";

    if (hasAdminCredentials()) {
      const docRef = adminDb.collection("vehicles").doc(vehicleId);
      const snap = await docRef.get();
      if (snap.exists) {
        vehicleSlug = snap.data()?.slug || "";
      }
      await docRef.update({
        status: "available",
        reservation: null,
        updatedAt: now,
        updatedBy: releasedBy,
      });
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) => {
        if (v.id === vehicleId) {
          vehicleSlug = v.slug;
          return {
            ...v,
            status: "available",
            reservation: null,
            updatedAt: now,
            updatedBy: releasedBy,
          };
        }
        return v;
      });
    }

    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    revalidatePath("/admin");
    revalidatePath("/admin/vehicles");
    revalidatePath(`/admin/vehicles/${vehicleId}/edit`);
    revalidatePath("/vehicles");
    revalidatePath("/incoming");
    revalidatePath("/");
    if (vehicleSlug) {
      revalidatePath(`/vehicles/${vehicleSlug}`);
    }

    return { success: true };
  } catch (err) {
    console.error("releaseVehicleReservationAction failed:", err);
    return { success: false, error: "Failed to release reservation hold." };
  }
}

/**
 * Extend a vehicle's hold expiry date/time.
 */
export async function extendVehicleHoldAction(
  vehicleId: string,
  newHoldExpiryDate: string,
  reason?: string,
  updatedBy: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    let vehicleSlug = "";

    if (hasAdminCredentials()) {
      const docRef = adminDb.collection("vehicles").doc(vehicleId);
      const snap = await docRef.get();
      if (snap.exists) {
        const data = snap.data();
        vehicleSlug = data?.slug || "";
        const currentReservation = data?.reservation || {};
        await docRef.update({
          reservation: {
            ...currentReservation,
            holdExpiryDate: newHoldExpiryDate,
            notes: reason
              ? `${currentReservation.notes || ""} [Hold extended: ${reason}]`.trim()
              : currentReservation.notes,
          },
          updatedAt: now,
          updatedBy,
        });
      }
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) => {
        if (v.id === vehicleId && v.reservation) {
          vehicleSlug = v.slug;
          return {
            ...v,
            reservation: {
              ...v.reservation,
              holdExpiryDate: newHoldExpiryDate,
              notes: reason
                ? `${v.reservation.notes || ""} [Hold extended: ${reason}]`.trim()
                : v.reservation.notes,
            },
            updatedAt: now,
            updatedBy,
          };
        }
        return v;
      });
    }

    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    revalidatePath("/admin");
    revalidatePath("/admin/vehicles");
    revalidatePath(`/admin/vehicles/${vehicleId}/edit`);
    revalidatePath("/vehicles");
    if (vehicleSlug) {
      revalidatePath(`/vehicles/${vehicleSlug}`);
    }
    return { success: true };
  } catch (err) {
    console.error("extendVehicleHoldAction failed:", err);
    return { success: false, error: "Failed to extend hold expiry." };
  }
}

/**
 * 1-Tap import pipeline stage updater for /admin/incoming.
 */
export async function updateIncomingStageAction(
  vehicleId: string,
  importStage: ImportStage,
  expectedArrival?: string | null,
  updatedBy: string = "Showroom Logistics"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      importStage,
      updatedAt: now,
      updatedBy,
    };

    if (expectedArrival !== undefined) {
      updatePayload.expectedArrival = expectedArrival;
    }

    // If unit has arrived in showroom stock, promote status to available
    if (importStage === "ready" || importStage === "in_stock") {
      updatePayload.status = "available";
    }

    let vehicleSlug = "";

    if (hasAdminCredentials()) {
      const docRef = adminDb.collection("vehicles").doc(vehicleId);
      const snap = await docRef.get();
      if (snap.exists) {
        vehicleSlug = snap.data()?.slug || "";
      }
      await docRef.update(updatePayload);
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) => {
        if (v.id === vehicleId) {
          vehicleSlug = v.slug;
          return {
            ...v,
            importStage,
            status: importStage === "ready" || importStage === "in_stock" ? "available" : v.status,
            expectedArrival: expectedArrival !== undefined ? expectedArrival : v.expectedArrival,
            updatedAt: now,
            updatedBy,
          };
        }
        return v;
      });
    }

    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    revalidatePath("/incoming");
    revalidatePath("/vehicles");
    if (vehicleSlug) {
      revalidatePath(`/vehicles/${vehicleSlug}`);
    }
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("updateIncomingStageAction failed:", err);
    return { success: false, error: "Failed to update import stage." };
  }
}

/**
 * Archive vehicle instead of hard delete (preserves past leads, unlists from public).
 */
export async function archiveVehicleAction(
  vehicleId: string,
  updatedBy: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    if (hasAdminCredentials()) {
      await adminDb.collection("vehicles").doc(vehicleId).update({
        archived: true,
        published: false,
        updatedAt: now,
        updatedBy,
      });
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) =>
        v.id === vehicleId
          ? { ...v, archived: true, published: false, updatedAt: now, updatedBy }
          : v
      );
    }
    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    revalidatePath("/vehicles");
    revalidatePath("/incoming");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("archiveVehicleAction failed:", err);
    return { success: false, error: "Failed to archive vehicle." };
  }
}

/**
 * Unarchive / restore vehicle back to draft inventory.
 */
export async function unarchiveVehicleAction(
  vehicleId: string,
  updatedBy: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    if (hasAdminCredentials()) {
      await adminDb.collection("vehicles").doc(vehicleId).update({
        archived: false,
        published: false,
        updatedAt: now,
        updatedBy,
      });
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) =>
        v.id === vehicleId
          ? { ...v, archived: false, published: false, updatedAt: now, updatedBy }
          : v
      );
    }
    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    revalidatePath("/vehicles");
    revalidatePath("/incoming");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("unarchiveVehicleAction failed:", err);
    return { success: false, error: "Failed to restore vehicle." };
  }
}

/**
 * Save (create or update) a vehicle record.
 */
export async function saveVehicleAction(
  vehicleData: Partial<Vehicle> & { make: string; model: string; year: number }
): Promise<{
  success: boolean;
  vehicleId?: string;
  matchedAlerts?: {
    search: SavedSearch;
    whatsappUrl: string;
    messageText: string;
  }[];
  error?: string;
}> {
  try {
    const now = new Date().toISOString();
    const id = vehicleData.id || `veh-${Date.now()}`;
    const slug =
      vehicleData.slug ||
      `${vehicleData.year}-${vehicleData.make.toLowerCase()}-${vehicleData.model.toLowerCase()}`.replace(
        /[^a-z0-9]+/g,
        "-"
      );

    const fullVehicle: Vehicle = {
      id,
      slug,
      make: vehicleData.make,
      model: vehicleData.model,
      year: Number(vehicleData.year),
      price: vehicleData.price ? Number(vehicleData.price) : null,
      costPrice: vehicleData.costPrice ? Number(vehicleData.costPrice) : null,
      mileage: Number(vehicleData.mileage) || 0,
      fuel: vehicleData.fuel || "petrol",
      transmission: vehicleData.transmission || "automatic",
      grade: vehicleData.grade || "Standard",
      engineCC: Number(vehicleData.engineCC) || 1500,
      color: vehicleData.color || "Pearl White",
      status: vehicleData.status || "available",
      bodyType: vehicleData.bodyType || "suv",
      driveType: vehicleData.driveType || "2WD",
      seats: vehicleData.seats !== undefined ? Number(vehicleData.seats) : 5,
      registrationStatus: vehicleData.registrationStatus || "unregistered",
      owners: vehicleData.owners !== undefined ? Number(vehicleData.owners) : 0,
      auctionGrade: vehicleData.auctionGrade || "4.5",
      auctionScore: vehicleData.auctionScore || "A",
      chassisNumber: vehicleData.chassisNumber || "",
      branch: vehicleData.branch || "polonnaruwa",
      reservation: vehicleData.reservation !== undefined ? vehicleData.reservation : null,
      importStage: vehicleData.importStage || null,
      expectedArrival: vehicleData.expectedArrival || null,
      published: vehicleData.published !== undefined ? vehicleData.published : true,
      verified: Boolean(vehicleData.verified),
      archived: Boolean(vehicleData.archived),
      updatedBy: vehicleData.updatedBy || "Showroom Staff",
      images:
        vehicleData.images && vehicleData.images.length > 0
          ? vehicleData.images
          : ["/images/vehicles/sample-prado.svg"],
      features: vehicleData.features || [],
      description: vehicleData.description || "",
      createdAt: vehicleData.createdAt || now,
      updatedAt: now,
    };

    if (hasAdminCredentials()) {
      await adminDb
        .collection("vehicles")
        .doc(id)
        .withConverter(vehicleConverter)
        .set(fullVehicle, { merge: true });
    } else {
      const idx = inMemoryVehicles.findIndex((v) => v.id === id);
      if (idx >= 0) {
        inMemoryVehicles[idx] = fullVehicle;
      } else {
        inMemoryVehicles.unshift(fullVehicle);
      }
    }

    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    revalidatePath("/admin");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin/incoming");
    revalidatePath("/vehicles");
    revalidatePath("/incoming");
    revalidatePath("/");
    revalidatePath(`/vehicles/${slug}`);

    // Check back-in-stock and saved search alerts for newly available vehicles
    let matchedAlerts: {
      search: SavedSearch;
      whatsappUrl: string;
      messageText: string;
    }[] = [];
    if (fullVehicle.published && fullVehicle.status !== "sold" && !fullVehicle.archived) {
      try {
        const matchRes = await checkAndNotifySavedSearchesAction(fullVehicle);
        matchedAlerts = matchRes.matchedAlerts;
      } catch (alertErr) {
        console.warn("Could not check saved searches for new vehicle:", alertErr);
      }
    }

    return { success: true, vehicleId: id, matchedAlerts };
  } catch (err) {
    console.error("saveVehicleAction failed:", err);
    return { success: false, error: "Failed to save vehicle details." };
  }
}

/**
 * Delete a vehicle record.
 */
export async function deleteVehicleAction(
  vehicleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (hasAdminCredentials()) {
      await adminDb.collection("vehicles").doc(vehicleId).delete();
    } else {
      inMemoryVehicles = inMemoryVehicles.filter((v) => v.id !== vehicleId);
    }
    revalidateTag("vehicles", "max");
    revalidateTag("admin-vehicles", "max");
    return { success: true };
  } catch (err) {
    console.error("deleteVehicleAction failed:", err);
    return { success: false, error: "Failed to delete vehicle." };
  }
}

/**
 * Fetch CRM Leads for staff.
 */
export const getAdminLeadsAction = unstable_cache(
  async (): Promise<Lead[]> => {
    if (!hasAdminCredentials()) {
      return inMemoryLeads;
    }
    try {
      const snap = await adminDb
        .collection("leads")
        .withConverter(leadConverter)
        .orderBy("createdAt", "desc")
        .get();
      return snap.docs.map((d) => d.data());
    } catch (err) {
      console.warn("getAdminLeadsAction fallback:", err);
      return inMemoryLeads;
    }
  },
  ["admin-leads-cache"],
  {
    revalidate: 60,
    tags: ["leads", "admin-leads"],
  }
);

/**
 * Advance or change Lead Stage.
 */
export async function updateLeadStageAction(
  leadId: string,
  stage: LeadStage,
  lostReason?: string,
  updatedBy: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      stage,
      updatedAt: now,
      updatedBy,
    };
    if (lostReason) {
      updatePayload.lostReason = lostReason;
    }

    if (hasAdminCredentials()) {
      await adminDb.collection("leads").doc(leadId).update(updatePayload);
    } else {
      inMemoryLeads = inMemoryLeads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage,
              lostReason: lostReason || l.lostReason,
              updatedAt: now,
              updatedBy,
            }
          : l
      );
    }
    revalidateTag("admin-leads", "max");
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    return { success: true };
  } catch (err) {
    console.error("updateLeadStageAction failed:", err);
    return { success: false, error: "Failed to update lead stage." };
  }
}

/**
 * Add note to lead conversation thread.
 */
export async function addLeadNoteAction(
  leadId: string,
  noteText: string,
  author: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const newNote = {
      id: `note-${Date.now()}`,
      text: noteText,
      author,
      time: now,
    };

    if (hasAdminCredentials()) {
      const docRef = adminDb.collection("leads").doc(leadId);
      const snap = await docRef.get();
      if (snap.exists) {
        const existingNotes = snap.data()?.notes || [];
        await docRef.update({
          notes: [...existingNotes, newNote],
          updatedAt: now,
          updatedBy: author,
        });
      }
    } else {
      inMemoryLeads = inMemoryLeads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              notes: [...l.notes, newNote],
              updatedAt: now,
              updatedBy: author,
            }
          : l
      );
    }
    revalidateTag("admin-leads", "max");
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    return { success: true };
  } catch (err) {
    console.error("addLeadNoteAction failed:", err);
    return { success: false, error: "Failed to append note." };
  }
}

/**
 * Set lead follow-up date.
 */
export async function setLeadFollowUpAction(
  leadId: string,
  followUpDate: string | null,
  updatedBy: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    if (hasAdminCredentials()) {
      await adminDb.collection("leads").doc(leadId).update({
        followUpDate,
        updatedAt: now,
        updatedBy,
      });
    } else {
      inMemoryLeads = inMemoryLeads.map((l) =>
        l.id === leadId ? { ...l, followUpDate, updatedAt: now, updatedBy } : l
      );
    }
    revalidateTag("admin-leads", "max");
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    return { success: true };
  } catch (err) {
    console.error("setLeadFollowUpAction failed:", err);
    return { success: false, error: "Failed to set follow-up date." };
  }
}

/**
 * Core lead registration & deduplication engine.
 * Normalizes phone numbers to canonical E.164 (+94) format, detects duplicate customer
 * phone numbers across the showroom CRM, and merges re-inquiries into a unified client dossier.
 */
export async function registerOrMergeLeadCoreAction(
  data: {
    name: string;
    phone: string;
    email?: string | null;
    source: LeadSource;
    branch: DealershipBranch;
    vehicleId?: string | null;
    vehicleTitle?: string | null;
    requestDetails?: string | null;
    photos?: string[];
    note?: string | null;
    assignedTo?: string | null;
  },
  author: string = "Showroom Desk"
): Promise<{
  success: boolean;
  leadId?: string;
  isMerged?: boolean;
  inquiryCount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const rawPhone = data.phone?.trim() || "";
    const normalizedPhone = normalizePhoneNumber(rawPhone);

    if (!normalizedPhone || normalizedPhone.length < 10) {
      return {
        success: false,
        error: "Please provide a valid 9 or 10-digit Sri Lankan phone number (e.g. 077 123 4567).",
      };
    }

    const now = new Date().toISOString();
    const branch: DealershipBranch = data.branch === "trincomalee" ? "trincomalee" : "polonnaruwa";
    const source: LeadSource = data.source || "website_form";
    const name = data.name.trim();

    // 1. Search for existing lead with identical normalized phone
    let existingLead: Lead | null = null;

    if (hasAdminCredentials()) {
      try {
        const snap = await adminDb
          .collection("leads")
          .withConverter(leadConverter)
          .where("phone", "==", normalizedPhone)
          .limit(1)
          .get();

        if (!snap.empty) {
          existingLead = snap.docs[0].data();
        } else {
          // Fallback search to check if any older records had unnormalized phones with spaces or leading 0
          const allSnap = await adminDb
            .collection("leads")
            .withConverter(leadConverter)
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();
          for (const doc of allSnap.docs) {
            const l = doc.data();
            if (isSamePhoneNumber(l.phone, normalizedPhone)) {
              existingLead = l;
              break;
            }
          }
        }
      } catch (err) {
        console.warn("Firestore lead deduplication query fallback:", err);
      }
    }

    // In-memory lookup (for development fallback or offline testing)
    if (!existingLead) {
      existingLead =
        inMemoryLeads.find(
          (l) =>
            normalizePhoneNumber(l.phone) === normalizedPhone ||
            isSamePhoneNumber(l.phone, normalizedPhone)
        ) || null;
    }

    // 2. CASE A: DUPLICATE PHONE DETECTED -> MERGE INTO EXISTING RECORD
    if (existingLead) {
      const currentCount =
        existingLead.inquiryCount || (existingLead.inquiries?.length || 1);
      const newInquiryCount = currentCount + 1;

      // Construct the new inquiry item
      const newInquiry: LeadInquiry = {
        id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        time: now,
        source,
        branch,
        vehicleId: data.vehicleId || null,
        vehicleTitle: data.vehicleTitle?.trim() || null,
        requestDetails: data.requestDetails?.trim() || data.note?.trim() || null,
        photos: data.photos || [],
        note: data.note?.trim() || null,
      };

      // Ensure historical inquiries array exists (seed or previous single inquiry)
      const updatedInquiries: LeadInquiry[] =
        Array.isArray(existingLead.inquiries) && existingLead.inquiries.length > 0
          ? [...existingLead.inquiries]
          : [
              {
                id: `inq-orig-${existingLead.id}`,
                time: existingLead.createdAt,
                source: existingLead.source,
                branch: existingLead.branch,
                vehicleId: existingLead.vehicleId || null,
                vehicleTitle: existingLead.vehicleTitle || null,
                requestDetails: existingLead.requestDetails || null,
                photos: existingLead.photos || [],
                note: existingLead.notes?.[0]?.text || null,
              },
            ];

      updatedInquiries.unshift(newInquiry); // Most recent inquiry first

      // Build audit note
      const vehicleDesc = data.vehicleTitle?.trim()
        ? `regarding "${data.vehicleTitle.trim()}"`
        : "for general showroom assistance";
      const branchLabel =
        branch === "trincomalee" ? "Trincomalee Branch" : "Kaduruwela Main Showroom";
      const formattedDisplay = formatPhoneDisplay(normalizedPhone);

      const auditText = `✦ RE-INQUIRY DETECTED: Returning client submitted a new inquiry ${vehicleDesc} via ${source
        .replace("_", " ")
        .toUpperCase()} at ${branchLabel}. Matched existing record by phone (${formattedDisplay}). Inquiries merged into single client record (Total inquiries: ${newInquiryCount}).`;

      const auditNote: LeadNote = {
        id: `note-${Date.now()}-audit`,
        text: auditText,
        author: "Lead Deduplication Engine",
        time: now,
      };

      const userNote: LeadNote | null = data.note?.trim()
        ? {
            id: `note-${Date.now()}-user`,
            text: `Client Note: ${data.note.trim()}`,
            author: name || "Customer",
            time: now,
          }
        : null;

      const updatedNotes = [
        auditNote,
        ...(userNote ? [userNote] : []),
        ...(existingLead.notes || []),
      ];

      // Re-activate stage if previously closed
      const newStage =
        existingLead.stage === "won" || existingLead.stage === "lost"
          ? "new"
          : existingLead.stage;

      const mergedLead: Lead = {
        ...existingLead,
        phone: normalizedPhone, // canonical +94 format
        name: name || existingLead.name,
        email: data.email?.trim() || existingLead.email,
        vehicleId: data.vehicleId || existingLead.vehicleId,
        vehicleTitle: data.vehicleTitle?.trim() || existingLead.vehicleTitle,
        requestDetails:
          data.requestDetails?.trim() || data.note?.trim() || existingLead.requestDetails,
        photos: Array.from(
          new Set([...(existingLead.photos || []), ...(data.photos || [])])
        ),
        branch,
        stage: newStage,
        inquiryCount: newInquiryCount,
        isReturningBuyer: true,
        inquiries: updatedInquiries,
        notes: updatedNotes,
        updatedAt: now,
        updatedBy: author,
      };

      if (hasAdminCredentials()) {
        await adminDb
          .collection("leads")
          .doc(existingLead.id)
          .withConverter(leadConverter)
          .set(mergedLead);
      } else {
        inMemoryLeads = inMemoryLeads.map((l) =>
          l.id === existingLead!.id ? mergedLead : l
        );
      }

      revalidateTag("admin-leads", "max");
      revalidateTag("leads", "max");
      revalidatePath("/admin/leads");
      revalidatePath(`/admin/leads/${existingLead.id}`);

      return {
        success: true,
        leadId: existingLead.id,
        isMerged: true,
        inquiryCount: newInquiryCount,
        message: `Inquiry successfully registered and merged into existing record for ${existingLead.name} (${newInquiryCount} inquiries on file).`,
      };
    }

    // 3. CASE B: NEW LEAD (NO DUPLICATE)
    const id = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const initialInquiry: LeadInquiry = {
      id: `inq-${Date.now()}`,
      time: now,
      source,
      branch,
      vehicleId: data.vehicleId || null,
      vehicleTitle: data.vehicleTitle?.trim() || null,
      requestDetails: data.requestDetails?.trim() || data.note?.trim() || null,
      photos: data.photos || [],
      note: data.note?.trim() || null,
    };

    const initialNoteText =
      data.note?.trim() ||
      (data.vehicleTitle?.trim()
        ? `Inquiry received for ${data.vehicleTitle.trim()}. Branch: ${branch.toUpperCase()}. Contact requested via Phone/WhatsApp.`
        : `General showroom inquiry received at ${branch.toUpperCase()} branch.`);

    const initialNotes: LeadNote[] = [
      {
        id: `note-${Date.now()}`,
        text: initialNoteText,
        author: author || "Website Intake",
        time: now,
      },
    ];

    const newLead: Lead = {
      id,
      name,
      phone: normalizedPhone,
      email: data.email?.trim() || null,
      source,
      branch,
      vehicleId: data.vehicleId || null,
      vehicleTitle: data.vehicleTitle?.trim() || null,
      requestDetails: data.requestDetails?.trim() || data.note?.trim() || null,
      photos: data.photos || [],
      stage: "new",
      assignedTo: data.assignedTo || null,
      followUpDate: null,
      lostReason: null,
      updatedBy: author,
      inquiryCount: 1,
      isReturningBuyer: false,
      inquiries: [initialInquiry],
      notes: initialNotes,
      createdAt: now,
      updatedAt: now,
    };

    if (hasAdminCredentials()) {
      await adminDb
        .collection("leads")
        .doc(id)
        .withConverter(leadConverter)
        .set(newLead);
    } else {
      inMemoryLeads.unshift(newLead);
    }

    revalidateTag("admin-leads", "max");
    revalidateTag("leads", "max");
    revalidatePath("/admin/leads");

    return {
      success: true,
      leadId: id,
      isMerged: false,
      inquiryCount: 1,
      message:
        "Thank you. Your inquiry has been registered. Our Kaduruwela showroom desk will contact you via phone or WhatsApp shortly.",
    };
  } catch (err) {
    console.error("registerOrMergeLeadCoreAction failed:", err);
    return {
      success: false,
      error: "Unable to process inquiry at this time. Please try again or call our showroom directly.",
    };
  }
}

/**
 * Create Lead from staff phone or walk-in enquiry.
 * Automatically checks for existing phone number and merges if returning client.
 */
export async function createLeadAdminAction(
  data: {
    name: string;
    phone: string;
    vehicleTitle?: string;
    vehicleId?: string;
    source: LeadSource;
    branch: DealershipBranch;
    photos?: string[];
    note?: string;
    assignedTo?: string;
  },
  author: string = "Showroom Staff"
): Promise<{
  success: boolean;
  leadId?: string;
  isMerged?: boolean;
  inquiryCount?: number;
  message?: string;
  error?: string;
}> {
  return registerOrMergeLeadCoreAction(
    {
      name: data.name,
      phone: data.phone,
      vehicleTitle: data.vehicleTitle,
      vehicleId: data.vehicleId,
      source: data.source,
      branch: data.branch,
      photos: data.photos,
      requestDetails: data.note,
      note: data.note,
      assignedTo: data.assignedTo,
    },
    author
  );
}

/**
 * Mark lead as won with prompt to mark vehicle sold.
 */
export async function markLeadWonWithVehicleAction(
  leadId: string,
  markVehicleSold: boolean,
  vehicleId?: string | null,
  author: string = "Showroom Staff"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();

    if (hasAdminCredentials()) {
      await adminDb.collection("leads").doc(leadId).update({
        stage: "won",
        updatedAt: now,
        updatedBy: author,
      });
    } else {
      inMemoryLeads = inMemoryLeads.map((l) =>
        l.id === leadId ? { ...l, stage: "won", updatedAt: now, updatedBy: author } : l
      );
    }

    if (markVehicleSold && vehicleId) {
      if (hasAdminCredentials()) {
        await adminDb.collection("vehicles").doc(vehicleId).update({
          status: "sold",
          updatedAt: now,
          updatedBy: author,
        });
      } else {
        inMemoryVehicles = inMemoryVehicles.map((v) =>
          v.id === vehicleId ? { ...v, status: "sold", updatedAt: now, updatedBy: author } : v
        );
      }
      revalidateTag("vehicles", "max");
      revalidateTag("admin-vehicles", "max");
      revalidatePath("/vehicles");
      revalidatePath("/incoming");
      revalidatePath("/");
    }

    revalidateTag("admin-leads", "max");
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    return { success: true };
  } catch (err) {
    console.error("markLeadWonWithVehicleAction failed:", err);
    return { success: false, error: "Failed to mark lead won." };
  }
}

/**
 * Reassign lead (Owner only).
 */
export async function reassignLeadAction(
  leadId: string,
  assignedTo: string,
  author: string = "Showroom Director"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    if (hasAdminCredentials()) {
      await adminDb.collection("leads").doc(leadId).update({
        assignedTo,
        updatedAt: now,
        updatedBy: author,
      });
    } else {
      inMemoryLeads = inMemoryLeads.map((l) =>
        l.id === leadId ? { ...l, assignedTo, updatedAt: now, updatedBy: author } : l
      );
    }
    revalidateTag("admin-leads", "max");
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    return { success: true };
  } catch (err) {
    console.error("reassignLeadAction failed:", err);
    return { success: false, error: "Failed to reassign lead." };
  }
}

/**
 * Delete a lead record (Owner only).
 */
export async function deleteLeadAction(
  leadId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (hasAdminCredentials()) {
      await adminDb.collection("leads").doc(leadId).delete();
    } else {
      inMemoryLeads = inMemoryLeads.filter((l) => l.id !== leadId);
    }
    revalidateTag("admin-leads", "max");
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    return { success: true };
  } catch (err) {
    console.error("deleteLeadAction failed:", err);
    return { success: false, error: "Failed to delete lead." };
  }
}

/**
 * Fetch and update company settings (Owner only).
 * Saving revalidates the entire site layout and company-settings cache tag.
 */
export async function updateCompanySettingsAction(
  updated: CompanySettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const payload = { ...updated, updatedAt: now };

    if (hasAdminCredentials()) {
      const batch = adminDb.batch();
      const genRef = adminDb
        .collection("settings")
        .doc("general")
        .withConverter(settingsConverter);
      const profRef = adminDb
        .collection("settings")
        .doc("company_profile")
        .withConverter(settingsConverter);
      batch.set(genRef, payload, { merge: true });
      batch.set(profRef, payload, { merge: true });
      await batch.commit();
    }

    // Revalidate settings tags and entire public site root layout
    revalidateTag("company-settings", "max");
    revalidateTag("settings", "max");
    revalidatePath("/", "layout");
    revalidatePath("/contact");
    revalidatePath("/about");
    revalidatePath("/services");
    revalidatePath("/spare-parts");
    revalidatePath("/incoming");
    revalidatePath("/vehicles");
    return { success: true };
  } catch (err) {
    console.error("updateCompanySettingsAction failed:", err);
    return { success: false, error: "Failed to update settings." };
  }
}

/**
 * Update vehicle purchase cost / landed import cost directly for profit calculations.
 */
export async function updateVehicleCostAction(
  vehicleId: string,
  costPrice: number | null,
  updatedBy: string = "Showroom Manager"
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    if (hasAdminCredentials()) {
      await adminDb.collection("vehicles").doc(vehicleId).update({
        costPrice,
        updatedAt: now,
        updatedBy,
      });
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) =>
        v.id === vehicleId ? { ...v, costPrice, updatedAt: now, updatedBy } : v
      );
    }
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/vehicles");
    revalidateTag("vehicles", "max");
    return { success: true };
  } catch (err) {
    console.error("updateVehicleCostAction failed:", err);
    return { success: false, error: "Failed to update vehicle cost." };
  }
}

