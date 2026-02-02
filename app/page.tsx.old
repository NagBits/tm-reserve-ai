import Link from 'next/link';
import { Mic2, CalendarCheck, Sparkles, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
          <div className="bg-purple-600 text-white p-1 rounded-lg">
            <Mic2 size={20} />
          </div>
          TM Reserve AI
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-purple-600">
          Member Login
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-8">
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
            Master your speaking journey.
            <span className="block text-purple-600">One role at a time.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            The intelligent way to book Toastmasters roles. 
            Get AI-driven suggestions for your next step and never miss a speaking slot again.
          </p>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto">
          <Link 
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Reserve a Spot <ArrowRight size={20} />
          </Link>
          <a 
            href="#features"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            How it works
          </a>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-16 w-full">
          <FeatureCard 
            icon={<CalendarCheck className="text-blue-600" />}
            title="Instant Booking"
            desc="See all upcoming Saturday slots in real-time. No more spreadsheet chaos."
          />
          <FeatureCard 
            icon={<Sparkles className="text-purple-600" />}
            title="AI Coach"
            desc="Gemini analyzes your history and suggests the perfect next role to grow."
          />
          <FeatureCard 
            icon={<Mic2 className="text-orange-600" />}
            title="Track Progress"
            desc="Your role history is automatically saved. Watch your leadership journey unfold."
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Toastmasters Club. All rights reserved.</p>
        <div className="mt-2">
          <Link href="/vpe" className="hover:text-purple-500 transition-colors">
            VPE Admin Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
