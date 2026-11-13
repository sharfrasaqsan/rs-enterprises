import "server-only";
import { unstable_cache } from "next/cache";
import { adminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { CompanySettings, settingsConverter } from "@/types/settings";
import { SEED_SETTINGS } from "@/lib/seed-data";

/**
 * Retrieve company profile and branch configurations.
 * Stored in Firestore doc 'settings/company_profile'.
 * Cached with the Next.js tag 'settings' for 1 hour.
 */
export const getCompanySettings = unstable_cache(
  async (): Promise<CompanySettings> => {
    if (!hasAdminCredentials()) {
      return SEED_SETTINGS;
    }
    try {
      const docSnap = await adminDb
        .collection("settings")
        .withConverter(settingsConverter)
        .doc("company_profile")
        .get();

      if (docSnap.exists) {
        const data = docSnap.data();
        if (data) return data;
      }
      return SEED_SETTINGS;
    } catch (error) {
      console.warn("Firestore settings read failed, using default seed settings:", error);
      return SEED_SETTINGS;
    }
  },
  ["company-settings-cache"],
  {
    revalidate: 3600,
    tags: ["settings"],
  }
);

