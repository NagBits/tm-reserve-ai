import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <nav className="p-4 border-b flex justify-between items-center bg-white">
            <span className="font-bold text-xl text-purple-700">TM Reserve AI</span>
            {/* Add a generic Sign Out button here if user is logged in */}
          </nav>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
