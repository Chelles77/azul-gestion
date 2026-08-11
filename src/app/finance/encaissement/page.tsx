'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Menu, ChevronDown, Euro, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Produit } from '@/lib/interfaces';

export default function PageEncaissement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ventes, setVentes] = useState<Produit[]>([]);
  const [tauxURSSAF, setTauxURSSAF] = useState(12.3);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [showFullYear, setShowFullYear] = useState(false);

  const fetchVentes = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('produits')
        .select('*')
        .eq('user_id', user.id)
        .eq('statut', 'vendu')
        .order('date_vente', { ascending: false });

      if (error) console.error('Erreur chargement:', error);
      else setVentes(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVentes();
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
        await fetchVentes();
      } catch (error) {
        console.error(error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  // Rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVentes();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Calculs
  const totalVentes = ventes.reduce((sum, v) => sum + (v.prix_vente_final || 0), 0);
  const totalCoutsAchat = ventes.reduce((sum, v) => sum + (v.prix_revient || 0), 0);
  const totalFrais = ventes.reduce((sum, v) => {
    const prixVente = v.prix_vente_final || 0;
    // Estimation simple des frais (à affiner)
    let frais = 0;
    if (v.plateforme_vente_finale === 'Vinted') frais = prixVente * 0.08; // 8%
    else if (v.plateforme_vente_finale === 'Le Bon Coin') frais = prixVente * 0.05; // 5%
    else if (v.plateforme_vente_finale === 'eBay') frais = prixVente * 0.125; // 12.5%
    else if (v.plateforme_vente_finale === 'Amazon') frais = prixVente * 0.15; // 15%
    else frais = prixVente * 0.05; // 5% par défaut
    return sum + frais;
  }, 0);
  const beneficeNet = totalVentes - totalFrais - totalCoutsAchat;
  const urssaf = totalVentes * (tauxURSSAF / 100);

  // Grouper par plateforme
  const parPlateforme = ventes.reduce((acc, v) => {
    const plat = v.plateforme_vente_finale || 'Non défini';
    if (!acc[plat]) acc[plat] = [];
    acc[plat].push(v);
    return acc;
  }, {} as Record<string, Produit[]>);

  // Grouper par mois
  const parMois = ventes.reduce((acc, v) => {
    const date = new Date(v.date_vente || new Date());
    const mois = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    if (!acc[mois]) acc[mois] = [];
    acc[mois].push(v);
    return acc;
  }, {} as Record<string, Produit[]>);

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gestion des Encaissements</h1>
          <p className="text-gray-400">Suivi des ventes, frais et bénéfices par plateforme</p>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-6 rounded-xl border border-blue-700">
            <p className="text-xs text-blue-400 uppercase font-bold mb-2">📥 Coûts Achat</p>
            <p className="text-3xl font-bold text-blue-400">{totalCoutsAchat.toFixed(0)} €</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-[#1a1a1a] p-6 rounded-xl border border-green-700">
            <p className="text-xs text-green-400 uppercase font-bold mb-2">💰 Total Ventes</p>
            <p className="text-3xl font-bold text-green-400">{totalVentes.toFixed(0)} €</p>
          </div>

          <div className="bg-gradient-to-br from-red-900/30 to-[#1a1a1a] p-6 rounded-xl border border-red-700">
            <p className="text-xs text-red-400 uppercase font-bold mb-2">📉 Total Frais</p>
            <p className="text-3xl font-bold text-red-400">{totalFrais.toFixed(0)} €</p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-[#1a1a1a] p-6 rounded-xl border border-orange-700">
            <p className="text-xs text-orange-400 uppercase font-bold mb-2">🇫🇷 URSSAF</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-orange-400">{urssaf.toFixed(0)} €</p>
              <input
                type="number"
                value={tauxURSSAF}
                onChange={e => setTauxURSSAF(parseFloat(e.target.value) || 12.3)}
                step="0.1"
                className="w-16 bg-[#252525] border border-gray-700 rounded px-2 py-1 text-white text-sm outline-none focus:border-orange-500"
              />
              <span className="text-orange-400 text-sm font-bold">%</span>
            </div>
          </div>

          <div className={`bg-gradient-to-br ${beneficeNet >= 0 ? 'from-emerald-900/30' : 'from-rose-900/30'} to-[#1a1a1a] p-6 rounded-xl border ${beneficeNet >= 0 ? 'border-emerald-700' : 'border-rose-700'}`}>
            <p className={`text-xs ${beneficeNet >= 0 ? 'text-emerald-400' : 'text-rose-400'} uppercase font-bold mb-2`}>🎯 Bénéfice Brut</p>
            <p className={`text-3xl font-bold ${beneficeNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {beneficeNet.toFixed(0)} €
            </p>
          </div>
        </div>

        {/* Ventes par Plateforme */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">📍 Ventes par Plateforme</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(parPlateforme).map(([plateforme, produits]) => {
              const totalPlat = produits.reduce((sum, p) => sum + (p.prix_vente_final || 0), 0);
              const countPlat = produits.length;
              return (
                <div key={plateforme} className="bg-[#252525] p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white">{plateforme}</h3>
                    <span className="text-sm bg-blue-600 px-2 py-1 rounded">{countPlat} ventes</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{totalPlat.toFixed(0)} €</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Moyenne: {(totalPlat / countPlat).toFixed(0)} €
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ventes du Mois Sélectionné */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">📅 {showFullYear ? 'Ventes de l\'année' : 'Ventes du Mois'}</h2>
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

          {(() => {
            const filteredVentes = ventes.filter(v => {
              const date = new Date(v.date_vente || new Date());
              return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
            });
            const totalMoisVentes = filteredVentes.reduce((sum, p) => sum + (p.prix_vente_final || 0), 0);
            const totalMoisCouts = filteredVentes.reduce((sum, p) => sum + (p.prix_revient || 0), 0);

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-[#252525] p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Coûts Achat</p>
                    <p className="text-xl font-bold text-blue-400">{totalMoisCouts.toFixed(0)} €</p>
                  </div>
                  <div className="bg-[#252525] p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Total Ventes</p>
                    <p className="text-xl font-bold text-green-400">{totalMoisVentes.toFixed(0)} €</p>
                  </div>
                  <div className="bg-[#252525] p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Produits</p>
                    <p className="text-xl font-bold text-purple-400">{filteredVentes.length}</p>
                  </div>
                </div>
                {filteredVentes.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Aucune vente pour ce mois</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Détail des Ventes */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">🎯 Détail des Ventes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-bold text-gray-300">Produit</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-300">Plateforme</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Coût</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Vente</th>
                  <th className="text-right py-3 px-4 font-bold text-gray-300">Bénéfice</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {ventes.filter(vente => {
                  const date = new Date(vente.date_vente || new Date());
                  if (showFullYear) {
                    return date.getFullYear() === selectedYear;
                  }
                  return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
                }).map(vente => {
                  const benefice = (vente.prix_vente_final || 0) - (vente.prix_revient || 0);
                  return (
                    <tr key={vente.id} className="border-b border-gray-800 hover:bg-[#252525]">
                      <td className="py-3 px-4 text-white">{vente.nom}</td>
                      <td className="py-3 px-4 text-gray-400">{vente.plateforme_vente_finale || '-'}</td>
                      <td className="py-3 px-4 text-right text-blue-400">{(vente.prix_revient || 0).toFixed(0)} €</td>
                      <td className="py-3 px-4 text-right text-green-400">{(vente.prix_vente_final || 0).toFixed(0)} €</td>
                      <td className={`py-3 px-4 text-right font-bold ${benefice >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {benefice.toFixed(0)} €
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {vente.date_vente ? new Date(vente.date_vente).toLocaleDateString('fr-FR') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {ventes.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p>Aucune vente enregistrée pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
