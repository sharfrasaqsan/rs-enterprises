import { z } from "zod";
import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";

export const vehicleStatusSchema = z.enum([
  "available",
  "reserved",
  "sold",
  "incoming",
]);
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;

export const importStageSchema = z
  .enum(["japan_auction", "in_transit", "customs_clearing", "in_stock"])
  .nullable();
export type ImportStage = z.infer<typeof importStageSchema>;

export const fuelTypeSchema = z.enum([
  "petrol",
  "diesel",
  "hybrid",
  "electric",
]);
export type FuelType = z.infer<typeof fuelTypeSchema>;

export const transmissionSchema = z.enum([
  "automatic",
  "manual",
  "cvt",
]);
export type TransmissionType = z.infer<typeof transmissionSchema>;

export const vehicleSchema = z.object({
  id: z.string(),
  slug: z.string().min(3),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  price: z.number().positive().nullable(), // null = "Call for price"
  mileage: z.number().nonnegative(), // in km
  fuel: fuelTypeSchema,
  transmission: transmissionSchema,
  grade: z.string().default("Standard"),
  engineCC: z.number().int().positive(),
  color: z.string().min(1),
  status: vehicleStatusSchema,
  importStage: importStageSchema.default(null),
  expectedArrival: z.string().nullable().default(null),
  published: z.boolean().default(true),
  archived: z.boolean().default(false),
  updatedBy: z.string().nullable().default(null),
  images: z.array(z.string().url()).min(1),
  features: z.array(z.string()).default([]),
  description: z.string().default(""),
  createdAt: z.string(), // ISO string in client representation
  updatedAt: z.string(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

export interface VehicleFilterParams {
  status?: VehicleStatus | "all";
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  fuel?: FuelType | "all";
  transmission?: TransmissionType | "all";
  search?: string;
  sort?: "price_asc" | "price_desc" | "year_desc" | "year_asc" | "mileage_asc" | "recent";
  page?: number;
  limit?: number;
}

export interface PaginatedVehiclesResult {
  vehicles: Vehicle[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  availableMakes: string[];
}

/**
 * Firestore Data Converter for firebase-admin
 */
export const vehicleConverter: FirestoreDataConverter<Vehicle> = {
  toFirestore(vehicle: Vehicle) {
    return {
      slug: vehicle.slug,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      mileage: vehicle.mileage,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      grade: vehicle.grade,
      engineCC: vehicle.engineCC,
      color: vehicle.color,
      status: vehicle.status,
      importStage: vehicle.importStage,
      expectedArrival: vehicle.expectedArrival,
      published: vehicle.published,
      archived: Boolean(vehicle.archived),
      updatedBy: vehicle.updatedBy || null,
      images: vehicle.images,
      features: vehicle.features,
      description: vehicle.description,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Vehicle {
    const data = snapshot.data();
    
    // Normalize Firestore Timestamps to ISO strings for safe Server/Client serialization
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
      slug: data.slug || snapshot.id,
      make: data.make || "Toyota",
      model: data.model || "",
      year: Number(data.year) || 2020,
      price: data.price !== undefined && data.price !== null ? Number(data.price) : null,
      mileage: Number(data.mileage) || 0,
      fuel: data.fuel || "petrol",
      transmission: data.transmission || "automatic",
      grade: data.grade || "",
      engineCC: Number(data.engineCC) || 1500,
      color: data.color || "",
      status: data.status || "available",
      importStage: data.importStage || null,
      expectedArrival: data.expectedArrival || null,
      published: Boolean(data.published),
      archived: Boolean(data.archived),
      updatedBy: data.updatedBy || null,
      images: Array.isArray(data.images) ? data.images : [],
      features: Array.isArray(data.features) ? data.features : [],
      description: data.description || "",
      createdAt: formatTimestamp(data.createdAt),
      updatedAt: formatTimestamp(data.updatedAt),
    };
  },
};
