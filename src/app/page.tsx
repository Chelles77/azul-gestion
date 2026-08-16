// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign, Package, Activity, ArrowRight, Plus } from 'lucide-react';

interface LotStats {
  id: string;
  numerolot: string;
  created_at: string;
  couttotal: number;
  prixneuftotal: number;
  coef_brut: number | null;
  nb_pieces_vendables?: number;
  nb_pieces_total?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [lots, setLots] = useState<LotStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ capital: 0, ca: 0, benefice: 0, rotation: 0 });

  useEffect(() => {
    async function fetchData() {
      // Récupérer les lots
      const { data: lotsData } = await supabase
        .from('lots')
        .select('*')
        .order('created_at', { ascending: false });

      if (lotsData) {
        setLots(lotsData);
        
        // Calculer les stats globales
        const totalCapital = lotsData.reduce((sum, lot) => sum + (lot.couttotal || 0), 0);
        const totalPrixNeuf = lotsData.reduce((sum, lot) => sum + (lot.prixneuftotal || 0), 0);
        // Le CA et le bénéfice seront mis à jour quand on aura des ventes
        // Pour l'instant, on affiche le potentiel
        setStats({
          capital: totalCapital,
          ca: 0, // À remplacer par la somme des ventes réelles plus tard
          benefice: 0 - totalCapital, // Pertes actuelles tant qu'aucune vente
          rotation: 0
        });
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#111111] flex items-center justify-center text-white">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Performance des Lots</h1>
          <p className="text-gray-400">Suivi détaillé de vos achats, ventes et rentabilité par lot.</p>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <div className="bg-[#1a1a1a] p-4 md:p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center text-center">
            <div className="p-2 bg-blue-500/10 rounded-lg mb-2"><DollarSign size={16} className="text-blue-400" /></div>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 line-clamp-2">Capital Investi</span>
            <div className="text-lg md:text-2xl font-bold text-white break-words overflow-hidden">{stats.capital.toFixed(2)} €</div>
          </div>

          <div className="bg-[#1a1a1a] p-4 md:p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center text-center">
            <div className="p-2 bg-green-500/10 rounded-lg mb-2"><TrendingUp size={16} className="text-green-400" /></div>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 line-clamp-2">Chiffre d'Affaires</span>
            <div className="text-lg md:text-2xl font-bold text-white break-words overflow-hidden">{stats.ca.toFixed(2)} €</div>
          </div>

          <div className="bg-[#1a1a1a] p-4 md:p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center text-center">
            <div className="p-2 bg-red-500/10 rounded-lg mb-2"><Activity size={16} className="text-red-400" /></div>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 line-clamp-2">Bénéfice Net</span>
            <div className={`text-lg md:text-2xl font-bold break-words overflow-hidden ${stats.benefice >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.benefice.toFixed(2)} €
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-4 md:p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center text-center">
            <div className="p-2 bg-purple-500/10 rounded-lg mb-2"><Package size={16} className="text-purple-400" /></div>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 line-clamp-2">Taux de Rotation</span>
            <div className="text-lg md:text-2xl font-bold text-white break-words overflow-hidden">{stats.rotation}%</div>
          </div>
        </div>

        {/* LISTE DES LOTS */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Détails par Lot
          </h2>
          <button 
            onClick={() => router.push('/organizer')} // Ou ta page de création de lot
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Nouveau Lot
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lots.map((lot) => {
            const coef = lot.coef_brut || (lot.prixneuftotal > 0 ? lot.couttotal / lot.prixneuftotal : 0);
            const coutReelPiece = lot.nb_pieces_total && lot.nb_pieces_total > 0 
              ? lot.couttotal / lot.nb_pieces_total 
              : 0;

            return (
              <div key={lot.id} className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all shadow-lg flex flex-col">
                {/* Header Carte */}
                <div className="p-5 border-b border-gray-800 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{lot.numerolot}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(lot.created_at).toLocaleDateString('fr-FR')} • B-Stock
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                    {(coef * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Stats Carte */}
                <div className="p-5 space-y-3 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Coût Total</span>
                    <span className="font-medium text-white">{lot.couttotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Coût / Palette</span>
                    <span className="font-medium text-blue-400">{(lot.couttotal / 4).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pièces Vendables</span>
                    <span className="font-medium text-orange-400">
                      {lot.nb_pieces_vendables || 0} / {lot.nb_pieces_total || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-800">
                    <span className="text-gray-400">Coût Réel / Pièce</span>
                    <span className="font-bold text-white">{coutReelPiece.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Actions Carte */}
                <div className="p-4 bg-[#151515] border-t border-gray-800 flex gap-3">
                  <button 
                    onClick={() => router.push(`/products/brute?lot=${lot.id}`)}
                    className="flex-1 px-3 py-2 bg-[#252525] hover:bg-[#333333] text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Voir les produits <ArrowRight size={14} />
                  </button>
                  <button 
                    onClick={() => router.push(`/products/vente?lot=${lot.id}`)}
                    className="px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Ajouter vente
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}