import { z } from "zod";
import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";
import type { Vehicle } from "@/types/vehicle";
import { getWhatsAppNumber, normalizePhoneNumber } from "@/lib/phone";

export const savedSearchStatusSchema = z.enum([
  "active",
  "notified",
  "fulfilled",
  "cancelled",
]);
export type SavedSearchStatus = z.infer<typeof savedSearchStatusSchema>;

export const savedSearchCriteriaSchema = z.object({
  make: z.string().optional().default(""),
  model: z.string().optional().default(""),
  keyword: z.string().optional().default(""),
  maxPrice: z.number().positive().nullable().optional().default(null),
  minPrice: z.number().positive().nullable().optional().default(null),
  minYear: z.number().int().optional().default(2015),
  maxYear: z.number().int().optional().default(2030),
  bodyType: z.string().optional().default("all"),
  fuel: z.string().optional().default("all"),
  transmission: z.string().optional().default("all"),
  branch: z.string().optional().default("all"),
});
export type SavedSearchCriteria = z.infer<typeof savedSearchCriteriaSchema>;

export const savedSearchNotificationLogSchema = z.object({
  vehicleId: z.string(),
  vehicleTitle: z.string(),
  vehiclePrice: z.number().nullable().optional(),
  vehicleSlug: z.string(),
  notifiedAt: z.string(),
  channel: z.enum(["whatsapp", "sms"]).default("whatsapp"),
  messagePreview: z.string(),
});
export type SavedSearchNotificationLog = z.infer<
  typeof savedSearchNotificationLogSchema
>;

