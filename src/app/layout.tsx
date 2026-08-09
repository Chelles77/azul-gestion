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
      <body className={`${inter.variable} font-sans antialiased bg-[#111111] text-gray-200 min-h-screen m-0 p-0`}>
        
        {/* NAVBAR GLOBALE AVEC SOUS-MENUS */}
        <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">A</div>
              <span className="text-xl font-bold text-white tracking-tight hidden sm:block">AZUL<span className="text-blue-500">GESTION</span></span>
            </Link>
            
            {/* Navigation Principale */}
            <nav className="hidden md:flex items-center gap-6">
              
              {/* Accueil - Lien simple */}
              <Link 
                href="/" 
                className="text-white hover:text-blue-400 hover:underline decoration-blue-400 underline-offset-4 text-sm font-medium transition-all duration-200"
              >
                Accueil
              </Link>

              {/* Produits - Avec sous-menu */}
              <div className="relative group">
                <button className="text-white group-hover:text-blue-400 text-sm font-medium transition-all duration-200 flex items-center gap-1 cursor-default bg-transparent border-none outline-none">
                  Produits
                  <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute left-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 overflow-hidden z-50">
                  <Link href="/products/brute" className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-[#252525] hover:text-blue-400 border-b border-gray-800 transition-colors">
                    Produits Bruts
                  </Link>
                  <Link href="/products/vente" className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-[#252525] hover:text-blue-400 border-b border-gray-800 transition-colors">
                    En Vente
                  </Link>
                  <Link href="/products/archives" className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-[#252525] hover:text-blue-400 transition-colors">
                    Archives
                  </Link>
                </div>
              </div>

              {/* Finance - Avec sous-menu */}
              <div className="relative group">
                <button className="text-white group-hover:text-blue-400 text-sm font-medium transition-all duration-200 flex items-center gap-1 cursor-default bg-transparent border-none outline-none">
                  Finance
                  <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                <div className="absolute left-0 top-full mt-2 w-40 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 overflow-hidden z-50">
                  <Link href="/finance/achat" className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-[#252525] hover:text-blue-400 border-b border-gray-800 transition-colors">
                    Achats
                  </Link>
                  <Link href="/finance/ventes" className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-[#252525] hover:text-blue-400 transition-colors">
                    Ventes
                  </Link>
                </div>
              </div>

              {/* Organisateur - Lien simple sans icône */}
              <Link 
                href="/organizer" 
                className="text-white hover:text-blue-400 hover:underline decoration-blue-400 underline-offset-4 text-sm font-medium transition-all duration-200"
              >
                Organisateur
              </Link>

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

        {/* Contenu principal des pages */}
        <main className="min-h-screen w-full">
          {children}
        </main>
      </body>
    </html>
  );
}