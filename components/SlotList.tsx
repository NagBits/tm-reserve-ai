'use client';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Unlock, ShieldCheck, User } from 'lucide-react';

export default function SlotList({ selectedDate }: { selectedDate: string }) {
  const [slots, setSlots] = useState<any[]>([]);
  const VPE_EMAIL = process.env.NEXT_PUBLIC_VPE_EMAIL; 

  useEffect(() => {
    const q = query(collection(db, "slots"), where("date", "==", selectedDate), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedDate]);

  const handleAction = async (slot: any) => {
    const user = auth.currentUser;
    if (!user) return;
    const isVPE = user.email === VPE_EMAIL;
    const isOwner = slot.userId === user.uid;
    const ref = doc(db, "slots", slot.id);

    if (slot.taken) {
      if (isOwner || isVPE) {
        if (confirm("Release this role?")) {
          await updateDoc(ref, { userId: null, userName: null, taken: false });
        }
      }
    } else {
      await updateDoc(ref, { userId: user.uid, userName: user.displayName, taken: true });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {slots.map((slot) => {
        const isOwner = auth.currentUser?.uid === slot.userId;
        const isVPE = auth.currentUser?.email === VPE_EMAIL;
        
        return (
          <div key={slot.id} className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
            isOwner ? 'bg-blue-600 border-blue-600 shadow-blue-200 shadow-lg' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${isOwner ? 'bg-blue-500' : 'bg-slate-50'}`}>
                {slot.taken ? 
                  <CheckCircle2 size={20} className={isOwner ? "text-white" : "text-blue-600"} /> : 
                  <Circle size={20} className="text-slate-300" />
                }
              </div>
              <button
                onClick={() => handleAction(slot)}
                disabled={slot.taken && !isOwner && !isVPE}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                  !slot.taken ? 'bg-blue-600 text-white hover:bg-blue-700' :
                  (isOwner || isVPE) ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                  'bg-slate-100 text-slate-400'
                }`}
              >
                {!slot.taken ? 'Reserve' : (isOwner || isVPE) ? 'Release' : 'Taken'}
              </button>
            </div>
            
            <h3 className={`font-bold text-lg ${isOwner ? 'text-white' : 'text-slate-800'}`}>{slot.roleName}</h3>
            <div className="flex items-center mt-2 gap-2">
              {slot.taken ? (
                <p className={`text-sm flex items-center gap-1 ${isOwner ? 'text-blue-100' : 'text-slate-500'}`}>
                  <User size={14} /> {slot.userName} {isOwner && "(You)"}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic font-light">Empty Slot</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
