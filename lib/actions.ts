import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendNotification } from '@/app/actions/email';

// Configuration
const VPE_EMAIL = process.env.NEXT_PUBLIC_VPE_EMAIL;

// Helper: Format date nicely
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Unknown Date';
  return timestamp.toDate ? timestamp.toDate().toDateString() : new Date(timestamp).toDateString();
};

/**
 * RESERVE A SLOT
 */
export const reserveRole = async (meetingId: string, slotIndex: number, user: any, roleName: string) => {
  const meetingRef = doc(db, "meetings", meetingId);
  const meetingSnap = await getDoc(meetingRef);

  if (!meetingSnap.exists()) {
    throw new Error("Meeting not found.");
  }

  const data = meetingSnap.data();
  const slots = [...data.slots];

  // Double-check: Is it still free?
  if (slots[slotIndex].userId) {
    throw new Error("This slot was just taken by someone else.");
  }

  // 1. Update Database
  slots[slotIndex] = {
    ...slots[slotIndex],
    role: roleName,
    userId: user.uid,
    userName: user.displayName || "Member",
    userEmail: user.email 
  };

  await updateDoc(meetingRef, { slots });

  // 2. Send Email Notification
  const meetingDate = formatDate(data.timestamp);
  
  await sendNotification(
    user.email,
    `✅ Confirmed: You are the ${roleName}`,
    `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #7c3aed; margin-top: 0;">Booking Confirmed!</h2>
        <p>Hi <strong>${user.displayName || 'Member'}</strong>,</p>
        <p>You have successfully reserved a role for the upcoming Toastmasters meeting.</p>
        
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Role</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${roleName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Date</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${meetingDate}</td>
          </tr>
        </table>

        <p style="font-size: 14px; color: #64748b;">
          If you can no longer fulfill this role, please log in and cancel it immediately so others can take the spot.
        </p>
        
        <div style="margin-top: 20px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}" style="background-color: #0f172a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 14px;">View Dashboard</a>
        </div>
      </div>
    `
  );
};

/**
 * CANCEL A SLOT
 */
export const cancelRole = async (meetingId: string, slotIndex: number, user: any, roleName: string) => {
  const meetingRef = doc(db, "meetings", meetingId);
  const meetingSnap = await getDoc(meetingRef);

  if (!meetingSnap.exists()) {
    throw new Error("Meeting not found.");
  }

  const data = meetingSnap.data();
  const slots = [...data.slots];
  const slot = slots[slotIndex];

  // Security: Can only cancel if YOU own it, or if YOU are the VPE
  const isOwner = slot.userId === user.uid;
  const isAdmin = user.email === VPE_EMAIL; 

  if (!isOwner && !isAdmin) {
    throw new Error("Unauthorized: You cannot cancel someone else's slot.");
  }

  // 1. Update Database (Clear the slot)
  const previousOwnerEmail = slot.userEmail; // Save email to notify them
  const previousOwnerName = slot.userName;

  slots[slotIndex] = {
    role: roleName,
    userId: null,
    userName: ""
  };

  await updateDoc(meetingRef, { slots });

  // 2. Send Email Notification
  const emailTarget = previousOwnerEmail || user.email;
  const meetingDate = formatDate(data.timestamp);

  await sendNotification(
    emailTarget,
    `❌ Cancelled: ${roleName} Role`,
    `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444; margin-top: 0;">Role Cancelled</h2>
        <p>Hi <strong>${previousOwnerName}</strong>,</p>
        <p>The reservation for <strong>${roleName}</strong> on <strong>${meetingDate}</strong> has been cancelled.</p>
        
        ${!isOwner ? `<p style="background-color: #fff1f2; padding: 10px; border-radius: 4px; color: #9f1239;"><strong>Note:</strong> This cancellation was processed by the VPE/Admin.</p>` : ''}
        
        <p>The slot is now open for others.</p>
      </div>
    `
  );
};
