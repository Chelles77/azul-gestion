'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';

export default function PageSynthese() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Données
  const [ventes, setVentes] = useState<any[]>([]);
  const [depenses, setDepenses] = useState<any[]>([]);
  const [tauxURSSAF, setTauxURSSAF] = useState(12.3);

  // Filtres
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [showFullYear, setShowFullYear] = useState(false);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Récupérer les ventes
      const { data: ventesData } = await supabase
        .from('produits')
        .select('*')
        .eq('user_id', user.id)
        .eq('statut', 'vendu');

      // Récupérer les dépenses
      const { data: depensesData } = await supabase
        .from('depenses')
        .select('*')
        .eq('user_id', user.id);

      setVentes(ventesData || []);
      setDepenses(depensesData || []);
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

  // Filtrer par mois/année
  const filterByDate = (items: any[], dateField: string) => {
    return items.filter(item => {
      const date = new Date(item[dateField] || new Date());
      if (showFullYear) {
        return date.getFullYear() === selectedYear;
      }
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
    });
  };

  const ventesFiltered = filterByDate(ventes, 'date_vente');
  const depensesFiltered = filterByDate(depenses, 'date_depense');

  // Calculs VENTES
  const totalVentes = ventesFiltered.reduce((sum, v) => sum + (v.prix_vente_final || 0), 0);
  const totalCoutsAchat = ventesFiltered.reduce((sum, v) => sum + (v.prix_revient || 0), 0);
  const nombreProduits = ventesFiltered.length;

  // Calculs FRAIS PLATEFORME
  const totalFraisPlat = ventesFiltered.reduce((sum, v) => {
    const prixVente = v.prix_vente_final || 0;
    let frais = 0;
    if (v.plateforme_vente_finale === 'Vinted') frais = prixVente * 0.08;
    else if (v.plateforme_vente_finale === 'Le Bon Coin') frais = prixVente * 0.05;
    else if (v.plateforme_vente_finale === 'eBay') frais = prixVente * 0.125;
    else if (v.plateforme_vente_finale === 'Amazon') frais = prixVente * 0.15;
    else frais = prixVente * 0.05;
    return sum + frais;
  }, 0);

  // Calculs URSSAF
  const urssaf = totalVentes * (tauxURSSAF / 100);

  // BÉNÉFICE BRUT = Ventes - Coûts achat - Frais plateforme - URSSAF
  const beneficeBrut = totalVentes - totalCoutsAchat - totalFraisPlat - urssaf;

  // Calculs DÉPENSES
  const totalDepenses = depensesFiltered.reduce((sum, d) => sum + d.montant, 0);
  const depensesParCategorie = depensesFiltered.reduce((acc, d) => {
    if (!acc[d.categorie]) acc[d.categorie] = 0;
    acc[d.categorie] += d.montant;
    return acc;
  }, {} as Record<string, number>);

  // BÉNÉFICE NET = Bénéfice Brut - Dépenses
  const beneficeNet = beneficeBrut - totalDepenses;

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
            <h1 className="text-4xl font-bold text-white mb-2">Synthèse Financière</h1>
            <p className="text-gray-400">Vue complète de vos ventes, dépenses et bénéfices</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg flex items-center gap-2 font-medium"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Actualisation...' : 'Rafraîchir'}
          </button>
        </div>

        {/* Filtres */}
        <div className="mb-8 flex gap-3">
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

        {/* SECTION 1: VENTES */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Ventes</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-6 rounded-xl border border-blue-700">
              <p className="text-xs text-blue-400 uppercase font-bold mb-2">🛍️ Produits Vendus</p>
              <p className="text-3xl font-bold text-blue-400">{nombreProduits}</p>
            </div>

            <div className="bg-gradient-to-br from-green-900/30 to-[#1a1a1a] p-6 rounded-xl border border-green-700">
              <p className="text-xs text-green-400 uppercase font-bold mb-2">💰 Total Ventes</p>
              <p className="text-3xl font-bold text-green-400">{totalVentes.toFixed(0)} €</p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-[#1a1a1a] p-6 rounded-xl border border-purple-700">
              <p className="text-xs text-purple-400 uppercase font-bold mb-2">📦 Coût Achat Total</p>
              <p className="text-3xl font-bold text-purple-400">{totalCoutsAchat.toFixed(0)} €</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/30 to-[#1a1a1a] p-6 rounded-xl border border-indigo-700">
              <p className="text-xs text-indigo-400 uppercase font-bold mb-2">📈 Prix Moyen</p>
              <p className="text-3xl font-bold text-indigo-400">{(totalVentes / (nombreProduits || 1)).toFixed(0)} €</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: FRAIS & TAXES */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">💸 Frais & Taxes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-900/30 to-[#1a1a1a] p-6 rounded-xl border border-red-700">
              <p className="text-xs text-red-400 uppercase font-bold mb-2">🏪 Frais Plateforme</p>
              <p className="text-3xl font-bold text-red-400">{totalFraisPlat.toFixed(0)} €</p>
              <p className="text-xs text-gray-400 mt-1">{((totalFraisPlat / totalVentes) * 100).toFixed(1)}% des ventes</p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/30 to-[#1a1a1a] p-6 rounded-xl border border-orange-700">
              <p className="text-xs text-orange-400 uppercase font-bold mb-2">🇫🇷 URSSAF</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-orange-400">{urssaf.toFixed(0)} €</p>
              </div>
              <input
                type="number"
                value={tauxURSSAF}
                onChange={e => setTauxURSSAF(parseFloat(e.target.value) || 12.3)}
                step="0.1"
                className="w-full bg-[#252525] border border-gray-700 rounded px-2 py-1 text-white text-xs mt-2 outline-none focus:border-orange-500"
              />
            </div>

            <div className="bg-gradient-to-br from-yellow-900/30 to-[#1a1a1a] p-6 rounded-xl border border-yellow-700">
              <p className="text-xs text-yellow-400 uppercase font-bold mb-2">📋 Total Frais</p>
              <p className="text-3xl font-bold text-yellow-400">{(totalFraisPlat + urssaf).toFixed(0)} €</p>
              <p className="text-xs text-gray-400 mt-1">Plateforme + URSSAF</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: BÉNÉFICE BRUT */}
        <div className="mb-8 bg-gradient-to-br from-emerald-900/40 to-[#1a1a1a] p-8 rounded-xl border border-emerald-700">
          <p className="text-sm text-emerald-400 uppercase font-bold mb-2">🎯 Bénéfice Brut</p>
          <p className="text-5xl font-bold text-emerald-400">{beneficeBrut.toFixed(0)} €</p>
          <p className="text-sm text-gray-400 mt-3">= Ventes - Coûts achat - Frais plateforme - URSSAF</p>
        </div>

        {/* SECTION 4: DÉPENSES */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📦 Dépenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-pink-900/30 to-[#1a1a1a] p-6 rounded-xl border border-pink-700">
              <p className="text-xs text-pink-400 uppercase font-bold mb-2">💰 Total Dépenses</p>
              <p className="text-3xl font-bold text-pink-400">{totalDepenses.toFixed(0)} €</p>
              <p className="text-xs text-gray-400 mt-1">{depensesFiltered.length} dépenses</p>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl">
              <p className="text-xs text-gray-400 uppercase font-bold mb-3">Détail par Catégorie</p>
              {Object.entries(depensesParCategorie).length === 0 ? (
                <p className="text-gray-400 text-sm">Aucune dépense</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(depensesParCategorie).map(([cat, montant]) => (
                    <div key={cat} className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">{cat}</span>
                      <span className="font-bold text-pink-400">{(montant as number).toFixed(0)} €</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: BÉNÉFICE NET - LE RÉSULTAT FINAL */}
        <div className={`mb-8 p-8 rounded-xl border-2 ${beneficeNet >= 0 ? 'bg-gradient-to-br from-emerald-900/50 to-[#1a1a1a] border-emerald-600' : 'bg-gradient-to-br from-rose-900/50 to-[#1a1a1a] border-rose-600'}`}>
          <p className={`text-sm uppercase font-bold mb-2 ${beneficeNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {beneficeNet >= 0 ? '✅ BÉNÉFICE NET (TON PROFIT RÉEL)' : '❌ PERTE'}
          </p>
          <p className={`text-6xl font-bold ${beneficeNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {beneficeNet.toFixed(0)} €
          </p>
          <p className={`text-sm mt-3 ${beneficeNet >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            = Bénéfice Brut ({beneficeBrut.toFixed(0)}€) - Dépenses ({totalDepenses.toFixed(0)}€)
          </p>
        </div>

        {/* COMPARAISON BRUT vs NET */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-emerald-400" />
              <p className="text-xl font-bold text-white">Bénéfice Brut</p>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{beneficeBrut.toFixed(0)} €</p>
            <p className="text-xs text-gray-400 mt-2">Sans compter les dépenses opérationnelles</p>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={20} className={beneficeNet >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
              <p className="text-xl font-bold text-white">Bénéfice Net</p>
            </div>
            <p className={`text-3xl font-bold ${beneficeNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{beneficeNet.toFixed(0)} €</p>
            <p className="text-xs text-gray-400 mt-2">Après toutes les dépenses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
