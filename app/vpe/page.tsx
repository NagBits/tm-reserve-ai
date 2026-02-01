// app/vpe/page.tsx
'use client';
import { seedSaturdays } from '@/lib/initializeMeetings';
import { useState } from 'react';
import { PlayCircle, Loader2, CheckCircle } from 'lucide-react';

export default function VPEPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleInit = async () => {
    if (!confirm("This will create slots for the next 4 Saturdays. Continue?")) return;
    
    setStatus('loading');
    try {
      await seedSaturdays();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      alert("Initialization failed. Check console for details.");
      setStatus('idle');
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2">System Initializer</h1>
        <p className="text-slate-400 mb-6 text-sm">
          Use this to generate the meeting structure for the next month. 
          Each Saturday will include all standard Toastmasters roles.
        </p>
        
        <button 
          onClick={handleInit}
          disabled={status !== 'idle'}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 className="animate-spin" /> : 
           status === 'success' ? <CheckCircle /> : <PlayCircle />}
          {status === 'loading' ? 'Writing to Firestore...' : 
           status === 'success' ? 'Database Seeded!' : 'Run Initialization'}
        </button>
      </div>
    </div>
  );
}
