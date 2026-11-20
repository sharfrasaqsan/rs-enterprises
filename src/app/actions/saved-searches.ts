"use server";

import { adminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { SEED_SAVED_SEARCHES } from "@/lib/seed-data";
import {
  SavedSearch,
  CreateSavedSearchInput,
  createSavedSearchInputSchema,
  savedSearchConverter,
  SavedSearchStatus,
  matchVehicleWithSavedSearch,
  buildSavedSearchWhatsAppMessage,
  buildSavedSearchWhatsAppUrl,
  generateSearchTitle,
} from "@/types/saved-search";
import { Vehicle } from "@/types/vehicle";
import { normalizePhoneNumber } from "@/lib/phone";
import { getAllPublishedVehicles } from "@/lib/vehicles";
import { registerOrMergeLeadCoreAction } from "@/app/actions/admin";

// In-memory persistent cache for environments without Firestore service account
let inMemorySavedSearches: SavedSearch[] = [...SEED_SAVED_SEARCHES];

/**
 * Retrieve all saved searches / back-in-stock alerts.
 */
export const getSavedSearchesAction = unstable_cache(
  async (filter?: {
    status?: string;
    phone?: string;
  }): Promise<SavedSearch[]> => {
    try {
      let searches: SavedSearch[] = [];
      if (hasAdminCredentials()) {
        const snap = await adminDb
          .collection("saved_searches")
          .withConverter(savedSearchConverter)
          .orderBy("createdAt", "desc")
          .get();
        searches = snap.docs.map((doc) => doc.data());
      } else {
        searches = [...inMemorySavedSearches];
      }

      if (filter?.status && filter.status !== "all") {
        searches = searches.filter((s) => s.status === filter.status);
      }
      if (filter?.phone) {
        const targetNorm = normalizePhoneNumber(filter.phone);
        searches = searches.filter((s) => s.customerPhone === targetNorm);
      }

      return searches;
    } catch (err) {
      console.warn("getSavedSearchesAction fallback:", err);
      return inMemorySavedSearches;
    }
  },
  ["admin-saved-searches-cache"],
  {
    revalidate: 60,
    tags: ["saved-searches", "admin-saved-searches"],
  }
);

/**
 * Public action: A visitor saves a search / back-in-stock alert (e.g. "Prado under 20M").
 * Automatically:
 * 1. Normalizes phone to Sri Lankan +94 format.
 * 2. Checks current inventory to see if matching vehicles already exist.
 * 3. Records into saved_searches.
 * 4. Integrates with the CRM Leads pipeline (registerOrMergeLeadCoreAction).
 */
export async function createSavedSearchAction(
  rawInput: CreateSavedSearchInput
): Promise<{
  success: boolean;
  savedSearch?: SavedSearch;
  existingMatches?: Vehicle[];
  error?: string;
}> {
  try {
    const parseRes = createSavedSearchInputSchema.safeParse(rawInput);
    if (!parseRes.success) {
      const msg = parseRes.error.issues[0]?.message || "Invalid input";
      return { success: false, error: msg };
    }

    const input = parseRes.data;
    const normalizedPhone = normalizePhoneNumber(input.customerPhone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return {
        success: false,
        error: "Please enter a valid Sri Lankan phone number (e.g. 077 123 4567).",
      };
    }

    const queryTitle =
      input.queryTitle?.trim() ||
      generateSearchTitle({
        make: input.make,
        model: input.model,
        keyword: input.keyword,
        maxPrice: input.maxPrice,
        bodyType: input.bodyType,
      });

    const now = new Date().toISOString();
    const id = `search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Query current inventory to see if any available or incoming vehicle matches right now
    const allVehicles = await getAllPublishedVehicles();
    const activeVehicles = allVehicles.filter(
      (v) => v.published && v.status !== "sold" && !v.archived
    );

    const tempSearchForMatching: SavedSearch = {
      id,
      customerName: input.customerName.trim(),
      customerPhone: normalizedPhone,
      customerEmail: input.customerEmail || null,
      queryTitle,
      criteria: {
        make: input.make || "",
        model: input.model || "",
        keyword: input.keyword || "",
        maxPrice: input.maxPrice || null,
        minPrice: input.minPrice || null,
        minYear: input.minYear || 2015,
        maxYear: 2030,
        bodyType: input.bodyType || "all",
        fuel: input.fuel || "all",
        transmission: "all",
        branch: input.branch || "all",
      },
      status: "active",
      matchCount: 0,
      matchedVehicleIds: [],
      lastNotifiedAt: null,
      notificationLog: [],
      notes: input.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    const existingMatches = activeVehicles.filter((v) =>
      matchVehicleWithSavedSearch(v, tempSearchForMatching)
    );

    const newSearch: SavedSearch = {
      ...tempSearchForMatching,
      matchCount: existingMatches.length,
      matchedVehicleIds: existingMatches.map((v) => v.id),
    };

    // Save to Firestore or in-memory
    if (hasAdminCredentials()) {
      await adminDb
        .collection("saved_searches")
        .doc(id)
        .withConverter(savedSearchConverter)
        .set(newSearch);
    } else {
      inMemorySavedSearches.unshift(newSearch);
    }

    // Auto-create or merge lead into CRM pipeline
    try {
      await registerOrMergeLeadCoreAction({
        name: newSearch.customerName,
        phone: newSearch.customerPhone,
        email: newSearch.customerEmail,
        source: "website_form",
        branch: input.branch === "trincomalee" ? "trincomalee" : "polonnaruwa",
        requestDetails: `[SAVED SEARCH & BACK-IN-STOCK ALERT] Alert Title: "${newSearch.queryTitle}"\nMake: ${newSearch.criteria.make || "Any"}\nModel: ${newSearch.criteria.model || newSearch.criteria.keyword || "Any"}\nMax Budget: ${newSearch.criteria.maxPrice ? `LKR ${newSearch.criteria.maxPrice.toLocaleString("en-US")}` : "Any"}\nCurrent Matches: ${existingMatches.length} vehicle(s)`,
        note: `Saved alert for "${newSearch.queryTitle}". WhatsApp notifications enabled for ${newSearch.customerPhone}.`,
      });
    } catch (leadErr) {
      console.warn("Could not auto-link saved search to CRM leads:", leadErr);
    }

    revalidateTag("saved-searches", "max");
    revalidateTag("admin-saved-searches", "max");
    revalidatePath("/vehicles");
    revalidatePath("/admin/leads");
    revalidatePath("/admin");

    return {
      success: true,
      savedSearch: newSearch,
      existingMatches,
    };
  } catch (err) {
    console.error("createSavedSearchAction failed:", err);
    return { success: false, error: "Failed to save alert. Please try again." };
  }
}

/**
 * Core check invoked whenever a vehicle is added or published.
 * Matches against all active saved searches and logs notification ready to be sent.
 */
export async function checkAndNotifySavedSearchesAction(
  vehicle: Vehicle
): Promise<{
  matchedCount: number;
  matchedAlerts: {
    search: SavedSearch;
    whatsappUrl: string;
    messageText: string;
  }[];
}> {
  if (!vehicle.published || vehicle.status === "sold" || vehicle.archived) {
    return { matchedCount: 0, matchedAlerts: [] };
  }

  try {
    let allSearches: SavedSearch[] = [];
    if (hasAdminCredentials()) {
      const snap = await adminDb
        .collection("saved_searches")
        .withConverter(savedSearchConverter)
        .where("status", "==", "active")
        .get();
      allSearches = snap.docs.map((d) => d.data());
    } else {
      allSearches = inMemorySavedSearches.filter((s) => s.status === "active");
    }

    const matchedAlerts: {
      search: SavedSearch;
      whatsappUrl: string;
      messageText: string;
    }[] = [];

    const now = new Date().toISOString();

    for (const search of allSearches) {
      // Skip if this search was already matched to this vehicle
      if (search.matchedVehicleIds.includes(vehicle.id)) {
        continue;
      }

      if (matchVehicleWithSavedSearch(vehicle, search)) {
        const messageText = buildSavedSearchWhatsAppMessage(search, vehicle);
        const whatsappUrl = buildSavedSearchWhatsAppUrl(search, vehicle);

        const newLogEntry = {
          vehicleId: vehicle.id,
          vehicleTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.grade || "Standard"})`,
          vehiclePrice: vehicle.price,
          vehicleSlug: vehicle.slug,
          notifiedAt: now,
          channel: "whatsapp" as const,
          messagePreview: messageText.slice(0, 160) + "...",
        };

        const updatedSearch: SavedSearch = {
          ...search,
          matchCount: (search.matchCount || 0) + 1,
          matchedVehicleIds: [...search.matchedVehicleIds, vehicle.id],
          lastNotifiedAt: now,
          status: "notified",
          notificationLog: [newLogEntry, ...(search.notificationLog || [])],
          updatedAt: now,
        };

        if (hasAdminCredentials()) {
          await adminDb
            .collection("saved_searches")
            .doc(search.id)
            .withConverter(savedSearchConverter)
            .set(updatedSearch, { merge: true });
        } else {
          const idx = inMemorySavedSearches.findIndex((s) => s.id === search.id);
          if (idx >= 0) {
            inMemorySavedSearches[idx] = updatedSearch;
          }
        }

        matchedAlerts.push({
          search: updatedSearch,
          whatsappUrl,
          messageText,
        });

        // Also add an audit note to the buyer's lead dossier
        try {
          await registerOrMergeLeadCoreAction({
            name: search.customerName,
            phone: search.customerPhone,
            source: "website_form",
            branch: vehicle.branch,
            vehicleId: vehicle.id,
            vehicleTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            note: `✦ STOCK MATCH DETECTED: Added vehicle "${vehicle.year} ${vehicle.make} ${vehicle.model}" matched saved alert "${search.queryTitle}". WhatsApp alert link prepared for ${search.customerPhone}.`,
          });
        } catch (leadErr) {
          console.warn("Could not log match into lead record:", leadErr);
        }
      }
    }

    if (matchedAlerts.length > 0) {
      revalidateTag("saved-searches", "max");
      revalidateTag("admin-saved-searches", "max");
      revalidatePath("/admin/leads");
      revalidatePath("/admin");
    }

    return {
      matchedCount: matchedAlerts.length,
      matchedAlerts,
    };
  } catch (err) {
    console.error("checkAndNotifySavedSearchesAction error:", err);
    return { matchedCount: 0, matchedAlerts: [] };
  }
}