export const savedSearchSchema = z.object({
  id: z.string(),
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z.string().min(8, "Valid phone number is required"),
  customerEmail: z.string().email().nullable().optional(),
  queryTitle: z.string().min(1),
  criteria: savedSearchCriteriaSchema,
  status: savedSearchStatusSchema.default("active"),
  matchCount: z.number().int().nonnegative().default(0),
  matchedVehicleIds: z.array(z.string()).default([]),
  lastNotifiedAt: z.string().nullable().optional(),
  notificationLog: z.array(savedSearchNotificationLogSchema).default([]),
  notes: z.string().optional().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SavedSearch = z.infer<typeof savedSearchSchema>;

export const createSavedSearchInputSchema = z.object({
  customerName: z.string().min(1, "Please provide your name"),
  customerPhone: z.string().min(8, "Please enter a valid WhatsApp or phone number"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  queryTitle: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  keyword: z.string().optional(),
  maxPrice: z.number().positive().optional().nullable(),
  minPrice: z.number().positive().optional().nullable(),
  minYear: z.number().int().optional().nullable(),
  bodyType: z.string().optional(),
  fuel: z.string().optional(),
  branch: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateSavedSearchInput = z.infer<typeof createSavedSearchInputSchema>;

/**
 * Intelligent Vehicle Matcher
 * Evaluates whether an incoming or newly added vehicle fulfills a visitor's saved search criteria.
 */
export function matchVehicleWithSavedSearch(
  vehicle: Vehicle,
  search: SavedSearch
): boolean {
  const { criteria } = search;

  // 1. Make match
  if (criteria.make && criteria.make !== "all") {
    if (vehicle.make.toLowerCase() !== criteria.make.toLowerCase()) {
      return false;
    }
  }

  // 2. Model / Keyword text match
  const searchTerms: string[] = [];
  if (criteria.model && criteria.model.trim()) {
    searchTerms.push(criteria.model.trim().toLowerCase());
  }
  if (criteria.keyword && criteria.keyword.trim()) {
    searchTerms.push(criteria.keyword.trim().toLowerCase());
  }

  if (searchTerms.length > 0) {
    const haystack = `${vehicle.make} ${vehicle.model} ${vehicle.grade} ${vehicle.description || ""}`.toLowerCase();
    const matchesAny = searchTerms.some((term) => haystack.includes(term));
    if (!matchesAny) {
      return false;
    }
  }

  // 3. Maximum Price constraint (e.g. Under 20M)
  if (criteria.maxPrice && criteria.maxPrice > 0) {
    if (vehicle.price !== null && vehicle.price !== undefined) {
      if (vehicle.price > criteria.maxPrice) {
        return false;
      }
    }
  }

  // 4. Minimum Price constraint
  if (criteria.minPrice && criteria.minPrice > 0) {
    if (vehicle.price !== null && vehicle.price !== undefined) {
      if (vehicle.price < criteria.minPrice) {
        return false;
      }
    }
  }

  // 5. Minimum Year constraint
  if (criteria.minYear && criteria.minYear > 0) {
    if (vehicle.year < criteria.minYear) {
      return false;
    }
  }

  // 6. Body Type constraint
  if (criteria.bodyType && criteria.bodyType !== "all") {
    if (vehicle.bodyType !== criteria.bodyType) {
      return false;
    }
  }

  // 7. Fuel constraint
  if (criteria.fuel && criteria.fuel !== "all") {
    if (vehicle.fuel !== criteria.fuel) {
      return false;
    }
  }

  // 8. Branch constraint
  if (criteria.branch && criteria.branch !== "all") {
    if (vehicle.branch !== criteria.branch) {
      return false;
    }
  }

  return true;
}

/**
 * Builds the official showroom WhatsApp back-in-stock message
 */
export function buildSavedSearchWhatsAppMessage(
  search: SavedSearch,
  vehicle: Vehicle
): string {
  const priceDisplay = vehicle.price
    ? `LKR ${vehicle.price.toLocaleString("en-US")}`
    : "Price on Request";

  return `Hello ${search.customerName}! Great news from RS Enterprises Polonnaruwa. A vehicle matching your saved alert "${search.queryTitle}" has just arrived:

🚗 ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.grade || "Standard"})
💰 Valuation: ${priceDisplay}
📊 Mileage: ${vehicle.mileage.toLocaleString("en-US")} km
📍 Showroom: ${vehicle.branch === "trincomalee" ? "Trincomalee Branch" : "Kaduruwela Main Showroom"}

🔗 View full gallery and auction sheet:
https://rsenterprises.lk/vehicles/${vehicle.slug}

Would you like to reserve this vehicle or schedule a viewing? Reply directly to this WhatsApp message or call our showroom desk.`;
}

/**
 * Builds a direct deep-link to WhatsApp click-to-chat
 */
export function buildSavedSearchWhatsAppUrl(
  search: SavedSearch,
  vehicle: Vehicle
): string {
  const cleanPhone = getWhatsAppNumber(search.customerPhone);
  const text = buildSavedSearchWhatsAppMessage(search, vehicle);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Computes a luxury user-facing title for a search filter combination
 * e.g. "Toyota Prado under 20M"
 */
export function generateSearchTitle(criteria: {
  make?: string;
  model?: string;
  keyword?: string;
  maxPrice?: number | null;
  bodyType?: string;
}): string {
  const parts: string[] = [];

  if (criteria.make && criteria.make !== "all") {
    parts.push(criteria.make);
  }

  const modelOrKw = criteria.model || criteria.keyword;
  if (modelOrKw && modelOrKw.trim()) {
    parts.push(modelOrKw.trim());
  } else if (!criteria.make || criteria.make === "all") {
    if (criteria.bodyType && criteria.bodyType !== "all") {
      parts.push(criteria.bodyType.toUpperCase());
    } else {
      parts.push("Vehicles");
    }
  }

  if (criteria.maxPrice && criteria.maxPrice > 0) {
    const millions = criteria.maxPrice / 1000000;
    const formattedM = millions >= 1 ? `${millions.toFixed(millions % 1 === 0 ? 0 : 1)}M` : `${criteria.maxPrice.toLocaleString()} LKR`;
    parts.push(`under ${formattedM}`);
  }

  return parts.join(" ") || "All Vehicles";
}

/**
 * Firestore Data Converter for Saved Searches
 */
export const savedSearchConverter: FirestoreDataConverter<SavedSearch> = {
  toFirestore(search: SavedSearch) {
    return {
      customerName: search.customerName,
      customerPhone: normalizePhoneNumber(search.customerPhone),
      customerEmail: search.customerEmail || null,
      queryTitle: search.queryTitle,
      criteria: search.criteria,
      status: search.status,
      matchCount: search.matchCount || 0,
      matchedVehicleIds: search.matchedVehicleIds || [],
      lastNotifiedAt: search.lastNotifiedAt || null,
      notificationLog: search.notificationLog || [],
      notes: search.notes || "",
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): SavedSearch {
    const data = snapshot.data();

    const formatTimestamp = (val: unknown): string => {
      if (!val) return new Date().toISOString();
      if (typeof val === "string") return val;
      if (typeof (val as Timestamp).toDate === "function") {
        return (val as Timestamp).toDate().toISOString();
      }
      return new Date(val as number).toISOString();
    };

    return {
      id: snapshot.id,
      customerName: data.customerName || "Anonymous Buyer",
      customerPhone: normalizePhoneNumber(data.customerPhone || ""),
      customerEmail: data.customerEmail || null,
      queryTitle: data.queryTitle || "Vehicle Alert",
      criteria: {
        make: data.criteria?.make || "",
        model: data.criteria?.model || "",
        keyword: data.criteria?.keyword || "",
        maxPrice: data.criteria?.maxPrice ? Number(data.criteria.maxPrice) : null,
        minPrice: data.criteria?.minPrice ? Number(data.criteria.minPrice) : null,
        minYear: data.criteria?.minYear ? Number(data.criteria.minYear) : 2015,
        maxYear: data.criteria?.maxYear ? Number(data.criteria.maxYear) : 2030,
        bodyType: data.criteria?.bodyType || "all",
        fuel: data.criteria?.fuel || "all",
        transmission: data.criteria?.transmission || "all",
        branch: data.criteria?.branch || "all",
      },
      status: (data.status as SavedSearchStatus) || "active",
      matchCount: typeof data.matchCount === "number" ? data.matchCount : 0,
      matchedVehicleIds: Array.isArray(data.matchedVehicleIds)
        ? data.matchedVehicleIds.map(String)
        : [],
      lastNotifiedAt: data.lastNotifiedAt ? formatTimestamp(data.lastNotifiedAt) : null,
      notificationLog: Array.isArray(data.notificationLog)
        ? data.notificationLog.map((log: Record<string, unknown>) => ({
            vehicleId: String(log.vehicleId || ""),
            vehicleTitle: String(log.vehicleTitle || ""),
            vehiclePrice: log.vehiclePrice !== undefined && log.vehiclePrice !== null ? Number(log.vehiclePrice) : null,
            vehicleSlug: String(log.vehicleSlug || ""),
            notifiedAt: formatTimestamp(log.notifiedAt),
            channel: (log.channel as "whatsapp" | "sms") || "whatsapp",
            messagePreview: String(log.messagePreview || ""),
          }))
        : [],
      notes: data.notes || "",
      createdAt: formatTimestamp(data.createdAt),
      updatedAt: formatTimestamp(data.updatedAt),
    };
  },
};
