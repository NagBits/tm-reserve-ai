'use client';

// 1. React & Next.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 2. Firebase & Auth
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext'; // <--- IMPORT THIS
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';

// 3. Admin Utilities
import { seedSaturdays, wipeAllMeetings, openNextMonth } from '@/lib/adminUtils';

// 4. Components
import VPEGrid from '@/components/VPEGrid';

// 5. Icons
import { 
  LayoutDashboard, CalendarDays, Users, AlertCircle, 
  PlusCircle, Trash2, Check, Loader2, RefreshCw, 
  ArrowLeft, Home, LogOut, ShieldAlert
} from 'lucide-react';

export default function VPEPage() {
  const { user, loading: authLoading } = useAuth(); // <--- Get current user
  const router = useRouter();
  
  // State
  const [status, setStatus] = useState(""); 
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({ 
    total: 0, 
    openSlots: 0, 
    nextDate: '-' 
  });

  // --- 🔒 AUTHENTICATION GATEKEEPER 🔒 ---
  useEffect(() => {
    // 1. Wait for auth to initialize
    if (authLoading) return;

    // 2. If not logged in, kick to login page
    if (!user) {
      router.push('/login');
      return;
    }

    // 3. If logged in but NOT the VPE, kick to Member Dashboard
    // Make sure NEXT_PUBLIC_VPE_EMAIL is set in your .env.local file!
    const vpeEmail = process.env.NEXT_PUBLIC_VPE_EMAIL;
    
    if (user.email !== vpeEmail) {
      console.warn(`Access Denied. User ${user.email} is not VPE (${vpeEmail})`);
      router.push('/dashboard'); 
    } else {
      // Only fetch data if we are authorized
      fetchStats();
    }
  }, [user, authLoading, router]);


  // --- STATS LOGIC ---
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "meetings"),
        where("timestamp", ">=", Timestamp.fromDate(now)),
        orderBy("timestamp", "asc")
      );

      const snapshot = await getDocs(q);
      const totalMeetings = snapshot.size;
      
      let openSlotsCount = 0;
      let nextMeetingDate = '-';

      if (!snapshot.empty) {
        const firstDoc = snapshot.docs[0].data();
        if (firstDoc.timestamp) {
          nextMeetingDate = firstDoc.timestamp.toDate().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short'
          });
        }

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.slots) {
            const empty = data.slots.filter((s: any) => !s.userId).length;
            openSlotsCount += empty;
          }
        });
      }

      setStats({
        total: totalMeetings,
        openSlots: openSlotsCount,
        nextDate: nextMeetingDate
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // --- ACTION RUNNER ---
  const runTask = async (task: () => Promise<any>, successMessage: string) => {
    if (!confirm("Are you sure you want to proceed with this administrative action?")) return;
    
    setStatus("Processing...");
    try {
      await task();
      setStatus(`✅ ${successMessage}`);
      fetchStats(); 
      setTimeout(() => setStatus(""), 4000);
    } catch (e: any) {
      console.error(e);
      setStatus(`❌ Error: ${e.message}`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  // --- LOADING SCREEN ---
  // If we are checking auth, show a full screen loader so they see nothing.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-purple-600" size={48} />
          <p className="text-slate-500 font-medium">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  // If user is loaded but not authorized (and useEffect hasn't redirected yet), hide content
  if (!user || user.email !== process.env.NEXT_PUBLIC_VPE_EMAIL) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <Link 
              href="/" 
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Back to Landing Page"
            >
              <ArrowLeft size={20} />
            </Link>

            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="bg-purple-600 p-1 rounded">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              VPE Portal
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-xs text-slate-400 font-mono hidden md:block flex items-center gap-1">
               <ShieldAlert size={12}/> ADMIN MODE ACTIVE
             </div>
             
             <Link href="/dashboard" className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full transition-colors">
               <Home size={14}/> Member App
             </Link>

             <button 
               onClick={handleSignOut}
               className="text-xs font-bold text-red-200 hover:text-white hover:bg-red-900 flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-red-800"
             >
               <LogOut size={14}/> Sign Out
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* --- STATUS MESSAGE --- */}
        {status && (
          <div className={`p-4 rounded-xl font-bold text-center animate-pulse ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {status}
          </div>
        )}

        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<CalendarDays className="text-blue-600" />}
            label="Upcoming Meetings"
            value={stats.total}
            loading={loadingStats}
          />
          <StatCard 
            icon={<Users className="text-purple-600" />}
            label="Open Roles"
            value={stats.openSlots}
            loading={loadingStats}
          />
          <StatCard 
            icon={<AlertCircle className="text-orange-600" />}
            label="Next Session"
            value={stats.nextDate}
            loading={loadingStats}
          />
        </div>

        {/* --- ADMIN TOOLBAR --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <RefreshCw size={18} /> Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            
            <button 
              onClick={() => runTask(seedSaturdays, "Current month generated!")}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-bold transition-colors"
            >
              <PlusCircle size={18} /> Seed Current Month
            </button>

            <button 
              onClick={() => runTask(openNextMonth, "Next month opened!")}
              className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg font-bold transition-colors"
            >
              <Check size={18} /> Open Next Month
            </button>

            <div className="flex-1"></div>

            <button 
              onClick={() => runTask(wipeAllMeetings, "All data wiped.")}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold transition-colors border border-red-100"
            >
              <Trash2 size={18} /> Reset Database
            </button>
          </div>
        </div>

        {/* --- MAIN MANAGEMENT GRID --- */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Manage Schedule</h2>
          <VPEGrid />
        </div>

      </div>
    </div>
  );
}

// --- SUBCOMPONENT: SIMPLE STAT CARD ---
function StatCard({ icon, label, value, loading }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
        {loading ? (
          <Loader2 className="animate-spin text-slate-300 mt-1" size={24} />
        ) : (
          <p className="text-2xl font-black text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
}
