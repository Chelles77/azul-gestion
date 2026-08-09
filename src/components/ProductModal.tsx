// src/components/ProductModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Download, Printer, Save, Upload } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase';

interface ProductModalProps {
  product: any; // Remplace par ton interface Produit si tu l'as importée
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProductModal({ product, isOpen, onClose, onUpdate }: ProductModalProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState(product || {});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
  if (product) {
    // ✅ Copie profonde pour éviter de modifier l'original
    setFormData(JSON.parse(JSON.stringify(product)));
  }
}, [product]);

  if (!isOpen) return null;

  // Gestion upload photo
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !product.id) return;
    
    setUploadingPhoto(true);
    try {
      const filePath = `${product.lot_id}/${product.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('product-photos') // Assure-toi que ce bucket existe dans Supabase
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-photos')
        .getPublicUrl(filePath);

      // Mettre à jour la DB
      const newPhotos = [...(formData.photos || []), publicUrl];
      await supabase.from('produits').update({ photos: newPhotos }).eq('id', product.id);
      
     setFormData((prev: any) => ({ ...prev, photos: newPhotos }));
      onUpdate();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'upload");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // Sauvegarde des modifications texte
  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('produits')
        .update({
          nom: formData.nom,
          description: formData.description,
          etat_produit: formData.etat_produit,
          etat_emballage: formData.etat_emballage,
          prix_vente: formData.prix_vente // Ajoute ce champ si tu veux gérer le prix de vente ici
        })
        .eq('id', product.id);
      
      if (error) throw error;
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  // Impression QR Code
  function printQRCode() {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>QR Code - ${formData.nom}</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
            <h2>${formData.nom}</h2>
            <p>Prix Neuf: ${formData.prix_neuf}€ | Revient: ${formData.prix_revient}€</p>
            <div id="qr-container"></div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
            <script>
              new QRCode(document.getElementById("qr-container"), {
                text: "${formData.qr_code}",
                width: 300,
                height: 300
              });
              setTimeout(() => window.print(), 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-white">Détails Produit</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Colonne Gauche : Infos & Édition */}
          <div className="space-y-6">
            {/* Photo */}
            <div className="aspect-video bg-[#252525] rounded-xl border border-gray-700 flex items-center justify-center overflow-hidden relative group">
              {formData.photos && formData.photos.length > 0 ? (
                <img 
                  src={formData.photos[0]} 
                  alt={formData.nom} 
                  className="w-full h-full max-h-[300px] object-contain rounded-lg" 
/>
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <Upload size={48} className="mb-2" />
                  <span>Aucune photo</span>
                </div>
              )}
              <label className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-all opacity-0 group-hover:opacity-100">
                <Upload size={20} />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
              </label>
            </div>

            {/* Champs éditables */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">Nom du produit</label>
                <input 
                  type="text" 
                  value={formData.nom} 
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-1">État Produit</label>
                  <select 
                    value={formData.etat_produit || ''} 
                    onChange={(e) => setFormData({...formData, etat_produit: e.target.value})}
                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Neuf">Neuf</option>
                    <option value="Très bon état">Très bon état</option>
                    <option value="Bon état">Bon état</option>
                    <option value="État moyen">État moyen</option>
                    <option value="HS">HS / Pièces</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-1">État Emballage</label>
                  <select 
                    value={formData.etat_emballage || ''} 
                    onChange={(e) => setFormData({...formData, etat_emballage: e.target.value})}
                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Origine complet">Origine complet</option>
                    <option value="Origine abîmé">Origine abîmé</option>
                    <option value="Sans boîte">Sans boîte</option>
                    <option value="Boîte générique">Boîte générique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">Description</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Colonne Droite : Prix & QR Code */}
          <div className="space-y-6">
            {/* Carte Prix */}
            <div className="bg-[#252525] rounded-xl p-6 border border-gray-700 space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">Informations Financières</h3>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Prix Neuf</span>
                <span className="text-xl font-bold text-white">{formData.prix_neuf?.toFixed(2)} €</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Prix de Revient</span>
                <span className="text-xl font-bold text-blue-400">{formData.prix_revient?.toFixed(2)} €</span>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <label className="block text-xs uppercase text-gray-500 mb-1">Prix de Vente Consiglié</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={formData.prix_vente || ''} 
                    onChange={(e) => setFormData({...formData, prix_vente: parseFloat(e.target.value)})}
                    placeholder="Ex: 899.00"
                    className="flex-1 bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-green-500 outline-none"
                  />
                  <span className="text-gray-400">€</span>
                </div>
                {formData.prix_vente && (
                  <div className="mt-2 text-xs text-right">
                    Marge estimée: <span className="text-green-400 font-bold">
                      {(formData.prix_vente - formData.prix_revient).toFixed(2)} €
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col items-center text-center">
              <h3 className="text-gray-900 font-bold mb-4">QR Code Identifiant</h3>
              <div className="bg-white p-2 rounded-lg shadow-sm mb-4">
                <QRCodeSVG value={formData.qr_code} size={180} level="H" />
              </div>
              <p className="text-xs text-gray-500 mb-4 font-mono break-all">{formData.qr_code}</p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={printQRCode}
                  className="flex-1 bg-gray-900 hover:bg-black text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <Printer size={16} /> Imprimer
                </button>
                <button 
                  onClick={() => {
                    // Logique de téléchargement simple via canvas si besoin, ou utiliser printQRCode
                    printQRCode(); 
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <Download size={16} /> Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-gray-800 p-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-gray-400 hover:text-white font-medium transition-colors">
            Annuler
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : <><Save size={18} /> Enregistrer les modifications</>}
          </button>
        </div>

      </div>
    </div>
  );
}