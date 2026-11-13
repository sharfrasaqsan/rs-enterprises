"use server";

import { adminDb, hasAdminCredentials } from "@/lib/firebase-admin";
import { createLeadSchema, Lead } from "@/types/lead";

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
    const rawData = {
      name: formData.get("name")?.toString().trim() || "",
      phone: formData.get("phone")?.toString().trim() || "",
      email: formData.get("email")?.toString().trim() || undefined,
      branch: formData.get("branch")?.toString().trim() || "polonnaruwa",
      vehicleId: formData.get("vehicleId")?.toString().trim() || undefined,
      vehicleTitle: formData.get("vehicleTitle")?.toString().trim() || undefined,
      requestDetails: formData.get("requestDetails")?.toString().trim() || undefined,
      source: "vehicle_request" as const,
      stage: "new" as const,
      initialNote: formData.get("initialNote")?.toString().trim() || undefined,
    };

    const parsed = createLeadSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input data";
      return { success: false, error: firstError };
    }

    const { name, phone, email, branch, vehicleId, vehicleTitle, requestDetails, source, stage, initialNote } = parsed.data;

    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const notes = [
      {
        id: `note-${Date.now()}`,
        text: initialNote || `Inquiry submitted for ${vehicleTitle || "vehicle"}. Customer requested showroom callback.`,
        author: "Showroom Website Form",
        time: now,
      },
    ];

    if (hasAdminCredentials()) {
      await adminDb.collection("leads").doc(leadId).set({
        name,
        phone,
        email: email || null,
        branch,
        vehicleId: vehicleId || null,
        vehicleTitle: vehicleTitle || null,
        requestDetails: requestDetails || null,
        source,
        stage,
        assignedTo: null,
        followUpDate: null,
        lostReason: null,
        notes,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      console.log(`ℹ️ [Development Fallback] Lead created in memory:`, { leadId, name, phone, vehicleTitle });
    }

    return {
      success: true,
      message: "Thank you. Your inquiry has been registered. Our Kaduruwela showroom desk will contact you via phone or WhatsApp shortly.",
      leadId,
    };
  } catch (error) {
    console.error("Failed to create showroom lead:", error);
    return {
      success: false,
      error: "Unable to submit inquiry at this time. Please contact our showroom directly on WhatsApp or telephone.",
    };
  }
}

