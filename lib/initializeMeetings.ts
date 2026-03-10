import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ALL_ROLES } from './roles';

export const seedSaturdays = async () => {
  const roles = ALL_ROLES;

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
