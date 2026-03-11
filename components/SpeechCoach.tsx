'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2, Sparkles, Loader2, Volume2, Target, Award, Brain } from 'lucide-react';

export default function SpeechCoach() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
            };

            mediaRecorder.start();
            setIsRecording(true);
            setFeedback(null);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const getFeedback = async () => {
        if (!audioBlob) return;

        setLoading(true);
        try {
            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];

                console.log("Fetching feedback from /api/ai/coach...");
                const response = await fetch('/api/ai/coach', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        audio: base64Audio,
                        mimeType: audioBlob.type
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Server responded with ${response.status}`);
                }

                const data = await response.json();
                console.log("AI Coach Response Data:", data);

                if (data.feedback) {
                    setFeedback(data.feedback);
                } else if (data.error) {
                    setFeedback(`Error: ${data.error}`);
                } else {
                    setFeedback("AI returned an empty analysis. Please try speaking for a longer duration.");
                }
                setLoading(false);
            };
        } catch (err: any) {
            console.error("Error getting feedback:", err);
            setFeedback(`Connection Error: ${err.message || "Please check your network."}`);
            setLoading(false);
        }
    };

    const reset = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setFeedback(null);
    };

    return (
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                <Brain size={180} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-600 rounded-[1rem] md:rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-purple-200">
                        <Mic size={24} className="md:w-7 md:h-7" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">AI Speech Lab</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instant Voice Analysis</p>
                    </div>
                </div>

                {!audioBlob ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative
                ${isRecording ? 'bg-red-500 scale-110' : 'bg-slate-900 hover:bg-purple-600'}`}
                        >
                            {isRecording ? (
                                <Square className="text-white fill-white" size={32} />
                            ) : (
                                <Mic className="text-white" size={32} />
                            )}
                            {isRecording && (
                                <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20"></div>
                            )}
                        </button>
                        <div className="text-center">
                            <p className="text-slate-900 font-black text-lg">
                                {isRecording ? "Recording Live..." : "Start Practice"}
                            </p>
                            <p className="text-slate-500 text-xs font-medium mt-1">
                                {isRecording ? "I'm listening to your speech" : "Record your speech for AI coaching"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <audio src={audioUrl!} controls className="flex-1 h-10" />
                            <button
                                onClick={reset}
                                className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                                title="Discard Recording"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {!feedback ? (
                            <button
                                onClick={getFeedback}
                                disabled={loading}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-purple-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Analyzing Patterns...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} className="text-purple-400" />
                                        Generate Feedback
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 relative">
                                    <div className="absolute top-6 right-6">
                                        <Sparkles className="text-purple-400 animate-pulse" size={20} />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-4 flex items-center gap-2">
                                        <Brain size={12} /> AI Coach Analysis
                                    </h4>
                                    <div className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line prose prose-slate">
                                        {feedback}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <Target size={16} className="text-emerald-500 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Focus Area</p>
                                        <p className="text-xs font-bold text-slate-800">Voice Modulation</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <Award size={16} className="text-amber-500 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strength</p>
                                        <p className="text-xs font-bold text-slate-800">Clarity of Thought</p>
                                    </div>
                                </div>

                                <button
                                    onClick={reset}
                                    className="w-full py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-slate-200 transition-all"
                                >
                                    Clear and Record New
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
