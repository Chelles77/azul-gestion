'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Archive, RotateCcw, DollarSign } from 'lucide-react';

interface LotsAnalytics {
  id: string;
  numerolot: string;
  statut: string;
  couttotal: number;
  totalVentes: number;
  totalRevient: number;
  roi: number;
  produitsVendus: number;
  produitsTotaux: number;
  tauxVente: number;
  archived_at?: string;
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allLots, setAllLots] = useState<LotsAnalytics[]>([]);
  const [activeLots, setActiveLots] = useState<LotsAnalytics[]>([]);
  const [archivedLots, setArchivedLots] = useState<LotsAnalytics[]>([]);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Récupérer tous les lots avec leurs données
      const { data: lots } = await supabase
        .from('lots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!lots) {
        setLoading(false);
        return;
      }

      // Pour chaque lot, calculer les stats
      const lotsWithStats = await Promise.all(
        lots.map(async (lot) => {
          // Compter les ventes
          const { data: ventes } = await supabase
            .from('produits')
            .select('prix_vente_final, prix_revient')
            .eq('lot_id', lot.id)
            .eq('statut', 'vendu');

          const { data: allProducts } = await supabase
            .from('produits')
            .select('id')
            .eq('lot_id', lot.id);

          const totalVentes = (ventes || []).reduce((sum, v) => sum + (v.prix_vente_final || 0), 0);
          const totalRevient = (ventes || []).reduce((sum, v) => sum + (v.prix_revient || 0), 0);
          const roi = totalVentes - lot.couttotal;
          const produitsVendus = ventes?.length || 0;
          const produitsTotaux = allProducts?.length || lot.nombre_produits_total || 0;
          const tauxVente = produitsTotaux > 0 ? (produitsVendus / produitsTotaux) * 100 : 0;

          return {
            ...lot,
            totalVentes,
            totalRevient,
            roi,
            produitsVendus,
            produitsTotaux,
            tauxVente
          };
        })
      );

      const active = lotsWithStats.filter(l => l.statut === 'actif');
      const archived = lotsWithStats.filter(l => l.statut === 'archive');

      setAllLots(lotsWithStats);
      setActiveLots(active);
      setArchivedLots(archived);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestoreLot(lotId: string) {
    if (!window.confirm('Restaurer ce lot?')) return;
    setIsRestoring(lotId);
    try {
      await supabase
        .from('lots')
        .update({ statut: 'actif', archived_at: null })
        .eq('id', lotId);
      await fetchAnalytics();
    } catch (error) {
      alert('Erreur: ' + (error as any).message);
    } finally {
      setIsRestoring(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const globalROI = allLots.reduce((sum, l) => sum + l.roi, 0);
  const globalVentes = allLots.reduce((sum, l) => sum + l.totalVentes, 0);
  const globalCouts = allLots.reduce((sum, l) => sum + l.couttotal, 0);

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytique Générale</h1>
          <p className="text-gray-400">Vue complète de vos performances et historique</p>
        </div>

        {/* VUE GLOBALE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1a1a] border border-green-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-green-400 font-semibold">Total Investi</span>
              <DollarSign size={20} className="text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">{globalCouts.toFixed(0)} €</p>
            <p className="text-xs text-gray-500 mt-2">{allLots.length} lots</p>
          </div>

          <div className="bg-[#1a1a1a] border border-blue-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">Total Ventes</span>
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">{globalVentes.toFixed(0)} €</p>
            <p className="text-xs text-gray-500 mt-2">{allLots.reduce((sum, l) => sum + l.produitsVendus, 0)} produits</p>
          </div>

          <div className={`bg-[#1a1a1a] border rounded-xl p-6 ${globalROI >= 0 ? 'border-emerald-700' : 'border-red-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs uppercase tracking-wider font-semibold ${globalROI >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Total Bénéfice
              </span>
              {globalROI >= 0 ? (
                <TrendingUp size={20} className="text-emerald-400" />
              ) : (
                <TrendingDown size={20} className="text-red-400" />
              )}
            </div>
            <p className={`text-3xl font-bold ${globalROI >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {globalROI.toFixed(0)} €
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {globalCouts > 0 ? ((globalROI / globalCouts) * 100).toFixed(1) : 0}% ROI
            </p>
          </div>
        </div>

        {/* LOTS ACTIFS */}
        {activeLots.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">📦 Lots Actifs ({activeLots.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeLots.map((lot) => (
                <div key={lot.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all">
                  <h3 className="text-lg font-bold text-white mb-4">Lot #{lot.numerolot}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coût total</span>
                      <span className="text-white font-semibold">{lot.couttotal.toFixed(0)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ventes</span>
                      <span className="text-green-400 font-semibold">{lot.totalVentes.toFixed(0)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bénéfice</span>
                      <span className={`font-semibold ${lot.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {lot.roi.toFixed(0)} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Taux vente</span>
                      <span className="text-blue-400 font-semibold">{lot.tauxVente.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Produits</span>
                      <span className="text-white font-semibold">{lot.produitsVendus}/{lot.produitsTotaux}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOTS ARCHIVÉS */}
        {archivedLots.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">🗂️ Lots Archivés ({archivedLots.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedLots.map((lot) => (
                <div key={lot.id} className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-6 opacity-75 hover:opacity-100 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-300">Lot #{lot.numerolot}</h3>
                    <Archive size={18} className="text-gray-500" />
                  </div>
                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Coût total</span>
                      <span className="text-gray-300 font-semibold">{lot.couttotal.toFixed(0)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ventes</span>
                      <span className="text-gray-300 font-semibold">{lot.totalVentes.toFixed(0)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bénéfice final</span>
                      <span className={`font-semibold ${lot.roi >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {lot.roi.toFixed(0)} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Archivé le</span>
                      <span className="text-gray-300 text-xs">
                        {lot.archived_at ? new Date(lot.archived_at).toLocaleDateString('fr-FR') : '-'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreLot(lot.id)}
                    disabled={isRestoring === lot.id}
                    className="w-full px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> {isRestoring === lot.id ? 'Restauration...' : 'Restaurer'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {allLots.length === 0 && (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-gray-800">
            <p className="text-gray-400">Aucun lot pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
