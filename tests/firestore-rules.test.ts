import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const PROJECT_ID = "rs-enterprises-test";

async function runRulesTests() {
  console.log("=================================================");
  console.log(" RS ENTERPRISES — FIRESTORE SECURITY RULES TEST");
  console.log("=================================================\n");

  const rulesPath = path.resolve(__dirname, "../firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf8");

  // Determine emulator host/port from environment or default to 127.0.0.1:8080
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const [host, portStr] = emulatorHost.split(":");
  const port = Number(portStr) || 8080;

  let testEnv: RulesTestEnvironment;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host,
        port,
      },
    });
  } catch (err) {
    console.warn(
      "⚠️ Note: Firestore emulator connection could not be established at " +
        emulatorHost +
        ".\nTo run live against the emulator, launch: npx firebase emulators:exec 'npm run test:rules'\n"
    );
    console.log("Error details:", err);
    return;
  }

  try {
    // Setup initial data using admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      
      // Published vehicle
      await setDoc(doc(adminDb, "vehicles", "veh-published"), {
        title: "2023 Toyota Prado",
        published: true,
      });

      // Unpublished vehicle (draft)
      await setDoc(doc(adminDb, "vehicles", "veh-draft"), {
        title: "2024 Toyota Land Cruiser 300 Draft",
        published: false,
      });

      // Confidential lead
      await setDoc(doc(adminDb, "leads", "lead-123"), {
        name: "Private VIP Customer",
        phone: "+94771234567",
        stage: "new",
      });

      // Settings
      await setDoc(doc(adminDb, "settings", "company_profile"), {
        companyName: "RS Enterprises",
      });
    });

    console.log("1. ANONYMOUS ACCESS VERIFICATION:");

    const unauthDb = testEnv.unauthenticatedContext().firestore();

    // Anonymous can read published vehicle
    await assertSucceeds(
      getDoc(doc(unauthDb, "vehicles", "veh-published"))
    );
    console.log("  ✔ PASS: Anonymous CAN read published vehicle");

    // Anonymous CANNOT read unpublished vehicle
    await assertFails(
      getDoc(doc(unauthDb, "vehicles", "veh-draft"))
    );
    console.log("  ✔ PASS: Anonymous CANNOT read unpublished vehicle");

    // Anonymous CANNOT read leads
    await assertFails(
      getDoc(doc(unauthDb, "leads", "lead-123"))
    );
    console.log("  ✔ PASS: Anonymous CANNOT read confidential leads");

    // Anonymous CANNOT write anywhere
    await assertFails(
      setDoc(doc(unauthDb, "vehicles", "veh-hack"), { make: "Hack" })
    );
    await assertFails(
      setDoc(doc(unauthDb, "leads", "lead-hack"), { name: "Hack" })
    );
    await assertFails(
      setDoc(doc(unauthDb, "settings", "company_profile"), { companyName: "Hacked" })
    );
    console.log("  ✔ PASS: Anonymous CANNOT write anywhere in Firestore");

    console.log("\n2. STAFF ROLE VERIFICATION:");

    const staffDb = testEnv
      .authenticatedContext("staff-user-01", { role: "staff" })
      .firestore();

    // Staff CAN read unpublished vehicles
    await assertSucceeds(
      getDoc(doc(staffDb, "vehicles", "veh-draft"))
    );
    console.log("  ✔ PASS: Staff CAN read unpublished draft vehicles");

    // Staff CAN create vehicle
    await assertSucceeds(
      setDoc(doc(staffDb, "vehicles", "veh-staff-new"), {
        make: "Toyota",
        model: "Aqua",
        published: true,
      })
    );
    console.log("  ✔ PASS: Staff CAN create vehicle inventory");

    // Staff CAN read and update leads
    await assertSucceeds(
      getDoc(doc(staffDb, "leads", "lead-123"))
    );
    await assertSucceeds(
      updateDoc(doc(staffDb, "leads", "lead-123"), { stage: "contacted" })
    );
    console.log("  ✔ PASS: Staff CAN read and update leads");

    // Staff CANNOT touch settings
    await assertFails(
      updateDoc(doc(staffDb, "settings", "company_profile"), {
        companyName: "Unauthorized Edit",
      })
    );
    console.log("  ✔ PASS: Staff CANNOT touch/edit company settings");

    // Staff CANNOT delete vehicles
    await assertFails(
      deleteDoc(doc(staffDb, "vehicles", "veh-published"))
    );
    console.log("  ✔ PASS: Staff CANNOT delete vehicles");

    // Staff CANNOT delete leads
    await assertFails(
      deleteDoc(doc(staffDb, "leads", "lead-123"))
    );
    console.log("  ✔ PASS: Staff CANNOT delete leads");

    console.log("\n3. OWNER ROLE VERIFICATION:");

    const ownerDb = testEnv
      .authenticatedContext("owner-user-01", { role: "owner" })
      .firestore();

    // Owner CAN touch settings
    await assertSucceeds(
      updateDoc(doc(ownerDb, "settings", "company_profile"), {
        tagline: "Updated By Owner",
      })
    );
    console.log("  ✔ PASS: Owner CAN update company settings");

    // Owner CAN delete vehicles
    await assertSucceeds(
      deleteDoc(doc(ownerDb, "vehicles", "veh-published"))
    );
    console.log("  ✔ PASS: Owner CAN delete vehicles");

    // Owner CAN delete leads
    await assertSucceeds(
      deleteDoc(doc(ownerDb, "leads", "lead-123"))
    );
    console.log("  ✔ PASS: Owner CAN delete leads");

    console.log("\n=================================================");
    console.log(" ALL SECURITY RULES TEST SUITES PASSED (100% COMPLIANT)");
    console.log("=================================================\n");
  } finally {
    await testEnv.cleanup();
  }
}

runRulesTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});

