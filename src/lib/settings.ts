import "server-only";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { CompanySettings, settingsConverter } from "@/types/settings";

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "RS Enterprises Company Pvt Ltd",
  tagline: "Direct Importer of Premium Japanese Vehicles & Genuine Spare Parts",
  registrationNumber: "TH/DS/ACCT/BR/38/2018",
  mainBranch: {
    name: "Polonnaruwa Main Showroom & Head Office",
    address: "No.37/1, Kaduruwela, Polonnaruwa, Sri Lanka",
    phone: "+94 27 222 0000",
    mobile: "+94 77 123 4567",
    whatsapp: "+94 77 123 4567",
    email: "info@rsenterprises.lk",
    hours: "Mon - Sat: 8:30 AM - 6:00 PM | Sun: Closed",
    status: "operational",
    geo: { lat: 7.9397, lng: 81.0028 },
  },
  coastalBranch: {
    name: "Trincomalee Coastal Showroom",
    address: "Inner Harbour Road, Trincomalee, Sri Lanka",
    phone: "+94 26 222 0000",
    mobile: "+94 77 987 6543",
    whatsapp: "+94 77 987 6543",
    email: "trinco@rsenterprises.lk",
    hours: "Mon - Sat: 9:00 AM - 5:30 PM | Sun: By Appointment",
    status: "coming_soon",
    geo: { lat: 8.5874, lng: 81.2152 },
  },
  announcement: {
    enabled: false,
    text: "",
    link: "",
  },
  socialLinks: {
    facebook: "https://facebook.com/rsenterprises.lk",
    instagram: "https://instagram.com/rsenterprises.lk",
    youtube: "",
  },
  updatedAt: new Date().toISOString(),
};

/**
 * Retrieve company profile and branch configurations from Firestore.
 * Checks 'company_profile' and 'general', returning the latest active configuration.
 * Cached with Next.js tags 'settings' and 'company-settings'.
 */
export const getCompanySettings = unstable_cache(
  async (): Promise<CompanySettings> => {
    try {
      // 1. Fetch both settings documents concurrently from Firestore
      const [profileSnap, generalSnap] = await Promise.all([
        adminDb
          .collection("settings")
          .withConverter(settingsConverter)
          .doc("company_profile")
          .get(),
        adminDb
          .collection("settings")
          .withConverter(settingsConverter)
          .doc("general")
          .get(),
      ]);

      const profileData = profileSnap.exists ? profileSnap.data() : null;
      const generalData = generalSnap.exists ? generalSnap.data() : null;

      if (profileData && generalData) {
        // Return whichever was updated more recently
        const profileTime = new Date(profileData.updatedAt || 0).getTime();
        const generalTime = new Date(generalData.updatedAt || 0).getTime();
        return generalTime > profileTime ? generalData : profileData;
      }

      if (profileData) return profileData;
      if (generalData) return generalData;

      return DEFAULT_COMPANY_SETTINGS;
    } catch (error) {
      console.error("Firestore settings read failed:", error);
      return DEFAULT_COMPANY_SETTINGS;
    }
  },
  ["company-settings-cache"],
  {
    revalidate: 3600,
    tags: ["settings", "company-settings"],
  }
);

