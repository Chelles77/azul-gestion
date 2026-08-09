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
      {/* Force le fond noir sur TOUTE la page, y compris les bords */}
      <body className={`${inter.variable} font-sans antialiased bg-[#111111] text-gray-200 min-h-screen m-0 p-0`}>
        
        {/* NAVBAR AVEC SOUS-MENUS DÉROULANTS */}
        <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/20">A</div>
              <span className="text-xl font-bold text-white tracking-tight hidden sm:block">AZUL<span className="text-blue-500">GESTION</span></span>
            </Link>
            
            {/* Navigation Principale avec Dropdowns */}
            <nav className="hidden md:flex items-center gap-1">
              
              <Link href="/" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-[#252525] rounded-lg text-sm font-medium transition-all">
                Accueil
              </Link>

              {/* Menu Produits (Dropdown) */}
              <div className="relative group">
                <button className="px-4 py-2 text-gray-300 group-hover:text-white group-hover:bg-[#252525] rounded-lg text-sm font-medium transition-all flex items-center gap-1 cursor-default">
                  Produits
                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                <div className="absolute left-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 overflow-hidden z-50">
                  <Link href="/products/brute" className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] hover:text-white border-b border-gray-800 transition-colors flex items-center gap-2">
                    <span>📦</span> Produits Bruts
                  </Link>
                  <Link href="/products/vente" className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] hover:text-white border-b border-gray-800 transition-colors flex items-center gap-2">
                    <span>🏷️</span> En Vente
                  </Link>
                  <Link href="/products/archives" className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] hover:text-white transition-colors flex items-center gap-2">
                    <span>🗄️</span> Archives
                  </Link>
                </div>
              </div>

              {/* Menu Finance (Dropdown) */}
              <div className="relative group">
                <button className="px-4 py-2 text-gray-300 group-hover:text-white group-hover:bg-[#252525] rounded-lg text-sm font-medium transition-all flex items-center gap-1 cursor-default">
                  Finance
                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                <div className="absolute left-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 overflow-hidden z-50">
                  <Link href="/finance/achat" className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] hover:text-white border-b border-gray-800 transition-colors flex items-center gap-2">
                    <span>💰</span> Achats
                  </Link>
                  <Link href="/finance/ventes" className="block px-4 py-3 text-sm text-gray-300 hover:bg-[#252525] hover:text-white transition-colors flex items-center gap-2">
                    <span>📈</span> Ventes
                  </Link>
                </div>
              </div>

            </nav>

            {/* Profil / Déconnexion */}
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-xs text-gray-400 hidden lg:block truncate max-w-[150px]">nqairidriss@yahoo.fr</span>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="min-h-screen w-full">
          {children}
        </main>
      </body>
    </html>
  );
}