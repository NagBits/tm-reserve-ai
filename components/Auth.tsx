'use client';
import { useState, useEffect } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { LogOut, ShieldCheck, LayoutGrid } from 'lucide-react';
import Link from 'next/link'; // Use Link for faster internal navigation

export default function Auth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // This creates the 'user' variable the error was missing
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">TM</span>
            </div>
            <span className="font-bold text-slate-900 tracking-tight hidden sm:block">Reserve AI</span>
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            {/* VPE Admin Link - Now safely checking 'user' inside the render block */}
            {user.email === process.env.NEXT_PUBLIC_VPE_EMAIL && (
              <Link 
                href="/vpe" 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <LayoutGrid size={14} />
                Admin Console
              </Link>
            )}

            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Member</p>
            </div>
            
            <button 
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
