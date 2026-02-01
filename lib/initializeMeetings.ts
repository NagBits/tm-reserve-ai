// lib/initializeMeetings.ts
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export const seedSaturdays = async () => {
  const roles = [
    "Toastmaster", "Timer", "Ah-Counter", "Grammarian", 
    "General Evaluator", "Speaker 1", "Speaker 2", "Evaluator 1", "Evaluator 2"
  ];

  let d = new Date();
  // Find the next Saturday
  d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);

  for (let i = 0; i < 4; i++) {
    const dateStr = d.toLocaleDateString('en-GB', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    await addDoc(collection(db, "meetings"), {
      date: dateStr,
      timestamp: new Date(d), // Used for sorting
      isPublished: true,      // Set to true so they show up immediately
      slots: roles.map(role => ({
        role: role,
        userId: null,
        userName: ""
      }))
    });
    // Jump to the following Saturday
    d.setDate(d.getDate() + 7);
  }
  console.log("Saturdays Initialized!");
};
