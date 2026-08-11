'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Produit } from '@/lib/interfaces';

interface ModalRetourClientProps {
  produit: Produit | null;
  lotInfo?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalRetourClient({ produit, lotInfo, isOpen, onClose, onSuccess }: ModalRetourClientProps) {
  const [etatProduit, setEtatProduit] = useState('bon');
  const [montantRemboursement, setMontantRemboursement] = useState('');
  const [fraisPort, setFraisPort] = useState('0');
  const [raison, setRaison] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !produit) return null;

  const handleBonEtat = async () => {
    if (!montantRemboursement) {
      setError('Veuillez indiquer le montant à rembourser');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Remettre en vente
      const { error: updateError } = await supabase
        .from('produits')
        .update({
          statut: 'en_vente',
          updated_at: new Date().toISOString()
        })
        .eq('id', produit.id);

      if (updateError) throw updateError;
      console.log(`Retour bon état: Rembourser ${montantRemboursement}€ + port ${fraisPort}€ - Produit remis en vente`);

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMauvaisEtat = async () => {
    if (!montantRemboursement) {
      setError('Veuillez indiquer le montant à rembourser');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Rejeter en rebut
      const { error: updateError } = await supabase
        .from('produits')
        .update({
          statut: 'rebut',
          updated_at: new Date().toISOString()
        })
        .eq('id', produit.id);

      if (updateError) throw updateError;
      console.log(`Retour mauvais état: Rembourser ${montantRemboursement}€ + port ${fraisPort}€ - Produit en rebut`);

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemboursementSeul = async () => {
    if (!montantRemboursement) {
      setError('Veuillez indiquer le montant à rembourser');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Rejeter en rebut (sans frais de port)
      const { error: updateError } = await supabase
        .from('produits')
        .update({
          statut: 'rebut',
          updated_at: new Date().toISOString()
        })
        .eq('id', produit.id);

      if (updateError) throw updateError;
      console.log(`Remboursement sans retour: Rembourser ${montantRemboursement}€ - Pas de frais`);

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCasse = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Marquer comme cassé
      const { error: updateError } = await supabase
        .from('produits')
        .update({
          statut: 'casse',
          updated_at: new Date().toISOString()
        })
        .eq('id', produit.id);

      if (updateError) throw updateError;
      console.log(`Produit cassé: ${produit.nom} - À traiter en perte`);

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEtatProduit('bon');
    setMontantRemboursement('');
    setFraisPort('0');
    setRaison('');
    setError('');
    onClose();
  };

  const montantNum = parseFloat(montantRemboursement) || 0;
  const fraisNum = parseFloat(fraisPort) || 0;
  const totalRemboursement = montantNum + fraisNum;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        {/* Header */}
        <div className="border-b border-gray-800 p-6 flex justify-between items-center sticky top-0 bg-[#1a1a1a]">
          <h2 className="text-xl font-bold text-white">Gestion Retour Client</h2>
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

          {/* Prix */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-3 rounded-lg border border-blue-700">
              <p className="text-xs text-blue-400 font-bold mb-1">Prix Revient</p>
              <p className="text-lg font-bold text-blue-400">{(produit.prix_revient || 0).toFixed(0)} €</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/30 to-[#1a1a1a] p-3 rounded-lg border border-green-700">
              <p className="text-xs text-green-400 font-bold mb-1">Prix Vente</p>
              <p className="text-lg font-bold text-green-400">{(produit.prix_vente_final || 0).toFixed(0)} €</p>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Décision de retour</label>
            <div className="space-y-2">
              <button
                onClick={() => setEtatProduit('bon')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all text-left ${
                  etatProduit === 'bon'
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-gray-700 bg-[#252525] hover:border-green-500/50'
                }`}
              >
                <CheckCircle size={20} className={etatProduit === 'bon' ? 'text-green-400 flex-shrink-0' : 'text-gray-500 flex-shrink-0'} />
                <div className={etatProduit === 'bon' ? 'text-green-400 font-bold' : 'text-gray-300'}>
                  <div>✅ Bon état - Remettre en vente</div>
                  <div className="text-xs opacity-75">Rembourser client + frais port</div>
                </div>
              </button>

              <button
                onClick={() => setEtatProduit('mauvais')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all text-left ${
                  etatProduit === 'mauvais'
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-gray-700 bg-[#252525] hover:border-red-500/50'
                }`}
              >
                <XCircle size={20} className={etatProduit === 'mauvais' ? 'text-red-400 flex-shrink-0' : 'text-gray-500 flex-shrink-0'} />
                <div className={etatProduit === 'mauvais' ? 'text-red-400 font-bold' : 'text-gray-300'}>
                  <div>❌ Mauvais état - Rejeter</div>
                  <div className="text-xs opacity-75">Rembourser client + frais port</div>
                </div>
              </button>

              <button
                onClick={() => setEtatProduit('remboursement')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all text-left ${
                  etatProduit === 'remboursement'
                    ? 'border-orange-500 bg-orange-900/20'
                    : 'border-gray-700 bg-[#252525] hover:border-orange-500/50'
                }`}
              >
                <div size={20} className={`flex-shrink-0 text-lg ${etatProduit === 'remboursement' ? 'text-orange-400' : 'text-gray-500'}`}>
                  💳
                </div>
                <div className={etatProduit === 'remboursement' ? 'text-orange-400 font-bold' : 'text-gray-300'}>
                  <div>💳 Rembourser sans retour</div>
                  <div className="text-xs opacity-75">Rembourser client seul (pas de frais)</div>
                </div>
              </button>

              <button
                onClick={() => setEtatProduit('casse')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all text-left ${
                  etatProduit === 'casse'
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-700 bg-[#252525] hover:border-purple-500/50'
                }`}
              >
                <div size={20} className={`flex-shrink-0 text-lg ${etatProduit === 'casse' ? 'text-purple-400' : 'text-gray-500'}`}>
                  💔
                </div>
                <div className={etatProduit === 'casse' ? 'text-purple-400 font-bold' : 'text-gray-300'}>
                  <div>💔 Cassé - Perte totale</div>
                  <div className="text-xs opacity-75">Créé une page dédiée aux produits cassés</div>
                </div>
              </button>
            </div>
          </div>

          {/* Montants si pas Cassé */}
          {etatProduit !== 'casse' && (
            <>
              <div className={`border ${etatProduit === 'bon' || etatProduit === 'mauvais' ? 'border-yellow-800/50 bg-yellow-900/20' : 'border-orange-800/50 bg-orange-900/20'} p-3 rounded-lg`}>
                <p className={`text-sm ${etatProduit === 'bon' || etatProduit === 'mauvais' ? 'text-yellow-400' : 'text-orange-400'}`}>
                  ⚠️ {etatProduit === 'remboursement' ? 'Rembourser le client seul (pas de frais port)' : 'Calculer le remboursement client (vente + port)'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Montant Vente €</label>
                  <input
                    type="number"
                    value={montantRemboursement}
                    onChange={e => setMontantRemboursement(e.target.value)}
                    placeholder="0"
                    step="0.01"
                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">À rembourser au client</p>
                </div>

                {etatProduit !== 'remboursement' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Frais Port €</label>
                    <input
                      type="number"
                      value={fraisPort}
                      onChange={e => setFraisPort(e.target.value)}
                      placeholder="0"
                      step="0.01"
                      className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Frais retour client</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {etatProduit !== 'remboursement' && (
                  <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 p-4 rounded-lg border border-red-800/50">
                    <p className="text-xs text-gray-400 mb-2">Remboursement Client</p>
                    <p className="text-2xl font-bold text-red-400">{totalRemboursement.toFixed(2)} €</p>
                    <p className="text-xs text-gray-500 mt-2">Vente: {montantNum.toFixed(2)}€ + Port: {fraisNum.toFixed(2)}€</p>
                  </div>
                )}

                {etatProduit !== 'remboursement' && (
                  <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 p-4 rounded-lg border border-orange-800/50">
                    <p className="text-xs text-orange-400 mb-2">Coût Réel (Achat + Port)</p>
                    <p className="text-2xl font-bold text-orange-400">{((produit.prix_revient || 0) + fraisNum).toFixed(2)} €</p>
                    <p className="text-xs text-gray-500 mt-2">Achat: {(produit.prix_revient || 0).toFixed(2)}€ + Port: {fraisNum.toFixed(2)}€</p>
                  </div>
                )}

                {etatProduit === 'remboursement' && (
                  <div className="bg-gradient-to-r from-orange-900/30 to-orange-900/20 p-4 rounded-lg border border-orange-800/50">
                    <p className="text-xs text-orange-400 mb-2">Remboursement Client (sans port)</p>
                    <p className="text-2xl font-bold text-orange-400">{montantNum.toFixed(2)} €</p>
                    <p className="text-xs text-gray-500 mt-2">Aucun frais de retour à payer</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Raison (optionnel) */}
          {etatProduit !== 'casse' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Raison du retour (optionnel)</label>
              <textarea
                value={raison}
                onChange={e => setRaison(e.target.value)}
                placeholder="Ex: Rayure, pièce cassée, dysfonctionnement..."
                rows={2}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 resize-none"
              />
            </div>
          )}

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

            {etatProduit === 'bon' && (
              <button
                onClick={handleBonEtat}
                disabled={loading || !montantRemboursement}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : '✅'}
                {loading ? 'Traitement...' : `Rembourser & Remettre ${totalRemboursement.toFixed(2)}€`}
              </button>
            )}

            {etatProduit === 'mauvais' && (
              <button
                onClick={handleMauvaisEtat}
                disabled={loading || !montantRemboursement}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : '❌'}
                {loading ? 'Traitement...' : `Rejeter & Rembourser ${totalRemboursement.toFixed(2)}€`}
              </button>
            )}

            {etatProduit === 'remboursement' && (
              <button
                onClick={handleRemboursementSeul}
                disabled={loading || !montantRemboursement}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : '💳'}
                {loading ? 'Traitement...' : `Rembourser ${montantNum.toFixed(2)}€`}
              </button>
            )}

            {etatProduit === 'casse' && (
              <button
                onClick={handleCasse}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : '💔'}
                {loading ? 'Traitement...' : 'Marquer comme Cassé'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
