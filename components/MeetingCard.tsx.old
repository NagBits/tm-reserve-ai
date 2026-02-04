'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { reserveRole, cancelRole } from '@/lib/actions';
import { Calendar, User, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function MeetingCard({ meeting }: { meeting: any }) {
  const { user } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleBook = async (slotIndex: number, roleName: string) => {
    if (!user) return alert("Please sign in to book a role.");
    if (!confirm(`Confirm booking for ${roleName}?`)) return;

    setLoadingRole(roleName);
    try {
      await reserveRole(meeting.id, slotIndex, user, roleName);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingRole(null);
    }
  };

  const handleCancel = async (slotIndex: number, roleName: string) => {
    if (!confirm("Are you sure you want to cancel this role?")) return;
    
    setLoadingRole(roleName);
    try {
      await cancelRole(meeting.id, slotIndex, user, roleName);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg border border-slate-200 text-purple-600">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{meeting.date.split(',')[0]}</h3>
            <p className="text-xs text-slate-500 font-medium">{meeting.date.split(',').slice(1).join(',')}</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
          <Clock size={12} /> Open
        </div>
      </div>

      {/* Slots Grid */}
      <div className="divide-y divide-slate-100">
        {meeting.slots.map((slot: any, index: number) => {
          const isTaken = !!slot.userId;
          const isMySlot = slot.userId === user?.uid;
          const isLoading = loadingRole === slot.role;

          return (
            <div key={index} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
              
              {/* Role Info */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isTaken ? 'bg-slate-100 text-slate-400' : 'bg-purple-100 text-purple-600'}`}>
                  <User size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{slot.role}</p>
                  {isTaken ? (
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      Taken by <span className="text-slate-900 font-bold">{slot.userName}</span>
                      {isMySlot && <span className="text-purple-600">(You)</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 font-bold">Available</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                {isLoading ? (
                  <Loader2 className="animate-spin text-slate-400" size={18} />
                ) : isMySlot ? (
                  <button 
                    onClick={() => handleCancel(index, slot.role)}
                    className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors flex items-center gap-1"
                  >
                    <XCircle size={14}/> Cancel
                  </button>
                ) : !isTaken ? (
                  <button 
                    onClick={() => handleBook(index, slot.role)}
                    className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-1"
                  >
                    <CheckCircle size={14}/> Book
                  </button>
                ) : (
                  <span className="text-xs text-slate-300 font-mono">LOCKED</span>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
