'use client';
import { useState, useEffect } from 'react';
import { Bot, Sparkles, Target, Lightbulb } from 'lucide-react';

// Standard Toastmasters Roles to check against
const STANDARD_ROLES = [
  "Toastmaster of the Day", "Speaker 1", "Speaker 2", 
  "Table Topics Master", "General Evaluator", 
  "Timer", "Ah-Counter", "Grammarian"
];

export default function AICoach({ stats }: { stats: Record<string, number> }) {
  const [recommendation, setRecommendation] = useState("");
  const [tip, setTip] = useState("");

  useEffect(() => {
    generateAdvice();
  }, [stats]);

  const generateAdvice = () => {
    // 1. Identify "Missing" or "Low Frequency" roles
    const playedRoles = Object.keys(stats);
    const missingRoles = STANDARD_ROLES.filter(r => !playedRoles.includes(r) && !r.includes("Speaker"));
    
    // 2. Logic for Recommendation
    if (playedRoles.length === 0) {
      setRecommendation("Start your journey with a smaller role like **Timer** or **Ah-Counter** to get comfortable on stage!");
    } else if (missingRoles.length > 0) {
      const nextRole = missingRoles[0]; // Suggest the first missing role
      setRecommendation(`To build a balanced skillset, I recommend you try being the **${nextRole}** next.`);
    } else {
      setRecommendation("You are a well-rounded leader! Consider taking on **Toastmaster of the Day** to master facilitation.");
    }

    // 3. Random Speaking Tip
    const tips = [
      "Pause for 3 seconds before you start speaking to command the room.",
      "Make eye contact with one person for a full thought before moving to the next.",
      "Eliminate filler words by taking a breath instead of saying 'Um'.",
      "Use gestures that are purposeful and open, avoiding closed arms."
    ];
    setTip(tips[Math.floor(Math.random() * tips.length)]);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden h-full">
      {/* Decorative Background Icon */}
      <Bot className="absolute -bottom-6 -right-6 text-white opacity-5 w-40 h-40" />

      <div className="relative z-10">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Sparkles className="text-yellow-400" size={20}/> AI Mentor
        </h3>

        {/* Recommendation Card */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Target size={12}/> Next Goal
          </p>
          <p className="text-sm font-medium leading-relaxed text-slate-100" 
             dangerouslySetInnerHTML={{ __html: recommendation }} />
        </div>

        {/* Tip Card */}
        <div className="bg-white/10 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Lightbulb size={12}/> Quick Tip
          </p>
          <p className="text-xs text-slate-300 italic">"{tip}"</p>
        </div>
      </div>
    </div>
  );
}
