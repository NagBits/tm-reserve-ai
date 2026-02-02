import { db } from './firebase'; // Ensure this points to your firebase config
import { collection, addDoc, Timestamp, getDocs, writeBatch, doc } from 'firebase/firestore';

// 1. The Roles List (Edit this to match your club's standard agenda)
const STANDARD_ROLES = [
  "Toastmaster", 
  "General Evaluator", 
  "Timer", 
  "Ah-Counter", 
  "Grammarian", 
  "Speaker 1", 
  "Evaluator 1", 
  "Speaker 2", 
  "Evaluator 2",
  "Table Topics Master"
];

/**
 * WIPES ALL DATA (Clean Slate)
 * Use this if your dates get messy or you want to restart.
 */
export const wipeAllMeetings = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "meetings"));
    const batch = writeBatch(db);

    querySnapshot.forEach((document) => {
      batch.delete(doc(db, "meetings", document.id));
    });

    await batch.commit();
    console.log("🔥 Database Wiped: All meetings deleted.");
  } catch (error) {
    console.error("Error wiping DB:", error);
    throw error;
  }
};

/**
 * GENERATES NEXT 4 SATURDAYS
 * Creates meetings with 'isPublished: true' so they appear immediately.
 */
export const seedSaturdays = async () => {
  try {
    const batch = writeBatch(db); // Use batch for atomic writes (all or nothing)
    
    let d = new Date();
    
    // Logic to find the very next Saturday
    // (6 = Saturday. If today is Sat, it picks today. If Fri, picks tomorrow)
    const distanceToSaturday = (6 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + distanceToSaturday);
    
    // Set time to 10:00 AM to ensure consistency in timestamps
    d.setHours(10, 0, 0, 0);

    for (let i = 0; i < 4; i++) {
      // Create a reference for a new document
      const newMeetingRef = doc(collection(db, "meetings"));

      const dateStr = d.toLocaleDateString('en-GB', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      batch.set(newMeetingRef, {
        date: dateStr,
        // Using Firestore Timestamp is CRITICAL for the 'orderBy' query to work
        timestamp: Timestamp.fromDate(new Date(d)), 
        isPublished: true, 
        slots: STANDARD_ROLES.map(role => ({
          role: role,
          userId: null,   // Null means "Open Slot"
          userName: ""
        }))
      });

      console.log(`Prepared: ${dateStr}`);
      
      // Jump to the next week
      d.setDate(d.getDate() + 7);
    }

    await batch.commit();
    console.log("✅ Success: 4 Saturdays seeded into Firestore.");
  } catch (error) {
    console.error("Error seeding Saturdays:", error);
    throw error;
  }
};
