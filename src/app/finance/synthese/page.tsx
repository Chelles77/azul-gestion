'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

interface ProduitVendu {
  id: string;
  nom: string;
  lot_id: string;
  numerolot: string;
  prix_revient: number;
  prix_vente_final: number;
  plateforme_vente_finale: string;
  frais: number;
  urssaf: number;
  benefice_brut: number;
}

interface LotStats {
  lot_id: string;
  numerolot: string;
  couttotal: number;
  nombreProduits: number;
  coutUnitaire: number;
  nombreVendus: number;
  pourcentageVente: number;
  totalVentesLot: number;
  fraisLot: number;
}

export default function PageSynthese() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lots, setLots] = useState<LotStats[]>([]);
  const [produitVendus, setProduitVendus] = useState<ProduitVendu[]>([]);
  const [tauxURSSAF, setTauxURSSAF] = useState(12.3);
  const [depensesTotales, setDepensesTotales] = useState(0);

  const calculateFrais = (prixVente: number, plateforme: string): number => {
    let frais = 0;
    if (plateforme === 'Vinted') frais = prixVente * 0.08;
    else if (plateforme === 'Le Bon Coin') frais = prixVente * 0.05;
    else if (plateforme === 'eBay') frais = prixVente * 0.125;
    else if (plateforme === 'Amazon') frais = prixVente * 0.15;
    else frais = prixVente * 0.05;
    return frais;
  };

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Récupérer tous les produits vendus
      const { data: soldProductsData } = await supabase
        .from('produits')
        .select('id, nom, lot_id, prix_revient, prix_vente_final, plateforme_vente_finale')
        .eq('user_id', user.id)
        .eq('statut', 'vendu');

      // Récupérer les lots pour avoir les numéros
      const { data: lotsData } = await supabase
        .from('lots')
        .select('*')
        .eq('user_id', user.id);

      const lotsMap = new Map(lotsData?.map(lot => [lot.id, lot]) || []);

      // Calculer pour chaque produit vendu
      const produitsVendus: ProduitVendu[] = [];
      const lotsWithStats: LotStats[] = [];

      // Créer un map pour les stats par lot
      const lotStatsMap = new Map<string, { couttotal: number; nombreProduits: number; nombreVendus: number; totalVentesLot: number; fraisLot: number }>();

      for (const product of soldProductsData || []) {
        const lot = lotsMap.get(product.lot_id);
        if (!lot) continue;

        const prixVente = product.prix_vente_final || 0;
        const prixAchat = product.prix_revient || 0;
        const frais = calculateFrais(prixVente, product.plateforme_vente_finale);
        const urssaf = prixVente * (tauxURSSAF / 100);
        const beneficeBrut = prixVente - prixAchat - frais - urssaf;

        produitsVendus.push({
          id: product.id,
          nom: product.nom,
          lot_id: product.lot_id,
          numerolot: lot.numerolot,
          prix_revient: prixAchat,
          prix_vente_final: prixVente,
          plateforme_vente_finale: product.plateforme_vente_finale,
          frais,
          urssaf,
          benefice_brut: beneficeBrut,
        });

        // Accumuler les stats par lot
        const currentStats = lotStatsMap.get(lot.id) || {
          couttotal: lot.couttotal,
          nombreProduits: 0,
          nombreVendus: 0,
          totalVentesLot: 0,
          fraisLot: 0,
        };
        currentStats.nombreVendus += 1;
        currentStats.totalVentesLot += prixVente;
        currentStats.fraisLot += frais;
        lotStatsMap.set(lot.id, currentStats);
      }

      // Compter tous les produits pour pourcentages
      if (lotsData) {
        for (const lot of lotsData) {
          const { data: allProducts } = await supabase
            .from('produits')
            .select('id')
            .eq('lot_id', lot.id);

          const nombreProduits = allProducts?.length || 0;
          const stats = lotStatsMap.get(lot.id);
          const nombreVendus = stats?.nombreVendus || 0;
          const pourcentageVente = nombreProduits > 0 ? (nombreVendus / nombreProduits) * 100 : 0;
          const coutUnitaire = nombreProduits > 0 ? lot.couttotal / nombreProduits : 0;

          lotsWithStats.push({
            lot_id: lot.id,
            numerolot: lot.numerolot,
            couttotal: lot.couttotal,
            nombreProduits,
            coutUnitaire,
            nombreVendus,
            pourcentageVente,
            totalVentesLot: stats?.totalVentesLot || 0,
            fraisLot: stats?.fraisLot || 0,
          });
        }
      }

      setLots(lotsWithStats);
      setProduitVendus(produitsVendus);

      // Dépenses totales
      const { data: depensesData } = await supabase
        .from('depenses')
        .select('montant')
        .eq('user_id', user.id);

      const depenses = depensesData?.reduce((sum: number, d: any) => sum + d.montant, 0) || 0;
      setDepensesTotales(depenses);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
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

        await fetchData();
      } catch (error) {
        console.error(error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  // Calculs totaux par produit
  const totalCoutAchat = produitVendus.reduce((sum, p) => sum + p.prix_revient, 0);
  const caTotal = produitVendus.reduce((sum, p) => sum + p.prix_vente_final, 0);
  const fraisTotal = produitVendus.reduce((sum, p) => sum + p.frais, 0);
  const urssafTotal = produitVendus.reduce((sum, p) => sum + p.urssaf, 0);

  // Bénéfice BRUT = CA - Coûts achat - Frais - URSSAF
  const beneficeBrut = caTotal - totalCoutAchat - fraisTotal - urssafTotal;

  // Bénéfice NET = Bénéfice brut - Dépenses
  const beneficeNet = beneficeBrut - depensesTotales;

  // Stats globales
  const totalProduits = lots.reduce((sum, lot) => sum + lot.nombreProduits, 0);
  const totalVendus = produitVendus.length;
  const pourcentageGlobal = totalProduits > 0 ? (totalVendus / totalProduits) * 100 : 0;

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
            <h1 className="text-4xl font-bold text-white mb-2">📊 Vue Synthèse</h1>
            <p className="text-gray-400">Bénéfice par produit vendu</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg flex items-center gap-2 font-medium"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            Rafraîchir
          </button>
        </div>

        {/* TOTAUX PRINCIPAUX */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-blue-700 p-6 rounded-xl">
            <p className="text-xs text-blue-400 font-bold mb-2">💰 COÛT ACHAT TOTAL</p>
            <p className="text-3xl font-bold text-blue-400">{totalCoutAchat.toFixed(0)} €</p>
          </div>

          <div className="bg-[#1a1a1a] border border-green-700 p-6 rounded-xl">
            <p className="text-xs text-green-400 font-bold mb-2">📦 PRODUITS VENDUS</p>
            <p className="text-3xl font-bold text-green-400">{totalVendus}/{totalProduits}</p>
            <p className="text-xs text-green-300 mt-1">{pourcentageGlobal.toFixed(1)}%</p>
          </div>

          <div className="bg-[#1a1a1a] border border-red-700 p-6 rounded-xl">
            <p className="text-xs text-red-400 font-bold mb-2">📉 FRAIS & URSSAF</p>
            <p className="text-2xl font-bold text-red-400">{(fraisTotal + urssafTotal).toFixed(0)} €</p>
            <p className="text-xs text-red-300 mt-1">Frais: {fraisTotal.toFixed(0)}€ + URSSAF: {urssafTotal.toFixed(0)}€</p>
            <input
              type="number"
              value={tauxURSSAF}
              onChange={e => setTauxURSSAF(parseFloat(e.target.value) || 12.3)}
              step="0.1"
              className="w-full bg-[#252525] border border-gray-700 rounded px-2 py-1 text-white text-xs mt-2"
              placeholder="URSSAF %"
            />
          </div>

          <div className="bg-[#1a1a1a] border border-red-700 p-6 rounded-xl">
            <p className="text-xs text-red-400 font-bold mb-2">📋 DÉPENSES</p>
            <p className="text-3xl font-bold text-red-400">{depensesTotales.toFixed(0)} €</p>
          </div>
        </div>

        {/* BÉNÉFICES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-900/40 to-[#1a1a1a] border-2 border-emerald-700 p-8 rounded-xl">
            <p className="text-sm text-emerald-400 font-bold mb-2">✅ BÉNÉFICE BRUT</p>
            <p className="text-4xl font-bold text-emerald-400">{beneficeBrut.toFixed(0)} €</p>
            <p className="text-xs text-emerald-300 mt-2">Avant dépenses</p>
          </div>

          <div className={`bg-gradient-to-br ${beneficeNet >= 0 ? 'from-emerald-900/60 to-[#1a1a1a] border-2 border-emerald-600' : 'from-rose-900/60 to-[#1a1a1a] border-2 border-rose-600'} p-8 rounded-xl`}>
            <p className={`text-sm font-bold mb-2 ${beneficeNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>🎯 BÉNÉFICE NET (TON PROFIT!)</p>
            <p className={`text-4xl font-bold ${beneficeNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{beneficeNet.toFixed(0)} €</p>
            <p className={`text-xs mt-2 ${beneficeNet >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>Après dépenses</p>
          </div>
        </div>

        {/* TABLEAU PAR LOT */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📦 Détail par Lot</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-bold text-gray-300">Lot</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Coût Total</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Coût Unit.</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-300">Prod.</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-300">Vendus</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-300">%</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">CA</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Frais</th>
                </tr>
              </thead>
              <tbody>
                {lots.map(lot => (
                  <tr key={lot.lot_id} className="border-b border-gray-700 hover:bg-[#252525]">
                    <td className="py-3 px-4 font-medium text-white">{lot.numerolot}</td>
                    <td className="py-3 px-4 text-right text-blue-400">{lot.couttotal.toFixed(0)} €</td>
                    <td className="py-3 px-4 text-right text-blue-300 font-bold">{lot.coutUnitaire.toFixed(2)} €</td>
                    <td className="py-3 px-4 text-center text-gray-300">{lot.nombreProduits}</td>
                    <td className="py-3 px-4 text-center font-bold text-green-400">{lot.nombreVendus}</td>
                    <td className="py-3 px-4 text-center font-bold text-green-400">{lot.pourcentageVente.toFixed(0)}%</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">{lot.totalVentesLot.toFixed(0)} €</td>
                    <td className="py-3 px-4 text-right text-red-400 font-bold">{lot.fraisLot.toFixed(0)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lots.length === 0 && (
            <p className="text-center py-8 text-gray-400">Aucun lot pour le moment</p>
          )}
        </div>

        {/* DÉTAIL PAR PRODUIT VENDU */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">📦 Détail par Produit Vendu</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-bold text-gray-300">Produit</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-300">Lot</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Achat</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Encaissement</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Frais</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">URSSAF</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Bénéfice</th>
                </tr>
              </thead>
              <tbody>
                {produitVendus.map(produit => (
                  <tr key={produit.id} className="border-b border-gray-700 hover:bg-[#252525]">
                    <td className="py-3 px-4 font-medium text-white truncate max-w-xs">{produit.nom}</td>
                    <td className="py-3 px-4 text-gray-300">{produit.numerolot}</td>
                    <td className="py-3 px-4 text-right text-blue-400">{produit.prix_revient.toFixed(2)} €</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">{produit.prix_vente_final.toFixed(2)} €</td>
                    <td className="py-3 px-4 text-right text-orange-400">{produit.frais.toFixed(2)} €</td>
                    <td className="py-3 px-4 text-right text-red-400">{produit.urssaf.toFixed(2)} €</td>
                    <td className={`py-3 px-4 text-right font-bold ${produit.benefice_brut >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {produit.benefice_brut.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {produitVendus.length === 0 && (
            <p className="text-center py-8 text-gray-400">Aucun produit vendu pour le moment</p>
          )}
        </div>

        {/* Formule */}
        <div className="mt-8 bg-[#252525] border border-gray-700 rounded-xl p-4 text-xs text-gray-400">
          <p className="font-bold text-gray-300 mb-2">📐 Formule de calcul (par produit):</p>
          <p><span className="text-gray-300 font-bold">Achat</span> = prix_revient (prix_neuf × coefficient_lot)</p>
          <p className="mt-1"><span className="text-gray-300 font-bold">Encaissement</span> = prix de vente réel</p>
          <p className="mt-1"><span className="text-gray-300 font-bold">Frais</span> = Encaissement × frais_plateforme (5-15%)</p>
          <p className="mt-1"><span className="text-gray-300 font-bold">URSSAF</span> = Encaissement × {tauxURSSAF}%</p>
          <p className="mt-2 border-t border-gray-600 pt-2"><span className="text-emerald-400 font-bold">Bénéfice BRUT</span> = Encaissement - Achat - Frais - URSSAF</p>
        </div>
      </div>
    </div>
  );
}
