// src/app/products/brute/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QrCode, Upload, Edit2, CheckCircle, Package, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

interface LotDB { id: string; numerolot: string; couttotal: number; prixneuftotal: number; coef_brut: number | null; }
interface ProduitDB { id: string; lot_id: string; user_id: string; nom: string; marque: string | null; categorie: string; description: string | null; prix_neuf: number; coef_revient: number; prix_revient: number; qr_code: string; statut: 'brute' | 'en_vente' | 'vendu' | 'archive'; photos: string[] | null; etat_produit: string | null; etat_emballage: string | null; }
interface Produit { id: string; lotId: string; userId: string; nom: string; marque: string | null; categorie: string; description: string | null; prixNeuf: number; coefRevient: number; prixRevient: number; qrCode: string; statut: 'brute' | 'en_vente' | 'vendu' | 'archive'; photos: string[] | null; etatProduit: string | null; etatEmballage: string | null; }

// Liste des 27 produits uniques nettoyés
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

  useEffect(() => {
    async function fetchLots() {
      const { data } = await supabase.from('lots').select('id, numerolot, couttotal, prixneuftotal, coef_brut').order('created_at', { ascending: false });
      if (data) { setLots(data); if (data.length > 0) setSelectedLotId(data[0].id); }
      setLoading(false);
    }
    fetchLots();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
  }, []);

  useEffect(() => {
    if (selectedLotId) {
      const lot = lots.find(l => l.id === selectedLotId);
      if (lot) {
        const coef = lot.coef_brut || (lot.prixneuftotal > 0 ? lot.couttotal / lot.prixneuftotal : 0);
        setCoefBrut(coef);
        if (!lot.coef_brut && lot.prixneuftotal > 0) supabase.from('lots').update({ coef_brut: coef }).eq('id', selectedLotId).then();
      }
      fetchProduits();
    }
  }, [selectedLotId, lots]);

  async function fetchProduits() {
    if (!selectedLotId) return;
    const { data } = await supabase.from('produits').select('*').eq('lot_id', selectedLotId).eq('statut', 'brute').order('created_at', { ascending: false });
    if (data) setProduits(data.map(mapDBToProduit));
  }

  function mapDBToProduit(db: ProduitDB): Produit {
    return { id: db.id, lotId: db.lot_id, userId: db.user_id, nom: db.nom, marque: db.marque, categorie: db.categorie, description: db.description, prixNeuf: db.prix_neuf, coefRevient: db.coef_revient, prixRevient: db.prix_revient, qrCode: db.qr_code, statut: db.statut, photos: db.photos, etatProduit: db.etat_produit, etatEmballage: db.etat_emballage };
  }

  function generateQRCode(): string { return `PROD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`; }

  // === IMPORT EXCEL CORRIGÉ ===
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
        // CORRECTION PRIX : Gère "1,686.38 €" -> enlève € et espaces, enlève virgules de milliers
        let prixStr = row['TOTAL RETAIL']?.toString() || '0';
        prixStr = prixStr.replace(/[€\s]/g, '').replace(/,/g, ''); 
        const prixNeuf = parseFloat(prixStr) || 0;
        
        const desc = row['Item Desc']?.toString() || '';
        const marques = ['Dreame', 'Ecovacs', 'Mova', 'Roborock', 'Ninja', 'Philips', 'Panasonic', 'KitchenAid', 'Toshiba', 'Levoit', 'Cecotec', 'AAOBOSI', 'Bauknecht', 'Comfee', 'Rintea', 'Amazon Basics', 'IBILI', 'Siemens'];
        const marque = marques.find(m => desc.toLowerCase().includes(m.toLowerCase())) || null;
        
        let categorie = 'Autres';
        if (desc.toLowerCase().includes('robot') || desc.toLowerCase().includes('aspir') || desc.toLowerCase().includes('saug')) categorie = 'Robot Aspirateur';
        else if (desc.toLowerCase().includes('friteuse') || desc.toLowerCase().includes('airfryer') || desc.toLowerCase().includes('cocotte') || desc.toLowerCase().includes('plaque') || desc.toLowerCase().includes('hotte') || desc.toLowerCase().includes('kochfeld') || desc.toLowerCase().includes('heißluft')) categorie = 'Cuisine';
        else if (desc.toLowerCase().includes('micro-ondes') || desc.toLowerCase().includes('ventilateur') || desc.toLowerCase().includes('fer') || desc.toLowerCase().includes('glacière') || desc.toLowerCase().includes('mikrowelle') || desc.toLowerCase().includes('ventilator') || desc.toLowerCase().includes('dampfbügeleisen') || desc.toLowerCase().includes('kühlbox')) categorie = 'Électroménager';
        else if (desc.toLowerCase().includes('accessoire') || desc.toLowerCase().includes('filtre') || desc.toLowerCase().includes('pâtes') || desc.toLowerCase().includes('ersatzfilter')) categorie = 'Accessoires';
        
        // Titre court : Marque + 6 mots max
        const mots = desc.split(' ').slice(0, 6).join(' ');
        const nom = marque ? `${marque} ${mots.replace(new RegExp(marque, 'i'), '').trim()}` : mots;
        
        return { 
          lot_id: selectedLotId, user_id: userId, nom: nom.substring(0, 100), marque, categorie, 
          description: desc.substring(0, 200), prix_neuf: prixNeuf, coef_revient: coefBrut, 
          prix_revient: Math.round(prixNeuf * coefBrut * 100) / 100, qr_code: generateQRCode(), statut: 'brute' as const 
        };
      }).filter((p: any) => p.prixNeuf > 0); // Filtre les lignes vides
      
      const { error } = await supabase.from('produits').insert(nouveauxProduits);
      if (!error) { fetchProduits(); alert(`${nouveauxProduits.length} produits importés depuis Excel !`); }
      else { alert('Erreur: ' + error.message); }
    } catch (err) { alert('Erreur lors de la lecture du fichier Excel'); } finally { setUploading(false); e.target.value = ''; }
  }

  // === CHARGER LISTE DÉMO (AVEC NETTOYAGE AUTO) ===
  async function creerProduitsPreRemplis() {
    if (!selectedLotId || coefBrut === 0 || !userId) return;
    
    // 1. On supprime les anciens produits 'brute' de ce lot pour éviter les doublons (56 produits)
    await supabase.from('produits').delete().eq('lot_id', selectedLotId).eq('statut', 'brute');
    
    // 2. On insère les 27 produits propres
    const produitsToInsert = PRODUITS_INITIAUX.map(p => ({ 
      lot_id: selectedLotId, user_id: userId, nom: p.nom, marque: p.marque, categorie: p.categorie, 
      description: p.desc, prix_neuf: p.prixNeuf, coef_revient: coefBrut, 
      prix_revient: Math.round(p.prixNeuf * coefBrut * 100) / 100, qr_code: generateQRCode(), statut: 'brute' as const 
    }));
    
    const { error } = await supabase.from('produits').insert(produitsToInsert);
    if (!error) { fetchProduits(); alert('Liste démo chargée (27 produits) !'); }
  }

  async function mettreEnVente(id: string) {
    const { error } = await supabase.from('produits').update({ statut: 'en_vente', updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) { setProduits(prev => prev.filter(p => p.id !== id)); router.push('/products/vente'); }
  }

  const produitsFiltres = useMemo(() => produits.filter(p => (!filterMarque || p.marque?.toLowerCase().includes(filterMarque.toLowerCase())) && (!filterCategorie || p.categorie.toLowerCase().includes(filterCategorie.toLowerCase()))), [produits, filterMarque, filterCategorie]);
  const marquesUniques = [...new Set(produits.map(p => p.marque).filter(Boolean))] as string[];
  const categoriesUniques = [...new Set(produits.map(p => p.categorie))];

  if (loading) return <div className="min-h-screen bg-[#111111] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Produits Bruts</h1>
            <p className="text-gray-400 mt-1">Inspection et préparation avant mise en vente</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={selectedLotId} onChange={(e) => setSelectedLotId(e.target.value)} className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
              {lots.map(lot => <option key={lot.id} value={lot.id}>Lot #{lot.numerolot} • Coef: {((lot.coef_brut || (lot.prixneuftotal > 0 ? lot.couttotal / lot.prixneuftotal : 0)) * 100).toFixed(1)}%</option>)}
            </select>
            <label className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg cursor-pointer hover:bg-[#252525] flex items-center gap-2 shadow-sm active:scale-[0.98] transition-all">
              <Upload size={18} className="text-gray-400" /><span className="text-gray-300 font-medium">Import Excel</span>
              <input type="file" accept=".xlsx,.xls" onChange={handleExcelImport} className="hidden" disabled={uploading || !userId} />
            </label>
            <button onClick={creerProduitsPreRemplis} disabled={!userId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50">
              <Package size={18} />Charger Liste Démo
            </button>
          </div>
        </div>

        {/* KPI COEF */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-800 flex justify-between items-center shadow-lg">
          <div>
            <span className="text-sm text-gray-400 block mb-1 uppercase tracking-wider text-xs">Coefficient d'achat du lot</span>
            <span className="text-3xl font-bold text-blue-400">{(coefBrut * 100).toFixed(1)}%</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-400 block mb-1 uppercase tracking-wider text-xs">Produits en attente</span>
            <span className="text-3xl font-bold text-white">{produits.length}</span>
          </div>
        </div>

        {/* FILTRES */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <select value={filterMarque} onChange={(e) => setFilterMarque(e.target.value)} className="pl-9 pr-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white shadow-sm focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="">Toutes marques</option>{marquesUniques.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <select value={filterCategorie} onChange={(e) => setFilterCategorie(e.target.value)} className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white shadow-sm focus:ring-2 focus:ring-blue-500 appearance-none">
            <option value="">Toutes catégories</option>{categoriesUniques.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* GRILLE PRODUITS */}
        {produitsFiltres.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-lg">
            <Package size={48} className="mx-auto text-gray-600 mb-4" /><p className="text-gray-400 text-lg">Aucun produit brut pour ce lot</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produitsFiltres.map(produit => (
              <div key={produit.id} className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all duration-200 flex flex-col shadow-lg">
                <div className="h-48 bg-[#252525] relative flex items-center justify-center border-b border-gray-800">
                  {produit.photos && produit.photos.length > 0 ? <img src={produit.photos[0]} alt={produit.nom} className="w-full h-full object-cover" /> : <div className="text-gray-500 text-center"><Upload size={32} className="mx-auto mb-2" /><span className="text-sm">Ajouter photo</span></div>}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-gray-300 border border-gray-700">{produit.qrCode}</div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs px-2.5 py-1 bg-[#252525] border border-gray-700 rounded-full text-gray-400 font-medium">{produit.categorie}</span>
                    {produit.marque && <span className="text-xs font-bold text-blue-400 bg-blue-900/30 border border-blue-800/50 px-2.5 py-1 rounded-full">{produit.marque}</span>}
                  </div>
                  <h3 className="font-bold text-white mb-2 line-clamp-2 leading-tight">{produit.nom}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">{produit.description}</p>
                  <div className="mb-4 mt-auto">
                    <div className="text-2xl font-extrabold text-white mb-1">{produit.prixNeuf.toFixed(0)} €</div>
                    <div className="text-xs text-gray-400 bg-[#252525] inline-block px-2 py-1 rounded border border-gray-700">
                      Revient : <span className="font-bold text-gray-200">{produit.prixRevient.toFixed(0)} €</span> <span className="text-gray-500">({(produit.coefRevient * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-800">
                    <button className="flex-1 px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg hover:bg-[#333333] flex items-center justify-center gap-1 text-sm font-medium text-gray-300 active:scale-[0.98] transition-all"><Edit2 size={14} /> Modifier</button>
                    <button className="px-3 py-2 bg-[#252525] border border-gray-700 rounded-lg hover:bg-[#333333] flex items-center justify-center active:scale-[0.98] transition-all" title="Voir QR Code"><QrCode size={16} className="text-gray-400" /></button>
                    <button onClick={() => mettreEnVente(produit.id)} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center active:scale-[0.98] transition-all shadow-sm" title="Mettre en vente"><CheckCircle size={16} /></button>
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