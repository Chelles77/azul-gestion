'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Plus, Camera, Upload, RefreshCw, AlertCircle, Trash2, X, Loader } from 'lucide-react';

interface Depense {
  id: string;
  nom: string;
  montant: number;
  categorie: string;
  date_depense: string;
  fournisseur?: string;
  photo?: string;
  description?: string;
  created_at: string;
}

export default function PageDepense() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    montant: '',
    categorie: 'Autres',
    fournisseur: '',
    description: '',
    photo: null as string | null,
  });

  // Filtres
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [showFullYear, setShowFullYear] = useState(false);

  const fetchDepenses = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('depenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date_depense', { ascending: false });

      if (error) console.error('Erreur chargement:', error);
      else setDepenses(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDepenses();
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
        await fetchDepenses();
      } catch (error) {
        console.error(error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  // Auto refresh toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDepenses();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Caméra
  useEffect(() => {
    if (showCamera && !cameraActive) {
      startCamera();
    }
    return () => {
      if (cameraActive) stopCamera();
    };
  }, [showCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      alert('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = async () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photo = canvasRef.current.toDataURL('image/jpeg');

        setFormData({ ...formData, photo });
        setShowCamera(false);
        stopCamera();

        // Extraire les données de la facture avec OCR
        await extractInvoiceData(photo);
      }
    }
  };

  const extractInvoiceData = async (imageData: string) => {
    setExtracting(true);
    try {
      // Convertir base64 en blob pour l'API
      const base64Data = imageData.split(',')[1];

      // Utiliser Free OCR API (api.ocr.space)
      const formData = new FormData();

      // Convertir base64 en blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      formData.append('filename', 'facture.jpg');
      formData.append('filetype', 'jpg');
      formData.append('apikey', 'K87899142C8');
      formData.append('language', 'fre');
      formData.append('base64Image', imageData);

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      const text = result.ParsedText || '';

      console.log('OCR Result:', text);

      if (text) {
        // Extraire le montant - cherche les patterns les plus courants
        const montantPatterns = [
          /TOTAL\s*[:\s€]*\s*([0-9]+[.,][0-9]{2})/i,
          /TTC\s*[:\s€]*\s*([0-9]+[.,][0-9]{2})/i,
          /MONTANT\s*[:\s€]*\s*([0-9]+[.,][0-9]{2})/i,
          /([0-9]+[.,][0-9]{2})\s*€/,
          /€\s*([0-9]+[.,][0-9]{2})/i,
        ];

        for (const pattern of montantPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const montant = match[1].replace(',', '.');
            setFormData(prev => ({ ...prev, montant }));
            console.log('Montant trouvé:', montant);
            break;
          }
        }

        // Extraire le fournisseur (première ligne avec du texte)
        const lines = text.split('\n').filter((l: string) => l.trim().length > 2);
        if (lines.length > 0) {
          const fournisseur = lines[0].trim().substring(0, 50);
          setFormData(prev => ({ ...prev, fournisseur }));
          console.log('Fournisseur trouvé:', fournisseur);
        }
      }
    } catch (error) {
      console.error('OCR Error:', error);
      // Silencieux - l'utilisateur peut remplir manuellement
    } finally {
      setExtracting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, photo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.montant) {
      alert('Remplissez les champs obligatoires');
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from('depenses').insert([{
        user_id: user.id,
        nom: formData.nom,
        montant: parseFloat(formData.montant),
        categorie: formData.categorie,
        fournisseur: formData.fournisseur,
        description: formData.description,
        photo: formData.photo,
        date_depense: new Date().toISOString(),
      }]);

      if (error) throw error;

      setFormData({ nom: '', montant: '', categorie: 'Autres', fournisseur: '', description: '', photo: null });
      setShowModal(false);
      await fetchDepenses();
    } catch (error) {
      alert('Erreur: ' + (error as any).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette dépense?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('depenses').delete().eq('id', id);

      if (error) throw error;
      await fetchDepenses();
    } catch (error) {
      alert('Erreur: ' + (error as any).message);
    }
  };

  // Calculs
  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
  const parCategorie = depenses.reduce((acc, d) => {
    if (!acc[d.categorie]) acc[d.categorie] = 0;
    acc[d.categorie] += d.montant;
    return acc;
  }, {} as Record<string, number>);

  const filteredDepenses = depenses.filter((d: any) => {
    const date = new Date(d.date_depense);
    if (showFullYear) {
      return date.getFullYear() === selectedYear;
    }
    return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
  });

  const totalMois = filteredDepenses.reduce((sum, d) => sum + d.montant, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Gestion des Dépenses</h1>
            <p className="text-gray-400">Suivi des dépenses avec scan de facture</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium"
          >
            <Plus size={20} />
            Nouvelle Dépense
          </button>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-6 rounded-xl border border-blue-700">
            <p className="text-xs text-blue-400 uppercase font-bold mb-2">💰 Total Dépenses</p>
            <p className="text-3xl font-bold text-blue-400">{totalDepenses.toFixed(0)} €</p>
            <p className="text-xs text-gray-400 mt-1">{depenses.length} dépenses</p>
          </div>

          <div className="bg-gradient-to-br from-red-900/30 to-[#1a1a1a] p-6 rounded-xl border border-red-700">
            <p className="text-xs text-red-400 uppercase font-bold mb-2">📊 Moyenne</p>
            <p className="text-3xl font-bold text-red-400">{(totalDepenses / (depenses.length || 1)).toFixed(0)} €</p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-[#1a1a1a] p-6 rounded-xl border border-orange-700">
            <p className="text-xs text-orange-400 uppercase font-bold mb-2">📅 Ce Mois</p>
            <p className="text-3xl font-bold text-orange-400">{totalMois.toFixed(0)} €</p>
            <p className="text-xs text-gray-400 mt-1">{filteredDepenses.length} dépenses</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-[#1a1a1a] p-6 rounded-xl border border-purple-700">
            <p className="text-xs text-purple-400 uppercase font-bold mb-2">🏷️ Catégories</p>
            <p className="text-3xl font-bold text-purple-400">{Object.keys(parCategorie).length}</p>
          </div>
        </div>

        {/* Par Catégorie */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">📂 Dépenses par Catégorie</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(parCategorie).map(([cat, montant]) => (
              <div key={cat} className="bg-[#252525] p-4 rounded-lg border border-gray-700">
                <h3 className="font-bold text-white mb-2">{cat}</h3>
                <p className="text-2xl font-bold text-orange-400">{montant.toFixed(0)} €</p>
                <p className="text-xs text-gray-400 mt-1">{((montant / totalDepenses) * 100).toFixed(1)}% du total</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filtres et Détail */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">📅 {showFullYear ? 'Dépenses de l\'année' : 'Dépenses du Mois'}</h2>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Actualisation...' : 'Rafraîchir'}
              </button>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              >
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={showFullYear ? 'year' : selectedMonth}
                onChange={e => {
                  if (e.target.value === 'year') {
                    setShowFullYear(true);
                  } else {
                    setShowFullYear(false);
                    setSelectedMonth(parseInt(e.target.value));
                  }
                }}
                className="bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              >
                {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
                <option value="year">Année entière</option>
              </select>
            </div>
          </div>

          {filteredDepenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p>Aucune dépense pour cette période</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 font-bold text-gray-300">Nom</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-300">Catégorie</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-300">Fournisseur</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-300">Montant</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-300">Date</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepenses.map(depense => (
                    <tr key={depense.id} className="border-b border-gray-700 hover:bg-[#252525]/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-white">{depense.nom}</p>
                          {depense.photo && <p className="text-xs text-blue-400">📷 Facture scannée</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{depense.categorie}</td>
                      <td className="py-3 px-4 text-gray-300">{depense.fournisseur || '—'}</td>
                      <td className="py-3 px-4 text-right font-bold text-red-400">{depense.montant.toFixed(2)} €</td>
                      <td className="py-3 px-4 text-gray-300">{new Date(depense.date_depense).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(depense.id)}
                          className="p-1 hover:bg-red-900/30 rounded text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouvelle Dépense */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="border-b border-gray-800 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Nouvelle Dépense</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Extraction en cours */}
              {extracting && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 flex items-center gap-3">
                  <Loader size={20} className="animate-spin text-blue-400" />
                  <div>
                    <p className="text-blue-400 font-medium">Extraction des données...</p>
                    <p className="text-xs text-blue-300">Lecture de la facture en cours</p>
                  </div>
                </div>
              )}

              {/* Scan/Upload Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">📷 Facture (optionnel)</label>
                {formData.photo ? (
                  <div className="relative mb-2">
                    <img src={formData.photo} alt="Facture" className="w-full h-32 object-cover rounded-lg border border-gray-700" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo: null })}
                      className="absolute top-1 right-1 bg-red-600 p-1 rounded-lg text-white hover:bg-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Camera size={16} />
                    Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Upload size={16} />
                    Upload
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Caméra */}
              {showCamera && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-4">
                  <div className="w-full max-w-md">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg border-2 border-blue-500"
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                      >
                        Capturer
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCamera(false); stopCamera(); }}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom de la dépense *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Facture électricité"
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Montant (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.montant}
                  onChange={e => setFormData({ ...formData, montant: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie</label>
                <select
                  value={formData.categorie}
                  onChange={e => setFormData({ ...formData, categorie: e.target.value })}
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="Autres">Autres</option>
                  <option value="Achats">Achats</option>
                  <option value="Transport">Transport</option>
                  <option value="Frais">Frais</option>
                  <option value="Électricité">Électricité</option>
                  <option value="Fournitures">Fournitures</option>
                  <option value="Publicité">Publicité</option>
                </select>
              </div>

              {/* Fournisseur */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fournisseur</label>
                <input
                  type="text"
                  value={formData.fournisseur}
                  onChange={e => setFormData({ ...formData, fournisseur: e.target.value })}
                  placeholder="Ex: EDF"
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes additionnelles..."
                  rows={2}
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
