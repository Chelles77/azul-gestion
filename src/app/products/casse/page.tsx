'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Package, Trash2, AlertTriangle } from 'lucide-react';
import { Produit } from '@/lib/interfaces';

export default function ProduitsClassePage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [lotInfo, setLotInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchProduits() {
      const { data } = await supabase
        .from('produits')
        .select('*')
        .eq('statut', 'casse')
        .order('updated_at', { ascending: false });

      if (data) {
        setProduits(data);
        // Charger les infos des lots
        const lotIds = [...new Set(data.map(p => p.lot_id))];
        for (const lotId of lotIds) {
          const { data: lot } = await supabase
            .from('lots')
            .select('*')
            .eq('id', lotId)
            .single();
          if (lot) setLotInfo(prev => ({ ...prev, [lotId]: lot }));
        }
      }
      setLoading(false);
    }
    fetchProduits();
  }, []);

  async function deleteProduit(produitId: string, nom: string) {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" définitivement ?`)) return;

    const { error } = await supabase
      .from('produits')
      .delete()
      .eq('id', produitId);

    if (!error) {
      setProduits(produits.filter(p => p.id !== produitId));
    } else {
      alert('Erreur: ' + error.message);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={32} className="text-red-500" />
          <h1 className="text-3xl font-bold text-white">Produits Cassés</h1>
        </div>
        <p className="text-gray-400 mb-6">{produits.length} produits cassés ou en perte</p>

        {/* KPI CARDS */}
        {produits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-red-900/30 to-[#1a1a1a] p-6 rounded-xl border border-red-700">
              <p className="text-xs text-red-400 uppercase font-bold mb-2">💔 Produits Cassés</p>
              <p className="text-3xl font-bold text-red-400">{produits.length}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/30 to-[#1a1a1a] p-6 rounded-xl border border-orange-700">
              <p className="text-xs text-orange-400 uppercase font-bold mb-2">💰 Total Coûts Achat</p>
              <p className="text-3xl font-bold text-orange-400">
                {produits.reduce((sum, p) => sum + (p.prix_revient || 0), 0).toFixed(0)} €
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900/30 to-[#1a1a1a] p-6 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">📊 Perte Moyenne</p>
              <p className="text-3xl font-bold text-gray-400">
                {produits.length > 0 ? (produits.reduce((sum, p) => sum + (p.prix_revient || 0), 0) / produits.length).toFixed(0) : 0} €
              </p>
            </div>
          </div>
        )}

        {produits.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-gray-800">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Aucun produit cassé pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produits.map(produit => (
              <div key={produit.id} className="bg-[#1a1a1a] rounded-xl border border-red-900/50 overflow-hidden hover:border-red-700 transition-all flex flex-col">
                {/* Header avec lot et produit number */}
                <div className="bg-red-900/30 px-5 py-3 border-b border-red-900/50">
                  <p className="text-xs text-red-400">
                    Lot #{lotInfo[produit.lot_id]?.numerolot || produit.lot_id || '...'} | Prod #{produit.product_number || '...'}
                  </p>
                </div>

                <div className="relative h-48 bg-[#252525] flex items-center justify-center flex-shrink-0">
                  {produit.photos && produit.photos.length > 0 ? (
                    <img src={produit.photos[0]} alt={produit.nom} className="w-full h-full object-contain opacity-60" />
                  ) : (
                    <div className="text-gray-500 text-sm">Pas de photo</div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl opacity-75">💔</div>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-gray-300">
                    {produit.qr_code}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs px-2.5 py-1 bg-red-900/30 border border-red-700 rounded-full text-red-400 font-bold">
                      {produit.categorie}
                    </span>
                    {produit.marque && (
                      <span className="text-xs font-bold text-blue-400 bg-blue-900/30 border border-blue-800/50 px-2.5 py-1 rounded-full">
                        {produit.marque}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white mb-2 line-clamp-2">{produit.nom}</h3>

                  <div className="space-y-1 mb-4">
                    {produit.etat_produit && (
                      <p className="text-xs text-gray-400">
                        État: <span className="text-white">{produit.etat_produit}</span>
                      </p>
                    )}
                    {produit.etat_emballage && (
                      <p className="text-xs text-gray-400">
                        Emballage: <span className="text-white">{produit.etat_emballage}</span>
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-extrabold text-red-400 mb-1">
                      -{(produit.prix_revient || 0).toFixed(0)} €
                    </div>
                    <div className="text-xs text-gray-400">
                      Perte: <span className="text-gray-200">{(produit.prix_revient || 0).toFixed(0)} €</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto px-5 py-5 border-t border-red-900/50">
                  <button
                    onClick={() => deleteProduit(produit.id, produit.nom)}
                    className="w-full px-3 py-2 bg-red-900/30 border border-red-700 rounded-lg hover:bg-red-900/50 text-red-400 flex items-center justify-center gap-2 text-sm font-bold"
                  >
                    <Trash2 size={16} /> Supprimer définitivement
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
