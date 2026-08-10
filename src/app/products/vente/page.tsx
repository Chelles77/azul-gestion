'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Package, QrCode, Edit2 } from 'lucide-react';
import { Produit } from '@/lib/interfaces';

export default function ProduitsEnVentePage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduits() {
      const { data } = await supabase
        .from('produits')
        .select('*')
        .eq('statut', 'en_vente')
        .order('updated_at', { ascending: false });

      if (data) setProduits(data);
      setLoading(false);
    }
    fetchProduits();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Produits En Vente</h1>
        <p className="text-gray-400 mb-8">{produits.length} produits actuellement en vente</p>

        {produits.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-gray-800">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Aucun produit en vente pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produits.map(produit => (
              <div key={produit.id} className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all">
                <div className="relative h-48 bg-[#252525] flex items-center justify-center">
                  {produit.photos && produit.photos.length > 0 ? (
                    <img src={produit.photos[0]} alt={produit.nom} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-gray-500 text-sm">Pas de photo</div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-gray-300">
                    {produit.qr_code}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs px-2.5 py-1 bg-[#252525] border border-gray-700 rounded-full text-gray-400">
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
                    <div className="text-2xl font-extrabold text-green-400 mb-1">
                      {produit.prix_estime_vente ? `${produit.prix_estime_vente.toFixed(0)} €` : 'Prix non défini'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Revient: <span className="text-gray-200">{produit.prix_revient.toFixed(0)} €</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-800">
                    <button className="flex-1 px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg hover:bg-[#333] flex items-center justify-center gap-1 text-sm text-gray-300">
                      <Edit2 size={14} /> Modifier
                    </button>
                    <button className="px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg hover:bg-[#333] flex items-center justify-center">
                      <QrCode size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
