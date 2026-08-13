'use client';

// Force rebuild - Web Crypto API (no crypto-js dependency)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Plus, X, Clock, AlertCircle, Eye, EyeOff, Copy, Trash2 } from 'lucide-react';

interface Activite {
  id: string;
  titre: string;
  categorie: 'Travail' | 'Perso';
  heure_debut: string;
  heure_fin: string;
  couleur: string;
  description?: string;
  priorite: number;
  statut: 'planifiee' | 'en_cours' | 'terminee';
}

interface Identifiant {
  id: string;
  nom_site: string;
  email: string;
  password_encrypted: string;
  url?: string;
  notes?: string;
  categorie: string;
}

interface Note {
  id: string;
  contenu: string;
  updated_at: string;
}

const COULEURS_CATEGORIE: Record<string, string> = {
  'Travail': '#3b82f6',
  'Perso': '#ec4899',
};

const SECRET_KEY = 'azul-gestion-2026';

// Utilise Web Crypto API native (pas de dépendances)
const encryptPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
};

const decryptPassword = async (encrypted: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SECRET_KEY.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

export default function Organisateur() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'identifiants' | 'notes'>('timeline');
  const [activites, setActivites] = useState<Activite[]>([]);
  const [identifiants, setIdentifiants] = useState<Identifiant[]>([]);
  const [notes, setNotes] = useState<Note | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formActivite, setFormActivite] = useState({
    titre: '',
    categorie: 'Travail' as const,
    heure_debut: '09:00',
    heure_fin: '10:00',
    priorite: 3,
  });

  const [formIdentifiant, setFormIdentifiant] = useState({
    nom_site: '',
    email: '',
    password: '',
    url: '',
    notes: '',
    categorie: 'Autre',
  });

  const calculateDuration = (debut: string, fin: string) => {
    const [hd, md] = debut.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    const mins = (hf * 60 + mf) - (hd * 60 + md);
    const heures = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${heures}h${minutes > 0 ? minutes + 'm' : ''}`;
  };

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Activités
      const { data: activitesData } = await supabase
        .from('activites')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_jour', today)
        .order('heure_debut', { ascending: true });

      setActivites(activitesData as Activite[] || []);

      // Identifiants
      const { data: identifiantsData } = await supabase
        .from('identifiants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setIdentifiants(identifiantsData as Identifiant[] || []);

      // Notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      setNotes(notesData?.[0] as Note || null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddActivite = async () => {
    try {
      if (!formActivite.titre) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('activites').insert({
        user_id: user.id,
        ...formActivite,
        couleur: COULEURS_CATEGORIE[formActivite.categorie],
        date_jour: new Date().toISOString().split('T')[0],
      });

      setFormActivite({ titre: '', categorie: 'Travail', heure_debut: '09:00', heure_fin: '10:00', priorite: 3 });
      setShowForm(false);
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddIdentifiant = async () => {
    try {
      if (!formIdentifiant.nom_site || !formIdentifiant.email || !formIdentifiant.password) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const encrypted = await encryptPassword(formIdentifiant.password);
      await supabase.from('identifiants').insert({
        user_id: user.id,
        nom_site: formIdentifiant.nom_site,
        email: formIdentifiant.email,
        password_encrypted: encrypted,
        url: formIdentifiant.url,
        notes: formIdentifiant.notes,
        categorie: formIdentifiant.categorie,
      });

      setFormIdentifiant({ nom_site: '', email: '', password: '', url: '', notes: '', categorie: 'Autre' });
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateNotes = async (contenu: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (notes?.id) {
        await supabase.from('notes').update({ contenu }).eq('id', notes.id);
      } else {
        await supabase.from('notes').insert({ user_id: user.id, contenu });
      }

      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteIdentifiant = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase.from('identifiants').delete().eq('id', id);
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteActivite = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase.from('activites').delete().eq('id', id);
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleShowPassword = async (id: string, encrypted: string) => {
    if (showPasswords[id]) {
      setShowPasswords({ ...showPasswords, [id]: false });
    } else {
      const decrypted = await decryptPassword(encrypted);
      setDecryptedPasswords({ ...decryptedPasswords, [id]: decrypted });
      setShowPasswords({ ...showPasswords, [id]: true });
    }
  };

  const copyPassword = async (id: string, encrypted: string) => {
    const password = await decryptPassword(encrypted);
    navigator.clipboard.writeText(password);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentPercent = (currentHour + currentMinutes / 60) * (100 / 24);

  const tempsParCategorie = activites.reduce((acc, a) => {
    if (a.statut !== 'planifiee') return acc;
    const [hd, md] = a.heure_debut.split(':').map(Number);
    const [hf, mf] = a.heure_fin.split(':').map(Number);
    const mins = (hf * 60 + mf) - (hd * 60 + md);
    const cat = a.categorie;
    return { ...acc, [cat]: (acc[cat] || 0) + mins };
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a1a1a]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-12">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-8">⏱️ Ton Hub Complet</h1>

          {/* Onglets */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white text-blue-600 shadow-2xl'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              ⏱️ Timeline
            </button>
            <button
              onClick={() => setActiveTab('identifiants')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'identifiants'
                  ? 'bg-white text-blue-600 shadow-2xl'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🔐 Identifiants
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'notes'
                  ? 'bg-white text-blue-600 shadow-2xl'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              📝 Notes
            </button>
          </div>

          {/* Stats */}
          {activeTab === 'timeline' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <p className="text-white/80 text-sm mb-2">⏰ Travail</p>
                <p className="text-3xl font-bold text-white">{Math.floor((tempsParCategorie['Travail'] || 0) / 60)}h</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <p className="text-white/80 text-sm mb-2">🎮 Perso</p>
                <p className="text-3xl font-bold text-white">{Math.floor((tempsParCategorie['Perso'] || 0) / 60)}h</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <p className="text-white/80 text-sm mb-2">📋 Activités</p>
                <p className="text-3xl font-bold text-white">{activites.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">

        {/* ONGLET TIMELINE - NOUVELLE VUE GRID ÉPOUSTOUFLANTE */}
        {activeTab === 'timeline' && (
          <div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="mb-8 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-2xl hover:scale-105 transition-all text-lg"
            >
              <Plus size={28} /> Ajouter une activité
            </button>

            {showForm && (
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-purple-600/50 rounded-2xl p-8 mb-12 backdrop-blur-xl shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">✨ Nouvelle Activité</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <input
                    type="text"
                    placeholder="Titre activité"
                    value={formActivite.titre}
                    onChange={e => setFormActivite({ ...formActivite, titre: e.target.value })}
                    className="md:col-span-2 bg-[#0a0a0a] border-2 border-gray-600 hover:border-purple-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:border-purple-600"
                  />
                  <select
                    value={formActivite.categorie}
                    onChange={e => setFormActivite({ ...formActivite, categorie: e.target.value as any })}
                    className="bg-[#0a0a0a] border-2 border-gray-600 hover:border-purple-500 rounded-xl px-4 py-3 text-white transition-all focus:outline-none focus:border-purple-600"
                  >
                    <option>Travail</option>
                    <option>Perso</option>
                  </select>
                  <input
                    type="time"
                    value={formActivite.heure_debut}
                    onChange={e => setFormActivite({ ...formActivite, heure_debut: e.target.value })}
                    className="bg-[#0a0a0a] border-2 border-gray-600 hover:border-purple-500 rounded-xl px-4 py-3 text-white transition-all focus:outline-none focus:border-purple-600"
                  />
                  <input
                    type="time"
                    value={formActivite.heure_fin}
                    onChange={e => setFormActivite({ ...formActivite, heure_fin: e.target.value })}
                    className="bg-[#0a0a0a] border-2 border-gray-600 hover:border-purple-500 rounded-xl px-4 py-3 text-white transition-all focus:outline-none focus:border-purple-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddActivite}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all active:scale-95"
                    >
                      ✅ Ajouter
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GRILLE CALENDAR ÉPOUSTOUFLANTE */}
            <div className="space-y-4">
              {/* En-tête avec heures */}
              <div className="grid gap-4">
                {/* Blocs colorés par heure */}
                <div className="space-y-3">
                  {Array.from({ length: 24 }).map((_, hourIndex) => {
                    const activitesHeure = activites.filter(a => {
                      const [hd] = a.heure_debut.split(':').map(Number);
                      return hd === hourIndex;
                    });

                    return (
                      <div key={hourIndex} className="group">
                        {/* Heure header */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-16 text-right">
                            <span className="text-2xl font-black text-blue-400">{String(hourIndex).padStart(2, '0')}</span>
                            <span className="text-xs text-gray-500 ml-1">h</span>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-gray-700 via-gray-600 to-transparent"></div>
                        </div>

                        {/* Activités de cette heure */}
                        {activitesHeure.length > 0 ? (
                          <div className="flex flex-wrap gap-3 ml-20">
                            {activitesHeure.map(activite => {
                              const duration = calculateDuration(activite.heure_debut, activite.heure_fin);
                              return (
                                <div
                                  key={activite.id}
                                  className="flex-1 min-w-xs relative group/card p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer backdrop-blur-md"
                                  style={{
                                    backgroundColor: `${activite.couleur}15`,
                                    borderColor: activite.couleur,
                                    background: `linear-gradient(135deg, ${activite.couleur}10 0%, ${activite.couleur}05 100%)`,
                                  }}
                                >
                                  {/* Indicateur couleur gauche */}
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                                    style={{ backgroundColor: activite.couleur }}
                                  ></div>

                                  <div className="flex justify-between items-start mb-3">
                                    <h4 className="text-lg font-bold text-white flex-1 pr-4">{activite.titre}</h4>
                                    <button
                                      onClick={() => handleDeleteActivite(activite.id)}
                                      className="opacity-0 group-hover/card:opacity-100 transition-opacity p-2 hover:bg-red-600/50 rounded-lg"
                                    >
                                      <X size={18} className="text-red-400" />
                                    </button>
                                  </div>

                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="px-3 py-1 rounded-full text-xs font-bold"
                                        style={{
                                          backgroundColor: `${activite.couleur}30`,
                                          color: activite.couleur,
                                        }}
                                      >
                                        {activite.categorie}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-300">
                                      <Clock size={14} />
                                      <span className="font-mono">
                                        {activite.heure_debut} → {activite.heure_fin}
                                      </span>
                                      <span className="ml-auto font-bold" style={{ color: activite.couleur }}>
                                        {duration}
                                      </span>
                                    </div>

                                    {activite.priorite >= 4 && (
                                      <div className="flex items-center gap-2 text-red-400">
                                        <AlertCircle size={14} />
                                        <span className="text-xs font-bold">Priorité</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Shine effect on hover */}
                                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/card:opacity-20 transition-opacity bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none"></div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="ml-20 h-12 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-sm group-hover:border-gray-600 transition-all">
                            Aucune activité
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET IDENTIFIANTS */}
        {activeTab === 'identifiants' && (
          <div>
            <button
              onClick={() => document.getElementById('id-form')?.classList.toggle('hidden')}
              className="mb-8 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Plus size={24} /> Ajouter identifiant
            </button>

            {/* Formulaire */}
            <div id="id-form" className="hidden bg-[#1a1a1a] border-2 border-green-600 rounded-xl p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Site/Client" value={formIdentifiant.nom_site} onChange={e => setFormIdentifiant({ ...formIdentifiant, nom_site: e.target.value })} className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white" />
                <input type="email" placeholder="Email" value={formIdentifiant.email} onChange={e => setFormIdentifiant({ ...formIdentifiant, email: e.target.value })} className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white" />
                <input type="password" placeholder="Mot de passe" value={formIdentifiant.password} onChange={e => setFormIdentifiant({ ...formIdentifiant, password: e.target.value })} className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white" />
                <input type="url" placeholder="URL (optionnel)" value={formIdentifiant.url} onChange={e => setFormIdentifiant({ ...formIdentifiant, url: e.target.value })} className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white" />
                <textarea placeholder="Notes" value={formIdentifiant.notes} onChange={e => setFormIdentifiant({ ...formIdentifiant, notes: e.target.value })} className="md:col-span-2 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white" rows={3}></textarea>
                <button onClick={handleAddIdentifiant} className="md:col-span-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg py-3">✅ Ajouter</button>
              </div>
            </div>

            {/* Liste identifiants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {identifiants.map(id => (
                <div key={id.id} className="bg-[#1a1a1a] border-2 border-green-700/50 rounded-xl p-6 hover:border-green-600 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-green-400">{id.nom_site}</h3>
                    <button onClick={() => handleDeleteIdentifiant(id.id)} className="p-2 hover:bg-red-600/50 rounded-lg"><Trash2 size={20} className="text-red-400" /></button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-400">Email</p>
                      <p className="text-white font-mono">{id.email}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Mot de passe</p>
                      <div className="flex gap-2 items-center">
                        <p className="text-white font-mono flex-1">
                          {showPasswords[id.id] ? decryptedPasswords[id.id] || '••••••••' : '••••••••'}
                        </p>
                        <button onClick={() => toggleShowPassword(id.id, id.password_encrypted)} className="p-2 hover:bg-white/10 rounded">
                          {showPasswords[id.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button
                          onClick={() => copyPassword(id.id, id.password_encrypted)}
                          className={`p-2 rounded transition-all ${copiedId === id.id ? 'bg-green-600' : 'hover:bg-white/10'}`}
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>

                    {id.url && (
                      <div>
                        <p className="text-gray-400">URL</p>
                        <a href={id.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">{id.url}</a>
                      </div>
                    )}

                    {id.notes && (
                      <div>
                        <p className="text-gray-400">Notes</p>
                        <p className="text-white">{id.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET NOTES */}
        {activeTab === 'notes' && (
          <div>
            <div className="bg-[#1a1a1a] border-2 border-yellow-600 rounded-xl p-8 h-96">
              <textarea
                value={notes?.contenu || ''}
                onChange={e => handleUpdateNotes(e.target.value)}
                placeholder="📝 Écris tes notes ici... (Auto-sauvegarde)"
                className="w-full h-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-yellow-600"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
