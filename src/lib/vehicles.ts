import "server-only";
import { unstable_cache } from "next/cache";
import { adminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import {
  Vehicle,
  VehicleFilterParams,
  PaginatedVehiclesResult,
  vehicleConverter,
} from "@/types/vehicle";
import { SEED_VEHICLES } from "@/lib/seed-data";

/**
 * Fetch all published vehicles from Firestore once per revalidation cycle.
 * Cached with the Next.js tag 'vehicles'.
 * If Firestore is not reachable or credentials are not yet set, gracefully returns seed data.
 */
export const getAllPublishedVehicles = unstable_cache(
  async (): Promise<Vehicle[]> => {
    if (!hasAdminCredentials()) {
      return SEED_VEHICLES.filter((v) => v.published && !v.archived);
    }
    try {
      const snapshot = await adminDb
        .collection("vehicles")
        .withConverter(vehicleConverter)
        .where("published", "==", true)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs
          .map((doc) => doc.data())
          .filter((v) => !v.archived);
      }
      
      // Fallback to seed vehicles if the database collection is empty
      return SEED_VEHICLES.filter((v) => v.published && !v.archived);
    } catch (error) {
      console.warn("Firestore read failed or credentials missing; using seed data fallback:", error);
      return SEED_VEHICLES.filter((v) => v.published && !v.archived);
    }
  },
  ["all-published-vehicles-cache"],
  {
    revalidate: 3600, // 1 hour TTL
    tags: ["vehicles"],
  }
);

/**
 * Filter, sort, and paginate vehicles in memory on the server from the single cached fetch.
 */
export async function getVehicles(
  filters: VehicleFilterParams = {}
): Promise<PaginatedVehiclesResult> {
  const allVehicles = await getAllPublishedVehicles();

  // 1. Gather all unique makes from the entire published inventory
  const availableMakes = Array.from(
    new Set(allVehicles.map((v) => v.make))
  ).sort();

  // 2. In-Memory Filtering
  let filtered = allVehicles.filter((v) => {
    // Status filter
    if (filters.status && filters.status !== "all") {
      if (v.status !== filters.status) return false;
    }

    // Make filter
    if (filters.make && filters.make !== "all") {
      if (v.make.toLowerCase() !== filters.make.toLowerCase()) return false;
    }

    // Model filter (partial or exact)
    if (filters.model) {
      if (!v.model.toLowerCase().includes(filters.model.toLowerCase())) {
        return false;
      }
    }

    // Year range
    if (filters.minYear && v.year < filters.minYear) return false;
    if (filters.maxYear && v.year > filters.maxYear) return false;

    // Price range (vehicles with price === null are treated as special unless filtered out)
    if (filters.minPrice !== undefined) {
      if (v.price === null || v.price < filters.minPrice) return false;
    }
    if (filters.maxPrice !== undefined) {
      if (v.price === null || v.price > filters.maxPrice) return false;
    }

    // Fuel filter
    if (filters.fuel && filters.fuel !== "all") {
      if (v.fuel !== filters.fuel) return false;
    }

    // Transmission filter
    if (filters.transmission && filters.transmission !== "all") {
      if (v.transmission !== filters.transmission) return false;
    }

    // Free-text search (make, model, year, grade, color, features)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchMake = v.make.toLowerCase().includes(q);
      const matchModel = v.model.toLowerCase().includes(q);
      const matchYear = String(v.year).includes(q);
      const matchGrade = v.grade.toLowerCase().includes(q);
      const matchColor = v.color.toLowerCase().includes(q);
      const matchFeatures = v.features.some((f) => f.toLowerCase().includes(q));

      if (
        !matchMake &&
        !matchModel &&
        !matchYear &&
        !matchGrade &&
        !matchColor &&
        !matchFeatures
      ) {
        return false;
      }
    }

    return true;
  });

  // 3. In-Memory Sorting (Sold vehicles stay visible, de-emphasized, and sorted last)
  const sort = filters.sort || "recent";
  filtered.sort((a, b) => {
    if (filters.status !== "sold") {
      if (a.status === "sold" && b.status !== "sold") return 1;
      if (a.status !== "sold" && b.status === "sold") return -1;
    }

    switch (sort) {
      case "price_asc":
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;

      case "price_desc":
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return b.price - a.price;

      case "year_desc":
        return b.year - a.year;

      case "year_asc":
        return a.year - b.year;

      case "mileage_asc":
        return a.mileage - b.mileage;

      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // 4. In-Memory Pagination
  const total = filtered.length;
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(50, filters.limit || 9));
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedVehicles = filtered.slice(startIndex, endIndex);

  return {
    vehicles: paginatedVehicles,
    total,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    availableMakes,
  };
}

/**
 * Retrieve a single vehicle by slug.
 * Checks the cached dataset first. If not found, falls back to direct database query.
 */
export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  const allVehicles = await getAllPublishedVehicles();
  const cached = allVehicles.find((v) => v.slug === slug);
  if (cached) return cached;

  // Direct database lookup (for drafts / newly published units)
  try {
    const snapshot = await adminDb
      .collection("vehicles")
      .withConverter(vehicleConverter)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!snapshot.empty && snapshot.docs[0]) {
      const data = snapshot.docs[0].data();
      if (data.archived) return null;
      return data;
    }
  } catch (error) {
    console.warn(`Direct vehicle lookup failed for slug ${slug}:`, error);
  }

  // Check seed vehicles fallback
  const seedFallback = SEED_VEHICLES.find((v) => v.slug === slug);
  if (seedFallback && !seedFallback.archived) {
    return seedFallback;
  }
  return null;
}

/**
 * Retrieve related vehicles based on make or price range.
 */
export async function getRelated(
  vehicle: Vehicle,
  limit = 3
): Promise<Vehicle[]> {
  const allVehicles = await getAllPublishedVehicles();

  const candidates = allVehicles.filter(
    (v) => v.id !== vehicle.id && v.status !== "sold"
  );

  // Score candidates: same make = +2, same fuel = +1, price within 30% = +1
  const scored = candidates.map((cand) => {
    let score = 0;
    if (cand.make.toLowerCase() === vehicle.make.toLowerCase()) score += 2;
    if (cand.fuel === vehicle.fuel) score += 1;
    if (vehicle.price && cand.price) {
      const ratio = cand.price / vehicle.price;
      if (ratio >= 0.7 && ratio <= 1.3) score += 1;
    }
    return { vehicle: cand, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.vehicle);
}

/**
 * Retrieve multiple vehicles by their slugs for the side-by-side comparison page.
 * Preserves the exact order of the requested slugs.
 */
export async function getVehiclesBySlugs(slugs: string[]): Promise<Vehicle[]> {
  if (!slugs || slugs.length === 0) return [];

  const allVehicles = await getAllPublishedVehicles();
  const slugSet = new Map<string, Vehicle>();

  // Map cached vehicles
  for (const v of allVehicles) {
    slugSet.set(v.slug, v);
  }

  const results: Vehicle[] = [];
  for (const slug of slugs) {
    const found = slugSet.get(slug);
    if (found) {
      results.push(found);
    } else {
      // Check seed data directly
      const seed = SEED_VEHICLES.find((s) => s.slug === slug);
      if (seed) results.push(seed);
    }
  }

  return results;
}

