'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

export default function PageSynthese() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tauxURSSAF, setTauxURSSAF] = useState(12.3);

  const [totalProduits, setTotalProduits] = useState(0);
  const [totalVendus, setTotalVendus] = useState(0);
  const [totalCoutAchat, setTotalCoutAchat] = useState(0);
  const [totalCA, setTotalCA] = useState(0);
  const [totalFrais, setTotalFrais] = useState(0);
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

      // Récupérer tous les produits
      const { data: allProducts } = await supabase
        .from('produits')
        .select('id, lot_id')
        .eq('user_id', user.id);

      // Récupérer les produits vendus
      const { data: soldProducts } = await supabase
        .from('produits')
        .select('prix_revient, prix_vente_final, plateforme_vente_finale')
        .eq('user_id', user.id)
        .eq('statut', 'vendu');

      // Calculer les totaux
      let coutAchatTotal = 0;
      let caTotal = 0;
      let fraisTotal = 0;

      soldProducts?.forEach(product => {
        coutAchatTotal += product.prix_revient || 0;
        caTotal += product.prix_vente_final || 0;
        fraisTotal += calculateFrais(product.prix_vente_final || 0, product.plateforme_vente_finale);
      });

      setTotalProduits(allProducts?.length || 0);
      setTotalVendus(soldProducts?.length || 0);
      setTotalCoutAchat(coutAchatTotal);
      setTotalCA(caTotal);
      setTotalFrais(fraisTotal);

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

  // Calculs
  const urssafTotal = totalCA * (tauxURSSAF / 100);
  const beneficeNet = totalCA - totalCoutAchat - totalFrais - urssafTotal - depensesTotales;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">📊 Vue Synthèse</h1>
            <p className="text-gray-400 text-lg">Résumé financier simplifié</p>
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

        {/* 4 Cartes principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          {/* Total produits */}
          <div className="bg-[#1a1a1a] border border-purple-700 p-8 rounded-xl">
            <p className="text-sm text-purple-400 font-bold mb-3">📦 TOTAL PRODUITS</p>
            <p className="text-4xl font-bold text-purple-400">{totalProduits}</p>
            <p className="text-xs text-purple-300 mt-2">Tous les lots</p>
          </div>

          {/* Produits vendus */}
          <div className="bg-[#1a1a1a] border border-green-700 p-8 rounded-xl">
            <p className="text-sm text-green-400 font-bold mb-3">✅ VENDUS</p>
            <p className="text-4xl font-bold text-green-400">{totalVendus}</p>
            <p className="text-xs text-green-300 mt-2">
              {totalProduits > 0 ? ((totalVendus / totalProduits) * 100).toFixed(1) : 0}%
            </p>
          </div>

          {/* Coût d'achat */}
          <div className="bg-[#1a1a1a] border border-blue-700 p-8 rounded-xl">
            <p className="text-sm text-blue-400 font-bold mb-3">💰 COÛT ACHAT</p>
            <p className="text-4xl font-bold text-blue-400">{totalCoutAchat.toFixed(0)} €</p>
            <p className="text-xs text-blue-300 mt-2">Coût d'achat des {totalVendus}</p>
          </div>

          {/* CA encaissé */}
          <div className="bg-[#1a1a1a] border border-emerald-700 p-8 rounded-xl">
            <p className="text-sm text-emerald-400 font-bold mb-3">🎯 CA ENCAISSÉ</p>
            <p className="text-4xl font-bold text-emerald-400">{totalCA.toFixed(0)} €</p>
            <p className="text-xs text-emerald-300 mt-2">Prix de vente réel</p>
          </div>
        </div>

        {/* Calcul détaillé du bénéfice */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] border-2 border-yellow-700 rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-yellow-400 mb-10 text-center">🧮 CALCUL DU BÉNÉFICE NET</h2>

          <div className="space-y-4 max-w-2xl mx-auto">
            {/* CA Brut */}
            <div className="flex justify-between items-center bg-[#1a1a1a] p-5 rounded-lg border border-emerald-700/50">
              <span className="text-lg font-semibold text-emerald-400">CA Brut encaissé</span>
              <span className="text-3xl font-bold text-emerald-400">{totalCA.toFixed(0)} €</span>
            </div>

            {/* Moins coût d'achat */}
            <div className="flex justify-between items-center bg-[#1a1a1a] p-5 rounded-lg border border-red-700/50">
              <span className="text-lg font-semibold text-red-400">- Coût d'achat</span>
              <span className="text-3xl font-bold text-red-400">-{totalCoutAchat.toFixed(0)} €</span>
            </div>

            {/* Moins URSSAF */}
            <div className="flex justify-between items-center bg-[#1a1a1a] p-5 rounded-lg border border-orange-700/50">
              <div>
                <span className="text-lg font-semibold text-orange-400">- URSSAF</span>
                <p className="text-xs text-orange-300 mt-1">{tauxURSSAF}% du CA</p>
              </div>
              <span className="text-3xl font-bold text-orange-400">-{urssafTotal.toFixed(0)} €</span>
            </div>

            {/* Ajuster URSSAF */}
            <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-700">
              <label className="text-xs text-gray-400 font-semibold">Taux URSSAF (%)</label>
              <input
                type="number"
                value={tauxURSSAF}
                onChange={e => setTauxURSSAF(parseFloat(e.target.value) || 12.3)}
                step="0.1"
                className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-4 py-2 text-white mt-2"
              />
            </div>

            {/* Moins frais */}
            <div className="flex justify-between items-center bg-[#1a1a1a] p-5 rounded-lg border border-yellow-700/50">
              <span className="text-lg font-semibold text-yellow-400">- Frais plateformes</span>
              <span className="text-3xl font-bold text-yellow-400">-{totalFrais.toFixed(0)} €</span>
            </div>

            {/* Moins dépenses */}
            <div className="flex justify-between items-center bg-[#1a1a1a] p-5 rounded-lg border border-red-700/50">
              <span className="text-lg font-semibold text-red-400">- Dépenses diverses</span>
              <span className="text-3xl font-bold text-red-400">-{depensesTotales.toFixed(0)} €</span>
            </div>

            {/* Bénéfice NET final */}
            <div className={`flex justify-between items-center p-8 rounded-xl border-2 text-2xl font-bold mt-8 ${
              beneficeNet >= 0
                ? 'bg-gradient-to-r from-emerald-900/50 to-[#1a1a1a] border-emerald-500 text-emerald-400'
                : 'bg-gradient-to-r from-rose-900/50 to-[#1a1a1a] border-rose-500 text-rose-400'
            }`}>
              <span>= BÉNÉFICE NET</span>
              <span>{beneficeNet.toFixed(0)} €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
