'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Produit } from '@/lib/interfaces';

interface ModalMarquerCasseProps {
  produit: Produit | null;
  lotInfo?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalMarquerCasse({ produit, lotInfo, isOpen, onClose, onSuccess }: ModalMarquerCasseProps) {
  const [raison, setRaison] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !produit) return null;

  async function handleMarquerCasse() {
    setLoading(true);
    setError('');
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase
        .from('produits')
        .update({
          statut: 'casse',
          updated_at: new Date().toISOString()
        })
        .eq('id', produit.id);

      if (updateError) throw updateError;

      console.log(`✅ Produit marqué comme cassé: ${produit.nom}`);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setRaison('');
    setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-red-900/50 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="border-b border-red-900/50 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-red-500" />
            <h2 className="text-xl font-bold text-white">Marquer comme Cassé</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info Produit avec Image */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              {produit.photos && produit.photos.length > 0 ? (
                <img src={produit.photos[0]} alt={produit.nom} className="w-full h-32 object-contain rounded-lg bg-[#252525] border border-gray-700" />
              ) : (
                <div className="w-full h-32 bg-[#252525] border border-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                  Pas de photo
                </div>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <div className="bg-[#252525] p-3 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Produit</p>
                <p className="text-white font-bold text-sm line-clamp-2">{produit.nom}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#252525] p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Lot</p>
                  <p className="text-white font-bold text-sm">#{lotInfo?.numerolot || produit.lot_id?.substring(0, 8)}</p>
                </div>
                <div className="bg-[#252525] p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Produit #</p>
                  <p className="text-white font-bold text-sm">{produit.product_number || '...'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prix & Coeff */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-3 rounded-lg border border-blue-700">
              <p className="text-xs text-blue-400 font-bold mb-1">Prix Neuf</p>
              <p className="text-lg font-bold text-blue-400">{(produit.prix_neuf || 0).toFixed(0)} €</p>
            </div>
            <div className="bg-gradient-to-br from-orange-900/30 to-[#1a1a1a] p-3 rounded-lg border border-orange-700">
              <p className="text-xs text-orange-400 font-bold mb-1">Prix Revient</p>
              <p className="text-lg font-bold text-orange-400">{(produit.prix_revient || 0).toFixed(2)} €</p>
            </div>
          </div>

          {/* Coeff Achat */}
          {produit.coef_revient && (
            <div className="bg-gradient-to-br from-purple-900/30 to-[#1a1a1a] p-3 rounded-lg border border-purple-700">
              <p className="text-xs text-purple-400 font-bold mb-1">Coefficient d'Achat</p>
              <p className="text-lg font-bold text-purple-400">{(produit.coef_revient * 100).toFixed(1)}%</p>
            </div>
          )}

          {/* Catégorie & Marque */}
          <div className="grid grid-cols-2 gap-3">
            {produit.categorie && (
              <div className="bg-[#252525] p-3 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400">Catégorie</p>
                <p className="text-white font-bold text-sm">{produit.categorie}</p>
              </div>
            )}
            {produit.marque && (
              <div className="bg-[#252525] p-3 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400">Marque</p>
                <p className="text-white font-bold text-sm">{produit.marque}</p>
              </div>
            )}
          </div>

          {/* Perte */}
          <div className="bg-gradient-to-br from-red-900/30 to-[#1a1a1a] p-4 rounded-lg border border-red-700">
            <p className="text-xs text-red-400 font-bold mb-1">Perte si Cassé</p>
            <p className="text-2xl font-bold text-red-400">-{(produit.prix_revient || 0).toFixed(2)} €</p>
            <p className="text-xs text-gray-500 mt-1">Sera ajouté aux rebuts</p>
          </div>

          {/* Warning */}
          <div className="bg-red-900/20 border border-red-800/50 p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">
              Ce produit sera marqué comme cassé/perte totale et disparaîtra de la liste des produits bruts.
            </p>
          </div>

          {/* Raison */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Raison du dégât (optionnel)
            </label>
            <textarea
              value={raison}
              onChange={e => setRaison(e.target.value)}
              placeholder="Ex: Casse à la réception, emballage déchiré, composant endommagé..."
              rows={3}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-800/50">
              <AlertTriangle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 font-medium rounded-lg"
            >
              Annuler
            </button>

            <button
              onClick={handleMarquerCasse}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : '💔'}
              {loading ? 'Marquage...' : 'Confirmer - Marquer Cassé'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
