'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import {
    Loader2, CheckCircle2, User as UserIcon, PlusCircle,
    Calendar, Users, ShieldCheck, Award, Mic, MessageSquare,
    ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { ROLE_CATEGORIES, ROLE_THEMES, CATEGORY_STYLES, ALL_ROLES as FALLBACK_ROLES } from '@/lib/roles';

interface Slot {
    id: string;
    role: string;
    userId?: string | null;
    userName?: string;
}

interface Meeting {
    id: string;
    timestamp: any;
    slots: Slot[];
}

const ROLE_ICONS: Record<string, any> = {
    "SAA": ShieldCheck,
    "President": Award,
    "TMOD": Mic,
    "TTM": MessageSquare,
    "DEFAULT": UserIcon
};

export default function MemberGrid() {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [roleColumns, setRoleColumns] = useState<string[]>(FALLBACK_ROLES);
    const [loading, setLoading] = useState(true);
    const [bookingRole, setBookingRole] = useState<{ mId: string, role: string } | null>(null);

    useEffect(() => {
        // 1. Fetch Dynamic Roles (from VPE settings)
        const rolesUnsubscribe = onSnapshot(doc(db, "settings", "roles"), (docSnap) => {
            if (docSnap.exists()) {
                const list = (docSnap.data().list || []) as string[];
                const uniqueList = list.filter((r, i) => list.indexOf(r) === i);
                setRoleColumns(uniqueList.length > 0 ? uniqueList : FALLBACK_ROLES);
            } else {
                setRoleColumns(FALLBACK_ROLES);
            }
        });

        // 2. Fetch Future Meetings
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, "meetings"),
            // where("timestamp", ">=", Timestamp.fromDate(now)),
            orderBy("timestamp", "asc")
        );

        const meetingsUnsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Meeting[];
            setMeetings(data);
            setLoading(false);
        });

        return () => {
            rolesUnsubscribe();
            meetingsUnsubscribe();
        };
    }, []);

    const handleBook = async (meetingId: string, roleName: string, currentSlots: Slot[]) => {
        if (!user) {
            alert("Please sign in to book a role.");
            return;
        }

        setBookingRole({ mId: meetingId, role: roleName });

        try {
            const updatedSlots = [...currentSlots];
            const index = updatedSlots.findIndex(s => s.role.trim().toLowerCase() === roleName.trim().toLowerCase());

            if (index >= 0) {
                // If already taken by someone else and not empty? (Firestore rules should handle this but let's be safe)
                if (updatedSlots[index].userId && updatedSlots[index].userId !== user.uid) {
                    alert("This role is already taken.");
                    setBookingRole(null);
                    return;
                }

                // Toggle booking if it's my own role
                if (updatedSlots[index].userId === user.uid) {
                    if (confirm("Are you sure you want to cancel your booking for " + roleName + "?")) {
                        updatedSlots[index] = { ...updatedSlots[index], userId: null, userName: "" };
                    } else {
                        setBookingRole(null);
                        return;
                    }
                } else {
                    updatedSlots[index] = { ...updatedSlots[index], userId: user.uid, userName: user.displayName || "Member" };
                }
            } else {
                // Add new slot if it didn't exist
                updatedSlots.push({
                    id: Math.random().toString(36).substr(2, 9),
                    role: roleName,
                    userId: user.uid,
                    userName: user.displayName || "Member"
                });
            }

            await updateDoc(doc(db, "meetings", meetingId), { slots: updatedSlots });
        } catch (error) {
            console.error("Booking failed:", error);
        } finally {
            setBookingRole(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-purple-600" size={40} />
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Loading Grid...</span>
        </div>
    );

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">

            {/* Grid Header Info */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">Role Reservation Grid</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Click a cell to book or cancel your role</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-6">
                    {Object.keys(CATEGORY_STYLES).map(cat => (
                        <div key={cat} className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${cat === 'Core' ? 'bg-purple-500' : cat === 'Prepared' ? 'bg-blue-500' : cat === 'Evaluation' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{cat}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="overflow-auto custom-scrollbar max-h-[60vh]">
                {meetings.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100">
                                <Calendar size={32} className="text-slate-400" strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-slate-900 font-black italic tracking-tighter uppercase text-sm">No Upcoming Sessions</span>
                                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Check back later for new dates</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm">
                                <th className="p-5 text-left border-b border-r border-slate-100 sticky left-0 z-40 bg-slate-50 min-w-[180px]">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                                        Member Roles
                                    </div>
                                </th>
                                {meetings.map((meeting) => (
                                    <th key={meeting.id} className="p-5 text-left border-b border-slate-100 min-w-[150px] whitespace-nowrap bg-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 tracking-tighter">
                                                {meeting.timestamp.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                                {meeting.timestamp.toDate().toLocaleDateString('en-GB', { weekday: 'short' })}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {roleColumns.map((role) => {
                                const category = ROLE_CATEGORIES[role] || "Other";
                                const Icon = ROLE_ICONS[role] || ROLE_ICONS.DEFAULT;

                                return (
                                    <tr key={role} className="group hover:bg-slate-50/50 transition-all duration-200">
                                        <td className={`p-5 border-r border-slate-100 bg-white sticky left-0 z-10 group-hover:bg-slate-50 ${CATEGORY_STYLES[category] || ""}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ROLE_THEMES[category]?.bg || 'bg-slate-50'} ${ROLE_THEMES[category]?.text || 'text-slate-400'}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex flex-col leading-tight">
                                                    <span className="text-[11px] font-black text-slate-700 uppercase italic tracking-tighter truncate max-w-[120px]">
                                                        {role}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {category}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {meetings.map((meeting) => {
                                            const slot = meeting.slots?.find(s => s.role.trim().toLowerCase() === role.trim().toLowerCase());
                                            const isTaken = !!slot?.userName;
                                            const isMySlot = user && slot?.userId === user.uid;
                                            const isLoading = bookingRole?.mId === meeting.id && bookingRole?.role === role;

                                            return (
                                                <td key={meeting.id} className="p-2 border-r border-slate-50 last:border-r-0">
                                                    <button
                                                        onClick={() => handleBook(meeting.id, role, meeting.slots)}
                                                        disabled={isTaken && !isMySlot}
                                                        className={`w-full h-11 flex items-center px-3 rounded-xl transition-all duration-300 relative group/btn
                            ${isMySlot
                                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 ring-2 ring-purple-600 ring-offset-1'
                                                                : isTaken
                                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
                                                                    : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 active:scale-95'
                                                            }
                          `}
                                                    >
                                                        {isLoading ? (
                                                            <Loader2 className="animate-spin mx-auto" size={16} />
                                                        ) : isMySlot ? (
                                                            <div className="flex items-center gap-2 w-full truncate">
                                                                <CheckCircle2 size={14} className="shrink-0" />
                                                                <span className="text-[10px] font-black truncate uppercase tracking-tighter">Your Role</span>
                                                            </div>
                                                        ) : isTaken ? (
                                                            <div className="flex items-center gap-2 w-full truncate grayscale">
                                                                <UserIcon size={12} className="shrink-0" />
                                                                <span className="text-[9px] font-bold truncate tracking-tight">{slot?.userName}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 mx-auto transition-all duration-300 group-hover/btn:scale-110">
                                                                <PlusCircle size={14} className="opacity-40 group-hover/btn:opacity-100 group-hover/btn:rotate-90 transition-all" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline">Sign Up</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-600"></div> Your Booking</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Already Taken</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white border border-slate-200"></div> Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Info size={12} className="text-slate-300" />
                    <span>Session availability synced in real-time</span>
                </div>
            </div>
        </div>
    );
}
