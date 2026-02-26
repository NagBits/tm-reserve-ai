'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, User, Mic, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Slot {
  id: string;
  role: string;
  userId?: string;
  userName?: string;
}

interface Meeting {
  id: string;
  timestamp: any;
  slots: Slot[];
}

export default function MeetingCard({ meeting }: { meeting: Meeting }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  // --- HELPER: Sanitize Data ---
  // Firestore crashes if you send 'undefined'. This removes undefined keys.
  const sanitizeSlots = (slots: Slot[]) => {
    return JSON.parse(JSON.stringify(slots));
  };

  // --- HANDLE BOOKING ---
  const handleBook = async (roleName: string) => {
    if (!user) {
      alert("Please sign in to book a role.");
      return;
    }

    if (!confirm(`Confirm sign-up for ${roleName}?`)) return;

    setLoading(roleName);

    try {
      // 1. Update Local State Logic
      const updatedSlots = meeting.slots.map((s) => {
        if (s.role === roleName) {
          return { 
            ...s, 
            userId: user.uid, 
            userName: user.displayName || "Member" 
          };
        }
        return s;
      });

      // 2. Update Firebase (Sanitized)
      const meetingRef = doc(db, "meetings", meeting.id);
      await updateDoc(meetingRef, { slots: sanitizeSlots(updatedSlots) });

      // 3. Send Booking Email
      const meetingDate = meeting.timestamp.toDate().toLocaleDateString('en-GB', {
         weekday: 'long', day: 'numeric', month: 'long'
      });

      const vpeEmail = process.env.NEXT_PUBLIC_VPE_EMAIL;
      const userEmail = user.email;
      const recipients = [vpeEmail, userEmail].filter(Boolean).join(',');

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients, 
          subject: `✅ Role Confirmed: ${roleName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #7e22ce; margin-top: 0;">Role Booking Confirmed</h2>
              <p>Hi <strong>${user.displayName}</strong>,</p>
              <p>You have successfully booked a role.</p>
              
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${meetingDate}</p>
                <p style="margin: 5px 0;"><strong>🎤 Role:</strong> ${roleName}</p>
              </div>

              <p style="font-size: 12px; color: #666; margin-top: 20px;">
                The VPE has been notified.
              </p>
            </div>
          `
        })
      });

    } catch (error) {
      console.error("Error booking role:", error);
      alert("Failed to book role. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  // --- HANDLE CANCEL ---
  const handleCancel = async (roleName: string) => {
    if (!confirm("Are you sure you want to cancel this role?")) return;
    setLoading(roleName);

    try {
      const meetingRef = doc(db, "meetings", meeting.id);
      
      // 1. Prepare Update
      const updatedSlots = meeting.slots.map((s) => {
        if (s.role === roleName) {
          return { ...s, userId: undefined, userName: undefined };
        }
        return s;
      });

      // 2. Update Firebase
      await updateDoc(meetingRef, { slots: sanitizeSlots(updatedSlots) });

      // 3. Send Cancellation Email
      if (user) {
        const meetingDate = meeting.timestamp.toDate().toLocaleDateString('en-GB', {
           weekday: 'long', day: 'numeric', month: 'long'
        });

        const vpeEmail = process.env.NEXT_PUBLIC_VPE_EMAIL;
        const userEmail = user.email;
        const recipients = [vpeEmail, userEmail].filter(Boolean).join(',');

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipients, 
            subject: `❌ Role Cancelled: ${roleName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #dc2626; margin-top: 0;">Role Cancelled</h2>
                <p>Hi <strong>${user.displayName}</strong>,</p>
                <p>You have cancelled your role. This slot is now available for others to book.</p>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                  <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${meetingDate}</p>
                  <p style="margin: 5px 0;"><strong>🎤 Role:</strong> ${roleName}</p>
                </div>

                <p style="font-size: 12px; color: #666; margin-top: 20px;">
                  The VPE has been notified of this cancellation.
                </p>
              </div>
            `
          })
        });
      }
      
    } catch (error) {
      console.error("Error canceling role:", error);
      alert("Failed to cancel role.");
    } finally {
      setLoading(null);
    }
  };

  const isPast = meeting.timestamp.toDate() < new Date();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      
      {/* HEADER */}
      <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Calendar size={14} />
            {meeting.timestamp.toDate().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>
          <h3 className="text-2xl font-black text-slate-800">
            {meeting.timestamp.toDate().getDate()}
            <span className="text-base font-medium text-slate-400 ml-1">
               {meeting.timestamp.toDate().toLocaleDateString('en-GB', { weekday: 'long' })}
            </span>
          </h3>
          <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
            <Clock size={14} /> 7:00 PM - 9:00 PM
          </div>
        </div>
        
        {isPast && (
          <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
            Completed
          </span>
        )}
      </div>

      {/* SLOTS LIST */}
      <div className="divide-y divide-slate-50">
        {meeting.slots.map((slot) => {
          const isTaken = !!slot.userId;
          const isMySlot = user && slot.userId === user.uid;
          const isLoading = loading === slot.role;

          return (
            <div key={slot.role} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isMySlot ? 'bg-purple-50/50' : 'hover:bg-slate-50'}`}>
              
              {/* Role Info */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isTaken ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {isTaken ? <CheckCircle2 size={20} /> : <Mic size={20} />}
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-sm">{slot.role}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    {isTaken ? (
                      <span className="flex items-center gap-1 text-green-700 font-medium">
                        <User size={12} /> {slot.userName}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Available</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              {!isPast && (
                <div className="shrink-0">
                  {isTaken ? (
                    isMySlot ? (
                      <button 
                        onClick={() => handleCancel(slot.role)}
                        disabled={!!loading}
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={14}/> : "Cancel"}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 px-3 py-1.5">
                        Taken
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => handleBook(slot.role)}
                      disabled={!!loading}
                      className="flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={14} /> : "Book Role"}
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}
        
        {meeting.slots.length === 0 && (
           <div className="p-6 text-center text-slate-400 text-sm italic flex flex-col items-center gap-2">
             <AlertCircle size={20} />
             No roles available yet.
           </div>
        )}
      </div>
    </div>
  );
}
