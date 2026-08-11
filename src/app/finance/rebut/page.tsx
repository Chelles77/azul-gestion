'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { AlertTriangle, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { Produit, Lot } from '@/lib/interfaces';

interface RebutStats {
  lot_id: string;
  lot_numero: string;
  prixAchat: number;
  nbRebutTotal: number;
  rebutCount: number;
  prixRebutTotal: number;
  prixRestantTotal: number;
  prixRebutPourcentage: number;
  produitsEnVente: number;
  prixMoyenOriginal: number;
  prixMoyenNouveau: number;
}

export default function RebutPage() {
  const supabase = createClient();
  const [rebutStats, setRebutStats] = useState<RebutStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLot, setExpandedLot] = useState<string | null>(null);
  const [rebutProducts, setRebutProducts] = useState<Record<string, Produit[]>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        // Récupérer tous les produits en rebut/cassé
        const { data: produits } = await supabase
          .from('produits')
          .select('*')
          .in('statut', ['rebut', 'casse'])
          .order('lot_id');

        // Récupérer tous les lots
        const { data: lots } = await supabase
          .from('lots')
          .select('*');

        if (produits && lots) {
          const lotsMap = new Map(lots.map((l: Lot) => [l.id, l]));

          // Grouper les rebuts par lot
          const rebutByLot = new Map<string, Produit[]>();
          produits.forEach((p: Produit) => {
            if (!rebutByLot.has(p.lot_id)) rebutByLot.set(p.lot_id, []);
            rebutByLot.get(p.lot_id)?.push(p);
          });

          // Calculer les stats par lot
          const stats: RebutStats[] = [];
          for (const [lotId, rebuts] of rebutByLot.entries()) {
            const lot = lotsMap.get(lotId);
            if (!lot) continue;

            const prixRebutTotal = rebuts.reduce((sum, p) => sum + (p.prix_revient || 0), 0);
            const prixRestantTotal = lot.prixAchat - prixRebutTotal;

            // Récupérer les produits en vente du même lot
            const { data: enVente } = await supabase
              .from('produits')
              .select('*')
              .eq('lot_id', lotId)
              .eq('statut', 'en_vente');

            const produitsEnVente = enVente?.length || 0;
            const prixMoyenOriginal = lot.prixAchat / (lot.nbpieces || 1);
            const prixMoyenNouveau = produitsEnVente > 0 ? prixRestantTotal / produitsEnVente : 0;

            stats.push({
              lot_id: lotId,
              lot_numero: lot.numerolot || lotId,
              prixAchat: lot.prixAchat,
              nbRebutTotal: lot.nbpieces || 0,
              rebutCount: rebuts.length,
              prixRebutTotal,
              prixRestantTotal,
              prixRebutPourcentage: ((prixRebutTotal / lot.prixAchat) * 100),
              produitsEnVente,
              prixMoyenOriginal,
              prixMoyenNouveau,
            });

            setRebutProducts(prev => ({
              ...prev,
              [lotId]: rebuts
            }));
          }

          setRebutStats(stats.sort((a, b) => b.prixRebutTotal - a.prixRebutTotal));
        }
      } catch (error) {
        console.error('Erreur chargement rebuts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  async function recalculatePrixRevient(lotId: string, stat: RebutStats) {
    if (stat.produitsEnVente === 0) return;

    const supabase = createClient();

    try {
      // Mettre à jour le prix_revient des produits en vente du lot
      const { data: enVente } = await supabase
        .from('produits')
        .select('id')
        .eq('lot_id', lotId)
        .eq('statut', 'en_vente');

      if (enVente) {
        for (const product of enVente) {
          await supabase
            .from('produits')
            .update({ prix_revient: stat.prixMoyenNouveau })
            .eq('id', product.id);
        }

        alert(`✅ Prix de revient recalculé pour ${enVente.length} produits en vente\nNouveaux prix: ${stat.prixMoyenNouveau.toFixed(2)}€`);
      }
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  const totalPerte = rebutStats.reduce((sum, s) => sum + s.prixRebutTotal, 0);
  const totalRebutCount = rebutStats.reduce((sum, s) => sum + s.rebutCount, 0);

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={32} className="text-red-500" />
          <h1 className="text-3xl font-bold text-white">Comptabilité des Rebuts</h1>
        </div>
        <p className="text-gray-400 mb-6">Suivi des pertes par lot et recalcul du prix de revient</p>

        {/* KPI GLOBAL */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-900/30 to-[#1a1a1a] p-6 rounded-xl border border-red-700">
            <p className="text-xs text-red-400 uppercase font-bold mb-2">💔 Total Rebuts</p>
            <p className="text-3xl font-bold text-red-400">{totalRebutCount}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-[#1a1a1a] p-6 rounded-xl border border-orange-700">
            <p className="text-xs text-orange-400 uppercase font-bold mb-2">💰 Perte Totale</p>
            <p className="text-3xl font-bold text-orange-400">{totalPerte.toFixed(0)} €</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/30 to-[#1a1a1a] p-6 rounded-xl border border-yellow-700">
            <p className="text-xs text-yellow-400 uppercase font-bold mb-2">📊 Lots Affectés</p>
            <p className="text-3xl font-bold text-yellow-400">{rebutStats.length}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-[#1a1a1a] p-6 rounded-xl border border-purple-700">
            <p className="text-xs text-purple-400 uppercase font-bold mb-2">⚠️ % Perte Moyen</p>
            <p className="text-3xl font-bold text-purple-400">
              {rebutStats.length > 0
                ? (rebutStats.reduce((sum, s) => sum + s.prixRebutPourcentage, 0) / rebutStats.length).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        {rebutStats.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-gray-800">
            <AlertTriangle size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Aucun rebut pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rebutStats.map(stat => (
              <div key={stat.lot_id} className="bg-[#1a1a1a] rounded-xl border border-red-900/50 overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedLot(expandedLot === stat.lot_id ? null : stat.lot_id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-[#252525] transition-colors border-b border-red-900/50"
                >
                  <div className="flex items-center gap-4 flex-grow text-left">
                    <div className="flex-1">
                      <p className="font-bold text-white">Lot #{stat.lot_numero}</p>
                      <p className="text-xs text-gray-400">{stat.rebutCount} rebuts / {stat.nbRebutTotal} produits</p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-400">-{stat.prixRebutTotal.toFixed(0)} €</p>
                      <p className="text-xs text-red-400 font-bold">{stat.prixRebutPourcentage.toFixed(1)}% du lot</p>
                    </div>
                  </div>

                  <div className="ml-4 text-gray-400">
                    <svg className={`w-6 h-6 transition-transform ${expandedLot === stat.lot_id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </button>

                {/* Contenu déroulé */}
                {expandedLot === stat.lot_id && (
                  <div className="p-6 bg-[#252525]/50 space-y-4">
                    {/* Stats détaillées */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">Lot Acheté</p>
                        <p className="font-bold text-white">{stat.prixAchat.toFixed(0)} €</p>
                      </div>

                      <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">Produits Restants</p>
                        <p className="font-bold text-green-400">{stat.produitsEnVente}</p>
                      </div>

                      <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">Prix/Prod (avant)</p>
                        <p className="font-bold text-blue-400">{stat.prixMoyenOriginal.toFixed(2)} €</p>
                      </div>

                      <div className="bg-[#1a1a1a] p-3 rounded-lg border border-orange-700">
                        <p className="text-xs text-orange-400 mb-1">Prix/Prod (après)</p>
                        <p className="font-bold text-orange-400">{stat.prixMoyenNouveau.toFixed(2)} €</p>
                        <p className="text-xs text-orange-300 mt-1">+{(stat.prixMoyenNouveau - stat.prixMoyenOriginal).toFixed(2)} €</p>
                      </div>
                    </div>

                    {/* Produits cassés */}
                    <div>
                      <p className="text-sm font-bold text-red-400 mb-2">Produits en Rebut :</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {rebutProducts[stat.lot_id]?.map(p => (
                          <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-[#1a1a1a] rounded border border-red-900/30">
                            <div>
                              <p className="text-white font-bold">{p.nom}</p>
                              <p className="text-gray-500">#{p.product_number || p.id.substring(0, 8)}</p>
                            </div>
                            <p className="text-red-400 font-bold">{p.prix_revient?.toFixed(2)} €</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bouton recalcul */}
                    {stat.produitsEnVente > 0 && (
                      <button
                        onClick={() => recalculatePrixRevient(stat.lot_id, stat)}
                        className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <TrendingDown size={18} />
                        Recalculer le prix de revient ({stat.produitsEnVente} produits)
                      </button>
                    )}

                    {stat.produitsEnVente === 0 && (
                      <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg text-yellow-400 text-sm">
                        ⚠️ Aucun produit en vente pour ce lot
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
