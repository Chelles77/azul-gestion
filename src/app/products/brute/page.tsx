'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Upload, Edit2, CheckCircle, Package, Filter, Trash2, QrCode, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Produit } from '@/lib/interfaces';
import ModalModifier from '@/components/ModalModifier';
import ModalValider from '@/components/ModalValider';
import ModalCreerProduit from '@/components/ModalCreerProduit';
import ModalMarquerCasse from '@/components/ModalMarquerCasse';

export default function ProduitsBrutePage() {
  const supabase = createClient();

  const [lots, setLots] = useState<any[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterMarque, setFilterMarque] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [coefBrut, setCoefBrut] = useState<number>(0);
  const [isModifying, setIsModifying] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isMarquingCasse, setIsMarquingCasse] = useState(false);

  // Charger les lots
  useEffect(() => {
    async function fetchLots() {
      const { data } = await supabase
        .from('lots')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setLots(data);
        if (data.length > 0) setSelectedLotId(data[0].id);
      }
      setLoading(false);
    }
    fetchLots();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Charger les produits bruts du lot sélectionné
  useEffect(() => {
    if (selectedLotId) {
      const lot = lots.find(l => l.id === selectedLotId);
      if (lot) {
        const coef = lot.coef_brut || (lot.prixneuftotal > 0 ? lot.couttotal / lot.prixneuftotal : 0);
        setCoefBrut(coef);
      }
      fetchProduits();
    }
  }, [selectedLotId, lots]);

  async function fetchProduits() {
    if (!selectedLotId) return;
    const { data } = await supabase
      .from('produits')
      .select('*')
      .eq('lot_id', selectedLotId)
      .eq('statut', 'brute')
      .order('product_number', { ascending: true });

    if (data) setProduits(data);
  }

  function generateQRCode(): string {
    return `PROD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedLotId || !userId) return;
    setUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Lire toutes les lignes pour trouver l'entête non-vide
      const allRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '', range: 0 });

      // Trouver la première ligne non-vide (entête)
      let headerRowIndex = 0;
      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        const nonEmptyValues = Object.values(row).filter((v: any) => v && v.toString().trim());
        if (nonEmptyValues.length > 0) {
          headerRowIndex = i;
          break;
        }
      }

      // Lire à partir de la ligne d'entête
      const jsonData = allRows.slice(headerRowIndex + 1);

      if (jsonData.length === 0) {
        alert('Le fichier Excel semble vide ou ne contient que des en-têtes.');
        setUploading(false);
        return;
      }

      const firstRow = allRows[headerRowIndex];
      const rawKeys = Object.keys(firstRow);
      console.log('Colonnes détectées:', rawKeys);

      // Détection flexible des colonnes
      const numberKey = rawKeys.find(k => {
        const lower = k.toLowerCase();
        return lower.includes('numero') || lower.includes('number') || lower.includes('id') || lower === 'n°' || lower === '1';
      }) || rawKeys[0];

      const descKey = rawKeys.find(k => {
        const lower = k.toLowerCase();
        return lower.includes('desc') || lower.includes('item') || lower.includes('produit') || lower.includes('name') || lower.includes('retail');
      }) || rawKeys[1];

      const priceKey = rawKeys.find(k => {
        const lower = k.toLowerCase();
        return lower.includes('total') || lower.includes('retail') || lower.includes('price') || lower.includes('prix');
      }) || rawKeys[rawKeys.length - 1];

      console.log('Colonne Numéro:', numberKey);
      console.log('Colonne Description:', descKey);
      console.log('Colonne Prix:', priceKey);

      const nouveauxProduits: any[] = [];
      let skipped = 0;
      const marques = ['Dreame', 'Ecovacs', 'Mova', 'Roborock', 'Ninja', 'Philips', 'Panasonic', 'KitchenAid', 'Toshiba', 'Levoit', 'Cecotec', 'AAOBOSI', 'Bauknecht', 'Comfee', 'Rintea', 'Amazon Basics', 'IBILI', 'Siemens'];

      for (const row of jsonData) {
        const productNumber = row[numberKey]?.toString() || '';
        let rawPrice = row[priceKey]?.toString() || '0';
        rawPrice = rawPrice.replace(/[^\d.]/g, '');
        const prixNeuf = parseFloat(rawPrice) || 0;
        const desc = row[descKey]?.toString() || '';

        if (!desc || prixNeuf <= 0) {
          skipped++;
          const reason = !desc ? 'Description manquante' : 'Prix invalide ou manquant';
          console.log(`❌ Skipped produit ${productNumber}: ${reason}`, { desc, prixNeuf });
          continue;
        }

        const marque = marques.find(m => desc.toLowerCase().includes(m.toLowerCase())) || null;
        let categorie = 'Autres';
        const d = desc.toLowerCase();
        if (d.includes('robot') || d.includes('aspir') || d.includes('vacuum')) categorie = 'Robot Aspirateur';
        else if (d.includes('friteuse') || d.includes('airfryer') || d.includes('cuisine')) categorie = 'Cuisine';
        else if (d.includes('micro') || d.includes('ventilateur') || d.includes('fer')) categorie = 'Électroménager';

        const mots = desc.split(' ').slice(0, 5).join(' ');
        const nom = marque ? `${marque} ${mots.replace(new RegExp(marque, 'i'), '').trim()}` : mots;
        const nomTrimmed = nom.substring(0, 100);

        const produit: any = {
          lot_id: selectedLotId,
          user_id: userId,
          nom: nomTrimmed,
          marque,
          categorie,
          description: desc.substring(0, 200),
          prix_neuf: prixNeuf,
          coef_revient: coefBrut,
          prix_revient: Math.round(prixNeuf * coefBrut * 100) / 100,
          qr_code: generateQRCode(),
          statut: 'brute',
          photos: null,
          etat_produit: null,
          etat_emballage: null,
          prix_estime_vente: null,
          product_number: nouveauxProduits.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        nouveauxProduits.push(produit);
      }

      if (nouveauxProduits.length === 0) {
        let msg = `⚠️ Aucun produit importé.`;
        if (skipped > 0) msg += ` ${skipped} lignes invalides (prix/nom manquant).`;
        alert(msg);
        setUploading(false);
        return;
      }

      // Récupérer les produits existants pour éviter les doublons
      const { data: existingProducts } = await supabase
        .from('produits')
        .select('product_number')
        .eq('lot_id', selectedLotId);

      const existingNumbers = new Set(
        (existingProducts || [])
          .map((p: any) => p.product_number)
          .filter(Boolean)
      );

      // Filtrer pour ne garder que les nouveaux produits
      const produitsAjouter = nouveauxProduits.filter(p => !existingNumbers.has(p.product_number));

      if (produitsAjouter.length === 0) {
        alert('✅ Tous les produits existent déjà dans ce lot.');
        setUploading(false);
        return;
      }

      // Insérer par batch de 1000 pour éviter la limite Supabase
      const batchSize = 1000;
      let insertedCount = 0;
      let hasError = false;

      for (let i = 0; i < produitsAjouter.length; i += batchSize) {
        const batch = produitsAjouter.slice(i, i + batchSize);
        const { error } = await supabase.from('produits').insert(batch);

        if (error) {
          console.error(`Erreur batch ${Math.floor(i / batchSize) + 1}:`, error);
          hasError = true;
          break;
        }
        insertedCount += batch.length;
      }

      if (!hasError) {
        let message = `✅ ${insertedCount} produits importés (${nouveauxProduits.length - insertedCount} déjà existants)`;
        if (skipped > 0) message += ` - ${skipped} lignes invalides ignorées`;
        alert(message);
        setTimeout(() => window.location.reload(), 500);
      } else {
        alert('❌ Erreur lors de l\'importation. Vérifiez la console.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lecture Excel.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function deleteProduit(produitId: string, nom: string) {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;

    try {
      const { error } = await supabase
        .from('produits')
        .delete()
        .eq('id', produitId);

      if (error) {
        alert('❌ Erreur: ' + error.message);
      } else {
        fetchProduits();
      }
    } catch (err: any) {
      alert('❌ Erreur inattendue: ' + err.message);
    }
  }

  async function viderListeLot() {
    if (!selectedLotId) return;
    if (!window.confirm(`Vider TOUS les produits bruts de ce lot ?`)) return;
    setUploading(true);
    try {
      const { error } = await supabase
        .from('produits')
        .delete()
        .eq('lot_id', selectedLotId)
        .eq('statut', 'brute');
      if (!error) {
        fetchProduits();
        alert('Liste vidée.');
      } else {
        alert('Erreur: ' + error.message);
      }
    } catch (err) {
      alert('Erreur inattendue.');
    } finally {
      setUploading(false);
    }
  }

  const produitsFiltres = useMemo(
    () =>
      produits.filter(
        p =>
          (!filterMarque || p.marque?.toLowerCase().includes(filterMarque.toLowerCase())) &&
          (!filterCategorie || p.categorie.toLowerCase().includes(filterCategorie.toLowerCase()))
      ),
    [produits, filterMarque, filterCategorie]
  );

  const marquesUniques = [...new Set(produits.map(p => p.marque).filter(Boolean))] as string[];
  const categoriesUniques = [...new Set(produits.map(p => p.categorie))];

  if (loading)
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Produits Bruts</h1>
            <p className="text-gray-400 mt-1">Inspection et préparation avant mise en vente</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedLotId}
              onChange={e => setSelectedLotId(e.target.value)}
              className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              {lots.map(lot => (
                <option key={lot.id} value={lot.id}>
                  Lot #{lot.numerolot}
                </option>
              ))}
            </select>
            <label className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer flex items-center gap-2 relative">
              <Upload size={18} />
              <span>{uploading ? 'Traitement...' : 'Importer Excel'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelImport}
                className="absolute w-0 h-0 opacity-0"
                disabled={uploading || !userId}
              />
            </label>
            <button
              onClick={viderListeLot}
              disabled={uploading || produits.length === 0}
              className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={18} /> Vider la liste
            </button>
            <button
              onClick={() => setIsCreating(true)}
              disabled={uploading || !selectedLotId}
              className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} /> Créer un produit
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase mb-1">Coeff Achat</p>
            <p className="text-2xl font-bold text-blue-400">{(coefBrut * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase mb-1">Produits Bruts</p>
            <p className="text-2xl font-bold text-white">{produits.length}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase mb-1">Prix Total Neuf</p>
            <p className="text-2xl font-bold text-green-400">
              {produits.reduce((sum, p) => sum + p.prix_neuf, 0).toFixed(0)} €
            </p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase mb-1">Coût Total</p>
            <p className="text-2xl font-bold text-orange-400">
              {produits.reduce((sum, p) => sum + p.prix_revient, 0).toFixed(0)} €
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <select
              value={filterMarque}
              onChange={e => setFilterMarque(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white appearance-none"
            >
              <option value="">Toutes marques</option>
              {marquesUniques.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <select
            value={filterCategorie}
            onChange={e => setFilterCategorie(e.target.value)}
            className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white appearance-none"
          >
            <option value="">Toutes catégories</option>
            {categoriesUniques.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Liste des produits */}
        {produitsFiltres.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-gray-800">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Aucun produit brut</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produitsFiltres.map((produit, index) => {
              const lotNumber = lots.find(l => l.id === selectedLotId)?.numerolot || selectedLotId;
              const productNumber = produit.product_number || (index + 1);
              return (
              <div key={produit.id} className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all flex flex-col">
                {/* Header avec numéros */}
                <div className="bg-[#252525] border-b border-gray-700 px-4 py-2 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Lot #{lotNumber}</span>
                  <span className="text-xs font-bold text-blue-400">Prod #{productNumber}</span>
                </div>

                <div className="relative bg-[#252525] h-48 flex items-center justify-center">
                  {produit.photos && produit.photos.length > 0 ? (
                    <img src={produit.photos[0]} alt={produit.nom} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <Upload size={32} className="mx-auto mb-2" />
                      <span className="text-sm">Ajouter photo</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-gray-300 border border-gray-700">
                    {produit.qr_code}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-1 bg-[#252525] border border-gray-700 rounded-full text-gray-400">
                      {produit.categorie}
                    </span>
                    {produit.marque && (
                      <span className="text-xs px-2 py-1 bg-blue-900/30 border border-blue-800/50 rounded-full text-blue-400 font-bold">
                        {produit.marque}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white mb-1 line-clamp-2 text-sm">{produit.nom}</h3>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2 flex-1">{produit.description}</p>

                  <div className="mb-3">
                    <div className="text-xl font-extrabold text-white">{produit.prix_neuf.toFixed(0)} €</div>
                    <div className="text-xs text-gray-500">
                      Revient: <span className="text-gray-200 font-bold">{produit.prix_revient.toFixed(0)} €</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => {
                        setSelectedProduct(produit);
                        setIsModifying(true);
                        setIsValidating(false);
                      }}
                      className="flex-1 px-2 py-2 bg-[#252525] border border-gray-700 rounded text-xs font-medium text-gray-300 hover:bg-[#333] transition-all flex items-center justify-center gap-1"
                    >
                      <Edit2 size={12} /> Modifier
                    </button>
                    <button className="px-2 py-2 bg-[#252525] border border-gray-700 rounded hover:bg-[#333] transition-all">
                      <QrCode size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(produit);
                        setIsValidating(true);
                        setIsModifying(false);
                      }}
                      className="px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all flex items-center justify-center"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(produit);
                        setIsMarquingCasse(true);
                      }}
                      className="px-2 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded border border-red-700/50 transition-all"
                      title="Marquer comme cassé"
                    >
                      💔
                    </button>
                    <button
                      onClick={() => deleteProduit(produit.id, produit.nom)}
                      className="px-2 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded border border-red-600/30 transition-all"
                      title="Supprimer ce produit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}

          </div>
        )}
      </div>

      {/* Modal Modifier */}
      <ModalModifier
        product={selectedProduct}
        isOpen={isModifying}
        onClose={() => {
          setIsModifying(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          fetchProduits();
          setIsModifying(false);
          setSelectedProduct(null);
        }}
      />

      {/* Modal Valider */}
      <ModalValider
        product={selectedProduct}
        isOpen={isValidating}
        onClose={() => {
          setIsValidating(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          fetchProduits();
          setIsValidating(false);
          setSelectedProduct(null);
        }}
      />

      {/* Modal Marquer Cassé */}
      <ModalMarquerCasse
        produit={selectedProduct}
        lotInfo={lots.find(l => l.id === selectedLotId)}
        isOpen={isMarquingCasse}
        onClose={() => {
          setIsMarquingCasse(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          fetchProduits();
          setIsMarquingCasse(false);
          setSelectedProduct(null);
        }}
      />

      {/* Modal Créer Produit */}
      <ModalCreerProduit
        lotId={selectedLotId}
        coefBrut={coefBrut}
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSuccess={() => {
          fetchProduits();
          setIsCreating(false);
        }}
      />
    </div>
  );
}
