'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Upload, Download, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase';
import { Produit } from '@/lib/interfaces';

interface ModalModifierProps {
  product: Produit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalModifier({ product, isOpen, onClose, onSuccess }: ModalModifierProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (product && isOpen) {
      setNom(product.nom);
      setDescription(product.description || '');
      setPhotoPreview(product.photos?.[0] || null);
      setError('');

      // Générer QR code
      QRCode.toDataURL(product.qr_code)
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR Error:', err));
    }
  }, [product, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !nom) {
      setError('Le nom du produit est obligatoire.');
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
          photos: photoPreview ? [photoPreview] : product.photos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Save size={20} className="text-blue-500" /> Modifier le produit
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* INFO FINANCIÈRE + QR CODE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Infos Financières */}
            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 space-y-3">
              <p className="text-sm font-bold text-gray-300 uppercase">💰 Infos Financières</p>
              <div>
                <p className="text-xs text-gray-500 mb-1">Prix Neuf</p>
                <p className="text-lg font-bold text-white">{product?.prix_neuf.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Prix de Revient</p>
                <p className="text-lg font-bold text-orange-400">{product?.prix_revient.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Coeff. d'Achat</p>
                <p className="text-lg font-bold text-blue-400">{(product?.coef_revient || 0).toFixed(1)}x ({((product?.coef_revient || 0) * 100).toFixed(1)}%)</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-[#252525] p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center space-y-3">
              <p className="text-sm font-bold text-gray-300 uppercase">🔖 QR Code</p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="border border-gray-700 rounded-lg bg-white p-2 w-40 h-40" />
              ) : (
                <div className="w-40 h-40 border border-gray-700 rounded-lg bg-white flex items-center justify-center animate-pulse">
                  <span className="text-gray-400 text-sm">Génération...</span>
                </div>
              )}
              <div className="flex gap-2 w-full">
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
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
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
              disabled={loading || uploading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={18} /> Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
