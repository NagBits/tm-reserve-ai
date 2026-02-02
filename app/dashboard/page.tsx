'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { getParticipationSuggestion } from '@/lib/aiCoach';
import MeetingList from '@/components/MeetingList';
import { Sparkles, LogIn, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, roleHistory, login, logout, loading } = useAuth();
  const [suggestion, setSuggestion] = useState("AI is thinking...");

  useEffect(() => {
    if (user) getParticipationSuggestion(roleHistory).then(setSuggestion);
  }, [user, roleHistory]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-3xl font-bold text-purple-700">TM Reserve AI</h1>
        <button onClick={login} className="bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center gap-2">
          <LogIn size={20}/> Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hello, {user.displayName}</h1>
          <p className="text-slate-500 text-sm">Roles completed: {roleHistory.length}</p>
        </div>
        <button onClick={logout} className="text-sm text-red-500 hover:underline flex gap-1 items-center">
          <LogOut size={14}/> Sign Out
        </button>
      </header>

      {/* AI Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-2xl text-white shadow-lg flex gap-4 items-start">
        <Sparkles className="shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-purple-100 text-sm uppercase tracking-wide">Coach Gemini Says:</h3>
          <p className="text-lg font-medium mt-1 leading-relaxed">"{suggestion}"</p>
        </div>
      </div>

      <MeetingList />
    </div>
  );
}
