// src/components/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProduitsOpen, setIsProduitsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-[#111111] border-b border-gray-800 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 1. LOGO */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">A</div>
            <span className="hidden sm:inline tracking-tight">AZULGESTION</span>
          </Link>

          {/* 2. MENU DESKTOP (Visible uniquement sur écran large) */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Accueil</Link>
            
            {/* Sous-menu Desktop au survol */}
            <div className="relative group">
              <button className="text-gray-300 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer py-2">
                Produits <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 mt-0 w-48 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                <Link href="/products/brute" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm first:rounded-t-lg border-b border-gray-800/50">Produits Bruts</Link>
                <Link href="/products/vente" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm last:rounded-b-lg">En Vente</Link>
              </div>
            </div>

            <Link href="/finance/achat" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Finance</Link>
            <Link href="/organisateur" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Organisateur</Link>
          </div>

          {/* 3. ACTIONS DROITE (Déconnexion + Hamburger) */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              <LogOut size={14} /> 
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
            
            {/* Bouton Hamburger (Visible uniquement sur mobile) */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. MENU MOBILE (Déroulant avec accordéon) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          <Link 
            href="/" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="block text-gray-300 hover:text-white py-2 text-sm font-medium border-b border-gray-800/50 pb-3"
          >
            Accueil
          </Link>
          
          {/* Accordéon Produits Mobile */}
          <div className="border-b border-gray-800/50 pb-3">
            <button 
              onClick={() => setIsProduitsOpen(!isProduitsOpen)}
              className="flex items-center justify-between w-full text-gray-300 hover:text-white py-2 text-sm font-medium"
            >
              Produits 
              <ChevronDown size={16} className={`transition-transform duration-200 ${isProduitsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isProduitsOpen && (
              <div className="pl-4 mt-2 space-y-3 border-l-2 border-gray-700 ml-1">
                <Link 
                  href="/products/brute" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block text-gray-400 hover:text-white py-1 text-sm"
                >
                  Produits Bruts
                </Link>
                <Link 
                  href="/products/vente" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block text-gray-400 hover:text-white py-1 text-sm"
                >
                  En Vente
                </Link>
              </div>
            )}
          </div>

          <Link 
            href="/finance/achat" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="block text-gray-300 hover:text-white py-2 text-sm font-medium border-b border-gray-800/50 pb-3"
          >
            Finance
          </Link>
          
          <Link 
            href="/organisateur" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="block text-gray-300 hover:text-white py-2 text-sm font-medium"
          >
            Organisateur
          </Link>
        </div>
      )}
    </nav>
  );
}