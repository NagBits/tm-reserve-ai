'use client';
import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Load default styles
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Calendar as CalendarIcon, Settings, Info } from 'lucide-react';

interface CalendarNavProps {
  onSelectDate: (date: Date) => void;
  selectedDate?: Date;
  isVPE?: boolean; // If true, shows the "Change Day" settings
}

export default function CalendarNav({ onSelectDate, selectedDate, isVPE }: CalendarNavProps) {
  const [meetingDates, setMeetingDates] = useState<Date[]>([]);
  const [clubDayName, setClubDayName] = useState("Saturday");

  // 1. Fetch real meeting dates to highlight them
  useEffect(() => {
    const q = query(collection(db, "meetings"));
    const unsub = onSnapshot(q, (snap) => {
      const dates = snap.docs.map(doc => doc.data().timestamp.toDate());
      setMeetingDates(dates);
    });
    return () => unsub();
  }, []);

  // 2. Styling Modifiers
  const modifiers = {
    hasMeeting: meetingDates, // Matches actual meeting dates
  };

  const modifiersStyles = {
    hasMeeting: { 
      fontWeight: 'bold', 
      color: '#7c3aed', // Purple text
      border: '2px solid #ddd6fe', // Purple border
      borderRadius: '50%'
    }
  };

  // VPE Feature: Change the "Default Day" for the seed script
  const changeClubDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const input = prompt("Enter new meeting day (0=Sun, 1=Mon... 6=Sat):", "6");
    if (input) {
      const idx = parseInt(input);
      if(idx >= 0 && idx <= 6) {
        setClubDayName(days[idx]);
        alert(`Seed script configuration updated to: ${days[idx]}\n(Note: In a real app, this would save to a Config document in Firebase.)`);
      } else {
        alert("Invalid day index.");
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
          <CalendarIcon size={16} /> Schedule
        </h3>
        {isVPE && (
          <button 
            onClick={changeClubDay}
            className="text-xs text-slate-400 hover:text-purple-600 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200"
            title="Configure Club Meeting Day"
          >
            <Settings size={12}/> Config
          </button>
        )}
      </div>

      {/* The Calendar */}
      <div className="flex justify-center text-sm">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(day) => day && onSelectDate(day)}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
        />
      </div>

      {/* Footer Info */}
      <div className="mt-2 space-y-2">
         {selectedDate ? (
            <p className="text-xs text-center text-slate-500 bg-slate-50 p-2 rounded">
              Selected: <span className="font-bold text-purple-700">{format(selectedDate, 'MMM do')}</span>
            </p>
          ) : (
            <p className="text-xs text-center text-slate-400">Pick a highlighted date.</p>
          )}

          {isVPE && (
            <div className="flex items-start gap-2 text-[10px] text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
               <Info size={14} className="mt-px flex-shrink-0"/>
               <span>
                 Generating new slots will currently default to <strong>{clubDayName}s</strong>.
               </span>
            </div>
          )}
      </div>
    </div>
  );
}
