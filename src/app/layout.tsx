// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Azul Gestion",
  description: "Application de gestion comptable et stock",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased bg-[#111111] text-gray-200`}>
        
        {/* NAVBAR */}
        <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">A</div>
              <span className="text-xl font-bold text-white">AZUL<span className="text-blue-500">GESTION</span></span>
            </div>
            
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="text-gray-300 hover:text-white text-sm font-medium">Accueil</Link>
              <Link href="/products/brute" className="text-gray-300 hover:text-white text-sm font-medium">Produits Bruts</Link>
              <Link href="/finance/achat" className="text-gray-300 hover:text-white text-sm font-medium">Finance</Link>
            </nav>

            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 hidden sm:block">nqairidriss@yahoo.fr</span>
              <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium">Déconnexion</button>
            </div>
          </div>
        </header>

        <main className="min-h-screen p-4 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}