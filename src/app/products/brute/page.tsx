// src/app/products/brute/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QrCode, Upload, Edit2, CheckCircle, Package, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

// === TYPES ===
interface LotDB {
  id: string;
  numerolot: string;
  couttotal: number;
  prixneuftotal: number;
  coef_brut: number | null;
}

interface ProduitDB {
  id: string;
  lot_id: string;
  user_id: string;
  nom: string;
  marque: string | null;
  categorie: string;
  description: string | null;
  prix_neuf: number;
  coef_revient: number;
  prix_revient: number;
  qr_code: string;
  statut: 'brute' | 'en_vente' | 'vendu' | 'archive';
  photos: string[] | null;
  etat_produit: string | null;
  etat_emballage: string | null;
}

interface Produit {
  id: string;
  lotId: string;
  userId: string;
  nom: string;
  marque: string | null;
  categorie: string;
  description: string | null;
  prixNeuf: number;
  coefRevient: number;
  prixRevient: number;
  qrCode: string;
  statut: 'brute' | 'en_vente' | 'vendu' | 'archive';
  photos: string[] | null;
  etatProduit: string | null;
  etatEmballage: string | null;
}

// === DONNÉES PRÉ-NORMALISÉES (depuis Excel) ===
const PRODUITS_INITIAUX = [
  { nom: "Dreame X50 Ultra Complete", marque: "Dreame", categorie: "Robot Aspirateur", prixNeuf: 1686.38, desc: "Robot aspirateur laveur IA 20000Pa" },
  { nom: "Ecovacs Deebot X1 OMNI", marque: "Ecovacs", categorie: "Robot Aspirateur", prixNeuf: 1549.00, desc: "Robot aspirateur laveur station auto" },
  { nom: "Mova Z50 Ultra", marque: "Mova", categorie: "Robot Aspirateur", prixNeuf: 1348.88, desc: "Robot aspirateur laveur mappage AI" },
  { nom: "Ecovacs T80 Omni", marque: "Ecovacs", categorie: "Robot Aspirateur", prixNeuf: 1346.25, desc: "Robot aspirateur laveur OZMO ZeroTangle" },
  { nom: "Dreame L40 Ultra", marque: "Dreame", categorie: "Robot Aspirateur", prixNeuf: 1123.88, desc: "Robot aspirateur laveur serpillière relevable" },
  { nom: "Dreame L10s Pro Ultra Heat", marque: "Dreame", categorie: "Robot Aspirateur", prixNeuf: 1123.88, desc: "Robot aspirateur laveur eau chaude 7000Pa" },
  { nom: "Dreame L40s Pro Ultra", marque: "Dreame", categorie: "Robot Aspirateur", prixNeuf: 1011.38, desc: "Robot aspirateur laveur 19000Pa DuoBrush" },
  { nom: "Roborock S7 MaxV", marque: "Roborock", categorie: "Robot Aspirateur", prixNeuf: 882.44, desc: "Robot aspirateur laveur ReactiveAI 5100Pa" },
  { nom: "Dreame L10s Ultra Gen 2", marque: "Dreame", categorie: "Robot Aspirateur", prixNeuf: 673.88, desc: "Robot aspirateur laveur MopExtend 10000Pa" },
  { nom: "Mova E40 Ultra", marque: "Mova", categorie: "Robot Aspirateur", prixNeuf: 561.38, desc: "Robot aspirateur laveur vidage auto 19000Pa" },
  { nom: "AAOBOSI Glacière Compresseur 45L", marque: "AAOBOSI", categorie: "Électroménager", prixNeuf: 336.93, desc: "Glacière compresseur APP contrôle" },
  { nom: "Bauknecht Plaque Induction BQ 2760S", marque: "Bauknecht", categorie: "Cuisine", prixNeuf: 299.99, desc: "Plaque induction booster touch control" },
  { nom: "Ninja CRISPi PRO XL", marque: "Ninja", categorie: "Cuisine", prixNeuf: 249.99, desc: "Friteuse airfryer verre 5,7L 5 modes" },
  { nom: "Ninja Foodi MAX Dual Zone", marque: "Ninja", categorie: "Cuisine", prixNeuf: 191.30, desc: "Airfryer double zone 9,5L 6-en-1" },
  { nom: "Comfee Hotte Aspirante 60cm", marque: "Comfee", categorie: "Cuisine", prixNeuf: 157.63, desc: "Hotte aspirante A++ 60cm sans conduit" },
  { nom: "KitchenAid Accessoire Pâtes", marque: "KitchenAid", categorie: "Accessoires", prixNeuf: 136.44, desc: "Set 3 pièces pâtes frais KitchenAid" },
  { nom: "Philips Airfryer Dual Basket", marque: "Philips", categorie: "Cuisine", prixNeuf: 129.99, desc: "Friteuse airfryer 9L 2 paniers RapidAir" },
  { nom: "Panasonic Micro-ondes Solo", marque: "Panasonic", categorie: "Électroménager", prixNeuf: 129.99, desc: "Micro-ondes 800W 20L inox" },
  { nom: "Levoit Ventilateur Sur Pied", marque: "Levoit", categorie: "Électroménager", prixNeuf: 92.33, desc: "Ventilateur DC silencieux télécommande" },
  { nom: "Toshiba Micro-ondes Solo", marque: "Toshiba", categorie: "Électroménager", prixNeuf: 76.40, desc: "Micro-ondes 800W 20L LED" },
  { nom: "Cecotec Ventilateur Mural", marque: "Cecotec", categorie: "Électroménager", prixNeuf: 63.45, desc: "Ventilateur mural 50W noir" },
  { nom: "Philips Fer Vapeur Series 7000", marque: "Philips", categorie: "Électroménager", prixNeuf: 59.99, desc: "Fer vapeur 2800W SteamGlide Plus" },
  { nom: "Cecotec Ventilateur Tour", marque: "Cecotec", categorie: "Électroménager", prixNeuf: 49.20, desc: "Ventilateur tour digital 50W télécommande" },
  { nom: "IBILI Cocotte Ovale Noire", marque: "IBILI", categorie: "Cuisine", prixNeuf: 38.32, desc: "Cocotte acier émaillé 42cm" },
  { nom: "Rintea Ventilateur Sur Pied", marque: "Rintea", categorie: "Électroménager", prixNeuf: 19.80, desc: "Ventilateur 9 vitesses LED oscillant" },
  { nom: "Amazon Basics Ventilateur Tour", marque: "Amazon Basics", categorie: "Électroménager", prixNeuf: 16.45, desc: "Ventilateur tour oscillant 71cm 35W" },
  { nom: "Siemens Filtre Aspirateur Q5.0", marque: "Siemens", categorie: "Accessoires", prixNeuf: 13.93, desc: "Filtre remplacement VSQ5X1230" },
];

