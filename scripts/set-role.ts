import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { userConverter, UserRole } from "../src/types/user";

// Load environment variables
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config({ path: ".env.local" });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config({ path: ".env" });
} catch {
  // Ignore
}

function getAdminServices() {
  const existingApps = getApps();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "rs-enterprises-lk";

  let app;
  if (existingApps.length > 0 && existingApps[0]) {
    app = existingApps[0];
  } else {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      app = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
      });
    } else if (clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      app = initializeApp({ projectId });
    }
  }

  const auth = getAuth(app);
  const db = getFirestore(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Ignore
  }

  return { auth, db };
}

async function setRole() {
  const args = process.argv.slice(2);
  const email = args[0];
  const roleInput = args[1]?.toLowerCase() as UserRole;
  const branchInput = (args[2]?.toLowerCase() || "polonnaruwa") as "polonnaruwa" | "trincomalee";

  console.log("=================================================");
  console.log(" RS ENTERPRISES — ROLE PROVISIONING CLI");
  console.log("=================================================\n");

  if (!email || !roleInput || !["owner", "staff"].includes(roleInput)) {
    console.error("Usage:");
    console.error("  npx tsx scripts/set-role.ts <email> <owner|staff> [polonnaruwa|trincomalee]\n");
    console.error("Examples:");
    console.error("  npx tsx scripts/set-role.ts director@rsenterprises.lk owner polonnaruwa");
    console.error("  npx tsx scripts/set-role.ts staff01@rsenterprises.lk staff polonnaruwa");
    process.exit(1);
  }

  const { auth, db } = getAdminServices();

  try {
    console.log(`🔍 Looking up user with email: ${email}...`);
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`✔ Found existing user account (UID: ${user.uid})`);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === "auth/user-not-found") {
        console.log(`ℹ️ User does not exist. Creating new staff account for ${email}...`);
        user = await auth.createUser({
          email,
          emailVerified: true,
          displayName: email.split("@")[0],
          password: "TempPassword123#", // Temporary password for initial login
        });
        console.log(`✔ Created user account (UID: ${user.uid}) with temporary password: TempPassword123#`);
      } else {
        throw err;
      }
    }

    // 1. Assign Custom Claims
    const customClaims = {
      role: roleInput,
      branch: branchInput,
    };
    await auth.setCustomUserClaims(user.uid, customClaims);
    console.log(`✔ Set Firebase Auth Custom Claims:`, customClaims);

    // 2. Upsert User Document in Firestore
    const userDocRef = db.collection("users").withConverter(userConverter).doc(user.uid);
    const existingDoc = await userDocRef.get();

    const userData = {
      uid: user.uid,
      email: user.email || email,
      displayName: user.displayName || email.split("@")[0],
      role: roleInput,
      branch: branchInput,
      isActive: true,
      createdAt: existingDoc.exists && existingDoc.data()?.createdAt ? existingDoc.data()!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userDocRef.set(userData, { merge: true });
    console.log(`✔ Synchronized profile in Firestore 'users/${user.uid}'`);

    console.log("\n=================================================");
    console.log(` SUCCESS: Role "${roleInput.toUpperCase()}" granted to ${email}`);
    console.log("=================================================\n");
  } catch (error) {
    console.error("\n❌ Error granting role:", error);
    process.exit(1);
  }
}

setRole();

