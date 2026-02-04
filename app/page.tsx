'use client';

import Link from 'next/link';
import Image from 'next/image'; 
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // <--- Import Auth Hook
import { ArrowRight, Star, Users, Calendar, CheckCircle2, Mic, Loader2 } from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth(); // <--- Get Auth State
  const router = useRouter();

  // --- SMART NAVIGATION HANDLER ---
  const handleReserveSpot = () => {
    if (loading) return; // Prevent action while checking status

    if (user) {
      // If already logged in, skip login screen
      router.push('/dashboard');
    } else {
      // If not logged in, go to login
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
            <Mic size={18} />
          </div>
          TM Reserve
        </div>
        <div className="flex items-center gap-6">
          {/* Top Login Button Logic */}
          {loading ? (
             <div className="w-20 h-8 bg-slate-200 rounded animate-pulse"></div>
          ) : user ? (
             <Link href="/dashboard" className="text-sm font-bold text-slate-900 hover:text-purple-600">
               Go to Dashboard
             </Link>
          ) : (
             <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-purple-600">
	     {/*Login */}
             </Link>
          )}

          <button 
            onClick={handleReserveSpot}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-purple-600 transition-all shadow-lg hover:shadow-purple-200"
          >
	  {/* Get Startedi */}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto mt-16 px-6 text-center">
        
        {/* LOGO */}
        <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100 relative overflow-hidden">
           <Image
             src="/tm.jpeg"
             alt="Club Logo"
             fill
             className="object-contain p-1"
           />
        </div>

        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-purple-100">
          <Star size={14} fill="currentColor" /> The Smart Way to Manage Meetings
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
          Effortless <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">AI based Role Signup</span> <br/> for Toastmaster
        </h1>
        
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop using messy spreadsheets. Empower your club members to self-book roles, track progress, and automate notifications instantly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          
          {/* --- MAIN ACTION BUTTON --- */}
          <button 
            onClick={handleReserveSpot}
            className="flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Reserve a spot"} <ArrowRight size={20} />
          </button>
          
        </div>

        {/* Floating Cards (Decorative) */}
        <div id="features" className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left opacity-90">
          <FeatureCard 
            icon={<Calendar className="text-blue-500" />}
            title="Smart Scheduling"
            desc="View upcoming agendas and lock in your slot instantly."
          />
          <FeatureCard 
            icon={<CheckCircle2 className="text-green-500" />}
            title="Instant Confirmation"
            desc="Receive email updates the moment you book a role."
          />
          <FeatureCard 
            icon={<Users className="text-purple-500" />}
            title="Fair Rotation"
            desc="AI ensures everyone gets a chance to speak."
          />
        </div>
      </main>

    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-purple-100 transition-colors">
      <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
