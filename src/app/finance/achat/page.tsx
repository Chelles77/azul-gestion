'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { 
  Plus, Pencil, Trash2, X, Save, Package, Euro, 
  TrendingDown, AlertTriangle, Calculator, ArrowLeft,
  Menu, ChevronDown, Loader2
} from 'lucide-react';

// Type Lot EXACTEMENT comme dans Supabase (noms minuscules)
type Lot = {
  id: string;
  user_id?: string;
  numerolot: string;
  dateachat: string;
  source: string;
  prixachat: number;
  fraisport: number;
  fraisencheres: number;
  couttotal: number;
  nbpalettes: number;
  nbpieces: number;
  prixneuftotal: number;
  tauxrebut: number;
  indiceachat: number;
  coutreelparpiece: number;
  created_at?: string;
};

export default function PageGestionAchats() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [lots, setLots] = useState<Lot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [saving, setSaving] = useState(false);

  // Chargement initial
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

        const { data, error } = await supabase
          .from('lots')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) console.error('Erreur chargement:', error);
        else setLots(data || []);

      } catch (error) {
        console.error(error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Formulaire
  const initialFormState = {
    numeroLot: '',
    dateAchat: new Date().toISOString().split('T')[0],
    source: 'B-Stock',
    prixAchat: '',
    fraisPort: '',
    fraisEncheres: '',
    nbPalettes: '',
    nbPieces: '',
    prixNeufTotal: '',
    tauxRebut: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Calculs dynamiques (variables locales en camelCase)
  const prixAchatNum = parseFloat(formData.prixAchat) || 0;
  const fraisPortNum = parseFloat(formData.fraisPort) || 0;
  const fraisEncheresNum = parseFloat(formData.fraisEncheres) || 0;
  const coutTotal = prixAchatNum + fraisPortNum + fraisEncheresNum;
  
  const prixNeufNum = parseFloat(formData.prixNeufTotal) || 0;
  const nbPiecesNum = parseInt(formData.nbPieces) || 0;
  const nbPalettesNum = parseInt(formData.nbPalettes) || 1;
  const tauxRebutNum = parseFloat(formData.tauxRebut) || 0;
  
  const indiceAchat = prixNeufNum > 0 ? ((coutTotal / prixNeufNum) * 100) : 0;
  const nbPiecesVendables = Math.max(0, nbPiecesNum - Math.round(nbPiecesNum * (tauxRebutNum / 100)));
  const coutReelParPiece = nbPiecesVendables > 0 ? (coutTotal / nbPiecesVendables) : 0;

  // KPIs globaux (utilisent les noms Supabase)
  const totalInvesti = lots.reduce((acc, lot) => acc + (lot.couttotal || 0), 0);
  const totalFraisAnnexes = lots.reduce((acc, lot) => acc + (lot.fraisport || 0) + (lot.fraisencheres || 0), 0);
  const avgIndice = lots.length > 0 
    ? (lots.reduce((acc, lot) => acc + (lot.indiceachat || 0), 0) / lots.length).toFixed(1) 
    : '0';
  const totalValeurNeuve = lots.reduce((acc, lot) => acc + (lot.prixneuftotal || 0), 0);
  const rendementGlobal = totalValeurNeuve > 0 
    ? (((totalValeurNeuve - totalInvesti) / totalValeurNeuve) * 100).toFixed(1) 
    : '0';

  // Actions modale
  const openNewLotModal = () => {
    setEditingLot(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (lot: Lot) => {
    setEditingLot(lot);
    setFormData({
      numeroLot: lot.numerolot || '',
      dateAchat: lot.dateachat || new Date().toISOString().split('T')[0],
      source: lot.source || 'B-Stock',
      prixAchat: (lot.prixachat || 0).toString(),
      fraisPort: (lot.fraisport || 0).toString(),
      fraisEncheres: (lot.fraisencheres || 0).toString(),
      nbPalettes: (lot.nbpalettes || 1).toString(),
      nbPieces: (lot.nbpieces || 0).toString(),
      prixNeufTotal: (lot.prixneuftotal || 0).toString(),
      tauxRebut: (lot.tauxrebut || 0).toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce lot ?')) {
      const supabase = createClient();
      const { error } = await supabase.from('lots').delete().eq('id', id);
      if (!error) setLots(lots.filter(l => l.id !== id));
      else alert('Erreur: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    const newLotData = {
      user_id: user.id,
      numerolot: formData.numeroLot,
      dateachat: formData.dateAchat,
      source: formData.source,
      prixAchat: prixAchatNum,
      fraisport: fraisPortNum,
      fraisencheres: fraisEncheresNum,
      couttotal: coutTotal,
      nbpalettes: nbPalettesNum,
      nbpieces: nbPiecesNum,
      prixneuftotal: prixNeufNum,
      tauxrebut: tauxRebutNum,
      indiceachat: indiceAchat,
      coutreelparpiece: coutReelParPiece
    };

    const supabase = createClient();
    try {
      let result;
      if (editingLot) {
        result = await supabase.from('lots').update(newLotData).eq('id', editingLot.id).select();
      } else {
        result = await supabase.from('lots').insert([newLotData]).select();
      }

      if (result.error) throw result.error;

      if (editingLot) {
        setLots(lots.map(l => l.id === editingLot.id ? { ...l, ...newLotData, id: editingLot.id } : l));
      } else {
        setLots([result.data?.[0], ...lots]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getIndiceColor = (val: number) => {
    if (val === 0) return 'text-gray-500 border-gray-700 bg-gray-900/30';
    if (val < 15) return 'text-green-400 border-green-500/30 bg-green-900/10';
    if (val < 25) return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
    if (val < 40) return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
    return 'text-red-400 border-red-500/30 bg-red-900/10';
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Chargement...</div>;
  if (!user) return null; 

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      {/* NAVBAR */}
      <nav className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 w-full">
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-900/50">A</div>
              <span className="font-bold text-xl tracking-tight text-white hidden sm:block">AZUL<span className="text-blue-500">GESTION</span></span>
            </div>
            
            <div className="hidden md:flex flex-1 justify-center items-center h-full">
              <button onClick={() => router.push('/')} className="h-full flex items-center px-4 text-gray-400 font-medium hover:text-white transition-colors border-b-2 border-transparent hover:border-blue-500">Accueil</button>
              
              <div className="relative group h-full flex items-center">
                <button className="h-full flex items-center gap-1 px-4 text-white font-medium transition-colors border-b-2 border-blue-500">Produits <ChevronDown size={16} /></button>
                <div className="absolute top-full left-0 mt-0 w-48 bg-[#252525] border border-gray-700 rounded-b-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <button onClick={() => router.push('/products/brute')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Produit Brute</button>
                  <button onClick={() => router.push('/products/vente')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Vente</button>
                  <button onClick={() => router.push('/products/archives')} className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors">Vendu / Archiver</button>
                </div>
              </div>

              <div className="relative group h-full flex items-center">
                <button className="h-full flex items-center gap-1 px-4 text-white font-medium transition-colors border-b-2 border-blue-500">Finance <ChevronDown size={16} /></button>
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

      {/* MAIN CONTENT */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Gestion des Achats</h1>
                <p className="text-gray-400 text-sm">Suivi, analyse et rentabilité de vos lots</p>
              </div>
            </div>
            <button 
              onClick={openNewLotModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20} />} Nouveau Lot
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Euro size={20} className="text-blue-500"/></div>
                <span className="text-xs text-gray-500 uppercase font-bold">Capital Investi</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalInvesti.toLocaleString()} €</p>
            </div>
            
            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/10 rounded-lg"><Calculator size={20} className="text-orange-500"/></div>
                <span className="text-xs text-gray-500 uppercase font-bold">Frais Annexes</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalFraisAnnexes.toLocaleString()} €</p>
            </div>

            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg"><TrendingDown size={20} className="text-purple-500"/></div>
                <span className="text-xs text-gray-500 uppercase font-bold">Indice Moyen</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{avgIndice}%</p>
            </div>

            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-lg"><Package size={20} className="text-green-500"/></div>
                <span className="text-xs text-gray-500 uppercase font-bold">Rendement Potentiel</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{rendementGlobal}%</p>
            </div>
          </div>

          {/* Lots List */}
          {lots.length === 0 ? (
            <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-12 text-center">
              <Package size={48} className="mx-auto text-gray-600 mb-4"/>
              <h3 className="text-xl font-bold text-white mb-2">Aucun lot enregistré</h3>
              <p className="text-gray-400 mb-6">Commencez par ajouter votre premier achat pour voir les indicateurs.</p>
              <button onClick={openNewLotModal} className="text-blue-400 hover:text-blue-300 font-medium">Ajouter un lot maintenant →</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {lots.map((lot) => (
                <div key={lot.id} className="bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors group">
                  <div className="p-5 border-b border-gray-800 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white">{lot.numerolot}</h3>
                      <p className="text-xs text-gray-500">{lot.dateachat} • {lot.source}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getIndiceColor(lot.indiceachat)}`}>
                      {lot.indiceachat.toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coût Total</span>
                      <span className="font-bold text-white">{(lot.couttotal || 0).toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coût / Palette</span>
                      <span className="font-bold text-blue-400">{((lot.couttotal || 0) / (lot.nbpalettes || 1)).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pièces Vendables</span>
                      <span className="font-bold text-orange-400">
                        {Math.round((lot.nbpieces || 0) * (1 - (lot.tauxrebut || 0)/100))} / {lot.nbpieces}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coût Réel / Pièce</span>
                      <span className="font-bold text-white">{(lot.coutreelparpiece || 0).toFixed(2)} €</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1a1a1a] border-t border-gray-800 flex gap-2">
                    <button 
                      onClick={() => openEditModal(lot)}
                      className="flex-1 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Pencil size={16} /> Modifier
                    </button>
                    <button 
                      onClick={() => handleDelete(lot.id)}
                      className="px-3 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="sticky top-0 bg-[#1e1e1e] border-b border-gray-800 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white">
                {editingLot ? `Modifier ${editingLot.numerolot}` : 'Nouveau Lot'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Numéro de Lot *</label>
                  <input type="text" required placeholder="LOT-2024-XXX" value={formData.numeroLot} onChange={(e) => setFormData({...formData, numeroLot: e.target.value})} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date d'achat *</label>
                  <input type="date" required value={formData.dateAchat} onChange={(e) => setFormData({...formData, dateAchat: e.target.value})} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Source</label>
                  <select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none">
                    <option value="B-Stock">B-Stock</option>
                    <option value="Stocklear">Stocklear</option>
                    <option value="Amazon">Amazon Returns</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Calculator size={16} className="text-blue-500"/> Structure du Coût</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Prix Marteau (€)</label>
                    <input type="number" required min="0" step="0.01" placeholder="0.00" value={formData.prixAchat} onChange={(e) => setFormData({...formData, prixAchat: e.target.value})} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Frais Port (€)</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.fraisPort} onChange={(e) => setFormData({...formData, fraisPort: e.target.value})} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Frais Enchères (€)</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.fraisEncheres} onChange={(e) => setFormData({...formData, fraisEncheres: e.target.value})} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Package size={12}/> Nb. Palettes</label>
                    <input type="number" required min="1" placeholder="1" value={formData.nbPalettes} onChange={(e) => setFormData({...formData, nbPalettes: e.target.value})} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"/>
                  </div>
                </div>
                <div className="mt-4 flex gap-4">
                   <div className="flex-1 bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                      <span className="text-xs text-gray-500 block">Coût Total Lot</span>
                      <span className="text-xl font-bold text-white">{coutTotal.toFixed(2)} €</span>
                   </div>
                   <div className="flex-1 bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                      <span className="text-xs text-gray-500 block">Coût / Palette</span>
                      <span className="text-xl font-bold text-blue-400">{(coutTotal / nbPalettesNum).toFixed(2)} €</span>
                   </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><TrendingDown size={16} className="text-purple-500"/> Analyse de Valeur</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Euro size={12} className="text-green-500"/> Valeur Estimée à Neuf (€) *</label>
                    <input type="number" required min="0" placeholder="Ex: 100000" value={formData.prixNeufTotal} onChange={(e) => setFormData({...formData, prixNeufTotal: e.target.value})} className="w-full bg-[#252525] border border-green-900/50 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nombre Total de Pièces *</label>
                    <input type="number" required min="1" placeholder="Ex: 1000" value={formData.nbPieces} onChange={(e) => setFormData({...formData, nbPieces: e.target.value})} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><AlertTriangle size={12} className="text-orange-500"/> Est. Pièces HS (%)</label>
                    <input type="number" min="0" max="100" placeholder="Ex: 15" value={formData.tauxRebut} onChange={(e) => setFormData({...formData, tauxRebut: e.target.value})} className="w-full bg-[#252525] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none"/>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`rounded-xl p-4 border ${getIndiceColor(indiceAchat)} bg-opacity-10`}>
                    <span className="text-xs font-bold uppercase text-gray-400 block mb-1">Indice d'Achat</span>
                    <span className={`text-2xl font-black ${indiceAchat < 15 ? 'text-green-400' : indiceAchat < 25 ? 'text-blue-400' : indiceAchat < 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {indiceAchat.toFixed(1)}%
                    </span>
                  </div>
                  <div className="rounded-xl p-4 border border-orange-500/30 bg-orange-900/10">
                    <span className="text-xs font-bold uppercase text-gray-400 block mb-1">Coût Réel / Pièce OK</span>
                    <span className="text-2xl font-black text-orange-400">{coutReelParPiece.toFixed(2)} €</span>
                  </div>
                  <div className="rounded-xl p-4 border border-green-500/30 bg-green-900/10">
                    <span className="text-xs font-bold uppercase text-gray-400 block mb-1">Potentiel Brut</span>
                    <span className="text-2xl font-black text-green-400">{(prixNeufNum - coutTotal).toLocaleString()} €</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-800">
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />} {editingLot ? 'Mettre à jour' : 'Enregistrer le Lot'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 font-medium rounded-lg transition-colors">
                  Annuler
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}