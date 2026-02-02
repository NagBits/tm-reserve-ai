'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import MeetingCard from './MeetingCard';
import { Loader2, CalendarX, CalendarCheck } from 'lucide-react';

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
      where("timestamp", ">=", Timestamp.fromDate(now)),
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
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          {selectedDate ? (
             // If date selected: Show specific Date Header
             <>
               <CalendarCheck className="text-purple-600" size={24}/>
               Meeting: <span className="text-purple-700">{selectedDate.toLocaleDateString('en-GB', { dateStyle: 'full' })}</span>
             </>
          ) : (
             // If NO date selected: Show generic Header
             "Upcoming Meetings"
          )}
        </h2>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {filteredMeetings.length} Found
        </span>
      </div>

      {/* The List */}
      {filteredMeetings.length > 0 ? (
        filteredMeetings.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))
      ) : (
        // Empty State (Triggered if you pick a date with no meeting)
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <CalendarX className="text-slate-400" />
          </div>
          <h3 className="text-slate-900 font-medium">No meeting scheduled</h3>
          <p className="text-slate-500 text-sm">
            We couldn't find a session for {selectedDate?.toLocaleDateString()}.
          </p>
          <button 
             onClick={() => window.location.reload()} // Simple way to clear filter if stuck
             className="mt-4 text-purple-600 text-sm font-bold hover:underline"
          >
            Show all meetings
          </button>
        </div>
      )}
    </div>
  );
}
