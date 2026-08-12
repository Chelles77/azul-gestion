'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
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
  const [lotInfo, setLotInfo] = useState<any>(null);
  const [plateformesVente, setPlateformesVente] = useState<string[]>([]);
  const [selectedPlateforme, setSelectedPlateforme] = useState('');
  const [customPlateforme, setCustomPlateforme] = useState('');

  const ETATS_PRODUIT = [
    { val: 'neuf_sous_plastique', label: '🟢 Neuf sous plastique' },
    { val: 'tres_bon_etat', label: '⭐ Très bon état' },
    { val: 'bon_etat', label: '👍 Bon état' },
    { val: 'occasion_comme_neuf', label: '✨ Occasion comme neuf' },
    { val: 'a_reparer', label: '🔧 À réparer' },
  ];

  const ETATS_EMBALLAGE = [
    { val: 'neuf', label: '📦 Neuf' },
    { val: 'bon', label: '👍 Bon' },
    { val: 'coupe', label: '✂️ Coupé' },
    { val: 'abime', label: '⚠️ Abîmé' },
    { val: 'pas_emballage', label: '❌ Pas d\'emballage' },
  ];

  const PLATEFORMES = [
    { id: 'mon-site', label: '🏪 Mon Site' },
    { id: 'vinted', label: '🛍️ Vinted' },
    { id: 'leboncoin', label: '📌 Le Bon Coin' },
    { id: 'ebay', label: '🌐 eBay' },
    { id: 'amazon', label: '🛒 Amazon' },
    { id: 'facebook', label: '👥 Facebook' },
  ];

  const getEtatProduitLabel = (val: string) => {
    const found = ETATS_PRODUIT.find(e => e.val === val);
    return found ? found.label : val;
  };

  const getEtatEmballageLabel = (val: string) => {
    const found = ETATS_EMBALLAGE.find(e => e.val === val);
    return found ? found.label : val;
  };

  const getPlateformeLabel = (id: string) => {
    const found = PLATEFORMES.find(p => p.id === id);
    return found ? found.label : id;
  };

  useEffect(() => {
    if (product && isOpen) {
      (async () => {
        const supabase = createClient();
        const { data } = await supabase.from('lots').select('*').eq('id', product.lot_id).single();
        if (data) setLotInfo(data);
      })();

      setNom(product.nom || '');
      setDescription(product.description || '');
      setPrixVente(product.prix_estime_vente?.toString() || '');
      setEtatProduit(product.etat_produit || '');
      setEtatEmballage(product.etat_emballage || '');
      setPlateformesVente(product.plateformes_vente || []);
      setError('');
    }
  }, [product, isOpen]);

  const addPlateforme = () => {
    if (selectedPlateforme && !plateformesVente.includes(selectedPlateforme)) {
      setPlateformesVente([...plateformesVente, selectedPlateforme]);
      setSelectedPlateforme('');
    }
  };

  const addCustomPlateforme = () => {
    if (customPlateforme.trim() && !plateformesVente.includes(customPlateforme)) {
      setPlateformesVente([...plateformesVente, customPlateforme]);
      setCustomPlateforme('');
    }
  };

  const removePlateforme = (p: string) => {
    setPlateformesVente(plateformesVente.filter(x => x !== p));
  };

  const prixSuggere = product ? Math.round(product.prix_neuf * 0.85) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !etatProduit || !etatEmballage || !prixVente) {
      setError('❌ Tous les champs sont obligatoires');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase
        .from('produits')
        .update({
          nom,
          description,
          etat_produit: etatProduit,
          etat_emballage: etatEmballage,
          prix_estime_vente: parseFloat(prixVente),
          plateformes_vente: plateformesVente,
          statut: 'en_vente',
          updated_at: new Date().toISOString(),
        })
        .eq('id', product?.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError('❌ ' + (err.message || 'Erreur'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* HEADER */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">✅ Valider pour la vente</h2>
            <p className="text-xs text-green-400 font-bold mt-1">📦 Lot: {lotInfo?.numerolot || '...'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ÉTATS AFFICHAGE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">État du Produit *</label>
              <div className="bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm font-medium">
                {etatProduit ? getEtatProduitLabel(etatProduit) : 'Sélectionner...'}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">État Emballage *</label>
              <div className="bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm font-medium">
                {etatEmballage ? getEtatEmballageLabel(etatEmballage) : 'Sélectionner...'}
              </div>
            </div>
          </div>

          {/* SÉLECTEURS CACHÉS */}
          <div className="hidden">
            <select value={etatProduit} onChange={e => setEtatProduit(e.target.value)}>
              <option value="">Sélectionner...</option>
              {ETATS_PRODUIT.map(e => <option key={e.val} value={e.val}>{e.label}</option>)}
            </select>
            <select value={etatEmballage} onChange={e => setEtatEmballage(e.target.value)}>
              <option value="">Sélectionner...</option>
              {ETATS_EMBALLAGE.map(e => <option key={e.val} value={e.val}>{e.label}</option>)}
            </select>
          </div>

          {/* NOM */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Nom du Produit *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none text-sm" />
          </div>

          {/* PRIX */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 flex justify-between items-center block">
              <span>💰 Prix de Vente Final (€) *</span>
              <span className="text-xs text-green-400 cursor-pointer hover:underline font-normal">Suggérer {prixSuggere} €</span>
            </label>
            <input type="number" value={prixVente} onChange={e => setPrixVente(e.target.value)} min="0" step="0.01" className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white text-lg font-bold focus:border-green-500 outline-none" />
          </div>

          {/* PLATEFORMES */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">🛍️ Plateformes de Vente</label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <select value={selectedPlateforme} onChange={e => setSelectedPlateforme(e.target.value)} className="flex-1 bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none text-sm">
                  <option value="">Sélectionner une plateforme...</option>
                  {PLATEFORMES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <button type="button" onClick={addPlateforme} disabled={!selectedPlateforme} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium disabled:cursor-not-allowed text-sm">
                  +
                </button>
              </div>
              <div className="flex gap-2">
                <input type="text" value={customPlateforme} onChange={e => setCustomPlateforme(e.target.value)} placeholder="Ajouter une plateforme personnalisée..." className="flex-1 bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none text-sm" onKeyPress={e => e.key === 'Enter' && addCustomPlateforme()} />
                <button type="button" onClick={addCustomPlateforme} disabled={!customPlateforme.trim()} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-medium disabled:cursor-not-allowed text-sm">
                  +
                </button>
              </div>
              {plateformesVente.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-[#252525] border border-gray-700 rounded-lg">
                  {plateformesVente.map(p => (
                    <div key={p} className="flex items-center gap-2 bg-blue-900/30 border border-blue-700 rounded-full px-3 py-1 text-sm text-blue-300">
                      <span>{getPlateformeLabel(p)}</span>
                      <button type="button" onClick={() => removePlateforme(p)} className="ml-1 text-blue-400 hover:text-blue-200 font-bold">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Description Client</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none resize-none text-sm" />
          </div>

          {/* ERREUR */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-800">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* BOUTONS */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 font-medium rounded-lg text-sm">
              Annuler
            </button>
            <button type="submit" disabled={loading || !nom || !etatProduit || !etatEmballage || !prixVente} className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Mise en vente...
                </>
              ) : (
                <>
                  ✅ Mettre en vente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
