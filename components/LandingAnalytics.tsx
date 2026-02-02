'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Trophy, Mic2, Star, TrendingUp } from 'lucide-react';

export default function LandingAnalytics() {
  const [stats, setStats] = useState({
    tmodOfTheMonth: { name: "N/A", count: 0 },
    topSpeaker: { name: "N/A", count: 0 },
    totalRolesTaken: 0,
    mostActiveMember: { name: "N/A", count: 0 }
  });

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 1. Fetch all meetings (We need history for stats)
    // Optimization: In a real app, you might limit this to the last 6 months
    const q = query(collection(db, "meetings"), where("isPublished", "==", true));
    const snap = await getDocs(q);

    const tmodCounts: Record<string, number> = {};
    const speakerCounts: Record<string, number> = {};
    const totalRoleCounts: Record<string, number> = {};
    let globalRoleCount = 0;

    snap.docs.forEach(doc => {
      const data = doc.data();
      const meetingDate = data.timestamp.toDate();
      const isThisMonth = meetingDate >= startOfMonth;

      data.slots.forEach((slot: any) => {
        if (!slot.userId) return; // Skip empty slots

        // Global Counter
        globalRoleCount++;
        
        // Track Most Active Member (All Time)
        totalRoleCounts[slot.userName] = (totalRoleCounts[slot.userName] || 0) + 1;

        // Track TMOD (Only This Month)
        if (isThisMonth && slot.role === "TMOD") {
          tmodCounts[slot.userName] = (tmodCounts[slot.userName] || 0) + 1;
        }

        // Track Speakers (All Time or This Month)
        if (slot.role.startsWith("Speaker")) {
          speakerCounts[slot.userName] = (speakerCounts[slot.userName] || 0) + 1;
        }
      });
    });

    // Helper to find the max key in an object
    const findTop = (obj: Record<string, number>) => {
      const sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1] } : { name: "-", count: 0 };
    };

    setStats({
      tmodOfTheMonth: findTop(tmodCounts),
      topSpeaker: findTop(speakerCounts),
      totalRolesTaken: globalRoleCount,
      mostActiveMember: findTop(totalRoleCounts)
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-6xl mx-auto mt-12">
      {/* TMOD of the Month */}
      <StatCard 
        icon={<Star className="text-yellow-500" />}
        title="TMOD of the Month"
        value={stats.tmodOfTheMonth.name}
        sub={`Led ${stats.tmodOfTheMonth.count} sessions`}
        color="bg-yellow-50 border-yellow-100"
      />
      
      {/* Top Speaker */}
      <StatCard 
        icon={<Mic2 className="text-purple-600" />}
        title="Top Speaker"
        value={stats.topSpeaker.name}
        sub={`Delivered ${stats.topSpeaker.count} speeches`}
        color="bg-purple-50 border-purple-100"
      />

      {/* Most Active */}
      <StatCard 
        icon={<Trophy className="text-orange-500" />}
        title="Club MVP"
        value={stats.mostActiveMember.name}
        sub={`${stats.mostActiveMember.count} total roles taken`}
        color="bg-orange-50 border-orange-100"
      />

      {/* Total Roles */}
      <StatCard 
        icon={<TrendingUp className="text-blue-600" />}
        title="Community Impact"
        value={stats.totalRolesTaken.toString()}
        sub="Total roles completed"
        color="bg-blue-50 border-blue-100"
      />
    </div>
  );
}

function StatCard({ icon, title, value, sub, color }: any) {
  return (
    <div className={`p-4 rounded-xl border ${color} shadow-sm flex flex-col items-center text-center`}>
      <div className="mb-2 p-2 bg-white rounded-full shadow-sm">{icon}</div>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
      <p className="text-lg font-black text-slate-900 truncate w-full px-2" title={value}>{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}
