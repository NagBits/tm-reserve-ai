'use client';
import { useState, useEffect } from 'react';
import { Bot, Sparkles, Target, Lightbulb, Loader2, Wand2, CheckCircle2, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp, doc, updateDoc } from 'firebase/firestore';

// Standard Toastmasters Roles to check against
const STANDARD_ROLES = [
  "TMOD", "Speaker 1", "Speaker 2",
  "TTM", "General Evaluator",
  "Timer", "Ah-Counter", "Grammarian"
];

export default function AICoach({ stats }: { stats: Record<string, number> }) {
  const [recommendation, setRecommendation] = useState("");
  const [tip, setTip] = useState("");
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedFeedback, setDetailedFeedback] = useState("");
  const [suggestedRole, setSuggestedRole] = useState("");
  const [availableMeeting, setAvailableMeeting] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    generateAdvice();
  }, [stats]);

  // Fetch meetings to find availability for the suggested role
  useEffect(() => {
    if (!suggestedRole) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "meetings"),
      where("timestamp", ">=", Timestamp.fromDate(now)),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Find the first meeting that has the suggested role available
      const found = meetings.find((m: any) =>
        m.slots?.some((s: any) =>
          s.role.trim().toLowerCase() === suggestedRole.trim().toLowerCase() && !s.userId
        )
      );

      setAvailableMeeting(found);
    });

    return () => unsubscribe();
  }, [suggestedRole]);

  const generateAdvice = () => {
    // 1. Identify "Missing" or "Low Frequency" roles
    const playedRoles = Object.keys(stats);
    const missingRoles = STANDARD_ROLES.filter(r => !playedRoles.includes(r) && !r.includes("Speaker"));

    // 2. Logic for Recommendation
    let role = "";
    if (playedRoles.length === 0) {
      role = "Timer";
      setRecommendation("Start your journey with a smaller role like **Timer** or **Ah-Counter** to get comfortable on stage!");
    } else if (missingRoles.length > 0) {
      role = missingRoles[0];
      setRecommendation(`To build a balanced skillset, I recommend you try being the **${role}** next.`);
    } else {
      role = "TMOD";
      setRecommendation("You are a well-rounded leader! Consider taking on **TMOD** to master facilitation.");
    }
    setSuggestedRole(role);

    // 3. Random Speaking Tip
    const tips = [
      "Pause for 3 seconds before you start speaking to command the room.",
      "Make eye contact with one person for a full thought before moving to the next.",
      "Eliminate filler words by taking a breath instead of saying 'Um'.",
      "Use gestures that are purposeful and open, avoiding closed arms."
    ];
    setTip(tips[Math.floor(Math.random() * tips.length)]);
  };

  const handleAutoBook = async () => {
    if (!user || !availableMeeting || !suggestedRole || bookingLoading) return;

    setBookingLoading(true);
    try {
      const updatedSlots = [...availableMeeting.slots];
      const index = updatedSlots.findIndex(s =>
        s.role.trim().toLowerCase() === suggestedRole.trim().toLowerCase() && !s.userId
      );

      if (index >= 0) {
        updatedSlots[index] = {
          ...updatedSlots[index],
          userId: user.uid,
          userName: user.displayName || "Member"
        };
        await updateDoc(doc(db, "meetings", availableMeeting.id), { slots: updatedSlots });
        alert(`Successfully booked ${suggestedRole} for ${availableMeeting.timestamp.toDate().toLocaleDateString()}!`);
      } else {
        alert("Sorry, that role was just taken. Refreshing...");
      }
    } catch (error) {
      console.error("Auto-booking failed:", error);
      alert("Failed to book role. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const getDetailedFeedback = async () => {
    setDetailedLoading(true);
    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: "Stats Report Request", // Signal that we want a text-based stats analysis
          mimeType: "text/plain",
          stats: stats,
          userName: user?.displayName
        })
      });

      const data = await response.json();
      setDetailedFeedback(data.feedback);
    } catch (error) {
      console.error("Detailed feedback failed:", error);
      setDetailedFeedback("Could not generate your report. Please try again.");
    } finally {
      setDetailedLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-full flex flex-col justify-center border border-white/5">
      {/* Decorative Background Icon */}
      <Bot className="absolute -bottom-10 -right-10 text-white opacity-[0.03] w-64 h-64 rotate-12" />
      <Sparkles className="absolute top-10 right-10 text-purple-400 opacity-20 w-12 h-12 animate-pulse" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
            <Sparkles className="text-purple-400" size={24} />
          </div>
          <div>
            <h3 className="font-black text-2xl tracking-tight leading-none">AI Mentor</h3>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em] mt-1">Smart Guidance</p>
          </div>
        </div>

        {/* Recommendation Card */}
        <div className="mb-10">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
            <Target size={14} className="text-emerald-500" /> Recommended Goal
          </p>
          <p className="text-2xl font-bold leading-tight text-slate-100 max-w-lg"
            dangerouslySetInnerHTML={{ __html: recommendation }} />

          {availableMeeting && (
            <div className="mt-4 flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-700">
              <button
                onClick={handleAutoBook}
                disabled={bookingLoading}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                {bookingLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                One-Click Book
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Next Available</span>
                <span className="text-xs font-black text-emerald-400 mt-1">
                  {availableMeeting.timestamp.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tip Card */}
        <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10 backdrop-blur-md shadow-2xl">
          <p className="text-xs font-black text-yellow-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
            <Lightbulb size={14} /> Knowledge Nugget
          </p>
          <p className="text-base text-slate-300 italic font-medium leading-relaxed font-serif">"{tip}"</p>
        </div>

        {/* Generate Feedback Button */}
        <div className="mt-10">
          {!detailedFeedback ? (
            <button
              onClick={getDetailedFeedback}
              disabled={detailedLoading || Object.keys(stats).length === 0}
              className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center gap-2 transition-all group/btn disabled:opacity-50"
            >
              {detailedLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Generating Your Report...</span>
                </>
              ) : (
                <>
                  <Wand2 size={18} className="text-purple-400 group-hover/btn:rotate-12 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Generate Detailed Feedback</span>
                </>
              )}
            </button>
          ) : (
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles size={12} /> Personalized Progress Report
              </h4>
              <div className="text-sm text-slate-300 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar pr-2 whitespace-pre-line prose prose-invert prose-sm prose-p:leading-relaxed prose-headings:text-purple-400 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0">
                {detailedFeedback}
              </div>
              <button
                onClick={() => setDetailedFeedback("")}
                className="mt-4 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Reset Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
