// src/app/products/brute/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QrCode, Upload, Edit2, CheckCircle, Package, Filter, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import ProductModal from '@/components/ProductModal';

interface LotDB { id: string; numerolot: string; couttotal: number; prixneuftotal: number; coef_brut: number | null; }
interface ProduitDB { id: string; lot_id: string; user_id: string; nom: string; marque: string | null; categorie: string; description: string | null; prix_neuf: number; coef_revient: number; prix_revient: number; qr_code: string; statut: 'brute' | 'en_vente' | 'vendu' | 'archive'; photos: string[] | null; etat_produit: string | null; etat_emballage: string | null; }
interface Produit { id: string; lotId: string; userId: string; nom: string; marque: string | null; categorie: string; description: string | null; prixNeuf: number; coefRevient: number; prixRevient: number; qrCode: string; statut: 'brute' | 'en_vente' | 'vendu' | 'archive'; photos: string[] | null; etatProduit: string | null; etatEmballage: string | null; }

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
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);

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

  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedLotId || !userId) return;
    setUploading(true);
    
    try {
      await supabase.from('produits').delete().eq('lot_id', selectedLotId).eq('statut', 'brute');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });
      
      if (jsonData.length === 0) { alert("Le fichier Excel semble vide."); setUploading(false); return; }

      const firstRow = jsonData[0];
      const rawKeys = Object.keys(firstRow);
      const descKey = rawKeys.find(k => k.replace(/[^a-zA-Z]/g, '').toLowerCase().includes('itemdesc')) || rawKeys[0];
      const priceKey = rawKeys.find(k => k.replace(/[^a-zA-Z]/g, '').toLowerCase().includes('totalretail')) || rawKeys[1];

      const nouveauxProduits: any[] = [];
      for (const row of jsonData) {
        let rawPrice = row[priceKey]?.toString() || '0';
        rawPrice = rawPrice.replace(/[^\d.]/g, ''); 
        const prixNeuf = parseFloat(rawPrice) || 0;
        const desc = row[descKey]?.toString() || '';
        if (!desc || prixNeuf <= 0) continue;

        const marques = ['Dreame', 'Ecovacs', 'Mova', 'Roborock', 'Ninja', 'Philips', 'Panasonic', 'KitchenAid', 'Toshiba', 'Levoit', 'Cecotec', 'AAOBOSI', 'Bauknecht', 'Comfee', 'Rintea', 'Amazon Basics', 'IBILI', 'Siemens'];
        const marque = marques.find(m => desc.toLowerCase().includes(m.toLowerCase())) || null;
        
        let categorie = 'Autres';
        const d = desc.toLowerCase();
        if (d.includes('robot') || d.includes('aspir') || d.includes('saug') || d.includes('vacuum')) categorie = 'Robot Aspirateur';
        else if (d.includes('friteuse') || d.includes('airfryer') || d.includes('cocotte') || d.includes('plaque') || d.includes('hotte') || d.includes('kochfeld') || d.includes('heißluft') || d.includes('pasta')) categorie = 'Cuisine';
        else if (d.includes('micro-ondes') || d.includes('ventilateur') || d.includes('fer') || d.includes('glacière') || d.includes('mikrowelle') || d.includes('ventilator') || d.includes('dampfbügeleisen') || d.includes('kühlbox') || d.includes('standventilator')) categorie = 'Électroménager';
        else if (d.includes('accessoire') || d.includes('filtre') || d.includes('ersatzfilter')) categorie = 'Accessoires';
        
        const mots = desc.split(' ').slice(0, 5).join(' ');
        const nom = marque ? `${marque} ${mots.replace(new RegExp(marque, 'i'), '').trim()}` : mots;
        
        nouveauxProduits.push({ 
          lot_id: selectedLotId, user_id: userId, nom: nom.substring(0, 100), marque, categorie, 
          description: desc.substring(0, 200), prix_neuf: prixNeuf, coef_revient: coefBrut, 
          prix_revient: Math.round(prixNeuf * coefBrut * 100) / 100, qr_code: generateQRCode(), statut: 'brute' as const 
        });
      }
      
      if (nouveauxProduits.length === 0) { alert("Aucun produit valide trouvé."); setUploading(false); return; }
      const { error } = await supabase.from('produits').insert(nouveauxProduits);
      if (!error) { fetchProduits(); alert(`${nouveauxProduits.length} produits importés !`); } 
      else { alert('Erreur Supabase: ' + error.message); }
    } catch (err) { console.error(err); alert('Erreur lecture Excel.'); } 
    finally { setUploading(false); e.target.value = ''; }
  }

  async function viderListeLot() {
    if (!selectedLotId) return;
    const lot = lots.find(l => l.id === selectedLotId);
    if (!window.confirm(`Vider TOUS les produits du ${lot?.numerolot} ?`)) return;
    setUploading(true);
    try {
      const { error } = await supabase.from('produits').delete().eq('lot_id', selectedLotId).eq('statut', 'brute');
      if (!error) { fetchProduits(); alert(`Liste vidée.`); } 
      else { alert('Erreur: ' + error.message); }
    } catch (err) { alert('Erreur inattendue.'); } 
    finally { setUploading(false); }
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Produits Bruts</h1>
            <p className="text-gray-400 mt-1">Inspection et préparation avant mise en vente</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={selectedLotId} onChange={(e) => setSelectedLotId(e.target.value)} className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 shadow-sm">
              {lots.map(lot => <option key={lot.id} value={lot.id}>Lot #{lot.numerolot} • Coef: {((lot.coef_brut || (lot.prixneuftotal > 0 ? lot.couttotal / lot.prixneuftotal : 0)) * 100).toFixed(1)}%</option>)}
            </select>
            <label className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer flex items-center gap-2 shadow-sm transition-all font-medium">
              <Upload size={18} /> <span>{uploading ? 'Traitement...' : 'Importer Excel'}</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} className="hidden" disabled={uploading || !userId} />
            </label>
            <button onClick={viderListeLot} disabled={uploading || produits.length === 0} className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg flex items-center gap-2 shadow-sm transition-all font-medium disabled:opacity-50">
              <Trash2 size={18} /> <span>Vider la liste</span>
            </button>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-800 flex justify-between items-center shadow-lg">
          <div><span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Coefficient d'achat</span><span className="text-3xl font-bold text-blue-400">{(coefBrut * 100).toFixed(1)}%</span></div>
          <div className="text-right"><span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Produits en attente</span><span className="text-3xl font-bold text-white">{produits.length}</span></div>
        </div>

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

        {produitsFiltres.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-lg">
            <Package size={48} className="mx-auto text-gray-600 mb-4" /><p className="text-gray-400 text-lg">Aucun produit brut</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produitsFiltres.map(produit => (
              // ✅ CORRECTION ICI : overflow-hidden sur la carte ET sur l'image
                <div 
  key={produit.id} 
  className="bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-gray-600 transition-all duration-200 flex flex-col shadow-lg"
  style={{ overflow: 'hidden' }} // ✅ Force le découpage au niveau de la carte entière
>
  {/* Zone Image */}
    {/* ZONE IMAGE CORRIGÉE */}
  <div 
    className="relative h-48 bg-[#252525] border-b border-gray-800 flex items-center justify-center"
    style={{ overflow: 'hidden' }}
  >
    {produit.photos && produit.photos.length > 0 ? (
      <img 
        src={produit.photos[0]} 
        alt={produit.nom} 
        className="block w-full"
        style={{ 
          maxHeight: '100%', 
          width: '100%',
          objectFit: 'contain', /* Change cover par contain pour voir l'image entière sans couper */
          display: 'block'
        }} 
      />
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
        <Upload size={32} className="mb-2" />
        <span className="text-sm">Ajouter photo</span>
      </div>
    )}
    
    {/* Badge QR Code */}
    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-gray-300 border border-gray-700 z-10">
      {produit.qrCode}
    </div>
  </div>
</div>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          onUpdate={fetchProduits}
        />
      )}
    </div>
  );
}