'use client';
import { useState, useRef } from 'react'; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// Components
import CalendarNav from '@/components/CalendarNav';
import MeetingList from '@/components/MeetingList';

// Icons
import { Home, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (window.innerWidth < 1024) {
      listRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* --- REVISED HEADER WITH NAVIGATION --- */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-b border-slate-200 pb-6">
           <div>
             <h1 className="text-3xl font-black text-slate-900">Member Dashboard</h1>
             <p className="text-slate-500 text-sm">Welcome back, {user?.displayName || 'Member'}</p>
           </div>
           
           <div className="flex items-center gap-3">
             {/* Home Button */}
             <Link 
               href="/"
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-purple-600 transition-colors font-medium text-sm shadow-sm"
             >
               <Home size={16} /> Home
             </Link>

             {/* Sign Out Button */}
             <button
               onClick={handleSignOut}
               className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm shadow-sm"
             >
               <LogOut size={16} /> Sign Out
             </button>
           </div>
        </header>

        {/* --- SPLIT LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1 h-fit lg:sticky lg:top-4">
             <CalendarNav 
                onSelectDate={handleDateSelect} 
                selectedDate={selectedDate} 
             />
          </div>

          {/* Meeting List */}
          <div className="lg:col-span-3" ref={listRef}>
             <MeetingList selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
