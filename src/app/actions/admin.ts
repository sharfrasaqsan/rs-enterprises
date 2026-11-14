"use server";

import { revalidateTag, revalidatePath, unstable_cache } from "next/cache";
import { adminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { Vehicle, vehicleConverter, VehicleStatus, ImportStage } from "@/types/vehicle";
import { Lead, leadConverter, LeadStage, DealershipBranch, LeadSource } from "@/types/lead";
import { CompanySettings, settingsConverter } from "@/types/settings";
import { SEED_VEHICLES, SEED_LEADS, SEED_SETTINGS } from "@/lib/seed-data";

// In-memory state for development fallback when Firestore credentials aren't active
let inMemoryVehicles: Vehicle[] = [...SEED_VEHICLES];
let inMemoryLeads: Lead[] = [...SEED_LEADS];
let inMemorySettings: CompanySettings = { ...SEED_SETTINGS };

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
      if (!snap.empty) {
        return snap.docs.map((d) => d.data());
      }
      return inMemoryVehicles;
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
    }

    if (hasAdminCredentials()) {
      await adminDb.collection("vehicles").doc(vehicleId).update(updatePayload);
    } else {
      inMemoryVehicles = inMemoryVehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              status,
              importStage: importStage !== undefined ? importStage : v.importStage,
              updatedAt: now,
              updatedBy,
            }
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
    console.error("updateVehicleStatusAction failed:", err);
    return { success: false, error: "Failed to update status." };
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
): Promise<{ success: boolean; vehicleId?: string; error?: string }> {
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
      importStage: vehicleData.importStage || null,
      expectedArrival: vehicleData.expectedArrival || null,
      published: vehicleData.published !== undefined ? vehicleData.published : true,
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
    revalidatePath("/vehicles");
    revalidatePath("/incoming");
    revalidatePath("/");
    revalidatePath(`/vehicles/${slug}`);
    return { success: true, vehicleId: id };
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
      if (!snap.empty) {
        return snap.docs.map((d) => d.data());
      }
      return inMemoryLeads;
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
    return { success: true };
  } catch (err) {
    console.error("setLeadFollowUpAction failed:", err);
    return { success: false, error: "Failed to set follow-up date." };
  }
}

/**
 * Create Lead from staff phone or walk-in enquiry.
 */
export async function createLeadAdminAction(
  data: {
    name: string;
    phone: string;
    vehicleTitle?: string;
    vehicleId?: string;
    source: LeadSource;
    branch: DealershipBranch;
    note?: string;
    assignedTo?: string;
  },
  author: string = "Showroom Staff"
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const now = new Date().toISOString();
    const id = `lead-${Date.now()}`;
    const initialNotes = data.note?.trim()
      ? [
          {
            id: `note-${Date.now()}`,
            text: data.note.trim(),
            author,
            time: now,
          },
        ]
      : [];

    const newLead: Lead = {
      id,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: null,
      source: data.source || "phone",
      branch: data.branch || "polonnaruwa",
      vehicleId: data.vehicleId || null,
      vehicleTitle: data.vehicleTitle?.trim() || null,
      requestDetails: data.note?.trim() || null,
      stage: "new",
      assignedTo: data.assignedTo || null,
      followUpDate: null,
      lostReason: null,
      updatedBy: author,
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
    return { success: true, leadId: id };
  } catch (err) {
    console.error("createLeadAdminAction failed:", err);
    return { success: false, error: "Failed to create lead." };
  }
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
      await adminDb
        .collection("settings")
        .doc("general")
        .withConverter(settingsConverter)
        .set(payload, { merge: true });
    } else {
      inMemorySettings = payload;
    }

    // Revalidate settings tag and entire public site root layout
    revalidateTag("company-settings", "max");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("updateCompanySettingsAction failed:", err);
    return { success: false, error: "Failed to update settings." };
  }
}

