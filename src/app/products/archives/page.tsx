'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Package } from 'lucide-react';
import { Produit } from '@/lib/interfaces';

export default function ProduitsArchivesPage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduits() {
      const { data } = await supabase
        .from('produits')
        .select('*')
        .eq('statut', 'archive')
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
        <h1 className="text-3xl font-bold text-white mb-2">Archives Produits</h1>
        <p className="text-gray-400 mb-8">{produits.length} produits archivés</p>

        {produits.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-gray-800">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Aucun produit archivé pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produits.map(produit => (
              <div key={produit.id} className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
                <div className="relative h-48 bg-[#252525] flex items-center justify-center">
                  {produit.photos && produit.photos.length > 0 ? (
                    <img src={produit.photos[0]} alt={produit.nom} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-gray-500 text-sm">Pas de photo</div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs px-2.5 py-1 bg-[#252525] border border-gray-700 rounded-full text-gray-400">
                      {produit.categorie}
                    </span>
                  </div>

                  <h3 className="font-bold text-white mb-2 line-clamp-2">{produit.nom}</h3>

                  <div className="text-2xl font-extrabold text-gray-400">
                    {produit.prix_estime_vente ? `${produit.prix_estime_vente.toFixed(0)} €` : 'N/A'}
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
