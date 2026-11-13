# RS Enterprises — Firebase Setup & Seeding Guide

This guide provides end-to-end instructions for provisioning Firebase, configuring security rules, executing the database seed script, assigning staff/owner roles, and running local emulator tests for **RS Enterprises Company Pvt Ltd**.

---

## 1. Firebase Project Provisioning

1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Name the project `rs-enterprises-lk` (or your preferred project ID) and disable Google Analytics (optional).
3. **Enable Cloud Firestore:**
   - Under **Build** in the left sidebar, click **Firestore Database** &rarr; **Create Database**.
   - Choose your nearest cloud location (e.g. `asia-south1` Mumbai or `asia-southeast1` Singapore for optimal Sri Lanka latency).
   - Select **Start in production mode** (our `firestore.rules` will govern access).
4. **Enable Firebase Authentication:**
   - Under **Build**, select **Authentication** &rarr; **Get Started**.
   - Under the **Sign-in method** tab, enable **Email/Password** (Email link is optional, disable public sign-up if you prefer invitation-only).
5. **Enable Cloud Storage:**
   - Under **Build**, select **Storage** &rarr; **Get Started**.
   - Accept default bucket settings and region matching your Firestore location.

---

## 2. Generating Admin Service Account Credentials

1. In the Firebase Console, click the gear icon &rarr; **Project Settings**.
2. Select the **Service Accounts** tab.
3. Click **Generate new private key** and confirm.
4. Save the downloaded JSON file securely.
5. Create `.env.local` in the `rs-enterprises` root:
   ```bash
   cp .env.example .env.local
   ```
6. Copy the values from your downloaded service account JSON into `.env.local`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----\n"
   ```
7. Under Project Settings &rarr; **General** &rarr; **Your apps**, click the Web icon (`</>`) to create a web app and copy the public SDK credentials into `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`.

---

## 3. Deploying Firestore Rules & Indexes

Using the Firebase CLI (`firebase-tools`):

```bash
# Login to Firebase
npx firebase login

# Deploy rules and composite indexes
npx firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

---

## 4. Seeding Realistic Showroom Data

The seed script creates:
- **12 Realistic Japanese Vehicles** (Toyota Land Cruiser 300 ZX, Prado TX-L 70th, Harrier Z, Honda Vezel e:HEV Z, Fit Luxe, Aqua G, Corolla Axio WxB, Suzuki Wagon R, Nissan X-Trail, Premio, etc.) with realistic LKR prices and auction grades.
- **15 Sample CRM Leads** across all sales pipeline stages (`new`, `contacted`, `viewing`, `negotiating`, `won`, `lost`).
- **Company Settings Document** with Kaduruwela main showroom and Trincomalee coastal showroom contact details (marked as placeholders to confirm).

Run the seed script:
```bash
# Using npm script:
npm run seed

# Or directly with tsx:
npx tsx scripts/seed.ts
```

---

## 5. Staff & Owner Role Provisioning

Staff accounts have access to vehicles and leads, while Owner accounts possess full permissions including settings, deletion, and user management.

```bash
# Syntax:
# npx tsx scripts/set-role.ts <email> <owner|staff> [polonnaruwa|trincomalee]

# Examples:
# Grant owner role to the dealership director:
npx tsx scripts/set-role.ts director@rsenterprises.lk owner polonnaruwa

# Grant staff role to a showroom sales representative:
npx tsx scripts/set-role.ts kasun@rsenterprises.lk staff polonnaruwa
```

If the user account does not already exist in Firebase Auth, the script automatically provisions it with a temporary password (`TempPassword123#`), injects custom claims (`{ role, branch }`), and synchronizes the profile in the `users` Firestore collection.

---

## 6. Local Emulator Suite & Security Rules Testing

To test and develop completely offline without connecting to production:

```bash
# 1. Start the Firebase Emulator Suite:
npx firebase emulators:start

# 2. Run the automated Security Rules test suite:
npm run test:rules
```

The test suite validates:
- Anonymous users cannot write anywhere in Firestore.
- Anonymous users cannot read unpublished draft vehicles.
- Anonymous users cannot read confidential leads.
- Staff members can read drafts, create vehicles, and update leads, but cannot touch settings or delete records.
- Owner accounts have full delete and settings authority.

