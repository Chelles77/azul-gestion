'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Produit } from '@/lib/interfaces';

interface ModalArchiverProps {
  product: Produit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalArchiver({ product, isOpen, onClose, onSuccess }: ModalArchiverProps) {
  const [prixVente, setPrixVente] = useState('');
  const [platformeVente, setPlatformeVente] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const platformes = product.plateformes_vente || [];

  const handleArchive = async () => {
    if (!prixVente || !platformeVente) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const prix = parseFloat(prixVente);
    if (isNaN(prix) || prix <= 0) {
      setError('Le prix doit être un nombre positif');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase
        .from('produits')
        .update({
          statut: 'vendu',
          prix_vente_final: prix,
          plateforme_vente_finale: platformeVente,
          date_vente: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
      setPrixVente('');
      setPlatformeVente('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'archivage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Archiver le produit</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info produit */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Produit</p>
            <p className="text-lg font-bold text-white">{product.nom}</p>
          </div>

          {/* Alerte plateformes */}
          <div className="flex gap-3 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-400 font-bold mb-1">⚠️ Important</p>
              <p className="text-sm text-yellow-300">
                Ce produit sera retiré de : <span className="font-bold">{platformes.join(', ')}</span>
              </p>
            </div>
          </div>

          {/* Plateforme de vente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📍 Sur quelle plateforme l'avez-vous vendu ? *
            </label>
            <select
              value={platformeVente}
              onChange={e => setPlatformeVente(e.target.value)}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            >
              <option value="">Sélectionner une plateforme...</option>
              {platformes.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Prix de vente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              💰 Prix de vente final (€) *
            </label>
            <input
              type="number"
              value={prixVente}
              onChange={e => setPrixVente(e.target.value)}
              placeholder="Ex: 350"
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Résumé financier */}
          {prixVente && (
            <div className="bg-[#252525] p-4 rounded-lg border border-gray-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prix d'achat:</span>
                <span className="text-white font-bold">{product.prix_revient.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prix de vente:</span>
                <span className="text-green-400 font-bold">{parseFloat(prixVente).toFixed(2)} €</span>
              </div>
              <div className="border-t border-gray-600 pt-2 flex justify-between text-sm">
                <span className="text-gray-300">Bénéfice brut:</span>
                <span className={`font-bold ${parseFloat(prixVente) - product.prix_revient >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(parseFloat(prixVente) - product.prix_revient).toFixed(2)} €
                </span>
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-800/50">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 font-medium rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleArchive}
              disabled={loading || !prixVente || !platformeVente}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Archivage...
                </>
              ) : (
                '✓ Archiver'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
