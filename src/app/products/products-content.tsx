'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, ArrowLeft, Archive, ShoppingCart, AlertCircle } from 'lucide-react';

type ProductStatus = 'all' | 'brute' | 'en_vente' | 'vendu' | 'casse';

export default function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [status, setStatus] = useState<ProductStatus>(
    (searchParams.get('status') as ProductStatus) || 'all'
  );
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
          .from('produits')
          .select('*')
          .eq('user_id', user.id);

        if (status !== 'all') {
          query = query.eq('statut', status);
        }

        const { data } = await query.order('created_at', { ascending: false });
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [status, supabase]);

  const filteredProducts = products.filter(p =>
    p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusCounts = {
    all: products.length,
    brute: products.filter(p => p.statut === 'brute').length,
    en_vente: products.filter(p => p.statut === 'en_vente').length,
    vendu: products.filter(p => p.statut === 'vendu').length,
    casse: products.filter(p => p.statut === 'casse' || p.statut === 'rebut').length
  };

  const statusLabels: Record<ProductStatus, string> = {
    all: 'Tous les produits',
    brute: 'Produits bruts',
    en_vente: 'En vente',
    vendu: 'Vendus',
    casse: 'Cassés/Rebuts'
  };

  const statusColors: Record<ProductStatus, string> = {
    all: 'text-gray-400 border-gray-600',
    brute: 'text-blue-400 border-blue-600',
    en_vente: 'text-yellow-400 border-yellow-600',
    vendu: 'text-green-400 border-green-600',
    casse: 'text-red-400 border-red-600'
  };

  const statusBgHover: Record<ProductStatus, string> = {
    all: 'hover:bg-gray-900/30',
    brute: 'hover:bg-blue-900/30',
    en_vente: 'hover:bg-yellow-900/30',
    vendu: 'hover:bg-green-900/30',
    casse: 'hover:bg-red-900/30'
  };

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Gestion des Produits</h1>
          <p className="text-gray-400">Gérez tous vos produits à partir d'une seule page</p>
        </div>

        {/* TABS/FILTERS */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {(['all', 'brute', 'en_vente', 'vendu', 'casse'] as ProductStatus[]).map(st => (
              <button
                key={st}
                onClick={() => {
                  setStatus(st);
                  router.push(`/products?status=${st}`);
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
                  status === st
                    ? `${statusColors[st]} bg-${st}-900/30 border-current`
                    : `text-gray-400 border-gray-700 ${statusBgHover[st]}`
                }`}
              >
                {statusLabels[st]}
                <span className="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded">
                  {statusCounts[st]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="🔍 Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* PRODUCTS GRID */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all cursor-pointer hover:shadow-lg"
                onClick={() => router.push(`/products/${product.id}`)}
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex-1 pr-2">
                    {product.nom?.substring(0, 30)}
                  </h3>
                  <span className={`text-xs px-3 py-1 rounded font-semibold whitespace-nowrap ${
                    product.statut === 'brute' ? 'bg-blue-900/30 text-blue-400' :
                    product.statut === 'en_vente' ? 'bg-yellow-900/30 text-yellow-400' :
                    product.statut === 'vendu' ? 'bg-green-900/30 text-green-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {product.statut === 'brute' ? 'Brut' :
                     product.statut === 'en_vente' ? 'En vente' :
                     product.statut === 'vendu' ? 'Vendu' :
                     'Cassé'}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-3 text-sm">
                  {product.lot_id && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Lot</span>
                      <span className="text-white font-semibold">#{product.lot_id.substring(0, 8)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Prix d'achat</span>
                    <span className="text-blue-400 font-semibold">{product.prix_achat?.toFixed(2) || '—'} €</span>
                  </div>
                  {product.prix_vente_final && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Prix de vente</span>
                      <span className="text-green-400 font-semibold">{product.prix_vente_final.toFixed(2)} €</span>
                    </div>
                  )}
                  {product.date_vente && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Vendu le</span>
                      <span className="text-gray-300 text-xs">
                        {new Date(product.date_vente).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
            <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Aucun produit {statusLabels[status].toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
