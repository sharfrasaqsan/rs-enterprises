import * as fs from "fs";
import * as path from "path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SEED_VEHICLES, SEED_LEADS, SEED_SETTINGS } from "../src/lib/seed-data";
import { vehicleConverter } from "../src/types/vehicle";
import { leadConverter } from "../src/types/lead";
import { settingsConverter } from "../src/types/settings";

function getDatabase() {
  const existingApps = getApps();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "rs-enterprises-f3d5e";

  let app;
  if (existingApps.length > 0 && existingApps[0]) {
    app = existingApps[0];
  } else {
    const serviceAccountPath = path.resolve(process.cwd(), "service-account.json");
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const sa = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
        app = initializeApp({
          credential: cert(sa),
          projectId: sa.project_id || projectId,
        });
      } catch (err) {
        console.warn("Could not parse service-account.json:", err);
      }
    }

    if (!app) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, "\n");
      }

      if (serviceAccountJson) {
        const parsed = JSON.parse(serviceAccountJson);
        if (parsed.private_key) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
        }
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
        console.log(`ℹ️ Initializing with projectId "${projectId}" (emulator or GCP default credentials)`);
        app = initializeApp({ projectId });
      }
    }
  }

  const db = getFirestore(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Ignore if already set
  }
  return db;
}

async function seedDatabase() {
  console.log("=================================================");
  console.log(" RS ENTERPRISES — FIRESTORE SEED GENERATOR");
  console.log("=================================================\n");

  const db = getDatabase();
  const batch = db.batch();

  // 1. Seed Vehicles
  console.log(`📦 Staging ${SEED_VEHICLES.length} realistic Japanese vehicles...`);
  const vehiclesCol = db.collection("vehicles").withConverter(vehicleConverter);
  for (const vehicle of SEED_VEHICLES) {
    const docRef = vehiclesCol.doc(vehicle.id);
    batch.set(docRef, vehicle);
    const priceStr = vehicle.price
      ? `LKR ${(vehicle.price / 1000000).toFixed(1)}M`
      : "Call for price";
    console.log(
      `  • [${vehicle.status.toUpperCase()}] ${vehicle.year} ${vehicle.make} ${vehicle.model} (${priceStr})`
    );
  }

  // 2. Seed Leads
  console.log(`\n📋 Staging ${SEED_LEADS.length} realistic CRM showroom leads...`);
  const leadsCol = db.collection("leads").withConverter(leadConverter);
  for (const lead of SEED_LEADS) {
    const docRef = leadsCol.doc(lead.id);
    batch.set(docRef, lead);
    console.log(
      `  • [${lead.stage.toUpperCase()}] ${lead.name} (${lead.phone}) — Branch: ${lead.branch}`
    );
  }

  // 3. Seed Settings
  console.log("\n⚙️ Staging company profile & branch settings...");
  const settingsCol = db.collection("settings").withConverter(settingsConverter);
  const settingsDocRef = settingsCol.doc("company_profile");
  batch.set(settingsDocRef, SEED_SETTINGS);
  console.log(`  • Main Branch: ${SEED_SETTINGS.mainBranch.name} (${SEED_SETTINGS.mainBranch.address})`);
  console.log(`  • Coastal Showroom: ${SEED_SETTINGS.coastalBranch.name} (${SEED_SETTINGS.coastalBranch.status})`);

  // Commit all writes atomically
  console.log("\n⏳ Committing batch transaction to Firestore...");
  try {
    await batch.commit();
    console.log("\n✅ SUCCESS: Firestore successfully populated with all vehicles, leads, and settings!");
    console.log("=================================================\n");
  } catch (commitErr: unknown) {
    const msg = (commitErr as Error)?.message || String(commitErr);
    if (msg.includes("Could not load the default credentials")) {
      console.log("\n⚠️ NOTICE: No active Google Cloud Application Default Credentials detected.");
      console.log("To commit data to your local Firebase Emulator, start the emulator first:");
      console.log("  $ npx firebase emulators:start");
      console.log("  $ FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed");
      console.log("\nTo seed a live Firebase project, set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY in .env.local.");
      console.log("All seed data is active and loaded in memory for the Next.js site.\n");
      process.exit(0);
    } else {
      throw commitErr;
    }
  }
}

seedDatabase().catch((error) => {
  console.error("\n❌ Seed error:", error);
  process.exit(1);
});

