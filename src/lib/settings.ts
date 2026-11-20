import "server-only";
import { unstable_cache } from "next/cache";
import { adminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { CompanySettings, settingsConverter } from "@/types/settings";
import { SEED_SETTINGS } from "@/lib/seed-data";

/**
 * Retrieve company profile and branch configurations from Firestore.
 * Checks 'company_profile' and 'general', returning the latest active configuration.
 * Cached with Next.js tags 'settings' and 'company-settings'.
 */
export const getCompanySettings = unstable_cache(
  async (): Promise<CompanySettings> => {
    if (!hasAdminCredentials()) {
      return SEED_SETTINGS;
    }
    try {
      // 1. Fetch both settings documents concurrently
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

      return SEED_SETTINGS;
    } catch (error) {
      console.warn("Firestore settings read failed, using default seed settings:", error);
      return SEED_SETTINGS;
    }
  },
  ["company-settings-cache"],
  {
    revalidate: 3600,
    tags: ["settings", "company-settings"],
  }
);

