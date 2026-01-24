const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

const {
  NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY
} = process.env;

if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error("❌ Missing environment variables in .env.local");
  process.exit(1);
}

const serviceAccount = {
  projectId: NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: FIREBASE_CLIENT_EMAIL,
  privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 1. Define the dates for the next 4 meetings (Saturdays/Sundays)
const meetingDates = ["2026-01-25", "2026-02-01", "2026-02-08", "2026-02-15"];

// 2. Define the template of roles for a standard meeting
const roleTemplate = [
  { roleName: "Toastmaster of the Day", order: 1 },
  { roleName: "General Evaluator", order: 2 },
  { roleName: "Timer", order: 3 },
  { roleName: "Ah-Counter", order: 4 },
  { roleName: "Grammarian", order: 5 },
  { roleName: "Table Topics Master", order: 6 },
  { roleName: "Speaker 1", order: 7 },
  { roleName: "Speaker 2", order: 8 },
  { roleName: "Evaluator 1", order: 9 },
  { roleName: "Evaluator 2", order: 10 },
];

async function seedDatabase() {
  console.log("🌱 Starting Seeding Process...");
  const slotsRef = db.collection("slots");

  // Optional: Clear existing slots to avoid duplicates during testing
  // const existingSlots = await slotsRef.get();
  // const batch = db.batch();
  // existingSlots.forEach(doc => batch.delete(doc.ref));
  // await batch.commit();
  // console.log("waste binned (existing slots cleared)");

  for (const date of meetingDates) {
    console.log(`📅 Seeding roles for ${date}...`);
    
    for (const role of roleTemplate) {
      await slotsRef.add({
        ...role,
        date: date, // This is what the Calendar and SlotList filter on
        taken: false,
        userId: null,
        userName: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  console.log("🏁 Success! Next 4 meetings are now open for reservations.");
  process.exit();
}

seedDatabase().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
