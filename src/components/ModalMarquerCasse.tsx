'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Produit } from '@/lib/interfaces';

interface ModalMarquerCasseProps {
  produit: Produit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalMarquerCasse({ produit, isOpen, onClose, onSuccess }: ModalMarquerCasseProps) {
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
          {/* Produit Info */}
          <div className="bg-[#252525] p-4 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Produit</p>
            <p className="text-white font-bold line-clamp-2">{produit.nom}</p>
            {produit.prix_revient && (
              <p className="text-sm text-gray-400 mt-2">
                Perte: <span className="text-red-400 font-bold">{produit.prix_revient.toFixed(2)} €</span>
              </p>
            )}
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
