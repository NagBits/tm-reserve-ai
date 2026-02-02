'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { reserveRole, cancelRole } from '@/lib/actions';
import { Calendar, UserPlus, UserX } from 'lucide-react';

export default function MeetingList() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    // Only fetch PUBLISHED meetings
    const q = query(
      collection(db, "meetings"),
      where("isPublished", "==", true),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Index missing? Check console link:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (meetingId: string, index: number, role: string, action: 'book' | 'cancel') => {
    if (!user) return alert("Please sign in first");
    try {
      if (action === 'book') await reserveRole(meetingId, index, user, role);
      else await cancelRole(meetingId, index, user, role);
    } catch (e) {
      alert(e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2"><Calendar/> Upcoming Meetings</h2>
      {meetings.length === 0 && <p className="text-slate-500">No meetings scheduled.</p>}
      
      {meetings.map((m) => (
        <div key={m.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-50 p-3 border-b font-bold text-slate-700">{m.date}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100">
            {m.slots.map((slot: any, idx: number) => (
              <div key={idx} className="bg-white p-3 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">{slot.role}</div>
                  <div className={`text-sm font-medium ${slot.userId ? 'text-slate-900' : 'text-slate-300'}`}>
                    {slot.userName || "Available"}
                  </div>
                </div>
                
                {slot.userId === user?.uid ? (
                  <button onClick={() => handleAction(m.id, idx, slot.role, 'cancel')} className="text-red-500 hover:bg-red-50 p-2 rounded">
                    <UserX size={18}/>
                  </button>
                ) : !slot.userId ? (
                  <button onClick={() => handleAction(m.id, idx, slot.role, 'book')} className="text-green-600 hover:bg-green-50 p-2 rounded">
                    <UserPlus size={18}/>
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
