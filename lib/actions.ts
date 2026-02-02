import { db } from './firebase';
import { doc, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';

// Reserve a slot: Update Meeting AND User History
export const reserveRole = async (meetingId: string, slotIndex: number, user: any, roleName: string) => {
  const meetingRef = doc(db, "meetings", meetingId);
  const userRef = doc(db, "users", user.uid);

  await runTransaction(db, async (transaction) => {
    const meetingSnap = await transaction.get(meetingRef);
    if (!meetingSnap.exists()) throw "Meeting not found";

    const slots = meetingSnap.data().slots;
    if (slots[slotIndex].userId) throw "Slot already taken!";

    // 1. Lock the slot
    slots[slotIndex].userId = user.uid;
    slots[slotIndex].userName = user.displayName;
    transaction.update(meetingRef, { slots });

    // 2. Add to history
    transaction.update(userRef, {
      roleHistory: arrayUnion(roleName)
    });
  });
};

// Cancel a slot: Clear Meeting AND Remove from User History
export const cancelRole = async (meetingId: string, slotIndex: number, user: any, roleName: string) => {
  const meetingRef = doc(db, "meetings", meetingId);
  const userRef = doc(db, "users", user.uid);

  await runTransaction(db, async (transaction) => {
    const meetingSnap = await transaction.get(meetingRef);
    if (!meetingSnap.exists()) throw "Meeting not found";

    const slots = meetingSnap.data().slots;
    
    // Only allow user to cancel their own slot
    if (slots[slotIndex].userId !== user.uid) throw "Not authorized";

    // 1. Release the slot
    slots[slotIndex].userId = null;
    slots[slotIndex].userName = "";
    transaction.update(meetingRef, { slots });

    // 2. Remove from history
    transaction.update(userRef, {
      roleHistory: arrayRemove(roleName)
    });
  });
};
