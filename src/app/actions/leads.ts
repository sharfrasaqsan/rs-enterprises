"use server";

import { headers } from "next/headers";
import { LeadSource, DealershipBranch } from "@/types/lead";
import { checkRateLimit } from "@/lib/rate-limit";
import { registerOrMergeLeadCoreAction } from "@/app/actions/admin";

export interface CreateLeadResult {
  success: boolean;
  message?: string;
  error?: string;
  leadId?: string;
  isMerged?: boolean;
}

export async function createLeadAction(
  formData: FormData
): Promise<CreateLeadResult> {
  try {
    // 1. Honeypot Anti-Spam Check
    const honeypot = formData.get("_hp_verify")?.toString();
    if (honeypot && honeypot.trim().length > 0) {
      // Bot detected: return faux success without polluting database
      console.warn("🤖 Bot submission intercepted via honeypot trap.");
      return {
        success: true,
        message: "Your inquiry has been submitted successfully.",
      };
    }

    // 2. IP Rate Limiting Check (max 6 requests per 10 minutes)
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const realIp = headerList.get("x-real-ip");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0]?.trim() || "unknown"
      : realIp || "127.0.0.1";

    const rateLimit = checkRateLimit(clientIp, 6, 10 * 60 * 1000);
    if (!rateLimit.success) {
      return {
        success: false,
        error:
          "Multiple requests received. To prevent spam, please wait a few moments or call our Kaduruwela showroom directly at +94 27 222 0000.",
      };
    }

    // 3. Extract & Format Fields
    const rawBranch = formData.get("branch")?.toString().trim().toLowerCase() || "polonnaruwa";
    const branch: DealershipBranch = rawBranch === "trincomalee" ? "trincomalee" : "polonnaruwa";

    const rawSource = formData.get("source")?.toString().trim() || "";
    let source: LeadSource = "website_form";
    if (rawSource === "trade_in") {
      source = "trade_in";
    } else if (rawSource === "vehicle_request" || formData.get("vehicleId")) {
      source = "vehicle_request";
    }

    const photosRaw = formData.get("photos")?.toString().trim();
    let photos: string[] = [];
    if (photosRaw) {
      try {
        const parsed = JSON.parse(photosRaw);
        if (Array.isArray(parsed)) {
          photos = parsed.filter((p) => typeof p === "string" && p.length > 0);
        }
      } catch {
        photos = photosRaw.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    const name = formData.get("name")?.toString().trim() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || null;
    const vehicleId = formData.get("vehicleId")?.toString().trim() || null;
    const vehicleTitle = formData.get("vehicleTitle")?.toString().trim() || null;
    const requestDetails = formData.get("requestDetails")?.toString().trim() || null;
    const initialNote = formData.get("initialNote")?.toString().trim() || null;

    if (!name) {
      return { success: false, error: "Please enter your full name." };
    }
    if (!phone || phone.length < 8) {
      return { success: false, error: "Please enter a valid phone number (e.g. 077 123 4567)." };
    }

    // 4. Delegate to central deduplication & registration engine
    const authorLabel =
      source === "trade_in" ? "Trade-In Online Portal" : "Website Customer Intake";

    const res = await registerOrMergeLeadCoreAction(
      {
        name,
        phone,
        email,
        branch,
        source,
        vehicleId,
        vehicleTitle,
        requestDetails,
        photos,
        note: initialNote,
      },
      authorLabel
    );

    return res;
  } catch (error) {
    console.error("Failed to process lead submission:", error);
    return {
      success: false,
      error:
        "Unable to submit inquiry at this time. Please contact our showroom directly on WhatsApp or telephone.",
    };
  }
}
