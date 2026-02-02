'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  roleHistory: string[];
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roleHistory, setRoleHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          
          const userRef = doc(db, "users", currentUser.uid);
          
          // 1. Check if user document exists; if not, create it safely
          // We do this inside a try-catch so it doesn't crash the auth flow
          try {
            const docSnap = await getDoc(userRef);
            if (!docSnap.exists()) {
              await setDoc(userRef, { 
                email: currentUser.email, 
                roleHistory: [] 
              });
            }
          } catch (docError) {
            console.error("Error creating user profile:", docError);
            // Even if DB fails, we still let them log in
          }

          // 2. Listen for real-time changes to Role History
          onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              setRoleHistory(snapshot.data().roleHistory || []);
            }
          });

        } else {
          setUser(null);
          setRoleHistory([]);
        }
      } catch (error) {
        console.error("Auth State Error:", error);
      } finally {
        // CRITICAL: Always turn off loading, even if errors occur
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Attempt 1: Try Popup (Better for Desktop)
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // If Popup is blocked, Error Code is 'auth/popup-blocked'
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        console.warn("Popup blocked. Switching to Redirect method...");
        // Attempt 2: Fallback to Redirect (Better for Mobile)
        await signInWithRedirect(auth, provider);
      } else {
        console.error("Login Error:", error);
        alert(error.message);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setRoleHistory([]);
  };

  return (
    <AuthContext.Provider value={{ user, roleHistory, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
