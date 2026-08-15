'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, Edit2, CheckCircle, Package, Filter, Trash2, QrCode, ArrowLeft, AlertCircle } from 'lucide-react';
import ModalModifier from '@/components/ModalModifier';
import ModalValider from '@/components/ModalValider';
import ModalMarquerCasse from '@/components/ModalMarquerCasse';
import { Produit } from '@/lib/interfaces';

type ProductStatus = 'all' | 'brute' | 'en_vente' | 'vendu' | 'casse';

export default function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [status, setStatus] = useState<ProductStatus>(
    (searchParams.get('status') as ProductStatus) || 'all'
  );
  const [products, setProducts] = useState<Produit[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isMarquingCasse, setIsMarquingCasse] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch lots
        const { data: lotsData } = await supabase
          .from('lots')
          .select('*')
          .eq('user_id', user.id);
        setLots(lotsData || []);

        // Fetch products
        let query = supabase
          .from('produits')
          .select('*')
          .eq('user_id', user.id);

        if (status !== 'all') {
          query = query.eq('statut', status);
        }

        const { data } = await query.order('product_number', { ascending: true });
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

  async function deleteProduit(id: string, nom: string) {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    try {
      await supabase.from('produits').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }

  const categoriesUniques = [...new Set(products.map(p => p.categorie))].filter(Boolean);

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

        {/* TABS */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-full md:min-w-0">
            {(['all', 'brute', 'en_vente', 'vendu', 'casse'] as ProductStatus[]).map(st => (
              <button
                key={st}
                onClick={() => {
                  setStatus(st);
                  router.push(`/products?status=${st}`);
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap border ${
                  status === st
                    ? 'bg-blue-900/30 text-blue-400 border-blue-600'
                    : 'text-gray-400 border-gray-700 hover:border-gray-600'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => {
              const lot = lots.find(l => l.id === product.lot_id);
              const lotNumber = lot?.numerolot || 'N/A';
              return (
                <div key={product.id} className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all flex flex-col">
                  {/* Header avec numéros */}
                  <div className="bg-[#252525] border-b border-gray-700 px-4 py-2 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Lot #{lotNumber}</span>
                    <span className="text-xs font-bold text-blue-400">Prod #{product.product_number || index + 1}</span>
                  </div>

                  {/* Image Area */}
                  <div className="relative bg-[#252525] h-48 flex items-center justify-center">
                    {product.photos && product.photos.length > 0 ? (
                      <img src={product.photos[0]} alt={product.nom} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-gray-500 text-center">
                        <Upload size={32} className="mx-auto mb-2" />
                        <span className="text-sm">Ajouter photo</span>
                      </div>
                    )}
                    {product.qr_code && (
                      <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-gray-300 border border-gray-700">
                        {product.qr_code}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-[#252525] border border-gray-700 rounded-full text-gray-400">
                        {product.categorie || 'N/A'}
                      </span>
                      {product.marque && (
                        <span className="text-xs px-2 py-1 bg-blue-900/30 border border-blue-800/50 rounded-full text-blue-400 font-bold">
                          {product.marque}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white mb-1 line-clamp-2 text-sm">{product.nom}</h3>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2 flex-1">{product.description || '—'}</p>

                    <div className="mb-3">
                      <div className="text-xl font-extrabold text-white">{product.prix_neuf?.toFixed(0) || '—'} €</div>
                      <div className="text-xs text-gray-500">
                        Revient: <span className="text-gray-200 font-bold">{product.prix_revient?.toFixed(0) || '—'} €</span>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-800">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsModifying(true);
                        }}
                        className="flex-1 px-2 py-2 bg-[#252525] border border-gray-700 rounded text-xs font-medium text-gray-300 hover:bg-[#333] transition-all flex items-center justify-center gap-1"
                      >
                        <Edit2 size={12} /> Modifier
                      </button>
                      <button className="px-2 py-2 bg-[#252525] border border-gray-700 rounded hover:bg-[#333] transition-all">
                        <QrCode size={14} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsValidating(true);
                        }}
                        className="px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all flex items-center justify-center"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsMarquingCasse(true);
                        }}
                        className="px-2 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded border border-red-700/50 transition-all"
                        title="Marquer comme cassé"
                      >
                        💔
                      </button>
                      <button
                        onClick={() => deleteProduit(product.id, product.nom)}
                        className="px-2 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded border border-red-600/30 transition-all"
                        title="Supprimer ce produit"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-gray-800">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Aucun produit {statusLabels[status].toLowerCase()}</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ModalModifier
        product={selectedProduct}
        isOpen={isModifying}
        onClose={() => {
          setIsModifying(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          setProducts(products.map(p => p.id === selectedProduct?.id ? { ...p } : p));
          setIsModifying(false);
          setSelectedProduct(null);
        }}
      />

      <ModalValider
        product={selectedProduct}
        isOpen={isValidating}
        onClose={() => {
          setIsValidating(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          setProducts(products.filter(p => p.id !== selectedProduct?.id));
          setIsValidating(false);
          setSelectedProduct(null);
        }}
      />

      <ModalMarquerCasse
        produit={selectedProduct}
        lotInfo={lots.find(l => l.id === selectedProduct?.lot_id)}
        isOpen={isMarquingCasse}
        onClose={() => {
          setIsMarquingCasse(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          setProducts(products.filter(p => p.id !== selectedProduct?.id));
          setIsMarquingCasse(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}
