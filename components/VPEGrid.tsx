'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import {
  Loader2, Save, X, AlertCircle, Edit3,
  Search, Filter, ChevronLeft, ChevronRight, PlusCircle,
  Database, User as UserIcon, Mic, MessageSquare, Award, Clock
} from 'lucide-react';

import { ROLE_CATEGORIES, CATEGORY_STYLES, ALL_ROLES as FALLBACK_ROLES } from '@/lib/roles';

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

// Using FALLBACK_ROLES from centralized roles

export default function VPEGrid() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [roleColumns, setRoleColumns] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [editingCell, setEditingCell] = useState<{ mId: string, role: string } | null>(null);
  const [tempName, setTempName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loading = loadingRoles || loadingMeetings;

  useEffect(() => {
    // 1. Fetch Dynamic Roles
    const rolesUnsubscribe = onSnapshot(doc(db, "settings", "roles"), (docSnap) => {
      if (docSnap.exists()) {
        const list = (docSnap.data().list || []) as string[];
        const uniqueList = list.filter((r, i) => list.indexOf(r) === i);
        setRoleColumns(uniqueList.length > 0 ? uniqueList : FALLBACK_ROLES);
      } else {
        setRoleColumns(FALLBACK_ROLES);
        // Initialize if not exists
        setDoc(doc(db, "settings", "roles"), { list: FALLBACK_ROLES });
      }
      setLoadingRoles(false);
    }, (error) => {
      console.error("Roles fetch error:", error);
      setRoleColumns(FALLBACK_ROLES);
      setLoadingRoles(false);
    });

    // 2. Fetch Meetings
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
      setLoadingMeetings(false);
    }, (error) => {
      console.error("Meetings fetch error:", error);
      setLoadingMeetings(false);
    });

    return () => {
      rolesUnsubscribe();
      meetingsUnsubscribe();
    };
  }, []);

  const filteredMeetings = useMemo(() => {
    if (!searchQuery) return meetings;
    const query = searchQuery.toLowerCase();
    return meetings.filter(m =>
      m.timestamp.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toLowerCase().includes(query) ||
      m.slots.some(s => s.userName?.toLowerCase().includes(query))
    );
  }, [meetings, searchQuery]);

  const filteredRoles = useMemo(() => {
    if (!searchQuery) return roleColumns;
    const query = searchQuery.toLowerCase();

    // Check if it's likely a date query - in that case, we show all roles
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const isDateQuery = /\d/.test(query) || monthNames.some(m => query.includes(m));
    if (isDateQuery) return roleColumns;

    return roleColumns.filter(role =>
      role.toLowerCase().includes(query) ||
      ROLE_CATEGORIES[role]?.toLowerCase().includes(query) ||
      meetings.some(m => m.slots?.some(s => s.role === role && s.userName?.toLowerCase().includes(query)))
    );
  }, [roleColumns, searchQuery, meetings]);

  const handleSave = async (meeting: Meeting, roleName: string) => {
    try {
      const meetingRef = doc(db, "meetings", meeting.id);
      let updatedSlots = [...(meeting.slots || [])];
      const index = updatedSlots.findIndex(s => s.role.trim().toLowerCase() === roleName.trim().toLowerCase());

      const slotUpdate = tempName.trim() === ""
        ? { userId: null, userName: "" }
        : { userId: 'manual-entry', userName: tempName };

      if (index >= 0) {
        updatedSlots[index] = { ...updatedSlots[index], ...slotUpdate };
      } else if (tempName.trim() !== "") {
        updatedSlots.push({
          id: Math.random().toString(36).substr(2, 9),
          role: roleName,
          ...slotUpdate
        });
      }

      await updateDoc(meetingRef, { slots: updatedSlots });
      setEditingCell(null);
    } catch (error) {
      console.error("Error updating cell:", error);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="animate-spin text-purple-500" size={48} />
      <span className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Syncing Ledger...</span>
    </div>
  );

  return (
    <div className="flex flex-col h-[75vh]">

      {/* GRID TOOLBAR */}
      <div className="p-3 md:p-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-t-[1.5rem] md:rounded-t-[2.5rem]">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ledger Online</span>
          </div>
          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {Object.keys(CATEGORY_STYLES).map(cat => (
              <div key={cat} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${cat === 'Core' ? 'bg-purple-500' : cat === 'Prepared' ? 'bg-blue-500' : cat === 'Evaluation' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 md:px-4 py-2 rounded-xl md:rounded-2xl border border-slate-800 w-full md:w-auto">
          <Search size={14} className="text-slate-500 shrink-0" />
          <input
            placeholder="Filter grid..."
            className="bg-transparent text-xs font-bold text-slate-300 outline-none w-full md:w-56 placeholder:text-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* SPREADSHEET ENGINE */}
      <div className="overflow-auto flex-1 custom-scrollbar bg-slate-950 border-x border-slate-800 text-slate-300">
        <table className="w-full border-collapse">
          <thead>
            <tr className="sticky top-0 z-30">
              <th className="bg-slate-900 p-5 text-left border-b border-r border-slate-800 sticky left-0 z-40 min-w-[180px]">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <UserIcon size={12} /> Roles
                </div>
              </th>
              {filteredMeetings.map((meeting) => (
                <th key={meeting.id} className="bg-slate-900 p-5 text-left border-b border-slate-800 min-w-[160px] whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-black text-slate-100 tracking-tighter">
                      {meeting.timestamp.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      {meeting.timestamp.toDate().toLocaleDateString('en-GB', { weekday: 'long' })}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/50">
            {filteredMeetings.length === 0 ? (
              <tr>
                <td colSpan={filteredMeetings.length + 1} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-40">
                    <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center border border-slate-800">
                      <Database size={32} className="text-slate-500" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-slate-100 font-black italic tracking-tighter uppercase text-sm">Empty Ledger</span>
                      <span className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em]">No Synchronized Records Found</span>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRoles.map((role) => (
                <tr key={role} className="group hover:bg-white/5 transition-all duration-300">
                  <td className={`p-5 border-r border-slate-800 bg-slate-950 sticky left-0 z-10 transition-colors group-hover:bg-slate-900 ${CATEGORY_STYLES[ROLE_CATEGORIES[role] || "Other"] || ""}`}>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest opacity-60">
                        {ROLE_CATEGORIES[role] || "Other"}
                      </span>
                      <span className="text-xs font-black text-slate-300 uppercase italic tracking-tighter">
                        {role}
                      </span>
                    </div>
                  </td>

                  {filteredMeetings.map((meeting) => {
                    const slot = meeting.slots?.find(s => s.role.trim().toLowerCase() === role.trim().toLowerCase());
                    const isEditing = editingCell?.mId === meeting.id && editingCell?.role === role;
                    const hasUser = !!slot?.userName;
                    const category = ROLE_CATEGORIES[role] || "Other";

                    return (
                      <td
                        key={meeting.id}
                        className={`p-2 transition-all duration-300 border-r border-slate-900/50 group/cell relative
                        ${isEditing ? 'bg-slate-900 ring-2 ring-purple-600 ring-inset z-20 shadow-2xl scale-105 rounded-xl' : ''}`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            <input
                              autoFocus
                              className="bg-slate-950 border border-slate-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-purple-500 w-full"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave(meeting, role);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                            />
                            <button onClick={() => handleSave(meeting, role)} className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 shadow-lg shadow-purple-900/20"><Save size={14} /></button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingCell({ mId: meeting.id, role });
                              setTempName(slot?.userName || "");
                            }}
                            className={`h-12 w-full flex items-center px-4 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden group/cell-container
                            ${CATEGORY_STYLES[category] || ""}
                            ${hasUser
                                ? 'bg-purple-500/10 text-purple-400 font-black hover:bg-purple-500/20 border border-purple-500/20 shadow-inner'
                                : 'bg-slate-900/40 border border-slate-800/50 text-slate-700 hover:text-slate-400 hover:border-slate-700 hover:bg-slate-800/60'
                              }`}
                          >
                            <div className="flex items-center gap-3 w-full truncate italic tracking-tight">
                              {hasUser ? (
                                <>
                                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                                  <span className="truncate">{slot?.userName}</span>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-slate-500/50 group-hover/cell-container:text-purple-400 transition-colors">
                                  <PlusCircle size={12} className="group-hover/cell-container:rotate-90 transition-transform duration-500" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Assign Member</span>
                                </div>
                              )}
                            </div>
                            <Edit3 size={12} className="opacity-0 group-hover/cell:opacity-100 transition-opacity ml-auto text-purple-500 shrink-0" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* GRID FOOTER */}
      <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800 text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-b-[1.5rem] md:rounded-b-[2.5rem]">
        <div className="flex items-center gap-4">
          <span>Records: {filteredMeetings.length}</span>
          <div className="h-3 w-px bg-slate-800"></div>
          <span>Active: {meetings.filter(m => m.timestamp.toDate() >= new Date()).length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-8">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-purple-600"></div> Core Team
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-blue-600"></div> Speeches
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-emerald-600"></div> Evaluations
          </div>
        </div>
      </div>
    </div>
  );
}

