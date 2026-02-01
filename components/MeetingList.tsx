// components/MeetingList.tsx
'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Calendar, UserPlus } from 'lucide-react';

export default function MeetingList() {
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    // 1. Query for Published meetings only
    // 2. Order by timestamp (requires a Firestore index)
    const q = query(
      collection(db, "meetings"),
      where("isPublished", "==", true),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMeetings(meetingsData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      {meetings.length === 0 && <p className="text-slate-400">No upcoming Saturdays published yet.</p>}
      
      {meetings.map((meeting) => (
        <div key={meeting.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
            <Calendar size={18} className="text-purple-600" />
            <h3 className="font-bold text-slate-800">{meeting.date}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200">
            {meeting.slots.map((slot: any, index: number) => (
              <div key={index} className="bg-white p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{slot.role}</p>
                  <p className="font-medium text-slate-700">
                    {slot.userName || "Vacant"}
                  </p>
                </div>
                {!slot.userId && (
                  <button className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors">
                    <UserPlus size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
