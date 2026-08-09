// src/components/ValidationModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Produit {
  id: string;
  nom: string;
  marque: string | null;
  categorie: string;
  prixNeuf: number;
  coefRevient: number;
  prixRevient: number;
  qrCode: string;
  photos: string[] | null;
  description: string | null;
}

interface ValidationModalProps {
  product: Produit;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ValidationModal({ product, isOpen, onClose, onSuccess }: ValidationModalProps) {
  const [nom, setNom] = useState(product.nom);
  const [etatProduit, setEtatProduit] = useState('');
  const [etatEmballage, setEtatEmballage] = useState('');
  const [prixVente, setPrixVente] = useState('');
  const [description, setDescription] = useState(product.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prix suggéré : 85% du prix neuf estimé (ajuste selon ta marge)
  const prixSuggere = Math.round(product.prixNeuf * 0.85); 

  useEffect(() => {
    if (isOpen) {
      setNom(product.nom);
      setDescription(product.description || '');
      setPrixVente(prixSuggere.toString());
      setEtatProduit('');
      setEtatEmballage('');
      setError('');
    }
  }, [isOpen, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!etatProduit || !etatEmballage || !prixVente) {
      setError('Tous les champs obligatoires doivent être remplis.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase
        .from('produits')
        .update({
          nom: nom,
          description: description,
          etat_produit: etatProduit,
          etat_emballage: etatEmballage,
          prix_estime_vente: parseFloat(prixVente), // ✅ Nom exact de ta colonne
          statut: 'en_vente',
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Save size={20} className="text-blue-500" /> Valider pour la Vente
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Info Produit & QR Code */}
          <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">QR Code</p>
              <p className="font-mono text-lg text-white">{product.qrCode}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Coût Revient</p>
              <p className="text-lg font-bold text-orange-400">{product.prixRevient.toFixed(2)} €</p>
            </div>
          </div>

          {/* Nom du Produit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nom du Produit *</label>
            <input 
              type="text" 
              value={nom} 
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
              placeholder="Ex: Dreame L10s Pro Ultra Heat"
            />
          </div>

          {/* États (Grille 2 colonnes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">État du Produit *</label>
              <select 
                value={etatProduit} 
                onChange={(e) => setEtatProduit(e.target.value)}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="">Sélectionner...</option>
                <option value="neuf_sous_plastique">🟢 Neuf sous plastique</option>
                <option value="tres_bon_etat">🟡 Très bon état</option>
                <option value="bon_etat"> Bon état</option>
                <option value="occasion_comme_neuf">✨ Occasion comme neuf</option>
                <option value="a_reparer">🔧 À réparer</option>
                <option value="casser_a_jeter">❌ Casser / À jeter</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">État Emballage *</label>
              <select 
                value={etatEmballage} 
                onChange={(e) => setEtatEmballage(e.target.value)}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="">Sélectionner...</option>
                <option value="emballage_neuf">📦 Emballage neuf</option>
                <option value="emballage_coupe">✂️ Emballage coupé</option>
                <option value="pas_d_emballage">❌ Pas d'emballage</option>
                <option value="emballage_abime">️ Emballage abîmé</option>
                <option value="emballage_partiel"> Emballage partiel</option>
              </select>
            </div>
          </div>

          {/* Prix de Vente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex justify-between">
              <span>Prix de Vente Final (€) *</span>
              <span className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={() => setPrixVente(prixSuggere.toString())}>
                Suggérer {prixSuggere} €
              </span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={prixVente} 
                onChange={(e) => setPrixVente(e.target.value)}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg pl-4 pr-12 py-3 text-white text-lg font-bold focus:border-green-500 outline-none transition-colors"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Marge estimée : {((parseFloat(prixVente || '0') - product.prixRevient) / Math.max(parseFloat(prixVente || '1'), 1) * 100).toFixed(1)}%
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description Client</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none"
              placeholder="Décris le produit honnêtement pour le client..."
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-800/50">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Boutons Action */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Validation...
                </>
              ) : (
                <>
                  <Save size={18} /> Valider & Mettre en Vente
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}