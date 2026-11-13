import { z } from "zod";
import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";

export const leadSourceSchema = z.enum([
  "website_form",
  "vehicle_request",
  "whatsapp",
  "phone",
  "walk_in",
]);
export type LeadSource = z.infer<typeof leadSourceSchema>;

export const leadStageSchema = z.enum([
  "new",
  "contacted",
  "viewing",
  "negotiating",
  "won",
  "lost",
]);
export type LeadStage = z.infer<typeof leadStageSchema>;

export const branchSchema = z.enum(["polonnaruwa", "trincomalee"]);
export type DealershipBranch = z.infer<typeof branchSchema>;

export const leadNoteSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  text: z.string().min(1),
  author: z.string().min(1),
  time: z.string(), // ISO string
});
export type LeadNote = z.infer<typeof leadNoteSchema>;

export const leadSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(8, "Valid phone number is required"),
  email: z.string().email().optional().nullable(),
  source: leadSourceSchema.default("website_form"),
  vehicleId: z.string().optional().nullable(),
  vehicleTitle: z.string().optional().nullable(),
  requestDetails: z.string().optional().nullable(),
  branch: branchSchema.default("polonnaruwa"),
  stage: leadStageSchema.default("new"),
  assignedTo: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  lostReason: z.string().optional().nullable(),
  notes: z.array(leadNoteSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Lead = z.infer<typeof leadSchema>;

export const createLeadSchema = leadSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  notes: true,
}).extend({
  initialNote: z.string().optional(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

/**
 * Firestore Data Converter for leads
 */
export const leadConverter: FirestoreDataConverter<Lead> = {
  toFirestore(lead: Lead) {
    return {
      name: lead.name,
      phone: lead.phone,
      email: lead.email || null,
      source: lead.source,
      vehicleId: lead.vehicleId || null,
      vehicleTitle: lead.vehicleTitle || null,
      requestDetails: lead.requestDetails || null,
      branch: lead.branch,
      stage: lead.stage,
      assignedTo: lead.assignedTo || null,
      followUpDate: lead.followUpDate || null,
      lostReason: lead.lostReason || null,
      notes: lead.notes,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Lead {
    const data = snapshot.data();

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
      name: data.name || "Anonymous Lead",
      phone: data.phone || "",
      email: data.email || null,
      source: data.source || "website_form",
      vehicleId: data.vehicleId || null,
      vehicleTitle: data.vehicleTitle || null,
      requestDetails: data.requestDetails || null,
      branch: data.branch || "polonnaruwa",
      stage: data.stage || "new",
      assignedTo: data.assignedTo || null,
      followUpDate: data.followUpDate || null,
      lostReason: data.lostReason || null,
      notes: Array.isArray(data.notes)
        ? data.notes.map((n: Record<string, unknown>) => ({
            id: String(n.id || Math.random().toString(36).substring(2, 9)),
            text: String(n.text || ""),
            author: String(n.author || "Staff"),
            time: formatTimestamp(n.time),
          }))
        : [],
      createdAt: formatTimestamp(data.createdAt),
      updatedAt: formatTimestamp(data.updatedAt),
    };
  },
};
