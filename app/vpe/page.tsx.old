'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { ShieldCheck, UserMinus, UserPlus, Calendar } from 'lucide-react';
import Auth from '@/components/Auth';

export default function VPEDashboard() {
  const [slots, setSlots] = useState<any[]>([]);
  const VPE_EMAIL = process.env.NEXT_PUBLIC_VPE_EMAIL; // MUST match your email

  useEffect(() => {
    // Fetch all slots ordered by date then role order
    const q = query(collection(db, "slots"), orderBy("date", "asc"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleOverride = async (slotId: string, currentTaken: boolean) => {
    const ref = doc(db, "slots", slotId);
    if (currentTaken) {
      if (confirm("Force clear this reservation?")) {
        await updateDoc(ref, { userId: null, userName: null, taken: false });
      }
    } else {
      const name = prompt("Enter Member Name to manually assign:");
      if (name) {
        await updateDoc(ref, { userId: "VPE_ASSIGNED", userName: name, taken: true });
      }
    }
  };

  // Guard Clause: Only show if logged in user is VPE
  if (auth.currentUser?.email !== VPE_EMAIL) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
        <ShieldCheck size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-slate-500">You must be logged in as the VPE to view this dashboard.</p>
        <a href="/" className="mt-4 text-blue-600 font-bold underline">Go back to Home</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Auth />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">VPE Admin Console</h1>
            <p className="text-slate-500">Manual overrides and meeting oversight.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4 text-xs uppercase tracking-widest font-bold">Meeting Date</th>
                <th className="p-4 text-xs uppercase tracking-widest font-bold">Role</th>
                <th className="p-4 text-xs uppercase tracking-widest font-bold">Member</th>
                <th className="p-4 text-xs uppercase tracking-widest font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.map((slot) => (
                <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" /> {slot.date}
                  </td>
                  <td className="p-4 font-bold text-slate-700">{slot.roleName}</td>
                  <td className="p-4">
                    {slot.taken ? (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                        {slot.userName}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleOverride(slot.id, slot.taken)}
                      className={`p-2 rounded-lg transition-all ${
                        slot.taken ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {slot.taken ? <UserMinus size={18} /> : <UserPlus size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
