'use client';
import { useState } from 'react';

export default function MeetingCalendar({ onDateSelect }: { onDateSelect: (d: string) => void }) {
  const [selected, setSelected] = useState("2026-01-25");
  const dates = ["2026-01-25", "2026-02-01", "2026-02-08", "2026-02-15"];

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Upcoming Meetings</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {dates.map((d) => {
          const dateObj = new Date(d);
          const isActive = selected === d;
          return (
            <button
              key={d}
              onClick={() => { setSelected(d); onDateSelect(d); }}
              className={`flex-shrink-0 w-24 p-4 rounded-2xl border-2 transition-all ${
                isActive ? 'border-blue-600 bg-white shadow-md' : 'border-transparent bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <p className={`text-[10px] font-black uppercase ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className="text-2xl font-black text-slate-900">{dateObj.getDate()}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
