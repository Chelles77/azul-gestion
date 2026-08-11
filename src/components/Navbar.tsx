// src/components/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null); // Pour gérer plusieurs accordéons sur mobile
  
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleSubmenu = (name: string) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
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

          {/* 2. MENU DESKTOP (Horizontal avec Dropdowns) */}
          <div className="hidden lg:flex items-center gap-6">
            
            {/* Tableau de bord */}
            <Link href="/dashboard" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Tableau de bord</Link>
            
            {/* Dropdown Produits */}
            <div className="relative group">
              <button className="text-gray-300 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer py-2">
                Produits <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 mt-0 w-48 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                <Link href="/products/brute" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm first:rounded-t-lg border-b border-gray-800/50">Produits Bruts</Link>
                <Link href="/products/vente" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm border-b border-gray-800/50">En Vente</Link>
                <Link href="/products/archives" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm border-b border-gray-800/50">Vendu / Archiver</Link>
                <Link href="/products/casse" className="block px-4 py-3 text-red-400 hover:bg-gray-800 hover:text-red-300 text-sm border-b border-gray-800/50 font-medium">💔 Cassés</Link>
                <Link href="/qr/print" className="block px-4 py-3 text-blue-400 hover:bg-gray-800 hover:text-blue-300 text-sm last:rounded-b-lg font-medium">📋 Imprimer QR</Link>
              </div>
            </div>

            {/* Dropdown Finance */}
            <div className="relative group">
              <button className="text-gray-300 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer py-2">
                Finance <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-0 mt-0 w-56 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                <Link href="/finance/achat" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm first:rounded-t-lg border-b border-gray-800/50">Achat</Link>
                <Link href="/finance/depense" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm border-b border-gray-800/50">Dépense</Link>
                <Link href="/finance/encaissement" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm border-b border-gray-800/50">Encaissement</Link>
                <Link href="/finance/analytheque" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm border-b border-gray-800/50">Analythèque</Link>
                <Link href="/finance/rebut" className="block px-4 py-3 text-red-400 hover:bg-gray-800 hover:text-red-300 text-sm border-b border-gray-800/50 font-medium">💔 Rebuts & Pertes</Link>
                <Link href="/finance/simulateur" className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white text-sm last:rounded-b-lg">Simulateur d'achat</Link>
              </div>
            </div>

            {/* Organisateur */}
            <Link href="/organisateur" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Organisateur</Link>

            {/* Collaborateurs */}
            <Link href="/collaborateurs" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Collaborateurs</Link>
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
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. MENU MOBILE (Accordéons complets) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl max-h-[85vh] overflow-y-auto">
          
          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 text-sm font-medium border-b border-gray-800/50 pb-3">Tableau de bord</Link>
          
          {/* Accordéon Produits */}
          <div className="border-b border-gray-800/50 pb-3">
            <button onClick={() => toggleSubmenu('produits')} className="flex items-center justify-between w-full text-gray-300 hover:text-white py-2 text-sm font-medium">
              Produits <ChevronDown size={16} className={`transition-transform duration-200 ${openSubmenu === 'produits' ? 'rotate-180' : ''}`} />
            </button>
            {openSubmenu === 'produits' && (
              <div className="pl-4 mt-2 space-y-3 border-l-2 border-gray-700 ml-1">
                <Link href="/products/brute" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-400 hover:text-white py-1 text-sm">Produits Bruts</Link>
                <Link href="/products/vente" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-400 hover:text-white py-1 text-sm">En Vente</Link>
                <Link href="/products/archives" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-400 hover:text-white py-1 text-sm">Vendu / Archiver</Link>
                <Link href="/products/casse" onClick={() => setIsMobileMenuOpen(false)} className="block text-red-400 hover:text-red-300 py-1 text-sm font-medium">💔 Cassés</Link>
                <Link href="/qr/print" onClick={() => setIsMobileMenuOpen(false)} className="block text-blue-400 hover:text-blue-300 py-1 text-sm font-medium">📋 Imprimer QR</Link>
              </div>
            )}
          </div>

          {/* Accordéon Finance */}
          <div className="border-b border-gray-800/50 pb-3">
            <button onClick={() => toggleSubmenu('finance')} className="flex items-center justify-between w-full text-gray-300 hover:text-white py-2 text-sm font-medium">
              Finance <ChevronDown size={16} className={`transition-transform duration-200 ${openSubmenu === 'finance' ? 'rotate-180' : ''}`} />
            </button>
            {openSubmenu === 'finance' && (
              <div className="pl-4 mt-2 space-y-3 border-l-2 border-gray-700 ml-1">
                <Link href="/finance/achat" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-400 hover:text-white py-1 text-sm">Achat</Link>
                <Link href="/finance/depense" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-400 hover:text-white py-1 text-sm">Dépense</Link>
                <Link href="/finance/encaissement" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-400 hover:text-white py-1 text-sm">Encaissement</Link>
                <Link href="/finance/analytheque" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-400 hover:text-white py-1 text-sm">Analythèque</Link>
                <Link href="/finance/rebut" onClick={() => setIsMobileMenuOpen(false)} className="block text-red-400 hover:text-red-300 py-1 text-sm font-medium">💔 Rebuts & Pertes</Link>
                <Link href="/finance/simulateur" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-400 hover:text-white py-1 text-sm">Simulateur d'achat</Link>
              </div>
            )}
          </div>

          <Link href="/organisateur" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 text-sm font-medium border-b border-gray-800/50 pb-3">Organisateur</Link>

          <Link href="/collaborateurs" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-300 hover:text-white py-2 text-sm font-medium">Collaborateurs</Link>
        </div>
      )}
    </nav>
  );
}