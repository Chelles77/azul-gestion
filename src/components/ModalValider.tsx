'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Produit } from '@/lib/interfaces';

interface ModalValiderProps {
  product: Produit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalValider({ product, isOpen, onClose, onSuccess }: ModalValiderProps) {
  const [nom, setNom] = useState('');
  const [etatProduit, setEtatProduit] = useState('');
  const [etatEmballage, setEtatEmballage] = useState('');
  const [prixVente, setPrixVente] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ETAT_PRODUIT_OPTIONS = [
    { value: 'neuf_sous_plastique', label: '🟢 Neuf sous plastique' },
    { value: 'tres_bon_etat', label: '⭐ Très bon état' },
    { value: 'bon_etat', label: '👍 Bon état' },
    { value: 'occasion_comme_neuf', label: '✨ Occasion comme neuf' },
    { value: 'a_reparer', label: '🔧 À réparer' },
  ];

  const ETAT_EMBALLAGE_OPTIONS = [
    { value: 'neuf', label: '📦 Neuf' },
    { value: 'bon', label: '👍 Bon' },
    { value: 'coupe', label: '✂️ Coupé' },
    { value: 'abime', label: '⚠️ Abîmé' },
    { value: 'pas_emballage', label: '❌ Pas d\'emballage' },
  ];

  useEffect(() => {
    if (product && isOpen) {
      setNom(product.nom || '');
      setDescription(product.description || '');
      setPrixVente(product.prix_estime_vente?.toString() || '');
      setEtatProduit(product.etat_produit || '');
      setEtatEmballage(product.etat_emballage || '');
      setError('');
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom || !etatProduit || !etatEmballage || !prixVente) {
      setError('❌ Tous les champs sont obligatoires');
      return;
    }

    if (parseFloat(prixVente) <= 0) {
      setError('❌ Le prix doit être supérieur à 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('produits')
        .update({
          nom,
          description,
          etat_produit: etatProduit,
          etat_emballage: etatEmballage,
          prix_estime_vente: parseFloat(prixVente),
          statut: 'en_vente',
          updated_at: new Date().toISOString(),
        })
        .eq('id', product?.id);

      if (updateError) {
        throw updateError;
      }

      setError('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Update error:', err);
      setError(`❌ Erreur: ${err.message || 'Impossible de mettre en vente'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">✅ Valider pour la vente</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nom du Produit *</label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
              required
            />
          </div>

          {/* États */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">État Produit *</label>
              <select
                value={etatProduit}
                onChange={e => setEtatProduit(e.target.value)}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
                required
              >
                <option value="">Sélectionner...</option>
                {ETAT_PRODUIT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">État Emballage *</label>
              <select
                value={etatEmballage}
                onChange={e => setEtatEmballage(e.target.value)}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
                required
              >
                <option value="">Sélectionner...</option>
                {ETAT_EMBALLAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prix */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Prix de Vente (€) *</label>
            <input
              type="number"
              value={prixVente}
              onChange={e => setPrixVente(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none resize-none"
            />
          </div>

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
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 font-medium rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Mise en vente...
                </>
              ) : (
                <>
                  <Save size={18} /> Mettre en vente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
