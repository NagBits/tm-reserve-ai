'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { getParticipationSuggestion } from '@/lib/aiCoach';
import { Sparkles, Calendar, Award, LogIn } from 'lucide-react';

export default function MemberDashboard() {
  const { user, roleHistory, login, loading } = useAuth();
  const [suggestion, setSuggestion] = useState("");

  useEffect(() => {
    if (user) {
      getParticipationSuggestion(roleHistory).then(setSuggestion);
    }
  }, [user, roleHistory]);

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-2xl font-bold mb-4">Ready to level up your speech?</h1>
        <button onClick={login} className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold">
          <LogIn size={20} /> Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Hello, {user.displayName?.split(' ')[0]}! 👋</h1>
        
        {/* AI Nudge Section */}
        <div className="mt-6 flex items-start gap-4 bg-purple-50 p-6 rounded-2xl border border-purple-100">
          <div className="bg-purple-600 p-2 rounded-lg text-white">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-bold text-purple-900">Gemini's Suggestion</h3>
            <p className="text-purple-700 mt-1 italic">{suggestion}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h2 className="font-bold flex items-center gap-2 mb-4"><Award className="text-orange-500"/> Achievements</h2>
          <div className="flex flex-wrap gap-2">
            {roleHistory.length > 0 ? roleHistory.map((r, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium">{r}</span>
            )) : <p className="text-slate-400 text-sm">Sign up for your first role!</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h2 className="font-bold flex items-center gap-2 mb-4"><Calendar className="text-blue-500"/> Next Saturday</h2>
          <p className="text-sm text-slate-500 mb-4">Reserve your spot for the next meeting.</p>
          <a href="/reserve" className="block text-center bg-slate-900 text-white py-2 rounded-lg font-bold">Browse Slots</a>
        </div>
      </div>
    </div>
  );
}
