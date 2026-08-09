// src/components/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">A</div>
          <span className="hidden sm:inline">AZULGESTION</span>
        </Link>

        {/* MENU DESKTOP */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-300 hover:text-white text-sm">Accueil</Link>
          <Link href="/products/brute" className="text-gray-300 hover:text-white text-sm">Produits Bruts</Link>
          <Link href="/finance/achat" className="text-gray-300 hover:text-white text-sm">Finance</Link>
        </div>

        {/* DROITE : DÉCONNEXION + HAMBURGER */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogout} 
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
          >
            <LogOut size={14} /> 
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-4 space-y-3">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Accueil</Link>
          <Link href="/products/brute" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Produits Bruts</Link>
          <Link href="/finance/achat" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Finance</Link>
        </div>
      )}
    </nav>
  );
}