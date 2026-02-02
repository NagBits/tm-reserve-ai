'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, Trophy, Medal } from 'lucide-react';

export default function UserStats({ onStatsCalculated }: { onStatsCalculated?: (stats: any) => void }) {
  const { user } = useAuth();
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [totalRoles, setTotalRoles] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      // 1. Fetch all meetings (In a real app, you might query a 'history' subcollection)
      const q = query(collection(db, "meetings"));
      const snapshot = await getDocs(q);
      
      const counts: Record<string, number> = {};
      let total = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.slots) {
          data.slots.forEach((slot: any) => {
            if (slot.userId === user.uid) {
              counts[slot.role] = (counts[slot.role] || 0) + 1;
              total++;
            }
          });
        }
      });

      setRoleCounts(counts);
      setTotalRoles(total);
      
      // Pass data up to parent for the AI Coach to use
      if (onStatsCalculated) onStatsCalculated(counts);
    };

    fetchHistory();
  }, [user]);

  // Sort roles by frequency (Most played first)
  const sortedRoles = Object.entries(roleCounts).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-purple-600" size={20}/> Role History
        </h3>
        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
          {totalRoles} Completed
        </span>
      </div>

      <div className="space-y-4">
        {sortedRoles.length > 0 ? (
          sortedRoles.map(([role, count]) => (
            <div key={role} className="group">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>{role}</span>
                <span>{count}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500 group-hover:bg-purple-500" 
                  style={{ width: `${Math.min((count / 5) * 100, 100)}%` }} // Scale: 5 roles = 100% bar
                ></div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Medal className="mx-auto mb-2 opacity-50" size={32}/>
            <p className="text-sm">No roles taken yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
