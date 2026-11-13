import { z } from "zod";
import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

export const userRoleSchema = z.enum(["owner", "staff"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: userRoleSchema,
  branch: z.enum(["polonnaruwa", "trincomalee"]).default("polonnaruwa"),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const userConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(user: UserProfile) {
    return { ...user };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): UserProfile {
    const data = snapshot.data();
    return {
      uid: snapshot.id,
      email: data.email || "",
      displayName: data.displayName || "",
      role: data.role || "staff",
      branch: data.branch || "polonnaruwa",
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  },
};
