'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Package, TrendingUp, Menu, X, ChevronDown, BarChart3, DollarSign, AlertCircle } from 'lucide-react';

// Type Lot adapté aux noms de colonnes Supabase + alias pour affichage
type LotStats = {
  id: string;
  numerolot: string;
  dateachat: string;
  couttotal: number;
  nbpieces: number;
  nbpalettes?: number;
  tauxrebut?: number;
  prixneuftotal?: number;
  coutreelparpiece?: number;
  // Alias pour compatibilité affichage
  numeroLot?: string;
  dateAchat?: string;
  coutTotal?: number;
  nbPieces?: number;
  nbPalettes?: number;
  tauxRebut?: number;
  prixNeufTotal?: number;
  coutReelParPiece?: number;
  // Champs dashboard ventes
  nbPiecesVendues?: number;
  caGenere?: number;
  beneficeEstime?: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lots, setLots] = useState<LotStats[]>([]);

  // Chargement depuis Supabase
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

        const { data, error } = await supabase
          .from('lots')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) console.error('Erreur chargement:', error);
        else {
          const mappedLots = (data || []).map((lot: any) => ({
            ...lot,
            numeroLot: lot.numerolot,
            dateAchat: lot.dateachat,
            coutTotal: lot.couttotal,
            nbPieces: lot.nbpieces,
            nbPalettes: lot.nbpalettes,
            tauxRebut: lot.tauxrebut,
            prixNeufTotal: lot.prixneuftotal,
            coutReelParPiece: lot.coutreelparpiece,
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

  // Calculs KPI
  const totalInvesti = lots.reduce((acc, lot) => acc + (lot.coutTotal || 0), 0);
  const totalCA = lots.reduce((acc, lot) => acc + (lot.caGenere || 0), 0);
  const totalBenefice = totalCA - totalInvesti;
  const totalPiecesVendues = lots.reduce((acc, lot) => acc + (lot.nbPiecesVendues || 0), 0);
  const totalPiecesTotales = lots.reduce((acc, lot) => acc + (lot.nbPieces || 0), 0);
  const tauxRotationGlobal = totalPiecesTotales > 0 ? Math.round((totalPiecesVendues / totalPiecesTotales) * 100) : 0;

  // Fonction utilitaire couleur indice
  const getIndiceColor = (val: number) => {
    if (val === 0) return 'text-gray-500 border-gray-700 bg-gray-900/30';
    if (val < 15) return 'text-green-400 border-green-500/30 bg-green-900/10';
    if (val < 25) return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
    if (val < 40) return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
    return 'text-red-400 border-red-500/30 bg-red-900/10';
  };

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

        {/* MENU MOBILE FONCTIONNEL AVEC SOUS-MENUS */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 z-40 bg-[#1a1a1a] border-t border-gray-800 overflow-y-auto animate-in slide-in-from-top-2">
            <div className="p-4 space-y-3">
              {/* Accueil */}
              <button 
                onClick={() => { router.push('/'); setMobileMenuOpen(false); }} 
                className="w-full text-left text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-600/20 active:scale-[0.98] transition-all"
              >
                Accueil
              </button>
              
              {/* Produits */}
              <div className="pt-2 border-t border-gray-800/50">
                <p className="text-xs text-gray-500 uppercase font-bold px-4 mb-2 mt-2">Produits</p>
                <button onClick={() => { router.push('/products/brute'); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-gray-300 py-3 px-6 rounded-lg hover:bg-white/5 active:bg-white/10">• Produit Brute</button>
                <button onClick={() => { router.push('/products/vente'); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-gray-300 py-3 px-6 rounded-lg hover:bg-white/5 active:bg-white/10">• Vente</button>
                <button onClick={() => { router.push('/products/archives'); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-gray-300 py-3 px-6 rounded-lg hover:bg-white/5 active:bg-white/10">• Vendu / Archiver</button>
              </div>

              {/* Finance */}
              <div className="pt-2 border-t border-gray-800/50">
                <p className="text-xs text-gray-500 uppercase font-bold px-4 mb-2 mt-2">Finance</p>
                <button onClick={() => { router.push('/finance/achat'); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-gray-300 py-3 px-6 rounded-lg hover:bg-white/5 active:bg-white/10">• Achat</button>
                <button onClick={() => { router.push('/finance/suivi'); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-gray-300 py-3 px-6 rounded-lg hover:bg-white/5 active:bg-white/10">• Suivi / Entrée / Sortie</button>
                <button onClick={() => { router.push('/finance/analytics'); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-gray-300 py-3 px-6 rounded-lg hover:bg-white/5 active:bg-white/10">• Analytique</button>
                <button onClick={() => { router.push('/finance/simulateur'); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-gray-300 py-3 px-6 rounded-lg hover:bg-white/5 active:bg-white/10">• Simulateur d'achat</button>
              </div>

              {/* Organisateur */}
              <button onClick={() => { router.push('/organizer'); setMobileMenuOpen(false); }} className="w-full text-left text-gray-300 font-medium py-3 px-4 rounded-lg hover:bg-white/5 active:bg-white/10 mt-2">Organisateur</button>
              
              {/* Déconnexion */}
              <div className="pt-4 mt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-3 px-4 truncate">{user.email}</p>
                <button onClick={async () => { await handleLogout(); setMobileMenuOpen(false); }} className="w-full py-3 bg-red-600/20 text-red-400 rounded-lg text-sm font-bold active:scale-[0.98] transition-transform">Se déconnecter</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* EN-TÊTE & KPI */}
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

        {/* LISTE DES LOTS - DESIGN CARTE IDENTIQUE PAGE ACHAT */}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {lots.map((lot) => {
              // Calculs pour l'affichage
              const coutTotal = lot.coutTotal || 0;
              const nbPieces = lot.nbPieces || 0;
              const nbPalettes = lot.nbPalettes || 1;
              const tauxRebut = lot.tauxRebut || 0;
              const prixNeuf = lot.prixNeufTotal || 0;
              
              const indiceAchat = prixNeuf > 0 ? ((coutTotal / prixNeuf) * 100) : 0;
              const piecesVendables = Math.round(nbPieces * (1 - tauxRebut/100));
              const coutParPalette = coutTotal / nbPalettes;
              const coutReelPiece = piecesVendables > 0 ? (coutTotal / piecesVendables) : 0;

              return (
                <div key={lot.id} className="bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors group">
                  {/* En-tête avec Indice */}
                  <div className="p-5 border-b border-gray-800 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white">{lot.numeroLot}</h3>
                      <p className="text-xs text-gray-500">{lot.dateAchat} • B-Stock</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getIndiceColor(indiceAchat)}`}>
                      {indiceAchat.toFixed(1)}%
                    </div>
                  </div>

                  {/* Détails du lot */}
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coût Total</span>
                      <span className="font-bold text-white">{coutTotal.toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coût / Palette</span>
                      <span className="font-bold text-blue-400">{coutParPalette.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pièces Vendables</span>
                      <span className="font-bold text-orange-400">{piecesVendables} / {nbPieces}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coût Réel / Pièce</span>
                      <span className="font-bold text-white">{coutReelPiece.toFixed(2)} €</span>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="p-4 bg-[#1a1a1a] border-t border-gray-800 flex gap-2">
                    <button className="flex-1 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                      Voir les produits
                    </button>
                    <button className="px-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-800/50 text-blue-400 rounded-lg transition-colors">
                      Ajouter vente
                    </button>
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