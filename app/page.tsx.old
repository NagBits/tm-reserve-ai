// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from '@/components/Auth';
import SlotList from '@/components/SlotList';
import FeedbackEngine from '@/components/FeedbackEngine';
import MeetingCalendar from '@/components/MeetingCalendar';
import { LayoutDashboard, Mic2, Calendar as CalendarIcon, Trophy } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Default to the first meeting date in your sequence
  const [activeDate, setActiveDate] = useState("2026-01-25");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Syncing with Toastmasters Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Navigation Header */}
      <Auth />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero Section */}
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Club <span className="text-blue-600">Dashboard</span>
          </h1>
          <p className="mt-2 text-slate-600">
            Manage your speaking journey and club roles in one place.
          </p>
        </header>

        {!user ? (
          <div className="bg-white p-16 rounded-[2rem] shadow-sm border border-slate-200 text-center">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Ready to speak?</h2>
            <p className="text-slate-500 mt-3 mb-8 max-w-sm mx-auto">
              Sign in with your Google account to view the meeting schedule and reserve your next role.
            </p>
            <div className="inline-block scale-125">
               <Auth /> {/* This shows the login button inside the card */}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: Calendar & Slots (8 Columns) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Meeting Selector Component */}
              <MeetingCalendar onDateSelect={setActiveDate} />

              <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <LayoutDashboard className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Meeting Roles</h2>
                      <p className="text-sm text-slate-500">Showing slots for {new Date(activeDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <SlotList selectedDate={activeDate} />
              </section>
            </div>

            {/* RIGHT: AI Feedback & Stats (4 Columns) */}
            <div className="lg:col-span-4 space-y-6">
              {/* AI Evaluation Panel */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Mic2 className="text-purple-600" size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">AI Grammarian</h2>
                </div>
                <FeedbackEngine />
              </section>

              {/* Progress Summary */}
              <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
                <Trophy className="absolute -right-4 -bottom-4 text-white/10 h-32 w-32 rotate-12" />
                <h3 className="font-bold text-xl mb-1">Your Growth</h3>
                <p className="text-slate-400 text-sm mb-6">Pathways Level 2 Progress</p>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Speech Goals</span>
                    <span>75%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full w-[75%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Great job! Your AI confidence score has increased by 12% over the last 3 meetings.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
