'use client';
import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mic, FileAudio, Upload, Loader2, CheckCircle2 } from 'lucide-react';

export default function FeedbackEngine() {
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeAudio = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 1. Convert file to Base64 for the Gemini SDK
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      // 2. Send to Gemini
      const prompt = "Analyze this audio for a Toastmasters speech. Give me an Ah-counter report, a summary of the speech content, and feedback on the speaker's vocal variety and pacing.";
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        }
      ]);

      setFeedback(result.response.text());
    } catch (error) {
      console.error("Audio Analysis Error:", error);
      setFeedback("Error processing audio. Ensure the file is under 20MB.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Mic className="text-purple-600" />
        <h2 className="text-xl font-bold">Audio Evaluator</h2>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="audio/*" 
          onChange={handleFileChange} 
        />
        
        {file ? (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="text-green-500 mb-2" size={32} />
            <p className="text-sm font-bold text-slate-700">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <>
            <Upload className="text-slate-400 mb-2" size={32} />
            <p className="text-sm font-semibold text-slate-600">Click to upload speech audio</p>
            <p className="text-xs text-slate-400">MP3, WAV, or AAC (Max 20MB)</p>
          </>
        )}
      </div>

      <button 
        onClick={analyzeAudio}
        disabled={!file || loading}
        className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Start AI Evaluation"}
      </button>

      {feedback && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm whitespace-pre-wrap leading-relaxed">
          {feedback}
        </div>
      )}
    </div>
  );
}
