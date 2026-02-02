'use client';
import { useEffect, useState, Fragment } from 'react'; // <--- Ensure Fragment is imported
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ROLE_GROUPS } from '@/lib/adminUtils';
import { cancelRole } from '@/lib/actions';
import { useAuth } from '@/context/AuthContext';
import { Loader2, X } from 'lucide-react';

export default function VPEGrid() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State for "Manual Override"
  const [selectedCell, setSelectedCell] = useState<{meetingId: string, role: string, currentName: string, slotIndex: number} | null>(null);
  const [overrideName, setOverrideName] = useState("");

  useEffect(() => {
    const q = query(collection(db, "meetings"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Helper to find data for a specific cell
  const getSlot = (meeting: any, role: string) => {
    const idx = meeting.slots.findIndex((s: any) => s.role === role);
    return { data: meeting.slots[idx], idx };
  };

  const handleOverride = async () => {
    if (!selectedCell || !user) return;
    try {
      if (selectedCell.currentName && !overrideName) {
        if(!confirm(`Remove ${selectedCell.currentName}?`)) return;
        await cancelRole(selectedCell.meetingId, selectedCell.slotIndex, user, selectedCell.role);
      }
      setSelectedCell(null);
      setOverrideName("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-xl bg-white">
      <table className="min-w-full text-sm border-collapse">
        
        {/* --- HEADER (Dates) --- */}
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="p-3 border border-slate-600 text-left w-48 sticky left-0 bg-slate-800 z-10">Role / Date</th>
            {meetings.map(m => (
              <th key={m.id} className="p-3 border border-slate-600 min-w-[140px]">
                <div className="font-bold">{m.date.split(',')[0]}</div> 
                <div className="text-xs text-slate-400">{m.date.split(',')[1]}</div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Object.entries(ROLE_GROUPS).map(([groupName, roles]) => (
            // 🟢 OPENING TAG: Fragment with key
            <Fragment key={groupName}>
              
              {/* Group Header Row */}
              <tr className="bg-slate-200 font-bold text-slate-700 uppercase tracking-wider text-xs">
                <td className="p-2 border border-slate-300 sticky left-0 bg-slate-200">{groupName}</td>
                {meetings.map(m => <td key={m.id} className="border border-slate-300 bg-slate-100"></td>)}
              </tr>

              {/* Role Rows */}
              {roles.map((role: string) => (
                <tr key={role} className="hover:bg-slate-50 transition-colors">
                  
                  {/* Role Name */}
                  <td className="p-2 border border-slate-200 font-medium text-slate-900 sticky left-0 bg-white border-r-2 border-r-slate-300">
                    {role}
                  </td>

                  {/* Meeting Slots */}
                  {meetings.map(m => {
                    const { data, idx } = getSlot(m, role);
                    const isTaken = !!data?.userId;
                    
                    return (
                      <td 
                        key={m.id + role} 
                        onClick={() => setSelectedCell({ 
                          meetingId: m.id, 
                          role: role, 
                          currentName: data?.userName, 
                          slotIndex: idx 
                        })}
                        className={`p-2 border border-slate-200 cursor-pointer text-center relative group ${isTaken ? 'bg-blue-50' : ''}`}
                      >
                        {isTaken ? (
                          <span className="font-semibold text-slate-800 text-xs truncate block max-w-[120px] mx-auto">
                            {data.userName}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                        
                        <div className="absolute inset-0 bg-black/5 hidden group-hover:flex items-center justify-center">
                           <span className="text-[10px] bg-black text-white px-1 rounded">Manage</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

            {/* 🟢 CLOSING TAG: Must match Fragment */}
            </Fragment>
          ))}
        </tbody>
      </table>

      {/* Override Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2">{selectedCell.role}</h3>
            <p className="text-slate-500 text-sm mb-4">
              Current: <span className="font-bold text-black">{selectedCell.currentName || "Empty"}</span>
            </p>

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setSelectedCell(null)} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              
              {selectedCell.currentName && (
                <button 
                  onClick={handleOverride}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <X size={16}/> Clear Slot
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
