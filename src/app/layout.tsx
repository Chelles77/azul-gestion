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
        
        {/* NAVBAR GLOBALE SIMPLE ET ÉLÉGANTE */}
        <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">A</div>
              <span className="text-xl font-bold text-white tracking-tight hidden sm:block">AZUL<span className="text-blue-500">GESTION</span></span>
            </Link>
            
            {/* Navigation Principale - Texte simple */}
            <nav className="hidden md:flex items-center gap-6">
              
              <Link 
                href="/" 
                className="text-white hover:text-blue-400 hover:underline decoration-blue-400 underline-offset-4 text-sm font-medium transition-all duration-200"
              >
                Accueil
              </Link>

              <Link 
                href="/products/brute" 
                className="text-white hover:text-blue-400 hover:underline decoration-blue-400 underline-offset-4 text-sm font-medium transition-all duration-200"
              >
                Produits Bruts
              </Link>

              <Link 
                href="/finance/achat" 
                className="text-white hover:text-blue-400 hover:underline decoration-blue-400 underline-offset-4 text-sm font-medium transition-all duration-200"
              >
                Finance
              </Link>

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