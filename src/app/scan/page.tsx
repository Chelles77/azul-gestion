'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Vérification authentification
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleScan = async () => {
    if (!selectedFile || !user) return;
    
    setScanning(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erreur lors du scan');
      }

      const data = await response.json();
      setResult(data);
      
      // Sauvegarde automatique dans Supabase (optionnel, à activer plus tard)
      // await saveToSupabase(data);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'analyse");
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#121212] text-blue-500">Chargement...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Scanner une facture</h1>
            <p className="text-gray-400">Prenez en photo ou importez une image pour l'analyser.</p>
          </div>
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white transition-colors">
            ← Retour
          </button>
        </div>

        {/* Zone de Scan */}
        <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 p-6 md:p-8 shadow-xl">
          
          {!selectedFile ? (
            /* État initial : Boutons d'upload */
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 transition-colors group">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Camera size={40} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucune image sélectionnée</h3>
              <p className="text-gray-400 text-center mb-6 max-w-md">
                Cliquez ci-dessous pour prendre une photo ou choisir une image dans votre galerie.
              </p>
              
              <div className="flex gap-4 flex-wrap justify-center">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  id="camera-input" 
                />
                <label 
                  htmlFor="camera-input" 
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-all shadow-lg shadow-blue-900/20"
                >
                  <Camera size={20} />
                  Prendre une photo
                </label>

                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  id="gallery-input" 
                />
                <label 
                  htmlFor="gallery-input" 
                  className="flex items-center gap-2 px-6 py-3 bg-[#2a2a2a] hover:bg-[#333] border border-gray-700 text-white font-medium rounded-lg cursor-pointer transition-all"
                >
                  <Upload size={20} />
                  Choisir une image
                </label>
              </div>
            </div>
          ) : (
            /* État sélectionné : Preview + Résultat */
            <div className="space-y-6">
              
              {/* Barre d'action haut */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                <span className="text-sm text-gray-400 truncate max-w-[200px]">{selectedFile.name}</span>
                <button onClick={resetScan} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm font-medium">
                  <X size={16} /> Annuler
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Colonne Gauche : Image */}
                <div className="bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center min-h-[300px]">
                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-[400px] object-contain" />
                </div>

                {/* Colonne Droite : Résultats ou Loading */}
                <div className="flex flex-col justify-center">
                  {scanning ? (
                    <div className="text-center py-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-lg font-medium text-blue-400">Analyse en cours...</p>
                      <p className="text-sm text-gray-500 mt-2">Mindee OCR extrait les données</p>
                    </div>
                  ) : result ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <CheckCircle size={24} />
                        <h3 className="text-xl font-bold text-white">Analyse réussie !</h3>
                      </div>
                      
                      <div className="bg-[#252525] p-4 rounded-lg border border-gray-700 space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fournisseur</p>
                          <p className="text-lg font-semibold text-white">{result.supplier || 'Non détecté'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Montant Total</p>
                          <p className="text-2xl font-bold text-blue-400">{result.amount ? `${result.amount} €` : '0.00 €'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
                          <p className="text-base text-gray-300">{result.date || 'Non détectée'}</p>
                        </div>
                      </div>

                      <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-green-900/20">
                        Enregistrer la facture
                      </button>
                    </div>
                  ) : error ? (
                    <div className="text-center py-6 bg-red-900/20 border border-red-800 rounded-lg">
                      <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
                      <p className="text-red-400 font-medium">{error}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-400 mb-4">L'image est prête.</p>
                      <button 
                        onClick={handleScan}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                      >
                        Lancer l'analyse OCR
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}