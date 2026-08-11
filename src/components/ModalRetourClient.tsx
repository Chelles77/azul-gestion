'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Produit } from '@/lib/interfaces';

interface ModalRetourClientProps {
  produit: Produit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalRetourClient({ produit, isOpen, onClose, onSuccess }: ModalRetourClientProps) {
  const [etatProduit, setEtatProduit] = useState('bon');
  const [raison, setRaison] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !produit) return null;

  const handleRemettreEnVente = async () => {
    if (etatProduit !== 'bon') {
      setError('Seuls les produits en bon état peuvent être remis en vente');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('produits')
      .update({
        statut: 'en_vente',
        updated_at: new Date().toISOString()
      })
      .eq('id', produit.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      onSuccess();
      handleClose();
    }
    setLoading(false);
  };

  const handleRejeter = async () => {
    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('produits')
      .update({
        statut: 'rebut',
        updated_at: new Date().toISOString()
      })
      .eq('id', produit.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      onSuccess();
      handleClose();
    }
    setLoading(false);
  };

  const handleClose = () => {
    setEtatProduit('bon');
    setRaison('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-800 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Gestion Retour Client</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info Produit */}
          <div className="bg-[#252525] p-4 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Produit</p>
            <p className="text-white font-bold">{produit.nom}</p>
            <p className="text-xs text-gray-500 mt-2">Prix vente: {(produit.prix_vente_final || 0).toFixed(0)} €</p>
          </div>

          {/* État Produit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">État du produit retourné</label>
            <div className="space-y-2">
              <button
                onClick={() => setEtatProduit('bon')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  etatProduit === 'bon'
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-gray-700 bg-[#252525] hover:border-green-500/50'
                }`}
              >
                <CheckCircle size={20} className={etatProduit === 'bon' ? 'text-green-400' : 'text-gray-500'} />
                <span className={etatProduit === 'bon' ? 'text-green-400 font-bold' : 'text-gray-300'}>
                  ✅ Bon état - Remettre en vente
                </span>
              </button>

              <button
                onClick={() => setEtatProduit('mauvais')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  etatProduit === 'mauvais'
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-gray-700 bg-[#252525] hover:border-red-500/50'
                }`}
              >
                <XCircle size={20} className={etatProduit === 'mauvais' ? 'text-red-400' : 'text-gray-500'} />
                <span className={etatProduit === 'mauvais' ? 'text-red-400 font-bold' : 'text-gray-300'}>
                  ❌ Mauvais état - Rejeter
                </span>
              </button>
            </div>
          </div>

          {/* Raison (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Raison du retour (optionnel)</label>
            <textarea
              value={raison}
              onChange={e => setRaison(e.target.value)}
              placeholder="Ex: Rayure, pièce cassée..."
              rows={2}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-800/50">
              <AlertCircle size={18} />
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
            {etatProduit === 'bon' ? (
              <button
                onClick={handleRemettreEnVente}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Traitement...
                  </>
                ) : (
                  '✅ Remettre en vente'
                )}
              </button>
            ) : (
              <button
                onClick={handleRejeter}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Traitement...
                  </>
                ) : (
                  '❌ Rejeter'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
