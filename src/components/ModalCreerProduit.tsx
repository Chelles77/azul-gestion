'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Upload, Download, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase';
import SelectWithAdd from './SelectWithAdd';

interface ModalCreerProduitProps {
  lotId: string;
  coefBrut?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function generateQRCode(): string {
  return `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export default function ModalCreerProduit({ lotId, coefBrut = 0.087, isOpen, onClose, onSuccess }: ModalCreerProduitProps) {
  const [nom, setNom] = useState('');
  const [productNumber, setProductNumber] = useState<number | null>(null);
  const [marque, setMarque] = useState('');
  const [marques, setMarques] = useState<string[]>([]);
  const [categorie, setCategorie] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [etatProduit, setEtatProduit] = useState('');
  const [etatsProduit, setEtatsProduit] = useState<string[]>([]);
  const [etatEmballage, setEtatEmballage] = useState('');
  const [etatsEmballage, setEtatsEmballage] = useState<string[]>([]);
  const [prixNeuf, setPrixNeuf] = useState('');
  const [coefRevient, setCoefRevient] = useState(coefBrut.toString());
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const newQrCode = generateQRCode();
      setQrCode(newQrCode);
      const qrUrl = `https://azul-gestion.vercel.app/qr/${newQrCode}`;
      QRCode.toDataURL(qrUrl)
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR Error:', err));

      loadOptions();
      loadNextProductNumber();
    }
  }, [isOpen]);

  const loadOptions = async () => {
    const supabase = createClient();
    const { data: marqueData } = await supabase.from('marques').select('nom').order('nom');
    const { data: categData } = await supabase.from('categories').select('nom').order('nom');
    const { data: etatProdData } = await supabase.from('etat_produit').select('nom').order('nom');
    const { data: etatEmbalData } = await supabase.from('etat_emballage').select('nom').order('nom');

    if (marqueData) setMarques(marqueData.map(m => m.nom));
    if (categData) setCategories(categData.map(c => c.nom));
    if (etatProdData) setEtatsProduit(etatProdData.map(e => e.nom));
    if (etatEmbalData) setEtatsEmballage(etatEmbalData.map(e => e.nom));
  };

  const loadNextProductNumber = async () => {
    const supabase = createClient();

    // Charger le prochain numéro de produit
    const { data: prodData } = await supabase
      .from('produits')
      .select('product_number')
      .eq('lot_id', lotId)
      .order('product_number', { ascending: false })
      .limit(1);

    const maxNumber = prodData && prodData.length > 0 && prodData[0].product_number ? prodData[0].product_number : 0;
    setProductNumber(maxNumber + 1);

    // Charger le coefficient du lot et le nombre de produits
    const { data: lotData } = await supabase
      .from('lots')
      .select('coefficient_achat')
      .eq('id', lotId)
      .single();

    const { data: allProds } = await supabase
      .from('produits')
      .select('id')
      .eq('lot_id', lotId);

    if (lotData && lotData.coefficient_achat) {
      const currentCount = allProds ? allProds.length : 0;
      const nextCount = currentCount + 1;
      const adjustedCoef = lotData.coefficient_achat / nextCount;
      setCoefRevient(adjustedCoef.toFixed(4));
    }
  };

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const fileName = `${qrCode}-${Date.now()}.jpg`;

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
    link.download = `QR-${qrCode}.png`;
    link.click();
  };

  const handlePrintQR = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head><title>QR Code - ${qrCode}</title></head>
        <body style="display: flex; align-items: center; justify-content: center; height: 100vh;">
          <img src="${qrDataUrl}" style="max-width: 400px;" />
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

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

      const prixRevient = Math.round(prix * coef * 100) / 100;

      const { error: insertError } = await supabase.from('produits').insert([
        {
          lot_id: lotId,
          user_id: userData.user.id,
          product_number: productNumber,
          nom: nom.substring(0, 100),
          marque: marque || null,
          categorie,
          description: description.substring(0, 200),
          prix_neuf: prix,
          coef_revient: coef,
          prix_revient: prixRevient,
          qr_code: qrCode,
          statut: 'brute',
          photos: photoPreview ? [photoPreview] : null,
          etat_produit: etatProduit || null,
          etat_emballage: etatEmballage || null,
          prix_estime_vente: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
      // Reset
      setNom('');
      setMarque('');
      setCategorie('Autres');
      setPrixNeuf('');
      setCoefRevient(coefBrut.toString());
      setDescription('');
      setEtatProduit('');
      setEtatEmballage('');
      setPhotoPreview(null);
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
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>

        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Créer un produit</h2>
            {productNumber !== null && <p className="text-sm text-gray-400 mt-1">Produit #<span className="font-bold text-blue-400">{productNumber}</span></p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleCreate(); }} className="p-6 space-y-6">
          {/* INFO FINANCIÈRE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Prix Neuf */}
            <div className="bg-gradient-to-br from-[#252525] to-[#1a1a1a] p-6 rounded-xl border border-gray-700 shadow-lg">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">💵 Prix Neuf</p>
              <input
                type="number"
                value={prixNeuf}
                onChange={e => setPrixNeuf(e.target.value)}
                placeholder="1349"
                className="w-full bg-transparent text-4xl font-bold text-white outline-none focus:ring-0"
              />
              <p className="text-lg text-gray-400">€</p>
            </div>

            {/* Prix Revient */}
            <div className="bg-gradient-to-br from-[#252525] to-[#1a1a1a] p-6 rounded-xl border border-gray-700 shadow-lg">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">💰 Prix Revient</p>
              <p className="text-4xl font-bold text-orange-400">{prixRevient.toFixed(0)}</p>
              <p className="text-lg text-gray-400">€</p>
            </div>

            {/* Coefficient */}
            <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-6 rounded-xl border border-blue-700 shadow-lg">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">📊 Coeff. Achat</p>
              <input
                type="number"
                step="0.001"
                value={coefRevient}
                onChange={e => setCoefRevient(e.target.value)}
                placeholder="0.087"
                className="w-full bg-transparent text-4xl font-bold text-blue-400 outline-none focus:ring-0"
              />
              <p className="text-xs text-gray-400">{parseFloat(coefRevient || '0').toFixed(3)}x</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-[#252525] p-6 rounded-xl border border-gray-800 flex flex-col items-center justify-center space-y-3">
            <p className="text-sm font-bold text-gray-300 uppercase">🔖 QR Code</p>
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
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Download size={14} /> Télécharger
              </button>
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Photo du Produit</label>
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors relative bg-[#252525] min-h-[150px] flex items-center justify-center">
              {photoPreview ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={photoPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
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
              placeholder="Ex: Dreame X50 Ultra Complete Robot"
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Marque et Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <SelectWithAdd
              label="Marque"
              value={marque}
              onChange={setMarque}
              options={marques}
              onAddOption={val => setMarques([...marques, val])}
              table="marques"
            />
            <SelectWithAdd
              label="Catégorie"
              value={categorie}
              onChange={setCategorie}
              options={categories}
              onAddOption={val => setCategories([...categories, val])}
              table="categories"
            />
          </div>

          {/* États */}
          <div className="grid grid-cols-2 gap-4">
            <SelectWithAdd
              label="État Produit"
              value={etatProduit}
              onChange={setEtatProduit}
              options={etatsProduit}
              onAddOption={val => setEtatsProduit([...etatsProduit, val])}
              table="etat_produit"
            />
            <SelectWithAdd
              label="État Emballage"
              value={etatEmballage}
              onChange={setEtatEmballage}
              options={etatsEmballage}
              onAddOption={val => setEtatsEmballage([...etatsEmballage, val])}
              table="etat_emballage"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
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
              disabled={loading || uploading || !nom || !prixNeuf}
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
