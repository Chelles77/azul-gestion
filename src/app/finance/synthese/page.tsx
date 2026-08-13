'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

interface LotStats {
  lot_id: string;
  numerolot: string;
  prixneuftotal: number;
  nombreProduits: number;
  nombreVendus: number;
  pourcentageVente: number;
  fraisTotal: number;
  profitNet: number;
}

export default function PageSynthese() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lots, setLots] = useState<LotStats[]>([]);
  const [tauxURSSAF, setTauxURSSAF] = useState(12.3);
  const [depensesTotales, setDepensesTotales] = useState(0);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Récupérer les lots avec leurs stats
      const { data: lotsData } = await supabase
        .from('lots')
        .select('*')
        .eq('user_id', user.id);

      // Pour chaque lot, calculer les stats
      const lotsWithStats: LotStats[] = [];

      for (const lot of lotsData || []) {
        // Nombre total de produits du lot
        const { data: allProducts } = await supabase
          .from('produits')
          .select('id')
          .eq('lot_id', lot.id);

        // Nombre de produits vendus
        const { data: soldsProducts } = await supabase
          .from('produits')
          .select('id, prix_vente_final, plateforme_vente_finale')
          .eq('lot_id', lot.id)
          .eq('statut', 'vendu');

        const nombreProduits = allProducts?.length || 0;
        const nombreVendus = soldsProducts?.length || 0;
        const pourcentageVente = nombreProduits > 0 ? (nombreVendus / nombreProduits) * 100 : 0;

        // Calculer les frais pour ce lot
        let fraisTotal = 0;
        soldsProducts?.forEach(product => {
          const prixVente = product.prix_vente_final || 0;
          let frais = 0;
          if (product.plateforme_vente_finale === 'Vinted') frais = prixVente * 0.08;
          else if (product.plateforme_vente_finale === 'Le Bon Coin') frais = prixVente * 0.05;
          else if (product.plateforme_vente_finale === 'eBay') frais = prixVente * 0.125;
          else if (product.plateforme_vente_finale === 'Amazon') frais = prixVente * 0.15;
          else frais = prixVente * 0.05;
          fraisTotal += frais;
        });

        // Profit net du lot (ventes - coût achat - frais)
        const totalVentes = soldsProducts?.reduce((sum: number, p: any) => sum + (p.prix_vente_final || 0), 0) || 0;
        const profitNet = totalVentes - lot.couttotal - fraisTotal - (totalVentes * (tauxURSSAF / 100));

        lotsWithStats.push({
          lot_id: lot.id,
          numerolot: lot.numerolot,
          prixneuftotal: lot.prixneuftotal,
          nombreProduits,
          nombreVendus,
          pourcentageVente,
          fraisTotal,
          profitNet,
        });
      }

      setLots(lotsWithStats);

      // Récupérer les dépenses totales
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

  // Calculs totaux
  const totalCoutAchat = lots.reduce((sum, lot) => sum + lot.prixneuftotal, 0);
  const totalProduits = lots.reduce((sum, lot) => sum + lot.nombreProduits, 0);
  const totalVendus = lots.reduce((sum, lot) => sum + lot.nombreVendus, 0);
  const pourcentageGlobal = totalProduits > 0 ? (totalVendus / totalProduits) * 100 : 0;
  const totalFrais = lots.reduce((sum, lot) => sum + lot.fraisTotal, 0);
  const totalVentes = lots.reduce((sum, lot) => {
    const v = 0;
    return v;
  }, 0);

  // Bénéfice brut = Total ventes - Coût achat - Frais - URSSAF
  let beneficeBrut = 0;
  for (const lot of lots) {
    beneficeBrut += lot.profitNet + (lot.fraisTotal * (tauxURSSAF / 100));
  }

  // Bénéfice net = Bénéfice brut - Dépenses
  const beneficeNet = beneficeBrut - depensesTotales;

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
            <p className="text-gray-400">Résumé de vos ventes, frais et bénéfices</p>
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
            <p className="text-3xl font-bold text-red-400">{(totalFrais + (beneficeBrut * (tauxURSSAF / 100))).toFixed(0)} €</p>
            <input
              type="number"
              value={tauxURSSAF}
              onChange={e => setTauxURSSAF(parseFloat(e.target.value) || 12.3)}
              step="0.1"
              className="w-full bg-[#252525] border border-gray-700 rounded px-2 py-1 text-white text-xs mt-2"
              placeholder="URSSAF %"
            />
          </div>

          <div className="bg-[#1a1a1a] border border-orange-700 p-6 rounded-xl">
            <p className="text-xs text-orange-400 font-bold mb-2">📋 DÉPENSES</p>
            <p className="text-3xl font-bold text-orange-400">{depensesTotales.toFixed(0)} €</p>
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
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Coût Achat</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-300">Produits</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-300">Vendus</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-300">%</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Frais</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Profit</th>
                </tr>
              </thead>
              <tbody>
                {lots.map(lot => (
                  <tr key={lot.lot_id} className="border-b border-gray-700 hover:bg-[#252525]">
                    <td className="py-3 px-4 font-medium text-white">{lot.numerolot}</td>
                    <td className="py-3 px-4 text-right text-blue-400">{lot.prixneuftotal.toFixed(0)} €</td>
                    <td className="py-3 px-4 text-center text-gray-300">{lot.nombreProduits}</td>
                    <td className="py-3 px-4 text-center font-bold text-green-400">{lot.nombreVendus}</td>
                    <td className="py-3 px-4 text-center font-bold text-green-400">{lot.pourcentageVente.toFixed(0)}%</td>
                    <td className="py-3 px-4 text-right text-red-400">{lot.fraisTotal.toFixed(0)} €</td>
                    <td className={`py-3 px-4 text-right font-bold ${lot.profitNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {lot.profitNet.toFixed(0)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lots.length === 0 && (
            <p className="text-center py-8 text-gray-400">Aucun lot pour le moment</p>
          )}
        </div>
      </div>
    </div>
  );
}
