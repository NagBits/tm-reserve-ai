'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import MeetingCard from './MeetingCard';
import { Loader2, CalendarX, CalendarCheck, Activity } from 'lucide-react';

interface MeetingListProps {
  selectedDate?: Date; // <--- This prop is key
}

export default function MeetingList({ selectedDate }: MeetingListProps) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Debugging: Check your browser console to see if the date is arriving
  console.log("MeetingList received selectedDate:", selectedDate);

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Fetch ALL future meetings first, then we filter in memory
    const q = query(
      collection(db, "meetings"),
      //where("timestamp", ">=", Timestamp.fromDate(now)),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetingData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMeetings(meetingData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- FILTERING LOGIC ---
  const filteredMeetings = meetings.filter(meeting => {
    // If no date is selected in the calendar, show EVERYTHING
    if (!selectedDate) return true;

    // If a date IS selected, compare strictly by date string
    const mDate = meeting.timestamp.toDate().toDateString(); // e.g., "Sat Mar 14 2026"
    const sDate = selectedDate.toDateString();               // e.g., "Sat Mar 14 2026"

    return mDate === sDate;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-purple-600" size={48} strokeWidth={1.5} />
        <span className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Syncing Calendar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Premium Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-10 border-b-2 border-slate-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-center border border-slate-100 shrink-0">
            {selectedDate ? <CalendarCheck className="text-purple-600" size={32} /> : <Activity className="text-emerald-500" size={32} />}
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
              {selectedDate ? (
                <>
                  <span className="text-slate-400 font-medium italic mr-3">Session for:</span>
                  {selectedDate.toLocaleDateString('en-GB', { dateStyle: 'long' })}
                </>
              ) : (
                "Upcoming Sessions"
              )}
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1 italic">
              {filteredMeetings.length} Verified Meeting Records
            </p>
          </div>
        </div>
      </div>

      {/* The List */}
      <div className="space-y-10">
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))
        ) : (
          // Helpful Empty State for Elderly Users
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner">
            <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm">
              <CalendarX className="text-slate-300" size={48} />
            </div>
            <h3 className="text-slate-900 font-black text-2xl uppercase tracking-tighter italic">Schedule Unavailable</h3>
            <p className="text-slate-500 text-lg font-medium mt-3 max-w-sm mx-auto leading-relaxed">
              We couldn't find any sessions for <span className="text-purple-600 font-black underline">{selectedDate?.toLocaleDateString()}</span>.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-purple-600 transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95"
            >
              Show All Sessions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
