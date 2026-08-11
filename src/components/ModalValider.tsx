'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Upload, CheckCircle2, Download, Printer } from 'lucide-react';
import QRCode from 'qrcode';
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lotInfo, setLotInfo] = useState<any>(null);
  const [plateformesVente, setPlateformesVente] = useState<string[]>([]);

  // Checklist
  const [checks, setChecks] = useState({
    photo: false,
    etat: false,
    emballage: false,
    prix: false,
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const PLATEFORMES = [
    { id: 'mon-site', label: 'Mon Site', emoji: '🏪' },
    { id: 'vinted', label: 'Vinted', emoji: '🛍️' },
    { id: 'leboncoin', label: 'Le Bon Coin', emoji: '📌' },
    { id: 'ebay', label: 'eBay', emoji: '🌐' },
    { id: 'amazon', label: 'Amazon', emoji: '🛒' },
    { id: 'facebook', label: 'Facebook Marketplace', emoji: '👥' },
  ];

  const togglePlateforme = (id: string) => {
    setPlateformesVente(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const prixSuggere = product ? Math.round(product.prix_neuf * 0.85) : 0;

  // Charger les infos du lot
  useEffect(() => {
    if (product && isOpen) {
      (async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('lots')
          .select('*')
          .eq('id', product.lot_id)
          .single();
        if (data) setLotInfo(data);
        if (error) console.error('Lot Error:', error);
      })();
    }
  }, [product, isOpen]);

  // Générer le QR code
  useEffect(() => {
    if (product && isOpen) {
      QRCode.toDataURL(product.qr_code)
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR Error:', err));
    }
  }, [product, isOpen]);

  useEffect(() => {
    if (product && isOpen) {
      setNom(product.nom);
      setDescription(product.description || '');
      setPrixVente(product.prix_estime_vente?.toString() || prixSuggere.toString());
      setEtatProduit(product.etat_produit || '');
      setEtatEmballage(product.etat_emballage || '');
      setPhotoPreview(product.photos?.[0] || null);
      setError('');
      setChecks({
        photo: !!product.photos?.[0],
        etat: !!product.etat_produit,
        emballage: !!product.etat_emballage,
        prix: !!product.prix_estime_vente,
      });
    }
  }, [product, isOpen]);

  useEffect(() => {
    setChecks({
      photo: !!photoPreview,
      etat: !!etatProduit,
      emballage: !!etatEmballage,
      prix: !!prixVente && parseFloat(prixVente) > 0,
    });
  }, [photoPreview, etatProduit, etatEmballage, prixVente]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    setUploading(true);
    const supabase = createClient();
    const fileName = `${product.id}-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('product-photos')
      .upload(fileName, file);

    if (!uploadError) {
      const { data } = supabase.storage.from('product-photos').getPublicUrl(fileName);
      setPhotoPreview(data.publicUrl);
    } else {
      alert('Erreur upload: ' + uploadError.message);
    }
    setUploading(false);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${product?.qr_code}.png`;
    link.click();
  };

  const handlePrintQR = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head><title>QR Code - ${product?.qr_code}</title></head>
        <body style="display: flex; align-items: center; justify-content: center; height: 100vh;">
          <img src="${qrDataUrl}" style="max-width: 400px;" />
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checks.photo || !checks.etat || !checks.emballage || !checks.prix) {
      setError('❌ Tous les champs obligatoires doivent être validés.');
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
          photos: photoPreview ? [photoPreview] : product?.photos,
          plateformes_vente: plateformesVente,
          statut: 'en_vente',
          updated_at: new Date().toISOString(),
        })
        .eq('id', product?.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise en vente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const allChecked = checks.photo && checks.etat && checks.emballage && checks.prix;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={24} className="text-green-500" /> Valider pour la vente
            </h2>
            <p className="text-sm text-green-400 font-bold mt-1">
              📦 Lot: {lotInfo?.numerolot || product?.lot_id || '...'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* CHECKLIST */}
          <div className="bg-green-900/10 border border-green-600/30 rounded-xl p-4">
            <p className="text-sm font-bold text-green-400 mb-3 uppercase">✓ Checklist de validation</p>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-2 rounded ${checks.photo ? 'bg-green-600/20 border border-green-600/50' : 'bg-red-600/10 border border-red-600/30'}`}>
                <input type="checkbox" checked={checks.photo} disabled className="w-4 h-4" />
                <span className={`text-sm font-medium ${checks.photo ? 'text-green-400' : 'text-red-400'}`}>
                  {checks.photo ? '✅ Photo présente' : '❌ Photo manquante'}
                </span>
              </label>
              <label className={`flex items-center gap-3 p-2 rounded ${checks.etat ? 'bg-green-600/20 border border-green-600/50' : 'bg-red-600/10 border border-red-600/30'}`}>
                <input type="checkbox" checked={checks.etat} disabled className="w-4 h-4" />
                <span className={`text-sm font-medium ${checks.etat ? 'text-green-400' : 'text-red-400'}`}>
                  {checks.etat ? '✅ État défini' : '❌ État manquant'}
                </span>
              </label>
              <label className={`flex items-center gap-3 p-2 rounded ${checks.emballage ? 'bg-green-600/20 border border-green-600/50' : 'bg-red-600/10 border border-red-600/30'}`}>
                <input type="checkbox" checked={checks.emballage} disabled className="w-4 h-4" />
                <span className={`text-sm font-medium ${checks.emballage ? 'text-green-400' : 'text-red-400'}`}>
                  {checks.emballage ? '✅ Emballage défini' : '❌ Emballage manquant'}
                </span>
              </label>
              <label className={`flex items-center gap-3 p-2 rounded ${checks.prix ? 'bg-green-600/20 border border-green-600/50' : 'bg-red-600/10 border border-red-600/30'}`}>
                <input type="checkbox" checked={checks.prix} disabled className="w-4 h-4" />
                <span className={`text-sm font-medium ${checks.prix ? 'text-green-400' : 'text-red-400'}`}>
                  {checks.prix ? '✅ Prix défini' : '❌ Prix manquant'}
                </span>
              </label>
            </div>
          </div>

          {/* INFO FINANCIÈRE EN CARTES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Prix Neuf */}
            <div className="bg-gradient-to-br from-[#252525] to-[#1a1a1a] p-6 rounded-xl border border-gray-700 shadow-lg">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">💵 Prix Neuf</p>
              <p className="text-4xl font-bold text-white">{product.prix_neuf.toFixed(0)}</p>
              <p className="text-lg text-gray-400">€</p>
            </div>

            {/* Prix Revient */}
            <div className="bg-gradient-to-br from-[#252525] to-[#1a1a1a] p-6 rounded-xl border border-gray-700 shadow-lg">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">💰 Prix Revient</p>
              <p className="text-4xl font-bold text-orange-400">{product.prix_revient.toFixed(0)}</p>
              <p className="text-lg text-gray-400">€</p>
            </div>

            {/* Coefficient */}
            <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-6 rounded-xl border border-blue-700 shadow-lg">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">📊 Coeff. Achat</p>
              <p className="text-4xl font-bold text-blue-400">{((product.coef_revient || 0) * 100).toFixed(1)}%</p>
              <p className="text-xs text-gray-400">= {(product.coef_revient || 0).toFixed(3)}x</p>
            </div>
          </div>

          {/* QR CODE */}
          <div className="bg-[#252525] p-6 rounded-xl border border-gray-800 flex flex-col items-center justify-center space-y-3">
            <p className="text-sm font-bold text-gray-300 uppercase">🔖 QR Code Identifiant</p>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="border border-gray-700 rounded-lg bg-white p-2 w-40 h-40" />
            ) : (
              <div className="w-40 h-40 border border-gray-700 rounded-lg bg-white flex items-center justify-center animate-pulse">
                <span className="text-gray-400 text-sm">Génération...</span>
              </div>
            )}
            <div className="flex gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={handlePrintQR}
                disabled={!qrDataUrl}
                className="flex-1 px-3 py-2 bg-[#1a1a1a] hover:bg-[#333] border border-gray-700 text-gray-300 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Printer size={14} /> Imprimer
              </button>
              <button
                type="button"
                onClick={handleDownloadQR}
                disabled={!qrDataUrl}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 border border-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Download size={14} /> Télécharger
              </button>
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">📸 Photo du Produit *</label>
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-green-500 transition-colors relative bg-[#252525] min-h-[150px] flex items-center justify-center">
              {photoPreview ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={photoPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500 pointer-events-none">
                  <Upload size={32} />
                  <span className="text-sm">Cliquer pour ajouter une photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nom du Produit *</label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none"
            />
          </div>

          {/* États */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">État du Produit *</label>
              <select
                value={etatProduit}
                onChange={e => setEtatProduit(e.target.value)}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none appearance-none"
              >
                <option value="">Sélectionner...</option>
                <option value="neuf_sous_plastique">🟢 Neuf sous plastique</option>
                <option value="tres_bon_etat">⭐ Très bon état</option>
                <option value="bon_etat">👍 Bon état</option>
                <option value="occasion_comme_neuf">✨ Occasion comme neuf</option>
                <option value="a_reparer">🔧 À réparer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">État Emballage *</label>
              <select
                value={etatEmballage}
                onChange={e => setEtatEmballage(e.target.value)}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none appearance-none"
              >
                <option value="">Sélectionner...</option>
                <option value="emballage_neuf">📦 Emballage neuf</option>
                <option value="emballage_coupe">✂️ Emballage coupé</option>
                <option value="pas_d_emballage">❌ Pas d'emballage</option>
                <option value="emballage_abime">⚠️ Emballage abîmé</option>
              </select>
            </div>
          </div>

          {/* Prix */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex justify-between">
              <span>💰 Prix de Vente Final (€) *</span>
              <span
                className="text-xs text-green-400 cursor-pointer hover:underline"
                onClick={() => setPrixVente(prixSuggere.toString())}
              >
                Suggérer {prixSuggere} €
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={prixVente}
                onChange={e => setPrixVente(e.target.value)}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg pl-4 pr-12 py-3 text-white text-lg font-bold focus:border-green-500 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
            </div>
          </div>

          {/* Plateformes de Vente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">🛍️ Plateformes de Vente</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PLATEFORMES.map(plateforme => (
                <label key={plateforme.id} className="flex items-center gap-2 p-3 bg-[#252525] border border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={plateformesVente.includes(plateforme.id)}
                    onChange={() => togglePlateforme(plateforme.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-300">{plateforme.emoji} {plateforme.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description Client</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none resize-none"
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
              disabled={loading || uploading || !allChecked}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Mise en vente...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Mettre en vente ✅
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
