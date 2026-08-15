'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

type FinanceTab = 'synthese' | 'achat' | 'vente' | 'depense' | 'rebut';

export default function FinanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [tab, setTab] = useState<FinanceTab>(
    (searchParams.get('tab') as FinanceTab) || 'synthese'
  );
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    async function fetchFinancialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all financial data
        const { data: lots } = await supabase
          .from('lots')
          .select('*')
          .eq('user_id', user.id);

        const { data: ventes } = await supabase
          .from('produits')
          .select('*')
          .eq('user_id', user.id)
          .eq('statut', 'vendu');

        const { data: depenses } = await supabase
          .from('depenses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        const { data: rebuts } = await supabase
          .from('produits')
          .select('*')
          .eq('user_id', user.id)
          .in('statut', ['casse', 'rebut']);

        setFinancialData({
          lots,
          ventes,
          depenses,
          rebuts
        });
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFinancialData();
  }, [supabase]);

  const tabs: Array<{ id: FinanceTab; label: string; icon: string }> = [
    { id: 'synthese', label: 'Synthèse', icon: '📊' },
    { id: 'achat', label: 'Achats', icon: '🛒' },
    { id: 'vente', label: 'Ventes', icon: '💰' },
    { id: 'depense', label: 'Dépenses', icon: '💸' },
    { id: 'rebut', label: 'Rebuts/Pertes', icon: '💔' }
  ];

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Gestion Financière</h1>
          <p className="text-gray-400">Vue complète de votre comptabilité</p>
        </div>

        {/* TABS */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-full md:min-w-0">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  router.push(`/finance?tab=${t.id}`);
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-blue-900/30 text-blue-400 border border-blue-600'
                    : 'text-gray-400 border border-gray-700 hover:border-gray-600'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* SYNTHÈSE */}
            {tab === 'synthese' && financialData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-6">
                    <p className="text-xs text-blue-300 mb-2">Capital Investi</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {(financialData.lots?.reduce((sum: number, l: any) => sum + (l.couttotal || 0), 0) || 0).toFixed(0)} €
                    </p>
                  </div>
                  <div className="bg-green-900/30 border border-green-700 rounded-xl p-6">
                    <p className="text-xs text-green-300 mb-2">Chiffre d'Affaires</p>
                    <p className="text-3xl font-bold text-green-400">
                      {(financialData.ventes?.reduce((sum: number, v: any) => sum + (v.prix_vente_final || 0), 0) || 0).toFixed(0)} €
                    </p>
                  </div>
                  <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-6">
                    <p className="text-xs text-orange-300 mb-2">Frais/Revient</p>
                    <p className="text-3xl font-bold text-orange-400">
                      {(financialData.ventes?.reduce((sum: number, v: any) => sum + (v.prix_revient || 0), 0) || 0).toFixed(0)} €
                    </p>
                  </div>
                  <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-6">
                    <p className="text-xs text-purple-300 mb-2">Bénéfice Brut</p>
                    <p className="text-3xl font-bold text-purple-400">
                      {((financialData.ventes?.reduce((sum: number, v: any) => sum + (v.prix_vente_final || 0), 0) || 0) - (financialData.ventes?.reduce((sum: number, v: any) => sum + (v.prix_revient || 0), 0) || 0)).toFixed(0)} €
                    </p>
                  </div>
                  <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-6">
                    <p className="text-xs text-emerald-300 mb-2">Bénéfice Net</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      {(((financialData.ventes?.reduce((sum: number, v: any) => sum + (v.prix_vente_final || 0), 0) || 0) - (financialData.ventes?.reduce((sum: number, v: any) => sum + (v.prix_revient || 0), 0) || 0)) * 0.58).toFixed(0)} €
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ACHATS */}
            {tab === 'achat' && financialData?.lots && (
              <div>
                {financialData.lots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {financialData.lots.map((lot: any) => (
                      <div key={lot.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-blue-400 mb-4">Lot N°{lot.numerolot}</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Coût Total</span>
                            <span className="text-blue-400 font-semibold">{lot.couttotal?.toFixed(2) || 0} €</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Palettes</span>
                            <span className="text-white">{lot.nbpalettes || 1}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Pièces</span>
                            <span className="text-white">{lot.nbpieces || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Coût/Pièce</span>
                            <span className="text-orange-400">{(lot.couttotal / (lot.nbpieces || 1))?.toFixed(2) || 0} €</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
                    <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Aucun achat enregistré</p>
                  </div>
                )}
              </div>
            )}

            {/* VENTES */}
            {tab === 'vente' && financialData?.ventes && (
              <div>
                {financialData.ventes.length > 0 ? (
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700 bg-[#252525]">
                            <th className="text-left py-4 px-6 font-bold text-gray-300">Produit</th>
                            <th className="text-left py-4 px-6 font-bold text-gray-300">Plateforme</th>
                            <th className="text-right py-4 px-6 font-bold text-gray-300">Prix Vente</th>
                            <th className="text-right py-4 px-6 font-bold text-gray-300">Revient</th>
                            <th className="text-right py-4 px-6 font-bold text-gray-300">Bénéfice</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialData.ventes.map((v: any) => (
                            <tr key={v.id} className="border-b border-gray-800 hover:bg-[#252525]">
                              <td className="py-3 px-6">{v.nom?.substring(0, 25) || '—'}</td>
                              <td className="py-3 px-6 text-gray-400">{v.plateforme_vente_finale || '—'}</td>
                              <td className="py-3 px-6 text-right text-green-400 font-semibold">{(v.prix_vente_final || 0).toFixed(0)} €</td>
                              <td className="py-3 px-6 text-right text-orange-400">{(v.prix_revient || 0).toFixed(0)} €</td>
                              <td className={`py-3 px-6 text-right font-bold ${((v.prix_vente_final || 0) - (v.prix_revient || 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {((v.prix_vente_final || 0) - (v.prix_revient || 0)).toFixed(0)} €
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
                    <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Aucune vente enregistrée</p>
                  </div>
                )}
              </div>
            )}

            {/* DÉPENSES */}
            {tab === 'depense' && (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
                <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Section Dépenses - à implémenter</p>
              </div>
            )}

            {/* REBUTS */}
            {tab === 'rebut' && financialData?.rebuts && (
              <div>
                {financialData.rebuts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {financialData.rebuts.map((product: any) => (
                      <div key={product.id} className="bg-[#1a1a1a] border border-red-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-red-400 mb-4">{product.nom?.substring(0, 25)}</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Statut</span>
                            <span className="text-red-400 font-semibold capitalize">{product.statut}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Prix d'achat</span>
                            <span className="text-blue-400">{product.prix_achat?.toFixed(2) || 0} €</span>
                          </div>
                          {product.description && (
                            <div className="pt-2 border-t border-gray-700">
                              <p className="text-xs text-gray-500">{product.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
                    <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Aucun rebut enregistré</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
