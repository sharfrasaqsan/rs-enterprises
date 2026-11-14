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
  .enum([
    "purchased",
    "shipped",
    "at_port",
    "clearing",
    "ready",
    // Legacy mapping support
    "japan_auction",
    "in_transit",
    "customs_clearing",
    "in_stock",
  ])
  .nullable();
export type ImportStage = z.infer<typeof importStageSchema>;

export type StandardImportStage = "purchased" | "shipped" | "at_port" | "clearing" | "ready";

export function normalizeImportStage(stage: ImportStage): StandardImportStage | null {
  if (!stage) return null;
  switch (stage) {
    case "japan_auction":
    case "purchased":
      return "purchased";
    case "in_transit":
    case "shipped":
      return "shipped";
    case "at_port":
      return "at_port";
    case "customs_clearing":
    case "clearing":
      return "clearing";
    case "in_stock":
    case "ready":
      return "ready";
    default:
      return "purchased";
  }
}

export const IMPORT_STAGES: {
  key: StandardImportStage;
  label: string;
  stepNumber: number;
  description: string;
}[] = [
  { key: "purchased", label: "Purchased", stepNumber: 1, description: "Secured at Japanese auction yard" },
  { key: "shipped", label: "Shipped", stepNumber: 2, description: "RoRo vessel ocean transit" },
  { key: "at_port", label: "At port", stepNumber: 3, description: "Arrived at Hambantota / Colombo port" },
  { key: "clearing", label: "Clearing", stepNumber: 4, description: "Customs assessment & documentation" },
  { key: "ready", label: "Ready", stepNumber: 5, description: "Ready on Kaduruwela showroom floor" },
];

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

export const bodyTypeSchema = z.enum([
  "suv",
  "sedan",
  "hatchback",
  "mpv",
  "crossover",
  "wagon",
  "van",
  "coupe",
  "pickup",
]);
export type BodyType = z.infer<typeof bodyTypeSchema>;

export const driveTypeSchema = z.enum([
  "2WD",
  "4WD",
  "AWD",
  "FWD",
  "RWD",
]);
export type DriveType = z.infer<typeof driveTypeSchema>;

export const registrationStatusSchema = z.enum([
  "unregistered",
  "registered",
]);
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;

export const dealershipBranchSchema = z.enum([
  "polonnaruwa",
  "trincomalee",
]);
export type DealershipBranch = z.infer<typeof dealershipBranchSchema>;

export function formatBodyType(type?: BodyType | string): string {
  switch (type) {
    case "suv":
      return "SUV";
    case "sedan":
      return "Sedan";
    case "hatchback":
      return "Hatchback";
    case "mpv":
      return "MPV / Mini Van";
    case "crossover":
      return "Crossover";
    case "wagon":
      return "Station Wagon";
    case "van":
      return "Van";
    case "coupe":
      return "Coupe";
    case "pickup":
      return "Pickup";
    default:
      return type ? type.toUpperCase() : "SUV";
  }
}

export function formatBranch(branch?: DealershipBranch | string): string {
  switch (branch) {
    case "polonnaruwa":
      return "Kaduruwela Main Showroom";
    case "trincomalee":
      return "Trincomalee Branch";
    default:
      return "Kaduruwela Main Showroom";
  }
}

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
  bodyType: bodyTypeSchema.default("suv"),
  driveType: driveTypeSchema.default("2WD"),
  seats: z.number().int().positive().default(5),
  registrationStatus: registrationStatusSchema.default("unregistered"),
  owners: z.number().int().nonnegative().default(0),
  auctionGrade: z.string().default("4.5"),
  auctionScore: z.string().default("A"),
  chassisNumber: z.string().default(""), // Admin only - strictly withheld from public display
  branch: dealershipBranchSchema.default("polonnaruwa"),
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
  bodyType?: BodyType | "all";
  branch?: DealershipBranch | "all";
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
      bodyType: vehicle.bodyType,
      driveType: vehicle.driveType,
      seats: vehicle.seats,
      registrationStatus: vehicle.registrationStatus,
      owners: vehicle.owners,
      auctionGrade: vehicle.auctionGrade,
      auctionScore: vehicle.auctionScore,
      chassisNumber: vehicle.chassisNumber || "",
      branch: vehicle.branch,
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
      bodyType: data.bodyType || "suv",
      driveType: data.driveType || "2WD",
      seats: Number(data.seats) || 5,
      registrationStatus: data.registrationStatus || "unregistered",
      owners: data.owners !== undefined ? Number(data.owners) : 0,
      auctionGrade: data.auctionGrade || "4.5",
      auctionScore: data.auctionScore || "A",
      chassisNumber: data.chassisNumber || "",
      branch: data.branch || "polonnaruwa",
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
