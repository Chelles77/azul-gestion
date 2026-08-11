'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface ModalCreerProduitProps {
  lotId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function generateQRCode(): string {
  return `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export default function ModalCreerProduit({ lotId, isOpen, onClose, onSuccess }: ModalCreerProduitProps) {
  const [nom, setNom] = useState('');
  const [marque, setMarque] = useState('');
  const [categorie, setCategorie] = useState('Autres');
  const [prixNeuf, setPrixNeuf] = useState('');
  const [coefRevient, setCoefRevient] = useState('0.087');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!nom || !prixNeuf) {
      setError('Nom et prix neuf sont obligatoires');
      return;
    }

    const prix = parseFloat(prixNeuf);
    const coef = parseFloat(coefRevient);

    if (isNaN(prix) || prix <= 0) {
      setError('Le prix doit être positif');
      return;
    }
    if (isNaN(coef) || coef <= 0) {
      setError('Le coefficient doit être positif');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const qrCode = generateQRCode();
      const prixRevient = Math.round(prix * coef * 100) / 100;

      const { error: insertError } = await supabase.from('produits').insert([
        {
          lot_id: lotId,
          user_id: userData.user.id,
          nom: nom.substring(0, 100),
          marque: marque || null,
          categorie,
          description: description.substring(0, 200),
          prix_neuf: prix,
          coef_revient: coef,
          prix_revient: prixRevient,
          qr_code: qrCode,
          statut: 'brute',
          photos: null,
          etat_produit: null,
          etat_emballage: null,
          prix_estime_vente: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
      // Reset form
      setNom('');
      setMarque('');
      setCategorie('Autres');
      setPrixNeuf('');
      setCoefRevient('0.087');
      setDescription('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const prixRevient = prixNeuf && coefRevient ? Math.round(parseFloat(prixNeuf) * parseFloat(coefRevient) * 100) / 100 : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-[#1a1a1a]">
          <h2 className="text-xl font-bold text-white">Créer un produit</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleCreate(); }} className="p-6 space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nom du Produit *</label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Ex: Dreame X50 Ultra Complete Robot"
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Marque */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Marque</label>
            <input
              type="text"
              value={marque}
              onChange={e => setMarque(e.target.value)}
              placeholder="Ex: Dreame, Ecovacs..."
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie</label>
            <select
              value={categorie}
              onChange={e => setCategorie(e.target.value)}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            >
              <option>Autres</option>
              <option>Robot Aspirateur</option>
              <option>Cuisine</option>
              <option>Électroménager</option>
            </select>
          </div>

          {/* Prix et Coef */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prix Neuf (€) *</label>
              <input
                type="number"
                value={prixNeuf}
                onChange={e => setPrixNeuf(e.target.value)}
                placeholder="Ex: 1349"
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Coeff. Revient</label>
              <input
                type="number"
                step="0.001"
                value={coefRevient}
                onChange={e => setCoefRevient(e.target.value)}
                placeholder="Ex: 0.087"
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Résumé financier */}
          {prixNeuf && coefRevient && (
            <div className="bg-[#252525] p-4 rounded-lg border border-gray-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prix Neuf:</span>
                <span className="text-white font-bold">{parseFloat(prixNeuf).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prix Revient:</span>
                <span className="text-orange-400 font-bold">{prixRevient.toFixed(2)} €</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description du produit..."
              rows={3}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none"
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
              className="flex-1 px-4 py-3 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 font-medium rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !nom || !prixNeuf}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                '✨ Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
