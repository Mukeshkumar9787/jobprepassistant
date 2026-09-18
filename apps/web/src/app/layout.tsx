import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/auth';

export const metadata: Metadata = {
  title: 'PrepKit AI — Personalized Interview Preparation',
  description: 'Turn any job description and company URL into a tailored interview prep kit with company brief, question bank, flashcards, and study schedule.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