export default function ProduitsBrutePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [lots, setLots] = useState<LotDB[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [coefBrut, setCoefBrut] = useState<number>(0);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterMarque, setFilterMarque] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [userId, setUserId] = useState<string>('');

  // === FETCH LOTS & USER ===
  useEffect(() => {
    async function fetchLots() {
      const { data, error } = await supabase
        .from('lots')
        .select('id, numerolot, couttotal, prixneuftotal, coef_brut')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setLots(data);
        if (data.length > 0) {
          setSelectedLotId(data[0].id);
        }
      }
      setLoading(false);
    }
    
    fetchLots();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // === CALCUL COEF BRUT AU CHANGEMENT DE LOT ===
  useEffect(() => {
    if (selectedLotId) {
      const lot = lots.find(l => l.id === selectedLotId);
      if (lot) {
        const coef = lot.coef_brut || (lot.prixneuftotal > 0 ? lot.couttotal / lot.prixneuftotal : 0);
        setCoefBrut(coef);
        
        if (!lot.coef_brut && lot.prixneuftotal > 0) {
          supabase.from('lots').update({ coef_brut: coef }).eq('id', selectedLotId).then();
        }
      }
      fetchProduits();
    }
  }, [selectedLotId, lots]);

  // === FETCH PRODUITS DU LOT ===
  async function fetchProduits() {
    if (!selectedLotId) return;
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('lot_id', selectedLotId)
      .eq('statut', 'brute')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setProduits(data.map(mapDBToProduit));
    }
  }

  // === MAPPING DB → FRONTEND ===
  function mapDBToProduit(db: ProduitDB): Produit {
    return {
      id: db.id,
      lotId: db.lot_id,
      userId: db.user_id,
      nom: db.nom,
      marque: db.marque,
      categorie: db.categorie,
      description: db.description,
      prixNeuf: db.prix_neuf,
      coefRevient: db.coef_revient,
      prixRevient: db.prix_revient,
      qrCode: db.qr_code,
      statut: db.statut,
      photos: db.photos,
      etatProduit: db.etat_produit,
      etatEmballage: db.etat_emballage,
    };
  }

  // === GÉNÉRATION QR CODE ===
  function generateQRCode(): string {
    return `PROD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  // === IMPORT EXCEL ===
  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedLotId || !userId) return;
    
    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
      
      const nouveauxProduits = jsonData.map((row: any) => {
        // Correction du parseur pour le format "1,686.38 €"
        const prixStr = row['TOTAL RETAIL']?.toString().replace(/[€\s]/g, '').replace(/,/g, '') || '0';
        const prixNeuf = parseFloat(prixStr) || 0;
        const desc = row['Item Desc']?.toString() || '';
        
        const marques = ['Dreame', 'Ecovacs', 'Mova', 'Roborock', 'Ninja', 'Philips', 'Panasonic', 'KitchenAid', 'Toshiba', 'Levoit', 'Cecotec', 'AAOBOSI', 'Bauknecht', 'Comfee', 'Rintea', 'Amazon Basics', 'IBILI', 'Siemens'];
        const marque = marques.find(m => desc.toLowerCase().includes(m.toLowerCase())) || null;
        
        let categorie = 'Autres';
        if (desc.toLowerCase().includes('robot') || desc.toLowerCase().includes('aspir')) categorie = 'Robot Aspirateur';
        else if (desc.toLowerCase().includes('friteuse') || desc.toLowerCase().includes('airfryer') || desc.toLowerCase().includes('cocotte') || desc.toLowerCase().includes('plaque') || desc.toLowerCase().includes('hotte')) categorie = 'Cuisine';
        else if (desc.toLowerCase().includes('micro-ondes') || desc.toLowerCase().includes('ventilateur') || desc.toLowerCase().includes('fer') || desc.toLowerCase().includes('glacière')) categorie = 'Électroménager';
        else if (desc.toLowerCase().includes('accessoire') || desc.toLowerCase().includes('filtre') || desc.toLowerCase().includes('pâtes')) categorie = 'Accessoires';
        
        const mots = desc.split(' ').slice(0, 8).join(' ');
        const nom = marque ? `${marque} ${mots.replace(new RegExp(marque, 'i'), '').trim()}` : mots;
        
        return {
          lot_id: selectedLotId,
          user_id: userId,
          nom: nom.substring(0, 100),
          marque,
          categorie,
          description: desc.substring(0, 200),
          prix_neuf: prixNeuf,
          coef_revient: coefBrut,
          prix_revient: Math.round(prixNeuf * coefBrut * 100) / 100,
          qr_code: generateQRCode(),
          statut: 'brute' as const,
        };
      });
      
      const { error } = await supabase.from('produits').insert(nouveauxProduits);
      if (!error) {
        fetchProduits();
        alert(`${nouveauxProduits.length} produits importés avec succès !`);
      } else {
        alert('Erreur lors de l\'insertion: ' + error.message);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'import Excel');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  // === CRÉATION RAPIDE DEPUIS LISTE PRÉ-REMPLIE ===
  async function creerProduitsPreRemplis() {
    if (!selectedLotId || coefBrut === 0 || !userId) {
      alert('Sélectionnez un lot valide et attendez le chargement de votre session.');
      return;
    }
    
    const produitsToInsert = PRODUITS_INITIAUX.map(p => ({
      lot_id: selectedLotId,
      user_id: userId,
      nom: p.nom,
      marque: p.marque,
      categorie: p.categorie,
      description: p.desc,
      prix_neuf: p.prixNeuf,
      coef_revient: coefBrut,
      prix_revient: Math.round(p.prixNeuf * coefBrut * 100) / 100,
      qr_code: generateQRCode(),
      statut: 'brute' as const,
    }));
    
    const { error } = await supabase.from('produits').insert(produitsToInsert);
    if (!error) {
      fetchProduits();
      alert(`${produitsToInsert.length} produits créés avec succès !`);
    } else {
      alert('Erreur: ' + error.message);
    }
  }

  // === METTRE EN VENTE ===
  async function mettreEnVente(id: string) {
    const { error } = await supabase
      .from('produits')
      .update({ statut: 'en_vente', updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (!error) {
      setProduits(prev => prev.filter(p => p.id !== id));
      router.push('/products/vente');
    }
  }

  // === FILTRES ===
  const produitsFiltres = useMemo(() => {
    return produits.filter(p => 
      (!filterMarque || p.marque?.toLowerCase().includes(filterMarque.toLowerCase())) &&
      (!filterCategorie || p.categorie.toLowerCase().includes(filterCategorie.toLowerCase()))
    );
  }, [produits, filterMarque, filterCategorie]);

  const marquesUniques = [...new Set(produits.map(p => p.marque).filter(Boolean))] as string[];
  const categoriesUniques = [...new Set(produits.map(p => p.categorie))];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Chargement des produits...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produits Bruts</h1>
            <p className="text-gray-500 mt-1">Inspection et préparation avant mise en vente</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              {lots.map(lot => (
                <option key={lot.id} value={lot.id}>
                  Lot #{lot.numerolot} • Coef: {((lot.coef_brut || (lot.prixneuftotal > 0 ? lot.couttotal / lot.prixneuftotal : 0)) * 100).toFixed(1)}%
                </option>
              ))}
            </select>
            
            <label className="px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]">
              <Upload size={18} className="text-gray-600" />
              <span className="text-gray-700 font-medium">Import Excel</span>
              <input type="file" accept=".xlsx,.xls" onChange={handleExcelImport} className="hidden" disabled={uploading || !userId} />
            </label>
            
            <button 
              onClick={creerProduitsPreRemplis}
              disabled={!userId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package size={18} />
              Charger Liste Démo
            </button>
          </div>
        </div>

        {/* KPI COEF - DESIGN AMÉLIORÉ */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500 block mb-1">Coefficient d'achat du lot</span>
            <span className="text-3xl font-bold text-blue-600">{(coefBrut * 100).toFixed(1)}%</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500 block mb-1">Produits en attente</span>
            <span className="text-3xl font-bold text-gray-900">{produits.length}</span>
          </div>
        </div>

        {/* FILTRES */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={filterMarque}
              onChange={(e) => setFilterMarque(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes marques</option>
              {marquesUniques.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          
          <select 
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes catégories</option>
            {categoriesUniques.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* GRILLE PRODUITS - DESIGN AMÉLIORÉ */}
        {produitsFiltres.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Aucun produit brut pour ce lot</p>
            <p className="text-sm text-gray-400 mt-2">Importez un Excel ou chargez la liste démo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produitsFiltres.map(produit => (
              <div key={produit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
                {/* PHOTO */}
                <div className="h-48 bg-gray-50 relative flex items-center justify-center border-b border-gray-100">
                  {produit.photos && produit.photos.length > 0 ? (
                    <img src={produit.photos[0]} alt={produit.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <Upload size={32} className="mx-auto mb-2" />
                      <span className="text-sm">Ajouter photo</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono shadow-sm border border-gray-200">
                    {produit.qrCode}
                  </div>
                </div>
                
                {/* INFOS */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-600 font-medium">{produit.categorie}</span>
                    {produit.marque && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{produit.marque}</span>}
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">{produit.nom}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{produit.description}</p>
                  
                  <div className="mb-4 mt-auto">
                    <div className="text-2xl font-extrabold text-gray-900 mb-1">{produit.prixNeuf.toFixed(0)} €</div>
                    <div className="text-xs text-gray-500 bg-gray-50 inline-block px-2 py-1 rounded">
                      Revient : <span className="font-bold text-gray-700">{produit.prixRevient.toFixed(0)} €</span> ({(produit.coefRevient * 100).toFixed(0)}%)
                    </div>
                  </div>
                  
                  {/* ACTIONS */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button className="flex-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1 text-sm font-medium text-gray-700 transition-all active:scale-[0.98]">
                      <Edit2 size={14} /> Modifier
                    </button>
                    <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-all active:scale-[0.98]" title="Voir QR Code">
                      <QrCode size={16} className="text-gray-600" />
                    </button>
                    <button 
                      onClick={() => mettreEnVente(produit.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center transition-all active:scale-[0.98] shadow-sm"
                      title="Mettre en vente"
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}