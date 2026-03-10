'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 2. Firebase & Auth
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where, Timestamp, orderBy, doc, onSnapshot, setDoc } from 'firebase/firestore';

// 3. Admin Utilities
import { seedSaturdays, openNextMonth } from '@/lib/adminUtils';

// 4. Components
import VPEGrid from '@/components/VPEGrid';

// 5. Icons
import {
  CalendarDays, Users, AlertCircle,
  PlusCircle, Check, Loader2, RefreshCw, X,
  ArrowLeft, Home, LogOut, ShieldAlert, Zap,
  Settings, ChevronRight, Activity, Database
} from 'lucide-react';

export default function VPEPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'info' | '' }>({ msg: '', type: '' });
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    openSlots: 0,
    nextDate: '-'
  });

  const vpeEmail = process.env.NEXT_PUBLIC_VPE_EMAIL;
  const [admins, setAdmins] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // --- 🔒 AUTHENTICATION GATEKEEPER 🔒 ---
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Optimization: If primary VPE, grant access immediately
    if (user.email?.toLowerCase() === vpeEmail?.toLowerCase()) {
      setIsAdmin(true);
      fetchStats();
    }

    // Fetch additional admins
    const unsub = onSnapshot(doc(db, "settings", "admins"), (docSnap) => {
      const adminList = docSnap.exists() ? (docSnap.data().list || []) as string[] : [];
      setAdmins(adminList);

      const userEmail = user.email?.toLowerCase();
      const primaryVpeEmail = vpeEmail?.toLowerCase();
      const isUserAdmin = (!!userEmail && !!primaryVpeEmail && userEmail === primaryVpeEmail) || (!!userEmail && adminList.includes(userEmail));
      setIsAdmin(isUserAdmin);

      if (!isUserAdmin) {
        router.push('/dashboard');
      } else if (userEmail !== primaryVpeEmail) {
        fetchStats();
      }
    }, (error) => {
      console.error("Admins fetch error:", error);
      // Fallback: strictly check primary VPE if list fetch fails
      const userEmail = user.email?.toLowerCase();
      const primaryVpeEmail = vpeEmail?.toLowerCase();
      const isUserAdmin = !!userEmail && !!primaryVpeEmail && userEmail === primaryVpeEmail;
      setIsAdmin(isUserAdmin);
      if (!isUserAdmin) router.push('/dashboard');
      else fetchStats();
    });

    return () => unsub();
  }, [user, authLoading, router, vpeEmail]);

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

    setStatus({ msg: "Processing request...", type: 'info' });
    try {
      await task();
      setStatus({ msg: successMessage, type: 'success' });
      fetchStats();
      setTimeout(() => setStatus({ msg: '', type: '' }), 4000);
    } catch (e: any) {
      console.error(e);
      setStatus({ msg: `Error: ${e.message}`, type: 'error' });
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 animate-pulse"></div>
            <Loader2 className="animate-spin text-purple-500 relative z-10" size={64} strokeWidth={1.5} />
          </div>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Accessing Command Center</p>
        </div>
      </div>
    );
  }

  if (!user || isAdmin === false) return null;
  if (isAdmin === null) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-purple-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500/30">

      {/* --- PREMIUM TOP NAVIGATION --- */}
      <nav className="glass-dark sticky top-0 z-50 border-b border-slate-800/50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">

          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="group p-2.5 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all duration-300"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </Link>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-black text-xl tracking-tighter uppercase italic">
                <span className="text-purple-500"><Database size={24} /></span>
                VPE <span className="text-slate-500">Terminal</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                <ShieldAlert size={10} className="text-amber-500" /> Administrative Environment
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-8 mr-8">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">System Status</span>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Operational
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
            </div>

            <button
              onClick={handleSignOut}
              className="group flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-tighter transition-all duration-300 border border-red-500/20"
            >
              <LogOut size={14} className="group-hover:translate-x-1 transition-transform" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-10">

        {/* --- DYNAMIC ALERT OVERLAY --- */}
        {status.msg && (
          <div className={`fixed bottom-10 right-10 z-[100] p-5 rounded-3xl border shadow-2xl animate-float backdrop-blur-xl flex items-center gap-4 min-w-[300px]
            ${status.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-200' :
              status.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' :
                'bg-blue-950/80 border-blue-500/50 text-blue-200'}`}>
            <div className={`p-2 rounded-xl transition-colors ${status.type === 'error' ? 'bg-red-500' : status.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
              {status.type === 'error' ? <AlertCircle size={20} /> : <Zap size={20} />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Notification</span>
              <span className="text-sm font-bold">{status.msg}</span>
            </div>
          </div>
        )}

        {/* --- COMMAND CENTER STATS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatPanel
            icon={<CalendarDays className="text-blue-400" />}
            label="Active Cycle"
            value={`${stats.total} Meetings`}
            subtext="Upcoming scheduled sessions"
            loading={loadingStats}
          />
          <StatPanel
            icon={<Users className="text-purple-400" />}
            label="Open Slots"
            value={stats.openSlots}
            subtext="Roles requiring assignment"
            loading={loadingStats}
            highlight={stats.openSlots > 5}
          />
          <StatPanel
            icon={<Activity className="text-amber-400" />}
            label="Nearest Session"
            value={stats.nextDate}
            subtext="Countdown initiated"
            loading={loadingStats}
          />
          <div className="glass-dark p-6 rounded-[2rem] border-slate-800/50 flex flex-col justify-between group hover:border-purple-500/50 transition-all duration-500">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 group-hover:bg-purple-500/10 transition-colors">
                <Settings className="text-slate-400 group-hover:text-purple-400" size={24} />
              </div>
              <Zap size={16} className="text-purple-500 animate-pulse" />
            </div>
            <div className="mt-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">VPE Meta</h3>
              <p className="text-lg font-black">{user.displayName?.split(' ')[0] || 'Admin'}</p>
              <div className="w-full bg-slate-900 h-1 mt-3 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full w-[70%]" />
              </div>
            </div>
          </div>
        </section>

        {/* --- QUICK ACTION COMMANDS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          <section className="glass-dark p-8 rounded-[2.5rem] border-slate-800/50 relative overflow-hidden lg:col-span-2">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Settings size={200} className="animate-[spin_20s_linear_infinite]" />
            </div>

            <div className="relative z-10 flex flex-col gap-8 h-full justify-center">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">Deployment <span className="text-purple-500">Hub</span></h2>
                  <div className="h-px w-20 bg-slate-800"></div>
                </div>
                <p className="text-slate-500 text-sm max-w-md font-medium">Execute administrative routines to initialize or extend the club's meeting schedule.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <ActionButton
                  onClick={() => runTask(seedSaturdays, "Current cycle initialized")}
                  icon={<PlusCircle size={20} />}
                  label="Start New Term"
                  variant="slate"
                />
                <ActionButton
                  onClick={() => runTask(openNextMonth, "Schedule extended successfully")}
                  icon={<Check size={20} />}
                  label="Add More Meetings"
                  variant="purple"
                />
                <div className="w-px h-12 bg-slate-800 mx-2 hidden lg:block" />
              </div>
            </div>
          </section>

          {/* --- ROLE ARCHITECTURE MANAGEMENT --- */}
          <div className="flex flex-col gap-10">
            <RoleManager />
            <AdminManager />
          </div>

        </div>

        {/* --- INFORMATION GRID --- */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/40">
                <Activity className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Master <span className="text-slate-500">Grid</span></h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Live Role Management System</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-full border border-slate-800">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Sync Active</span>
            </div>
          </div>

          <div className="glass-dark p-2 rounded-[2.5rem] border-slate-800 shadow-2xl">
            <VPEGrid />
          </div>
        </section>

      </main>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function RoleManager() {
  const [roles, setRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(true);

  const rolesRef = doc(db, "settings", "roles");

  useEffect(() => {
    const unsub = onSnapshot(rolesRef, (docSnap) => {
      if (docSnap.exists()) {
        const list = (docSnap.data().list || []) as string[];
        // Filter for unique roles to prevent key errors
        setRoles(list.filter((role, idx) => list.indexOf(role) === idx));
      }
      setLoading(false);
    }, (error) => {
      console.error("Roles manager fetch error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addRole = async () => {
    if (!newRole.trim()) return;
    if (roles.includes(newRole.trim())) {
      alert("Role already exists");
      return;
    }
    const updated = [...roles, newRole.trim()];
    await setDoc(rolesRef, { list: updated });
    setNewRole("");
  };

  const removeRole = async (roleToRemove: string) => {
    if (!confirm(`Are you sure you want to remove the role: ${roleToRemove}?`)) return;
    const updated = roles.filter(r => r !== roleToRemove);
    await setDoc(rolesRef, { list: updated });
  };

  return (
    <section className="glass-dark p-8 rounded-[2.5rem] border-slate-800/50 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-black uppercase tracking-tighter italic">Role <span className="text-purple-500">Architecture</span></h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Schema Management</span>
        </div>
        <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
          <Database size={16} className="text-purple-500" />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pr-2 mb-6 max-h-[200px]">
        <div className="flex flex-wrap gap-2">
          {roles.map(role => (
            <div key={role} className="group relative flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-400 hover:border-purple-500/50 transition-colors">
              {role}
              <button
                onClick={() => removeRole(role)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-125 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <input
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="New Role Name..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs font-bold outline-none focus:border-purple-500 transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && addRole()}
        />
        <button
          onClick={addRole}
          className="p-3 bg-purple-600 rounded-2xl text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/40"
        >
          <PlusCircle size={20} />
        </button>
      </div>
    </section>
  );
}

function AdminManager() {
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [loading, setLoading] = useState(true);

  const adminsRef = doc(db, "settings", "admins");

  useEffect(() => {
    const unsub = onSnapshot(adminsRef, (docSnap) => {
      if (docSnap.exists()) {
        setAdmins(docSnap.data().list || []);
      }
      setLoading(false);
    }, (error) => {
      console.error("Admins manager fetch error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addAdmin = async () => {
    if (!newAdmin.trim()) return;
    if (admins.includes(newAdmin.trim().toLowerCase())) {
      alert("Admin already exists");
      return;
    }
    const updated = [...admins, newAdmin.trim().toLowerCase()];
    await setDoc(adminsRef, { list: updated });
    setNewAdmin("");
  };

  const removeAdmin = async (adminToRemove: string) => {
    if (!confirm(`Are you sure you want to remove admin access for: ${adminToRemove}?`)) return;
    const updated = admins.filter(a => a !== adminToRemove);
    await setDoc(adminsRef, { list: updated });
  };

  return (
    <section className="glass-dark p-8 rounded-[2.5rem] border-slate-800/50 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-black uppercase tracking-tighter italic">Admin <span className="text-purple-500">Access</span></h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manage Privileged Users</span>
        </div>
        <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
          <Users size={16} className="text-purple-500" />
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pr-2 mb-6 max-h-[200px]">
        <div className="flex flex-wrap gap-2">
          {admins.map(admin => (
            <div key={admin} className="group relative flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black lowercase tracking-wider text-slate-400 hover:border-purple-500/50 transition-colors">
              {admin}
              <button
                onClick={() => removeAdmin(admin)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-125 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {admins.length === 0 && (
            <span className="text-slate-600 text-xs italic">No additional admins assigned</span>
          )}
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <input
          value={newAdmin}
          onChange={(e) => setNewAdmin(e.target.value)}
          placeholder="New Admin Email..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs font-bold outline-none focus:border-purple-500 transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && addAdmin()}
        />
        <button
          onClick={addAdmin}
          className="p-3 bg-purple-600 rounded-2xl text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/40"
        >
          <PlusCircle size={20} />
        </button>
      </div>
    </section>
  );
}

// --- SUBCOMPONENTS ---

function StatPanel({ icon, label, value, subtext, loading, highlight }: any) {
  return (
    <div className={`glass-dark p-8 rounded-[2rem] border-slate-800/50 group transition-all duration-500 hover:-translate-y-1 hover:border-slate-700
      ${highlight ? 'shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        <ChevronRight size={16} className="text-slate-700" />
      </div>
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{label}</h3>
        {loading ? (
          <div className="h-8 w-24 bg-slate-900 rounded animate-pulse"></div>
        ) : (
          <p className="text-3xl font-black text-slate-100 tracking-tighter">{value}</p>
        )}
        <p className="text-[10px] font-bold text-slate-600 mt-2 flex items-center gap-1">
          <Zap size={10} className="text-purple-500" /> {subtext}
        </p>
      </div>
    </div>
  );
}

function ActionButton({ onClick, icon, label, variant }: any) {
  const styles = {
    slate: "bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-800",
    purple: "bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-950/40"
  }[variant as 'slate' | 'purple'];

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-8 py-4 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 ${styles}`}
    >
      {icon} {label}
    </button>
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
