'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Edit2, Trash2, Plus, Save, X, User, GripVertical, CheckCircle2 } from 'lucide-react';

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
  
  // State to track which slot is currently being edited
  // Format: "meetingId_slotId"
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Temporary state for the inputs while editing
  const [editForm, setEditForm] = useState({ role: '', userName: '' });

  // --- 1. FETCH MEETINGS ---
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

  // --- 2. UPDATE SLOT (Save Changes) ---
  const handleSaveSlot = async (meeting: Meeting, slotId: string) => {
    try {
      const meetingRef = doc(db, "meetings", meeting.id);
      
      // Map over slots to find the one we changed
      const updatedSlots = meeting.slots.map(slot => {
        if (slot.id === slotId) {
          return {
            ...slot,
            role: editForm.role,
            userName: editForm.userName || null, // Allow clearing name
            userId: editForm.userName ? (slot.userId || 'manual-override') : null // Keep ID if exists, or flag as manual
          };
        }
        return slot;
      });

      await updateDoc(meetingRef, { slots: updatedSlots });
      setEditingId(null); // Exit edit mode
    } catch (error) {
      console.error("Error saving slot:", error);
      alert("Failed to save changes.");
    }
  };

  // --- 3. DELETE SLOT ---
  const handleDeleteSlot = async (meeting: Meeting, slotId: string) => {
    if (!confirm("Are you sure you want to remove this role from the agenda?")) return;

    try {
      const meetingRef = doc(db, "meetings", meeting.id);
      const updatedSlots = meeting.slots.filter(s => s.id !== slotId);
      await updateDoc(meetingRef, { slots: updatedSlots });
    } catch (error) {
      console.error("Error deleting slot:", error);
    }
  };

  // --- 4. ADD NEW SLOT ---
  const handleAddSlot = async (meetingId: string, currentSlots: Slot[]) => {
    const roleName = prompt("Enter the name of the new role (e.g., 'Speaker 4'):");
    if (!roleName) return;

    try {
      const meetingRef = doc(db, "meetings", meetingId);
      const newSlot: Slot = {
        id: Math.random().toString(36).substr(2, 9),
        role: roleName,
        userId: undefined,
        userName: undefined
      };
      
      await updateDoc(meetingRef, { 
        slots: [...currentSlots, newSlot] 
      });
    } catch (error) {
      console.error("Error adding slot:", error);
    }
  };

  // --- HELPER: START EDITING ---
  const startEditing = (meetingId: string, slot: Slot) => {
    setEditingId(`${meetingId}_${slot.id}`);
    setEditForm({ 
      role: slot.role, 
      userName: slot.userName || '' 
    });
  };

  if (loading) return <div className="text-slate-400 text-center py-10">Loading schedule...</div>;

  return (
    <div className="grid grid-cols-1 gap-8">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* MEETING HEADER */}
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {meeting.timestamp.toDate().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-1">ID: {meeting.id}</p>
            </div>
            <button 
              onClick={() => handleAddSlot(meeting.id, meeting.slots)}
              className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors"
            >
              <Plus size={14} /> Add Role
            </button>
          </div>

          {/* SLOTS LIST */}
          <div className="divide-y divide-slate-100">
            {meeting.slots.map((slot) => {
              const isEditing = editingId === `${meeting.id}_${slot.id}`;

              return (
                <div key={slot.id} className={`p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-colors ${isEditing ? 'bg-purple-50' : 'hover:bg-slate-50'}`}>
                  
                  {/* DRAG HANDLE (Visual only for now) */}
                  <div className="hidden md:block text-slate-300 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                  </div>

                  {/* EDIT MODE */}
                  {isEditing ? (
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Role Input */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Role Title</label>
                        <input 
                          type="text" 
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="w-full text-sm font-bold text-slate-800 border-b-2 border-purple-500 bg-transparent focus:outline-none py-1"
                        />
                      </div>
                      
                      {/* Member Input */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Assignee (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="Unassigned"
                          value={editForm.userName}
                          onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
                          className="w-full text-sm text-slate-700 border-b-2 border-slate-300 focus:border-purple-500 bg-transparent focus:outline-none py-1"
                        />
                      </div>
                    </div>
                  ) : (
                    // READ ONLY MODE
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                      <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        {slot.role}
                      </div>
                      <div className={`text-sm flex items-center gap-2 ${slot.userName ? 'text-green-700 font-medium' : 'text-slate-400 italic'}`}>
                        {slot.userName ? (
                          <>
                            <User size={14} className="text-green-600"/> {slot.userName}
                          </>
                        ) : (
                          "Open Slot"
                        )}
                      </div>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="flex items-center gap-2 ml-auto">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => handleSaveSlot(meeting, slot.id)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          title="Save Changes"
                        >
                          <Save size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEditing(meeting.id, slot)}
                          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Slot"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSlot(meeting, slot.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Slot"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              );
            })}

            {meeting.slots.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm italic">
                No roles configured for this meeting yet.
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
