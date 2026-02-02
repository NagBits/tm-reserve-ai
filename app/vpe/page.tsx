'use client';
import { seedSaturdays, wipeAllMeetings } from '@/lib/adminUtils';
import { useState } from 'react';
import { Trash2, PlusCircle, Check, Loader2 } from 'lucide-react';

export default function VPEConsole() {
  const [status, setStatus] = useState("");

  const runTask = async (task: Function, msg: string) => {
    if(!confirm("Are you sure? This affects live data.")) return;
    setStatus("Processing...");
    try {
      await task();
      setStatus(msg);
    } catch (e) {
      console.error(e);
      setStatus("Error.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-10 space-y-6">
      <h1 className="text-3xl font-bold mb-8">VPE Admin Console</h1>
      
      <div className="grid gap-4">
        <button 
          onClick={() => runTask(seedSaturdays, "Saturdays Created!")}
          className="bg-green-600 text-white p-6 rounded-xl text-left hover:bg-green-700 transition flex justify-between items-center"
        >
          <div>
            <div className="font-bold text-lg">Generate Next Month</div>
            <div className="text-green-100 text-sm">Creates 4 Saturday slots</div>
          </div>
          <PlusCircle size={24}/>
        </button>

        <button 
          onClick={() => runTask(wipeAllMeetings, "Database Wiped.")}
          className="bg-red-600 text-white p-6 rounded-xl text-left hover:bg-red-700 transition flex justify-between items-center"
        >
          <div>
            <div className="font-bold text-lg">Emergency Wipe</div>
            <div className="text-red-100 text-sm">Delete ALL meetings</div>
          </div>
          <Trash2 size={24}/>
        </button>
      </div>
      
      {status && (
        <div className="text-center font-bold text-slate-600 flex justify-center gap-2 animate-pulse">
           {status === 'Processing...' ? <Loader2 className="animate-spin"/> : <Check/>}
           {status}
        </div>
      )}
    </div>
  );
}
