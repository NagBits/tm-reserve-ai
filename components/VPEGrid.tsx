'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';

// --- CONFIGURATION: Define your Table Columns here ---
const ROLE_COLUMNS = [
  "Toastmaster of the Day",
  "Speaker 1",
  "Speaker 2",
  "Speaker 3",
  "Table Topics Master",
  "General Evaluator",
  "Evaluator 1",
  "Evaluator 2",
  "Evaluator 3",
  "Timer",
  "Ah-Counter",
  "Grammarian"
];

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

export default function VPEGrid() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track which specific cell is being edited: { meetingId: "...", role: "..." }
  const [editingCell, setEditingCell] = useState<{ mId: string, role: string } | null>(null);
  const [tempName, setTempName] = useState("");

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "meetings"),
      where("timestamp", ">=", Timestamp.fromDate(now)),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Meeting[];
      setMeetings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. HANDLE SAVE (Cell Update) ---
  const handleSave = async (meeting: Meeting, roleName: string) => {
    try {
      const meetingRef = doc(db, "meetings", meeting.id);
      let updatedSlots = [...meeting.slots];
      
      // Check if slot exists for this role
      const existingSlotIndex = updatedSlots.findIndex(s => s.role === roleName);

      if (existingSlotIndex >= 0) {
        // UPDATE EXISTING SLOT
        if (tempName.trim() === "") {
           // If empty, remove the user but keep the slot open
           updatedSlots[existingSlotIndex] = {
             ...updatedSlots[existingSlotIndex],
             userName: undefined,
             userId: undefined
           };
        } else {
           // Update name
           updatedSlots[existingSlotIndex] = {
             ...updatedSlots[existingSlotIndex],
             userName: tempName,
             userId: 'manual-entry' // Flag as manually entered by VPE
           };
        }
      } else {
        // CREATE NEW SLOT (if it didn't exist in the meeting yet)
        if (tempName.trim() !== "") {
          updatedSlots.push({
            id: Math.random().toString(36).substr(2, 9),
            role: roleName,
            userName: tempName,
            userId: 'manual-entry'
          });
        }
      }

      await updateDoc(meetingRef, { slots: updatedSlots });
      setEditingCell(null);
    } catch (error) {
      console.error("Error updating cell:", error);
      alert("Failed to save. Check console.");
    }
  };

  // --- 3. HELPER: Find user in a specific role for a specific meeting ---
  const getSlotData = (meeting: Meeting, roleName: string) => {
    return meeting.slots.find(s => s.role === roleName);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-purple-600" size={32}/>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[80vh]">
      
      {/* TOOLBAR / LEGEND */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center gap-4">
        <div className="flex items-center gap-2">
           <span className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></span> Filled
        </div>
        <div className="flex items-center gap-2">
           <span className="w-3 h-3 bg-white border border-slate-200 rounded"></span> Open
        </div>
        <div className="ml-auto flex items-center gap-2 text-slate-400">
           <AlertCircle size={14}/> Click any cell to assign a member
        </div>
      </div>

      {/* --- EXCEL TABLE CONTAINER --- */}
      <div className="overflow-auto flex-1 relative">
        <table className="w-full border-collapse text-sm text-left">
          
          {/* TABLE HEADER (Sticky) */}
          <thead className="text-xs text-slate-500 bg-slate-100 uppercase sticky top-0 z-20 shadow-sm font-bold">
            <tr>
              <th className="p-3 border-b border-r border-slate-200 sticky left-0 z-30 bg-slate-100 min-w-[120px]">
                Date
              </th>
              {ROLE_COLUMNS.map((role) => (
                <th key={role} className="p-3 border-b border-slate-200 min-w-[160px] whitespace-nowrap">
                  {role}
                </th>
              ))}
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-slate-100">
            {meetings.map((meeting) => (
              <tr key={meeting.id} className="hover:bg-slate-50 transition-colors">
                
                {/* DATE COLUMN (Sticky Left) */}
                <td className="p-3 border-r border-slate-200 bg-white sticky left-0 z-10 font-medium text-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {meeting.timestamp.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  <span className="text-slate-400 text-xs font-normal ml-1">
                    ({meeting.timestamp.toDate().toLocaleDateString('en-GB', { weekday: 'short' })})
                  </span>
                </td>

                {/* ROLE COLUMNS */}
                {ROLE_COLUMNS.map((role) => {
                  const slot = getSlotData(meeting, role);
                  const isEditing = editingCell?.mId === meeting.id && editingCell?.role === role;
                  const hasUser = !!slot?.userName;

                  return (
                    <td 
                      key={role} 
                      className={`p-1 border-r border-slate-100 relative h-12 align-middle ${isEditing ? 'bg-white z-20 ring-2 ring-purple-500 ring-inset' : ''}`}
                    >
                      {isEditing ? (
                        // --- EDIT MODE ---
                        <div className="flex items-center h-full w-full px-1">
                          <input 
                            autoFocus
                            className="w-full h-8 text-xs px-2 bg-slate-50 border border-purple-200 rounded focus:outline-none"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSave(meeting, role);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            placeholder="Enter Name..."
                          />
                          <button onClick={() => handleSave(meeting, role)} className="ml-1 text-green-600 hover:bg-green-100 p-1 rounded"><Save size={14}/></button>
                          <button onClick={() => setEditingCell(null)} className="ml-1 text-slate-400 hover:bg-slate-100 p-1 rounded"><X size={14}/></button>
                        </div>
                      ) : (
                        // --- VIEW MODE ---
                        <div 
                          onClick={() => {
                            setEditingCell({ mId: meeting.id, role });
                            setTempName(slot?.userName || "");
                          }}
                          className={`w-full h-full flex items-center px-3 cursor-pointer text-xs transition-all
                            ${hasUser 
                              ? 'bg-purple-50 text-purple-900 font-medium hover:bg-purple-100' 
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                          {slot?.userName || <span className="text-[10px] uppercase tracking-widest opacity-50">Empty</span>}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
