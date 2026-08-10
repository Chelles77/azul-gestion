// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar'; // ✅ Seul import autorisé ici

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Azul Gestion',
  description: 'Application de gestion comptable et stock',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased bg-[#111111] text-white`}>
        {/* ✅ Le menu est géré EXCLUSIVEMENT par le composant ci-dessous */}
        <Navbar />
        
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}