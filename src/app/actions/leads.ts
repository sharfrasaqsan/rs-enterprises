"use server";

import { headers } from "next/headers";
import { adminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { createLeadSchema, LeadSource, DealershipBranch } from "@/types/lead";
import { checkRateLimit } from "@/lib/rate-limit";

export interface CreateLeadResult {
  success: boolean;
  message?: string;
  error?: string;
  leadId?: string;
}

export async function createLeadAction(
  formData: FormData
): Promise<CreateLeadResult> {
  try {
    // 1. Honeypot Anti-Spam Check
    // Hidden input with name "_hp_verify" that standard users never see or fill
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
    if (rawSource === "vehicle_request" || formData.get("vehicleId")) {
      source = "vehicle_request";
    }

    const rawData = {
      name: formData.get("name")?.toString().trim() || "",
      phone: formData.get("phone")?.toString().trim() || "",
      email: formData.get("email")?.toString().trim() || undefined,
      branch,
      vehicleId: formData.get("vehicleId")?.toString().trim() || undefined,
      vehicleTitle: formData.get("vehicleTitle")?.toString().trim() || undefined,
      requestDetails: formData.get("requestDetails")?.toString().trim() || undefined,
      source,
      stage: "new" as const,
      initialNote: formData.get("initialNote")?.toString().trim() || undefined,
    };

    // 4. Zod Validation
    const parsed = createLeadSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input data. Please check required fields.";
      return { success: false, error: firstError };
    }

    const {
      name,
      phone,
      email,
      branch: validBranch,
      vehicleId,
      vehicleTitle,
      requestDetails,
      source: validSource,
      stage,
      initialNote,
    } = parsed.data;

    // 5. Generate Lead Document
    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const leadNoteText =
      initialNote ||
      (vehicleTitle
        ? `Inquiry received for ${vehicleTitle}. Branch: ${validBranch.toUpperCase()}. Contact requested via Phone/WhatsApp.`
        : `General showroom inquiry received. Branch: ${validBranch.toUpperCase()}.`);

    const notes = [
      {
        id: `note-${Date.now()}`,
        text: leadNoteText,
        author: "Website Lead Action",
        time: now,
      },
    ];

    // 6. Write to Firestore via Admin SDK
    if (hasAdminCredentials()) {
      await adminDb.collection("leads").doc(leadId).set({
        name,
        phone,
        email: email || null,
        branch: validBranch,
        vehicleId: vehicleId || null,
        vehicleTitle: vehicleTitle || null,
        requestDetails: requestDetails || null,
        source: validSource,
        stage,
        assignedTo: null,
        followUpDate: null,
        lostReason: null,
        notes,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      console.log(`ℹ️ [Development Fallback] Lead created in memory:`, {
        leadId,
        name,
        phone,
        branch: validBranch,
        vehicleTitle,
      });
    }

    return {
      success: true,
      message:
        "Thank you. Your inquiry has been registered. Our Kaduruwela showroom desk will contact you via phone or WhatsApp shortly.",
      leadId,
    };
  } catch (error) {
    console.error("Failed to process lead submission:", error);
    return {
      success: false,
      error:
        "Unable to submit inquiry at this time. Please contact our showroom directly on WhatsApp or telephone.",
    };
  }
}
