import "server-only";
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: Storage | null = null;

function initializeFirebaseAdmin(): App {
  if (app) return app;

  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    app = existingApps[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "rs-enterprises-lk";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Replace escaped newlines if passed through environment variables
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  // Check for entire service account JSON string if provided
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  try {
    if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      app = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
    } else if (clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
    } else {
      // Emulator or default application credentials (GCP environment)
      app = initializeApp({
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
    }
  } catch (error) {
    console.error("Firebase Admin initialization warning:", error);
    // Fallback stub initialization for build time without active credentials
    app = initializeApp({ projectId }, "build-fallback");
  }

  return app;
}

export function hasAdminCredentials(): boolean {
  if (process.env.FIRESTORE_EMULATOR_HOST) return true;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) return true;
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) return true;
  return false;
}

export function getAdminApp(): App {
  if (!app) {
    app = initializeFirebaseAdmin();
  }
  return app;
}

export function getAdminDb(): Firestore {
  if (!db) {
    const adminApp = getAdminApp();
    db = getFirestore(adminApp);
    // Ignore undefined properties in Firestore writes
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Settings can only be applied once
    }
  }
  return db;
}

export function getAdminAuth(): Auth {
  if (!auth) {
    const adminApp = getAdminApp();
    auth = getAuth(adminApp);
  }
  return auth;
}

export function getAdminStorage(): Storage {
  if (!storage) {
    const adminApp = getAdminApp();
    storage = getStorage(adminApp);
  }
  return storage;
}

// Proxied exports for zero-overhead imports
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const firestore = getAdminDb();
    const val = (firestore as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === "function") {
      return val.bind(firestore);
    }
    return val;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const authInstance = getAdminAuth();
    const val = (authInstance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === "function") {
      return val.bind(authInstance);
    }
    return val;
  },
});

export const adminStorage = new Proxy({} as Storage, {
  get(_target, prop) {
    const storageInstance = getAdminStorage();
    const val = (storageInstance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === "function") {
      return val.bind(storageInstance);
    }
    return val;
  },
});

