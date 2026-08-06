'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Camera, Package, FileText, TrendingUp, Menu, X } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- AUTHENTIFICATION (NE PAS TOUCHER) ---
  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) router.push('/login');
        else setUser(user);
      } catch (error) {
        console.error(error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#121212] text-blue-500">Chargement...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      
      {/* NAVBAR CORRIGÉE - FLEXBOX */}
      <nav className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Flex justify-between force : Gauche | Centre | Droite */}
          <div className="flex justify-between items-center h-16 w-full">
            
            {/* 1. LOGO (Gauche - flex-shrink-0 empêche d'écraser) */}
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-900/50">A</div>
              <span className="font-bold text-xl tracking-tight text-white hidden sm:block">
                AZUL<span className="text-blue-500">GESTION</span>
              </span>
            </div>

            {/* 2. MENU CENTRAL (Milieu - flex-1 prend toute la place dispo pour centrer) */}
            <div className="hidden md:flex flex-1 justify-center items-center gap-8">
              <button onClick={() => router.push('/')} className="text-white font-medium hover:text-blue-400 transition-colors py-2 border-b-2 border-blue-500">Tableau de Bord</button>
              <button className="text-gray-400 font-medium hover:text-white transition-colors py-2 border-b-2 border-transparent hover:border-gray-600">Produits</button>
              <button className="text-gray-400 font-medium hover:text-white transition-colors py-2 border-b-2 border-transparent hover:border-gray-600">Gestion</button>
              <button className="text-gray-400 font-medium hover:text-white transition-colors py-2 border-b-2 border-transparent hover:border-gray-600">Organisateur</button>
            </div>

            {/* 3. UTILISATEUR (Droite - Collé sans espace vide) */}
            <div className="flex items-center gap-4">
              <span className="hidden lg:block text-sm text-gray-400 bg-[#252525] px-3 py-1.5 rounded-full border border-gray-700 truncate max-w-[200px]">
                {user.email}
              </span>
              
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-red-900/20 active:scale-95 whitespace-nowrap"
              >
                Déconnexion
              </button>

              {/* Mobile Menu Button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-400 hover:text-white p-2">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
            <button onClick={() => { router.push('/'); setMobileMenuOpen(false); }} className="block w-full text-left text-white font-medium py-3 px-2 rounded hover:bg-white/5">Tableau de Bord</button>
            <button className="block w-full text-left text-gray-400 font-medium py-3 px-2 rounded hover:bg-white/5">Produits</button>
            <button className="block w-full text-left text-gray-400 font-medium py-3 px-2 rounded hover:bg-white/5">Gestion</button>
            <div className="pt-4 mt-2 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2 px-2">{user.email}</p>
              <button onClick={handleLogout} className="w-full py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-bold">Se déconnecter</button>
            </div>
          </div>
        )}
      </nav>

      {/* CONTENU DASHBOARD */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bonjour, {user.user_metadata?.full_name || user.email.split('@')[0]} </h1>
          <p className="text-gray-400">Voici un aperçu de votre activité aujourd'hui.</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Camera, color: 'blue', label: 'Factures Scannées', val: '0', sub: 'Total' },
            { icon: Package, color: 'green', label: 'Produits en Stock', val: '0', sub: 'Stock' },
            { icon: FileText, color: 'purple', label: 'Dépenses', val: '0.00 €', sub: 'Ce mois-ci' },
            { icon: TrendingUp, color: 'orange', label: 'Chiffre d\'affaires', val: '0.00 €', sub: 'CA' }
          ].map((stat, i) => (
            <div key={i} className={`bg-[#1e1e1e] p-6 rounded-xl border border-gray-800 hover:border-${stat.color}-500/50 transition-all group`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-500/10 rounded-lg group-hover:bg-${stat.color}-500/20 transition-colors`}>
                  <stat.icon className={`text-${stat.color}-500`} size={24} />
                </div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{stat.sub}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.val}</h3>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ACTIONS RAPIDES */}
        <h2 className="text-xl font-bold text-white mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => router.push('/scan')} className="bg-blue-600 hover:bg-blue-700 p-6 rounded-xl text-left transition-all shadow-lg shadow-blue-900/20 group">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Camera size={24} className="text-white"/></div>
            <h3 className="font-bold text-lg text-white mb-1">Scanner une facture</h3>
            <p className="text-sm text-blue-200">Prenez en photo et classez</p>
          </button>
          <div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-xl opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center mb-4"><Package size={24} className="text-gray-400"/></div>
            <h3 className="font-bold text-lg text-white mb-1">Gérer le stock</h3>
            <p className="text-sm text-gray-500">Bientôt disponible</p>
          </div>
          <div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-xl opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center mb-4"><FileText size={24} className="text-gray-400"/></div>
            <h3 className="font-bold text-lg text-white mb-1">Voir les rapports</h3>
            <p className="text-sm text-gray-500">Bientôt disponible</p>
          </div>
        </div>
      </main>
    </div>
  );
}