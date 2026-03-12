'use client';

import { useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, User, Mic, AlertCircle, CheckCircle2, Loader2, Award, Users, MessageSquare, ShieldCheck, PlusCircle } from 'lucide-react';

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

import { ROLE_CATEGORIES, ROLE_THEMES, ROLE_DESCRIPTIONS } from '@/lib/roles';

// Mapping icons for roles
const ROLE_ICONS: Record<string, any> = {
  "SAA": ShieldCheck,
  "President": Award,
  "TMOD": Mic,
  "TTM": MessageSquare,
  "DEFAULT": User
};

export default function MeetingCard({ meeting }: { meeting: Meeting }) {
  const { user } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const meetingDateObj = useMemo(() => meeting.timestamp.toDate(), [meeting.timestamp]);
  const isPast = meetingDateObj < new Date();

  // --- HANDLE BOOKING ---
  const handleBook = async (roleName: string) => {
    if (isPast) {
      alert("You cannot book roles for past meetings.");
      return;
    }

    if (!user) {
      alert("Please sign in to book a role.");
      return;
    }

    setLoadingRole(roleName);

    try {
      const updatedSlots = meeting.slots.map((s) =>
        s.role.trim().toLowerCase() === roleName.trim().toLowerCase() ? { ...s, userId: user.uid, userName: user.displayName || "Member" } : s
      );

      const meetingRef = doc(db, "meetings", meeting.id);
      await updateDoc(meetingRef, { slots: updatedSlots });

      // Notify via API (Fire and forget, don't block UI)
      const meetingDateStr = meetingDateObj.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long'
      });

      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [process.env.NEXT_PUBLIC_VPE_EMAIL, user.email].filter(Boolean).join(','),
          subject: `✅ Role Confirmed: ${roleName}`,
          html: `<h2>Role Booking Confirmed</h2><p>Hi <strong>${user.displayName}</strong>, you have successfully booked <strong>${roleName}</strong> for <strong>${meetingDateStr}</strong>.</p>`
        })
      }).catch(err => console.error("Email notification failed:", err));

    } catch (error) {
      console.error("Error booking role:", error);
      alert("Failed to book role. Please try again.");
    } finally {
      setLoadingRole(null);
    }
  };

  // --- HANDLE CANCEL ---
  const handleCancel = async (roleName: string) => {
    if (!confirm("Are you sure you want to cancel this role?")) return;
    setLoadingRole(roleName);

    try {
      const updatedSlots = meeting.slots.map((s) =>
        s.role.trim().toLowerCase() === roleName.trim().toLowerCase() ? { ...s, userId: null, userName: "" } : s
      );

      const meetingRef = doc(db, "meetings", meeting.id);
      await updateDoc(meetingRef, { slots: updatedSlots });

    } catch (error) {
      console.error("Error canceling role:", error);
      alert("Failed to cancel role.");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="group bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1">

      {/* HEADER: Glassmorphic feel */}
      <div className="bg-gradient-to-br from-slate-50 to-white p-6 border-b border-slate-100 flex justify-between items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-purple-500/10 transition-colors"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-widest mb-2">
            <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
            {meetingDateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>
          <h3 className="text-4xl font-black text-slate-800 tracking-tight">
            {meetingDateObj.getDate()}
            <span className="text-lg font-medium text-slate-400 ml-2">
              {meetingDateObj.toLocaleDateString('en-GB', { weekday: 'long' })}
            </span>
          </h3>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
              <Clock size={14} className="text-purple-500" /> 11:00 AM - 1:00 PM
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
              <Users size={14} className="text-blue-500" /> {meeting.slots.length} Roles
            </div>
          </div>
        </div>

        {isPast ? (
          <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-xs font-bold border border-slate-200 uppercase tracking-tighter">
            Archived
          </span>
        ) : (
          <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-100 uppercase tracking-tighter animate-pulse">
            Upcoming
          </span>
        )}
      </div>

      {/* SLOTS LIST: Refined interaction */}
      <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
        {meeting.slots.map((slot, index) => {
          const isTaken = !!slot.userId;
          const isMySlot = user && slot.userId === user.uid;
          const isLoading = loadingRole === slot.role;
          const category = ROLE_CATEGORIES[slot.role] || "Other";
          const theme = ROLE_THEMES[category] || ROLE_THEMES.Other;
          const RoleIcon = ROLE_ICONS[slot.role] || ROLE_ICONS.DEFAULT;

          return (
            <div
              key={slot.id || `${slot.role}-${index}`}
              className={`group/slot p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 
              ${isMySlot ? 'bg-purple-50/50' : 'hover:bg-slate-50/80'}`}
            >
              {/* Role Info */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover/slot:scale-110 
                ${isTaken ? 'bg-white text-green-600 border border-green-100' : theme.bg + ' ' + theme.text}`}>
                  {isTaken ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <RoleIcon size={24} />}
                </div>
                <div>
                  <p
                    className="font-extrabold text-slate-800 text-base tracking-tight cursor-help"
                    title={ROLE_DESCRIPTIONS[slot.role] || "Standard Toastmasters meeting role"}
                  >
                    {slot.role}
                  </p>
                  <p className="text-xs flex items-center gap-1.5 mt-1">
                    {isTaken ? (
                      <span className="flex items-center gap-1.5 text-slate-600 bg-white border border-slate-100 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                        <User size={12} className="text-purple-500" /> {slot.userName}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium italic flex items-center gap-1 opacity-60">
                        Open for Signup
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Button: Premium interaction */}
              {!isPast && (
                <div className="shrink-0">
                  {isTaken ? (
                    isMySlot ? (
                      <button
                        onClick={() => handleCancel(slot.role)}
                        disabled={!!loadingRole}
                        className="text-xs font-black text-red-500 hover:text-white hover:bg-red-500 px-4 py-2 rounded-xl transition-all duration-300 border-2 border-red-50 hover:border-red-500 shadow-sm disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Cancel Booking"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <ShieldCheck size={14} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-300 uppercase">Booked</span>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => handleBook(slot.role)}
                      disabled={!!loadingRole}
                      className="group/btn flex items-center gap-2 text-sm font-black bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-purple-600 transition-all duration-300 shadow-lg hover:shadow-purple-200 disabled:opacity-50 active:scale-95"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={16} /> : (
                        <>
                          <span>Book Role</span>
                          <Mic size={16} className="group-hover/btn:rotate-12 transition-transform" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {meeting.slots.length === 0 && (
          <div className="p-10 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-dashed border-slate-200">
              <AlertCircle size={32} />
            </div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Agenda not published</p>
          </div>
        )}
      </div>
    </div>
  );
}

