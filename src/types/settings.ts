import { z } from "zod";
import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

export const branchDetailsSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  mobile: z.string(),
  whatsapp: z.string(),
  email: z.string().email(),
  hours: z.string(),
  status: z.enum(["operational", "coming_soon"]).default("operational"),
  geo: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});
export type BranchDetails = z.infer<typeof branchDetailsSchema>;

export const companySettingsSchema = z.object({
  companyName: z.string(),
  tagline: z.string(),
  registrationNumber: z.string(),
  mainBranch: branchDetailsSchema,
  coastalBranch: branchDetailsSchema,
  socialLinks: z.object({
    facebook: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
    youtube: z.string().url().optional().or(z.literal("")),
  }),
  updatedAt: z.string(),
});
export type CompanySettings = z.infer<typeof companySettingsSchema>;

export const settingsConverter: FirestoreDataConverter<CompanySettings> = {
  toFirestore(settings: CompanySettings) {
    return { ...settings };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): CompanySettings {
    const data = snapshot.data();
    return {
      companyName: data.companyName || "RS Enterprises Company Pvt Ltd [Placeholder to Confirm]",
      tagline: data.tagline || "Direct Importer of Premium Japanese Vehicles & Genuine Spare Parts",
      registrationNumber: data.registrationNumber || "PV-000000 [Placeholder to Confirm]",
      mainBranch: {
        name: data.mainBranch?.name || "Polonnaruwa Main Showroom",
        address: data.mainBranch?.address || "No.37/1, Kaduruwela, Polonnaruwa, Sri Lanka",
        phone: data.mainBranch?.phone || "+94 27 222 0000 [Placeholder to Confirm]",
        mobile: data.mainBranch?.mobile || "+94 77 123 4567 [Placeholder to Confirm]",
        whatsapp: data.mainBranch?.whatsapp || "94771234567 [Placeholder to Confirm]",
        email: data.mainBranch?.email || "info@rsenterprises.lk [Placeholder to Confirm]",
        hours: data.mainBranch?.hours || "Mon - Sat: 8:30 AM - 6:00 PM | Sun: Closed",
        status: data.mainBranch?.status || "operational",
        geo: data.mainBranch?.geo || { lat: 7.9397, lng: 81.0028 },
      },
      coastalBranch: {
        name: data.coastalBranch?.name || "Trincomalee Coastal Showroom [Placeholder to Confirm]",
        address: data.coastalBranch?.address || "Inner Harbour Road, Trincomalee, Sri Lanka [Details to be confirmed]",
        phone: data.coastalBranch?.phone || "+94 26 222 0000 [Placeholder to Confirm]",
        mobile: data.coastalBranch?.mobile || "+94 77 987 6543 [Placeholder to Confirm]",
        whatsapp: data.coastalBranch?.whatsapp || "94779876543 [Placeholder to Confirm]",
        email: data.coastalBranch?.email || "trinco@rsenterprises.lk [Placeholder to Confirm]",
        hours: data.coastalBranch?.hours || "Mon - Sat: 9:00 AM - 5:30 PM | Sun: By Appointment",
        status: data.coastalBranch?.status || "coming_soon",
        geo: data.coastalBranch?.geo || { lat: 8.5874, lng: 81.2152 },
      },
      socialLinks: data.socialLinks || {
        facebook: "https://facebook.com/rsenterprises.lk",
        instagram: "https://instagram.com/rsenterprises.lk",
        youtube: "",
      },
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  },
};
