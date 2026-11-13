import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";

let clientApp: FirebaseApp | null = null;
let clientAuth: Auth | null = null;
let clientDb: Firestore | null = null;
let clientStorage: FirebaseStorage | null = null;
let emulatorsConnected = false;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForBuild",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "rs-enterprises-f3d5e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "rs-enterprises-f3d5e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "rs-enterprises-f3d5e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "451097812118",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:451097812118:web:b6b728747c4b652a9cf6b7",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-998L42P765",
};

/**
 * Lazy initializer for Firebase Client SDK.
 * STRICT RULE: Only invoked inside /admin routes to keep public bundle size near zero.
 */
export function getFirebaseClientApp(): FirebaseApp {
  if (clientApp) return clientApp;

  const existing = getApps();
  if (existing.length > 0 && existing[0]) {
    clientApp = existing[0];
  } else {
    clientApp = initializeApp(firebaseConfig);
  }

  return clientApp;
}

export function getFirebaseClientAuth(): Auth {
  if (clientAuth) return clientAuth;
  const app = getFirebaseClientApp();
  clientAuth = getAuth(app);

  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && !emulatorsConnected) {
    const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "http://127.0.0.1:9099";
    connectAuthEmulator(clientAuth, authHost, { disableWarnings: true });
  }

  return clientAuth;
}

export function getFirebaseClientDb(): Firestore {
  if (clientDb) return clientDb;
  const app = getFirebaseClientApp();
  clientDb = getFirestore(app);

  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && !emulatorsConnected) {
    const host = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "127.0.0.1";
    const port = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080);
    connectFirestoreEmulator(clientDb, host, port);
  }

  return clientDb;
}

export function getFirebaseClientStorage(): FirebaseStorage {
  if (clientStorage) return clientStorage;
  const app = getFirebaseClientApp();
  clientStorage = getStorage(app);

  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && !emulatorsConnected) {
    const host = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST || "127.0.0.1";
    const port = Number(process.env.NEXT_PUBLIC_STORAGE_EMULATOR_PORT || 9199);
    connectStorageEmulator(clientStorage, host, port);
    emulatorsConnected = true;
  }

  return clientStorage;
}

