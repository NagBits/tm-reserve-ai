// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Ensure you have Tailwind directives here

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Toastmasters AI | Slot Reservations & Feedback",
  description: "Automated role reservations and AI-powered speech progress tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50 text-slate-900`}>
        {/* You can wrap children in a Provider if using React Context for Auth */}
        <div className="min-h-screen">
          {children}
        </div>

        {/* Global Footer */}
        <footer className="border-t border-gray-200 bg-white py-8 mt-12">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Toastmasters AI Concierge. Built for Club Growth.</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gray-400">
              Powered by Node.js • Firebase • OpenAI
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
