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

export const announcementSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().default(""),
  link: z.string().optional().default(""),
});
export type SiteAnnouncement = z.infer<typeof announcementSchema>;

export const companySettingsSchema = z.object({
  companyName: z.string(),
  tagline: z.string(),
  registrationNumber: z.string(),
  mainBranch: branchDetailsSchema,
  coastalBranch: branchDetailsSchema,
  announcement: announcementSchema.default({ enabled: false, text: "", link: "" }),
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
      companyName: data.companyName || "RS Enterprises Company Pvt Ltd",
      tagline: data.tagline || "Direct Importer of Premium Japanese Vehicles & Genuine Spare Parts",
      registrationNumber: data.registrationNumber || "TH/DS/ACCT/BR/38/2018",
      mainBranch: {
        name: data.mainBranch?.name || "Polonnaruwa Main Showroom & Head Office",
        address: data.mainBranch?.address || "No.37/1, Kaduruwela, Polonnaruwa, Sri Lanka",
        phone: data.mainBranch?.phone || "+94 27 222 0000",
        mobile: data.mainBranch?.mobile || "+94 77 123 4567",
        whatsapp: data.mainBranch?.whatsapp || "+94 77 123 4567",
        email: data.mainBranch?.email || "info@rsenterprises.lk",
        hours: data.mainBranch?.hours || "Mon - Sat: 8:30 AM - 6:00 PM | Sun: Closed",
        status: data.mainBranch?.status || "operational",
        geo: data.mainBranch?.geo || { lat: 7.9397, lng: 81.0028 },
      },
      coastalBranch: {
        name: data.coastalBranch?.name || "Trincomalee Coastal Showroom",
        address: data.coastalBranch?.address || "Inner Harbour Road, Trincomalee, Sri Lanka",
        phone: data.coastalBranch?.phone || "+94 26 222 0000",
        mobile: data.coastalBranch?.mobile || "+94 77 987 6543",
        whatsapp: data.coastalBranch?.whatsapp || "+94 77 987 6543",
        email: data.coastalBranch?.email || "trinco@rsenterprises.lk",
        hours: data.coastalBranch?.hours || "Mon - Sat: 9:00 AM - 5:30 PM | Sun: By Appointment",
        status: data.coastalBranch?.status || "coming_soon",
        geo: data.coastalBranch?.geo || { lat: 8.5874, lng: 81.2152 },
      },
      announcement: data.announcement || { enabled: false, text: "", link: "" },
      socialLinks: data.socialLinks || {
        facebook: "https://facebook.com/rsenterprises.lk",
        instagram: "https://instagram.com/rsenterprises.lk",
        youtube: "",
      },
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  },
};
