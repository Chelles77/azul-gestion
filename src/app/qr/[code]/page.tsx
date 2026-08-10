'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Produit } from '@/lib/interfaces';
import { Edit2, Save, X, Check, AlertCircle } from 'lucide-react';

export default function QRProductPage({ params }: { params: { code: string } }) {
  const [product, setProduct] = useState<Produit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    nom: '',
    description: '',
    prix_estime_vente: 0,
    statut: 'brute' as const,
    plateforme_vente: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [params.code]);

  const loadProduct = async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('produits')
        .select('*')
        .eq('qr_code', params.code)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Produit non trouvé');

      setProduct(data);
      setEditData({
        nom: data.nom,
        description: data.description || '',
        prix_estime_vente: data.prix_estime_vente || 0,
        statut: data.statut,
        plateforme_vente: (data as any).plateforme_vente || ''
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('produits')
        .update({
          nom: editData.nom,
          description: editData.description,
          prix_estime_vente: editData.prix_estime_vente,
          statut: editData.statut,
          plateforme_vente: editData.plateforme_vente,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      setProduct({ ...product, ...editData });
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white p-4">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-lg font-bold mb-2">Produit non trouvé</p>
          <p className="text-sm text-gray-400">{error || 'Le QR code ne correspond à aucun produit'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Photo */}
        {product.photos && product.photos.length > 0 && (
          <div className="mb-6 rounded-lg overflow-hidden bg-[#1a1a1a]">
            <img src={product.photos[0]} alt={product.nom} className="w-full h-48 object-contain" />
          </div>
        )}

        {/* QR Code Info */}
        <div className="bg-[#1e1e1e] rounded-lg p-4 mb-6 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">QR CODE</p>
          <p className="font-mono text-sm text-blue-400">{product.qr_code}</p>
        </div>

        {/* Infos Edit */}
        {editing ? (
          <div className="space-y-4 mb-6">
            {/* Titre */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase">Titre</label>
              <input
                type="text"
                value={editData.nom}
                onChange={(e) => setEditData({ ...editData, nom: e.target.value })}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase">Description</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none resize-none"
              />
            </div>

            {/* Prix Estimé */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase">Prix de Vente</label>
              <input
                type="number"
                value={editData.prix_estime_vente}
                onChange={(e) => setEditData({ ...editData, prix_estime_vente: parseFloat(e.target.value) })}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Plateforme */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase">Plateforme de Vente</label>
              <select
                value={editData.plateforme_vente}
                onChange={(e) => setEditData({ ...editData, plateforme_vente: e.target.value })}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              >
                <option value="">Sélectionner...</option>
                <option value="ebay">eBay</option>
                <option value="amazon">Amazon</option>
                <option value="leboncoin">LeBonCoin</option>
                <option value="vinted">Vinted</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase">Statut</label>
              <select
                value={editData.statut}
                onChange={(e) => setEditData({ ...editData, statut: e.target.value as any })}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              >
                <option value="brute">Brute (non validé)</option>
                <option value="en_vente">En Vente</option>
                <option value="vendu">Vendu</option>
                <option value="archive">Archivé</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-[#252525] hover:bg-[#333] border border-gray-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <X size={18} /> Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {/* Titre */}
            <div className="bg-[#1e1e1e] rounded-lg p-4 border border-gray-800">
              <p className="text-xs text-gray-500 mb-2 uppercase">Titre</p>
              <p className="text-lg font-bold text-white">{product.nom}</p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-[#1e1e1e] rounded-lg p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-2 uppercase">Description</p>
                <p className="text-sm text-gray-300">{product.description}</p>
              </div>
            )}

            {/* Prices */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#1e1e1e] rounded-lg p-3 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1 uppercase">Prix Neuf</p>
                <p className="text-xl font-bold text-white">{product.prix_neuf.toFixed(0)}€</p>
              </div>
              <div className="bg-[#1e1e1e] rounded-lg p-3 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1 uppercase">Prix Revient</p>
                <p className="text-xl font-bold text-orange-400">{product.prix_revient.toFixed(0)}€</p>
              </div>
            </div>

            {/* Prix de Vente */}
            {product.prix_estime_vente && (
              <div className="bg-green-900/20 rounded-lg p-4 border border-green-800">
                <p className="text-xs text-green-500 mb-2 uppercase">Prix de Vente Estimé</p>
                <p className="text-2xl font-bold text-green-400">{product.prix_estime_vente.toFixed(0)}€</p>
              </div>
            )}

            {/* Plateforme */}
            {(product as any).plateforme_vente && (
              <div className="bg-[#1e1e1e] rounded-lg p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-2 uppercase">Plateforme</p>
                <p className="text-sm font-bold text-blue-400 capitalize">{(product as any).plateforme_vente}</p>
              </div>
            )}

            {/* Statut */}
            <div className={`rounded-lg p-4 border ${
              product.statut === 'vendu' ? 'bg-red-900/20 border-red-800' :
              product.statut === 'en_vente' ? 'bg-green-900/20 border-green-800' :
              'bg-[#1e1e1e] border-gray-800'
            }`}>
              <p className="text-xs text-gray-500 mb-2 uppercase">Statut</p>
              <p className={`text-sm font-bold capitalize ${
                product.statut === 'vendu' ? 'text-red-400' :
                product.statut === 'en_vente' ? 'text-green-400' :
                'text-gray-300'
              }`}>
                {product.statut === 'brute' ? 'Non validé' :
                 product.statut === 'en_vente' ? 'En vente' :
                 product.statut === 'vendu' ? 'Vendu' : 'Archivé'}
              </p>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-lg"
            >
              <Edit2 size={20} /> Modifier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
