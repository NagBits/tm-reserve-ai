import { db } from './firebase';
import { collection, addDoc, Timestamp, getDocs, writeBatch, doc, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { ROLE_GROUPS, ALL_ROLES } from './roles';

// 1. Role Definitions (Matches your Spreadsheet/Grid)
// Using central ROLE_GROUPS from ./roles.ts

// HELPER: Fetch dynamic roles from DB
const getDynamicRoles = async () => {
  try {
    const rolesSnap = await getDoc(doc(db, "settings", "roles"));
    if (rolesSnap.exists()) {
      return rolesSnap.data().list as string[];
    }
  } catch (e) {
    console.error("Error fetching dynamic roles:", e);
  }
  return ALL_ROLES; // Fallback
};

/**
 * 2. WIPE DB
 * Clears all meetings.
 */
export const wipeAllMeetings = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "meetings"));
    const batch = writeBatch(db);

    querySnapshot.forEach((document) => {
      batch.delete(doc(db, "meetings", document.id));
    });

    await batch.commit();
    console.log("🔥 Database Wiped.");
  } catch (error) {
    console.error("Error wiping DB:", error);
    throw error;
  }
};

/**
 * 3. SEED SATURDAYS (Reset to Standard)
 * Generates the *next* 4 Saturdays from today.
 * Useful for a hard reset.
 */
export const seedSaturdays = async () => {
  try {
    const roles = await getDynamicRoles();
    const batch = writeBatch(db);
    let d = new Date();

    // Find next Saturday
    const distanceToSaturday = (6 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + distanceToSaturday);
    d.setHours(10, 0, 0, 0);

    for (let i = 0; i < 4; i++) {
      const docId = d.toISOString().split('T')[0]; // ID = 2024-02-10
      const newMeetingRef = doc(db, "meetings", docId);

      const dateStr = d.toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      batch.set(newMeetingRef, {
        date: dateStr,
        timestamp: Timestamp.fromDate(new Date(d)),
        isPublished: true,
        slots: roles.map((role: string) => ({
          role: role,
          userId: null,
          userName: ""
        }))
      }, { merge: true }); // Merge prevents overwriting existing data if it exists

      d.setDate(d.getDate() + 7);
    }

    await batch.commit();
    console.log("✅ Standard Reset: 4 Saturdays seeded.");
  } catch (error) {
    console.error("Error seeding:", error);
    throw error;
  }
};

/**
 * 4. OPEN NEXT MONTH (Smart Extend)
 * Finds the LAST scheduled meeting and adds 4 weeks after that.
 */
export const openNextMonth = async () => {
  try {
    const roles = await getDynamicRoles();
    const batch = writeBatch(db);

    // Find the LAST scheduled meeting
    const meetingsRef = collection(db, "meetings");
    const q = query(meetingsRef, orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    let startDate = new Date();

    if (!querySnapshot.empty) {
      // Start 1 week AFTER the last meeting
      const lastDate = querySnapshot.docs[0].data().timestamp.toDate();
      startDate = new Date(lastDate);
      startDate.setDate(startDate.getDate() + 7);
    } else {
      // Fallback: Start next Saturday
      const distanceToSaturday = (6 - startDate.getDay() + 7) % 7;
      startDate.setDate(startDate.getDate() + distanceToSaturday);
    }

    startDate.setHours(10, 0, 0, 0);

    for (let i = 0; i < 4; i++) {
      const docId = startDate.toISOString().split('T')[0];
      const newMeetingRef = doc(db, "meetings", docId);

      const displayDate = startDate.toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      batch.set(newMeetingRef, {
        date: displayDate,
        timestamp: Timestamp.fromDate(new Date(startDate)),
        isPublished: true,
        slots: roles.map((role: string) => ({
          role: role,
          userId: null,
          userName: ""
        }))
      }, { merge: true });

      startDate.setDate(startDate.getDate() + 7);
    }

    await batch.commit();
    console.log("✅ Extension: Added 4 new weeks.");
  } catch (error) {
    console.error("Error extending schedule:", error);
    throw error;
  }
};
