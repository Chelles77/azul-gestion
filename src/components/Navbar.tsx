// src/components/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProduitsOpen, setIsProduitsOpen] = useState(false); // ✅ État pour le sous-menu
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-[#111111] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">A</div>
          <span className="hidden sm:inline">AZULGESTION</span>
        </Link>

        {/* MENU DESKTOP (avec dropdown hover) */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-300 hover:text-white text-sm transition-colors">Accueil</Link>
          
          {/* Dropdown Desktop */}
          <div className="relative group">
            <button className="text-gray-300 hover:text-white flex items-center gap-1 text-sm transition-colors">
              Produits <ChevronDown size={14} />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
              <Link href="/products/brute" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm first:rounded-t-lg">Produits Bruts</Link>
              <Link href="/products/vente" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm last:rounded-b-lg">En Vente</Link>
            </div>
          </div>

          <Link href="/finance/achat" className="text-gray-300 hover:text-white text-sm transition-colors">Finance</Link>
          <Link href="/organisateur" className="text-gray-300 hover:text-white text-sm transition-colors">Organisateur</Link>
        </div>

        {/* DROITE : DÉCONNEXION + HAMBURGER */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogout} 
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors shrink-0"
          >
            <LogOut size={14} /> 
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ✅ MENU MOBILE AVEC SOUS-MENU PRODUITS */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <Link 
            href="/" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="block text-gray-300 hover:text-white py-2 text-sm font-medium"
          >
            Accueil
          </Link>
          
          {/* Sous-menu Produits (Accordéon) */}
          <div>
            <button 
              onClick={() => setIsProduitsOpen(!isProduitsOpen)}
              className="flex items-center justify-between w-full text-gray-300 hover:text-white py-2 text-sm font-medium"
            >
              Produits 
              <ChevronDown size={16} className={`transition-transform duration-200 ${isProduitsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isProduitsOpen && (
              <div className="pl-4 mt-2 space-y-2 border-l-2 border-gray-700 ml-2">
                <Link 
                  href="/products/brute" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block text-gray-400 hover:text-white py-1.5 text-sm"
                >
                  Produits Bruts
                </Link>
                <Link 
                  href="/products/vente" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block text-gray-400 hover:text-white py-1.5 text-sm"
                >
                  En Vente
                </Link>
              </div>
            )}
          </div>

          <Link 
            href="/finance/achat" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="block text-gray-300 hover:text-white py-2 text-sm font-medium"
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