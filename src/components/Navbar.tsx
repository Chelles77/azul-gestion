// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar'; // ✅ Ajoute cette ligne

export const metadata: Metadata = {
  title: 'Azul Gestion',
  description: 'Gestion de stock',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-[#111111] text-white">
        <Navbar /> {/* ✅ Ajoute ceci */}
        <main>{children}</main>
      </body>
    </html>
  );
}