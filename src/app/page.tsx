'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Camera, Package, FileText, TrendingUp, Menu, X, ChevronDown, BarChart3, DollarSign, AlertCircle } from 'lucide-react';

// Type Lot adapté aux noms de colonnes Supabase (minuscules)
type LotStats = {
  id: string;
  numerolot: string;
  dateachat: string;
  couttotal: number;
  nbpieces: number;
  nbPiecesVendues?: number;
  caGenere?: number;
  beneficeEstime?: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // État pour les lots venant de Supabase
  const [lots, setLots] = useState<LotStats[]>([]);

  // --- AUTHENTIFICATION & CHARGEMENT DES DONNÉES DEPUIS SUPABASE ---
  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // Charger les lots DEPUIS SUPABASE (et non localStorage)
        const { data, error } = await supabase
          .from('lots')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur chargement lots:', error);
        } else {
          // Mapper les données Supabase vers le format attendu par le dashboard
          const mappedLots = (data || []).map((lot: any) => ({
            ...lot,
            numeroLot: lot.numerolot,       // Mapping nom Supabase -> nom affichage
            dateAchat: lot.dateachat,
            coutTotal: lot.couttotal,
            nbPieces: lot.nbpieces,
            nbPiecesVendues: lot.nbPiecesVendues || 0,
            caGenere: lot.caGenere || 0,
            beneficeEstime: (lot.caGenere || 0) - lot.couttotal
          }));
          setLots(mappedLots);
        }

      } catch (error) {
        console.error(error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#121212] text-blue-500">Chargement...</div>;
  if (!user) return null;

  // Calculs globaux basés sur les VRAIS lots
  const totalInvesti = lots.reduce((acc, lot) => acc + (lot.coutTotal || 0), 0);
  const totalCA = lots.reduce((acc, lot) => acc + (lot.caGenere || 0), 0);
  const totalBenefice = totalCA - totalInvesti;
  const totalPiecesVendues = lots.reduce((acc, lot) => acc + (lot.nbPiecesVendues || 0), 0);
  const totalPiecesTotales = lots.reduce((acc, lot) => acc + (lot.nbPieces || 0), 0);
  const tauxRotationGlobal = totalPiecesTotales > 0 ? Math.round((totalPiecesVendues / totalPiecesTotales) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 w-full">
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-900/50">A</div>
              <span className="font-bold text-xl tracking-tight text-white hidden sm:block">AZUL<span className="text-blue-500">GESTION</span></span>
            </div>
            <div className="hidden md:flex flex-1 justify-center items-center h-full">
              <button onClick={() => router.push('/')} className="h-full flex items-center px-4 text-white font-medium hover:text-blue-400 transition-colors border-b-2 border-blue-500">Accueil</button>
              <div className="relative group h-full flex items-center">
                <button className="h-full flex items-center gap-1 px-4 text-gray-400 font-medium hover:text-white transition-colors border-b-2 border-transparent hover:border-blue-500">Produits <ChevronDown size={16} /></button>
                <div className="absolute top-full left-0 mt-0 w-48 bg-[#252525] border border-gray-700 rounded-b-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <button onClick={() => router.push('/products/brute')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Produit Brute</button>
                  <button onClick={() => router.push('/products/vente')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Vente</button>
                  <button onClick={() => router.push('/products/archives')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Vendu / Archiver</button>
                </div>
              </div>
              <div className="relative group h-full flex items-center">
                <button className="h-full flex items-center gap-1 px-4 text-gray-400 font-medium hover:text-white transition-colors border-b-2 border-transparent hover:border-blue-500">Finance <ChevronDown size={16} /></button>
                <div className="absolute top-full left-0 mt-0 w-56 bg-[#252525] border border-gray-700 rounded-b-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <button onClick={() => router.push('/finance/achat')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Achat</button>
                  <button onClick={() => router.push('/finance/suivi')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Suivi / Entrée / Sortie</button>
                  <button onClick={() => router.push('/finance/analytics')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Analytique</button>
                  <button onClick={() => router.push('/finance/simulateur')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Simulateur d'achat</button>
                </div>
              </div>
              <button onClick={() => router.push('/organizer')} className="h-full flex items-center px-4 text-gray-400 font-medium hover:text-white transition-colors border-b-2 border-transparent hover:border-blue-500">Organisateur</button>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden lg:block text-sm text-gray-400 bg-[#252525] px-3 py-1.5 rounded-full border border-gray-700 truncate max-w-[200px]">{user.email}</span>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-red-900/20 active:scale-95 whitespace-nowrap">Déconnexion</button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-400 hover:text-white p-2">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
            <button onClick={() => { router.push('/'); setMobileMenuOpen(false); }} className="block w-full text-left text-white font-medium py-3 px-2 rounded hover:bg-white/5">Accueil</button>
            <button className="block w-full text-left text-gray-400 font-medium py-3 px-2 rounded hover:bg-white/5">Produits</button>
            <button className="block w-full text-left text-gray-400 font-medium py-3 px-2 rounded hover:bg-white/5">Finance</button>
            <button className="block w-full text-left text-gray-400 font-medium py-3 px-2 rounded hover:bg-white/5">Organisateur</button>
            <div className="pt-4 mt-2 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2 px-2">{user.email}</p>
              <button onClick={handleLogout} className="w-full py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-bold">Se déconnecter</button>
            </div>
          </div>
        )}
      </nav>

      {/* CONTENU DASHBOARD LOTS */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* EN-TÊTE & KPI GLOBAUX */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Performance des Lots</h1>
          <p className="text-gray-400 mb-6">Suivi détaillé de vos achats, ventes et rentabilité par lot.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg"><DollarSign size={20} className="text-blue-500"/></div>
                <span className="text-xs text-gray-500 uppercase font-bold">Capital Investi</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalInvesti.toFixed(2)} €</p>
            </div>
            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-lg"><TrendingUp size={20} className="text-green-500"/></div>
                <span className="text-xs text-gray-500 uppercase font-bold">Chiffre d'Affaires</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalCA.toFixed(2)} €</p>
            </div>
            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${totalBenefice >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <BarChart3 size={20} className={totalBenefice >= 0 ? 'text-green-500' : 'text-red-500'}/>
                </div>
                <span className="text-xs text-gray-500 uppercase font-bold">Bénéfice Net</span>
              </div>
              <p className={`text-2xl font-bold ${totalBenefice >= 0 ? 'text-green-400' : 'text-red-400'}`}>{totalBenefice.toFixed(2)} €</p>
            </div>
            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg"><Package size={20} className="text-purple-500"/></div>
                <span className="text-xs text-gray-500 uppercase font-bold">Taux de Rotation</span>
              </div>
              <p className="text-2xl font-bold text-white">{tauxRotationGlobal}%</p>
            </div>
          </div>
        </div>

        {/* LISTE DES LOTS (TABLEAU DE BORD PAR LOT) */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-500"/> Détails par Lot
        </h2>
        
        {lots.length === 0 ? (
          <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-12 text-center">
            <Package size={48} className="mx-auto text-gray-600 mb-4"/>
            <h3 className="text-xl font-bold text-white mb-2">Aucun lot enregistré</h3>
            <p className="text-gray-400 mb-6">Allez dans Finance &gt; Achat pour ajouter votre premier lot.</p>
            <button onClick={() => router.push('/finance/achat')} className="text-blue-400 hover:text-blue-300 font-medium">Ajouter un lot maintenant →</button>
          </div>
        ) : (
          <div className="space-y-4">
            {lots.map((lot) => {
              const progressPercent = Math.round(((lot.nbPiecesVendues || 0) / (lot.nbPieces || 1)) * 100);
              const isProfitable = (lot.beneficeEstime || 0) >= 0;
              
              return (
                <div key={lot.id} className="bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
                  {/* En-tête du Lot */}
                  <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{lot.numeroLot}</h3>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{lot.dateAchat}</span>
                      </div>
                      <p className="text-sm text-gray-500">Coût total: <span className="text-white font-medium">{lot.coutTotal?.toFixed(2) || '0.00'} €</span> ({lot.nbPieces} pièces)</p>
                    </div>
                    
                    {/* Indicateurs rapides */}
                    <div className="flex gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-gray-500 text-xs uppercase">Vendu</p>
                        <p className="font-bold text-white">{lot.nbPiecesVendues || 0} / {lot.nbPieces}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 text-xs uppercase">CA Généré</p>
                        <p className="font-bold text-white">{(lot.caGenere || 0).toFixed(2)} €</p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-gray-500 text-xs uppercase">Rentabilité</p>
                        <p className={`font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                          {isProfitable ? '+' : ''}{(lot.beneficeEstime || 0).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Barre de Progression & Actions */}
                  <div className="p-6 bg-[#1a1a1a]/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400">Progression des ventes</span>
                      <span className="text-xs font-bold text-blue-400">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-4 flex gap-3">
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                        Voir les produits du lot
                      </button>
                      <button className="px-4 py-2 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors">
                        Ajouter une vente
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}