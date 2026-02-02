import { db } from './firebase';
import { collection, getDocs, writeBatch, doc, Timestamp, addDoc } from 'firebase/firestore';

// DELETE ALL Meetings
export const wipeAllMeetings = async () => {
  const querySnapshot = await getDocs(collection(db, "meetings"));
  const batch = writeBatch(db);
  querySnapshot.forEach((document) => {
    batch.delete(doc(db, "meetings", document.id));
  });
  await batch.commit();
  console.log("🔥 All meetings wiped.");
};

// CREATE Next 4 Saturdays
export const seedSaturdays = async () => {
  const roles = [
    "Toastmaster", "Timer", "Ah-Counter", "Grammarian", 
    "General Evaluator", "Speaker 1", "Speaker 2", "Evaluator 1", "Evaluator 2"
  ];

  let d = new Date();
  // Find next Saturday
  d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);

  for (let i = 0; i < 4; i++) {
    const dateStr = d.toLocaleDateString('en-GB', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    await addDoc(collection(db, "meetings"), {
      date: dateStr,
      timestamp: Timestamp.fromDate(new Date(d)),
      isPublished: true, // Auto-publish for simplicity
      slots: roles.map(role => ({
        role: role,
        userId: null,
        userName: ""
      }))
    });
    d.setDate(d.getDate() + 7);
  }
  console.log("✅ 4 Saturdays Created.");
};
