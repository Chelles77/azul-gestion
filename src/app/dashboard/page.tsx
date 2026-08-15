'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign, Package, Activity, ArrowRight, Plus, ShoppingCart, Wallet } from 'lucide-react';

interface DashboardStats {
  capital: number;
  totalVentes: number;
  totalCouts: number;
  benefice: number;
  nbLots: number;
  nbProduits: number;
  nbVentes: number;
  tauxRotation: number;
}

interface LotDetail {
  id: string;
  numerolot: string;
  couttotal: number;
  nbpieces: number;
  coutreelparpiece: number;
  venduCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats>({
    capital: 0,
    totalVentes: 0,
    totalCouts: 0,
    benefice: 0,
    nbLots: 0,
    nbProduits: 0,
    nbVentes: 0,
    tauxRotation: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lots, setLots] = useState<LotDetail[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Lots
        const { data: lotsData } = await supabase
          .from('lots')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Produits bruts
        const { data: produitsData } = await supabase
          .from('produits')
          .select('*')
          .eq('user_id', user.id)
          .eq('statut', 'brute');

        // Ventes
        const { data: ventesData } = await supabase
          .from('produits')
          .select('*')
          .eq('user_id', user.id)
          .eq('statut', 'vendu')
          .order('date_vente', { ascending: false })
          .limit(5);

        // Compter les produits vendus par lot
        const lotsWithSales = await Promise.all(
          (lotsData || []).map(async (lot) => {
            const { data: soldProducts } = await supabase
              .from('produits')
              .select('*', { count: 'exact' })
              .eq('lot_id', lot.id)
              .eq('statut', 'vendu');

            return {
              ...lot,
              venduCount: soldProducts?.length || 0
            };
          })
        );

        const totalCapital = lotsData?.reduce((sum, lot) => sum + (lot.couttotal || 0), 0) || 0;
        const totalVentes = ventesData?.reduce((sum, v) => sum + (v.prix_vente_final || 0), 0) || 0;
        const totalCouts = ventesData?.reduce((sum, v) => sum + (v.prix_revient || 0), 0) || 0;
        const benefice = totalVentes - totalCouts;
        const nbProduitsBruts = produitsData?.length || 0;
        const totalProduits = (produitsData?.length || 0) + (ventesData?.length || 0);
        const tauxRotation = totalProduits > 0 ? ((ventesData?.length || 0) / totalProduits) * 100 : 0;

        setStats({
          capital: totalCapital,
          totalVentes,
          totalCouts,
          benefice,
          nbLots: lotsData?.length || 0,
          nbProduits: nbProduitsBruts,
          nbVentes: ventesData?.length || 0,
          tauxRotation
        });

        setRecentSales(ventesData || []);
        setLots(lotsWithSales);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tableau de Bord</h1>
          <p className="text-gray-400">Vue d'ensemble de vos activités et performances</p>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Capital Investi */}
          <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-6 rounded-xl border border-blue-700 shadow-lg lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShoppingCart size={20} className="text-blue-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">Achat - Lots</span>
            </div>
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
              {lots.length > 0 ? (
                lots.map((lot) => (
                  <div key={lot.id} className="pb-3 border-b border-gray-700">
                    <div className="flex justify-between text-xs text-blue-300 mb-1">
                      <span className="font-semibold">Lot N°{lot.numerolot}</span>
                      <span className="text-blue-400 font-bold">{lot.couttotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>📫 Palettes: <span className="text-gray-300 font-semibold">{Math.ceil((lot.nbpieces || 0) / 50)}</span></span>
                      <span>📦 Pièces: <span className="text-gray-300 font-semibold">{lot.nbpieces || 0}</span></span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">Aucun lot</p>
              )}
            </div>
            <div className="border-t-2 border-blue-500 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-blue-300">Total Investi</span>
                <div className="text-2xl font-bold text-blue-400">{stats.capital.toFixed(2)} €</div>
              </div>
            </div>
          </div>

          {/* Chiffre d'Affaires */}
          <div className="bg-gradient-to-br from-green-900/30 to-[#1a1a1a] p-6 rounded-xl border border-green-700 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-green-400 font-semibold">Chiffre d'Affaires</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.totalVentes.toFixed(0)} €</div>
            <p className="text-xs text-gray-500 mt-2">{stats.nbVentes} ventes</p>
          </div>

          {/* Bénéfice Net */}
          <div className={`bg-gradient-to-br ${stats.benefice >= 0 ? 'from-emerald-900/30' : 'from-red-900/30'} to-[#1a1a1a] p-6 rounded-xl border ${stats.benefice >= 0 ? 'border-emerald-700' : 'border-red-700'} shadow-lg`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 ${stats.benefice >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-lg`}>
                <Wallet size={20} className={stats.benefice >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              </div>
              <span className={`text-xs uppercase tracking-wider font-semibold ${stats.benefice >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Bénéfice Net
              </span>
            </div>
            <div className={`text-3xl font-bold ${stats.benefice >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.benefice.toFixed(0)} €
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.benefice >= 0 ? 'Positif ✓' : 'Négatif ✗'}
            </p>
          </div>

          {/* Taux de Rotation */}
          <div className="bg-gradient-to-br from-purple-900/30 to-[#1a1a1a] p-6 rounded-xl border border-purple-700 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Activity size={20} className="text-purple-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Rotation</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">{stats.tauxRotation.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-2">{stats.nbProduits} en stock</p>
          </div>
        </div>

        {/* SECTION PRODUITS ET VENTES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Produits en Stock */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package size={20} className="text-orange-400" />
              <h2 className="text-lg font-bold text-white">Produits en Stock</h2>
            </div>
            <div className="text-4xl font-bold text-orange-400 mb-2">{stats.nbProduits}</div>
            <p className="text-sm text-gray-400 mb-4">En attente de vente</p>
            <button
              onClick={() => router.push('/products/brute')}
              className="w-full px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/50 text-orange-400 rounded-lg text-sm font-medium transition-colors"
            >
              Voir les produits →
            </button>
          </div>

          {/* Ventes Récentes */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={20} className="text-green-400" />
              <h2 className="text-lg font-bold text-white">Ventes Récentes</h2>
            </div>
            <div className="text-4xl font-bold text-green-400 mb-2">{stats.nbVentes}</div>
            <p className="text-sm text-gray-400 mb-4">Produits vendus</p>
            <button
              onClick={() => router.push('/products/archives')}
              className="w-full px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 rounded-lg text-sm font-medium transition-colors"
            >
              Voir les archives →
            </button>
          </div>

          {/* Actions Rapides */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Actions Rapides</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/products/brute')}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Voir produits
              </button>
              <button
                onClick={() => router.push('/finance/encaissement')}
                className="w-full px-4 py-2 bg-[#252525] hover:bg-[#333] text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Gestion Encaissement
              </button>
            </div>
          </div>
        </div>

        {/* DÉTAILS DES LOTS */}
        {lots.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">📦 Détails par Lot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lots.map(lot => {
                const tauxVente = lot.nbpieces && lot.nbpieces > 0
                  ? (lot.venduCount / lot.nbpieces) * 100
                  : 0;

                return (
                  <div key={lot.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all">
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white">Lot #{lot.numerolot}</h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {lot.id.substring(0, 8)}</p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Prix de Revient</span>
                        <span className="font-bold text-blue-400">{lot.couttotal.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Produits Total</span>
                        <span className="font-bold text-white">{lot.nbpieces}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Prix / Produit</span>
                        <span className="font-bold text-orange-400">{lot.coutreelparpiece.toFixed(2)} €</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Ventes</span>
                        <span className="text-xs font-bold text-green-400">{lot.venduCount}/{lot.nbpieces} ({tauxVente.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-[#252525] rounded-full h-2 border border-gray-700">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all"
                          style={{ width: `${tauxVente}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => router.push(`/products/brute?lot=${lot.id}`)}
                      className="w-full px-4 py-2 bg-[#252525] hover:bg-[#333] text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Voir produits <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VENTES RÉCENTES */}
        {recentSales.length > 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Dernières Ventes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 font-bold text-gray-300">Produit</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-300">Plateforme</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-300">Prix Vente</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-300">Bénéfice</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.slice(0, 5).map(vente => {
                    const benefice = (vente.prix_vente_final || 0) - (vente.prix_revient || 0);
                    return (
                      <tr key={vente.id} className="border-b border-gray-800 hover:bg-[#252525]">
                        <td className="py-3 px-4 text-white">{vente.nom.substring(0, 30)}</td>
                        <td className="py-3 px-4 text-gray-400">{vente.plateforme_vente_finale || '-'}</td>
                        <td className="py-3 px-4 text-right text-green-400">{(vente.prix_vente_final || 0).toFixed(0)} €</td>
                        <td className={`py-3 px-4 text-right font-bold ${benefice >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {benefice.toFixed(0)} €
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
