'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // <--- Don't forget this import
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot, collection, query, orderBy, where, Timestamp } from 'firebase/firestore';

// Components
import CalendarNav from '@/components/CalendarNav';
import MeetingList from '@/components/MeetingList';
import MemberGrid from '@/components/MemberGrid';
import UserStats from '@/components/UserStats';
import AICoach from '@/components/AICoach';
import SpeechCoach from '@/components/SpeechCoach';

// Icons
import { Home, LogOut, ShieldAlert, Activity, LayoutGrid, List } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [userStats, setUserStats] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // Default to list view as requested
  const listRef = useRef<HTMLDivElement>(null);

  // --- 🔒 CHECK IF USER IS VPE ---
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const vpeEmail = process.env.NEXT_PUBLIC_VPE_EMAIL;

  useEffect(() => {
    if (!user) return;

    const userEmail = user.email?.toLowerCase();
    const primaryVpeEmail = vpeEmail?.toLowerCase();

    // Check primary VPE
    if (userEmail === primaryVpeEmail) {
      setIsAdmin(true);
      return;
    }

    // Check additional admins
    const unsub = onSnapshot(doc(db, "settings", "admins"), (docSnap) => {
      if (docSnap.exists()) {
        const adminList = (docSnap.data().list || []) as string[];
        setIsAdmin(!!userEmail && adminList.includes(userEmail));
      } else {
        setIsAdmin(false);
      }
    }, (err) => {
      console.error("Admin check failed:", err);
      setIsAdmin(false);
    });

    return () => unsub();
  }, [user, vpeEmail]);

  // --- 📅 SET DEFAULT DATE TO NEXT MEETING ---
  useEffect(() => {
    if (selectedDate) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "meetings"),
      where("timestamp", ">=", Timestamp.fromDate(now)),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty && !selectedDate) {
        const nextMeeting = snapshot.docs[0].data().timestamp.toDate();
        setSelectedDate(nextMeeting);
      }
    });

    return () => unsubscribe();
  }, [selectedDate]);

  const isVPE = isAdmin === true || (!!user?.email && !!vpeEmail && user.email.toLowerCase() === vpeEmail.toLowerCase());

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
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 selection:bg-purple-500/20">
      <div className="max-w-[1400px] mx-auto p-4 md:p-10 lg:p-16">

        {/* --- PREMIUM ACCESSIBLE HEADER --- */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-10 mb-8 md:mb-16">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
            {/* Large, high-contrast Logo */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex items-center justify-center p-3 md:p-4 border border-slate-100 group hover:scale-105 transition-transform duration-500">
              <Image
                src="/tm.jpeg"
                alt="Toastmasters International Logo"
                fill
                sizes="(max-width: 768px) 96px, 128px"
                priority
                className="object-contain"
              />
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-1">
                Member <span className="text-purple-600">Dashboard</span>
              </h1>
              <p className="text-slate-400 md:text-slate-500 text-sm md:text-lg font-medium">
                Hello, <span className="font-black text-slate-900">{user?.displayName || 'Toastmaster'}</span>. Ready for your next meeting?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto flex-wrap justify-center">

            {isVPE && (
              <Link
                href="/vpe"
                className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-purple-600 text-white rounded-[1rem] md:rounded-[1.25rem] hover:bg-purple-700 transition-all duration-300 font-extrabold text-xs md:text-sm shadow-xl shadow-purple-200 hover:-translate-y-1 active:scale-95"
              >
                <ShieldAlert size={18} className="md:w-5 md:h-5" />
                <div className="flex flex-col items-start leading-tight">
                  <span>VPE Dashboard</span>
                  <span className="text-[8px] md:text-[10px] opacity-60 font-medium uppercase tracking-widest">VP Education Hub</span>
                </div>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-slate-900 text-white rounded-[1rem] md:rounded-[1.25rem] hover:bg-slate-800 transition-all duration-300 font-extrabold text-xs md:text-sm shadow-xl shadow-slate-200 hover:-translate-y-1 active:scale-95"
            >
              <LogOut size={18} className="md:w-5 md:h-5 text-slate-400" />
              <div className="flex flex-col items-start leading-tight">
                <span>Sign Out</span>
                <span className="text-[8px] md:text-[10px] opacity-50 font-medium uppercase tracking-widest">Secure Exit</span>
              </div>
            </button>
          </div>
        </header>

        {/* --- REGISTRATION ENGINE (Moved to top for mobile friendly access) --- */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 md:gap-12 items-start mb-12 md:mb-16">

          <aside className="xl:col-span-1 space-y-6 md:space-y-8 xl:sticky xl:top-10">
            <div className="p-1 md:p-2 bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <CalendarNav onSelectDate={handleDateSelect} selectedDate={selectedDate} />
            </div>

            {/* Quick Help Plate for Elderly Users */}
            <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <h4 className="font-black text-lg md:text-xl mb-4 flex items-center gap-2">
                <div className="w-1 md:w-1.5 h-6 bg-purple-500 rounded-full"></div>
                Quick Help
              </h4>
              <ul className="space-y-3 md:space-y-4">
                {[
                  { t: "Pick a Date", d: "Click a date on the calendar above to see roles." },
                  { t: "Sign Up", d: "Click the big black button to reserve your spot." },
                  { t: "Cancel", d: "Changed your mind? Click 'Cancel Duty' anytime." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 md:gap-4 group">
                    <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 flex items-center justify-center text-[8px] md:text-[10px] font-black shrink-0 group-hover:bg-purple-500 transition-colors">{i + 1}</span>
                    <div>
                      <p className="text-xs md:text-sm font-black text-white">{item.t}</p>
                      <p className="text-[10px] md:text-xs text-slate-400 font-medium leading-relaxed">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <main className="xl:col-span-3 scroll-mt-10" ref={listRef}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Activity size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Available Meetings</h2>
                  <p className="text-slate-400 md:text-slate-500 font-bold uppercase tracking-wider text-[8px] md:text-[10px]">Select a date to begin registration</p>
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner self-start md:self-center">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${viewMode === 'grid'
                    ? 'bg-white text-purple-600 shadow-md transform scale-105'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <LayoutGrid size={16} /> Grid View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${viewMode === 'list'
                    ? 'bg-white text-emerald-600 shadow-md transform scale-105'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <List size={16} /> List View
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <MemberGrid selectedDate={selectedDate} />
            ) : (
              <MeetingList selectedDate={selectedDate} />
            )}
          </main>
        </div>

        {/* --- INSIGHTS SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-4 min-h-[300px]">
            <UserStats onStatsCalculated={setUserStats} />
          </div>
          {/* AICoach disabled for now */}
          {/* <div className="lg:col-span-4 min-h-[300px]">
            <AICoach stats={userStats} />
          </div> */}
          <div className="lg:col-span-8 min-h-[300px]">
            <SpeechCoach />
          </div>
        </section>

      </div>
    </div>
  );
}