/**
 * 1-Tap Trigger from Admin CRM: staff manually generates or re-sends WhatsApp alert.
 */
export async function triggerManualSavedSearchAlertAction(
  savedSearchId: string,
  vehicleId: string
): Promise<{
  success: boolean;
  whatsappUrl?: string;
  messageText?: string;
  error?: string;
}> {
  try {
    const allVehicles = await getAllPublishedVehicles();
    const vehicle = allVehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      return { success: false, error: "Vehicle not found." };
    }

    const allSearches = await getSavedSearchesAction();
    const search = allSearches.find((s) => s.id === savedSearchId);
    if (!search) {
      return { success: false, error: "Saved alert not found." };
    }

    const messageText = buildSavedSearchWhatsAppMessage(search, vehicle);
    const whatsappUrl = buildSavedSearchWhatsAppUrl(search, vehicle);
    const now = new Date().toISOString();

    const newLogEntry = {
      vehicleId: vehicle.id,
      vehicleTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      vehiclePrice: vehicle.price,
      vehicleSlug: vehicle.slug,
      notifiedAt: now,
      channel: "whatsapp" as const,
      messagePreview: messageText.slice(0, 160) + "...",
    };

    const updatedMatchedIds = search.matchedVehicleIds.includes(vehicle.id)
      ? search.matchedVehicleIds
      : [...search.matchedVehicleIds, vehicle.id];

    const updatedSearch: SavedSearch = {
      ...search,
      matchCount: updatedMatchedIds.length,
      matchedVehicleIds: updatedMatchedIds,
      lastNotifiedAt: now,
      status: "notified",
      notificationLog: [newLogEntry, ...(search.notificationLog || [])],
      updatedAt: now,
    };

    if (hasAdminCredentials()) {
      await adminDb
        .collection("saved_searches")
        .doc(search.id)
        .withConverter(savedSearchConverter)
        .set(updatedSearch, { merge: true });
    } else {
      const idx = inMemorySavedSearches.findIndex((s) => s.id === search.id);
      if (idx >= 0) {
        inMemorySavedSearches[idx] = updatedSearch;
      }
    }

    revalidateTag("saved-searches", "max");
    revalidateTag("admin-saved-searches", "max");
    revalidatePath("/admin/leads");
    revalidatePath("/admin");

    return {
      success: true,
      whatsappUrl,
      messageText,
    };
  } catch (err) {
    console.error("triggerManualSavedSearchAlertAction failed:", err);
    return { success: false, error: "Failed to trigger alert." };
  }
}

/**
 * Update saved search status (e.g. fulfill or cancel)
 */
export async function updateSavedSearchStatusAction(
  id: string,
  status: SavedSearchStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    if (hasAdminCredentials()) {
      await adminDb
        .collection("saved_searches")
        .doc(id)
        .update({ status, updatedAt: now });
    } else {
      const idx = inMemorySavedSearches.findIndex((s) => s.id === id);
      if (idx >= 0) {
        inMemorySavedSearches[idx] = {
          ...inMemorySavedSearches[idx]!,
          status,
          updatedAt: now,
        };
      }
    }
    revalidateTag("saved-searches", "max");
    revalidateTag("admin-saved-searches", "max");
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("updateSavedSearchStatusAction failed:", err);
    return { success: false, error: "Failed to update status." };
  }
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearchAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (hasAdminCredentials()) {
      await adminDb.collection("saved_searches").doc(id).delete();
    } else {
      inMemorySavedSearches = inMemorySavedSearches.filter((s) => s.id !== id);
    }
    revalidateTag("saved-searches", "max");
    revalidateTag("admin-saved-searches", "max");
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("deleteSavedSearchAction failed:", err);
    return { success: false, error: "Failed to delete alert." };
  }
}
