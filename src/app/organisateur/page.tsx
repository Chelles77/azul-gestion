'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Plus, X, Clock, AlertCircle, Eye, EyeOff, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  date_jour: string;
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
      encoder.encode(SECRET_KEY.padStart(32, '0').slice(0, 32)),
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
  // Organisateur v1.0
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'identifiants' | 'notes'>('timeline');
  const [viewType, setViewType] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('semaine');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activites, setActivites] = useState<Activite[]>([]);
  const [identifiants, setIdentifiants] = useState<Identifiant[]>([]);
  const [notes, setNotes] = useState<Note | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showAddIdentifiant, setShowAddIdentifiant] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newIdentifiant, setNewIdentifiant] = useState({
    nom_site: '',
    email: '',
    password: '',
    url: '',
    notes: '',
    categorie: 'Autre',
  });

  const [quickAddMenuOpen, setQuickAddMenuOpen] = useState<string | null>(null);
  const [quickAddForm, setQuickAddForm] = useState<{
    titre: string;
    categorie: 'Travail' | 'Perso';
    heure_debut: string;
    heure_fin: string;
    date?: string;
  }>({
    titre: '',
    categorie: 'Travail',
    heure_debut: '09:00',
    heure_fin: '10:00',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: activitesData } = await supabase
        .from('activites')
        .select('*')
        .eq('user_id', user.id)
        .order('heure_debut', { ascending: true });

      setActivites(activitesData as Activite[] || []);

      const { data: identifiantsData } = await supabase
        .from('identifiants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setIdentifiants(identifiantsData as Identifiant[] || []);

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

  const handleAddActiviteQuick = async (date: string, heure: string) => {
    try {
      if (!quickAddForm.titre) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('activites').insert({
        user_id: user.id,
        titre: quickAddForm.titre,
        categorie: quickAddForm.categorie,
        heure_debut: quickAddForm.heure_debut,
        heure_fin: quickAddForm.heure_fin,
        couleur: COULEURS_CATEGORIE[quickAddForm.categorie],
        date_jour: date,
      });

      setQuickAddForm({ titre: '', categorie: 'Travail', heure_debut: '09:00', heure_fin: '10:00' });
      setQuickAddMenuOpen(null);
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
    try {
      if (showPasswords[id]) {
        setShowPasswords({ ...showPasswords, [id]: false });
      } else {
        const decrypted = await decryptPassword(encrypted);
        if (!decrypted) {
          alert('❌ Erreur: Impossible de décrypter le mot de passe');
          return;
        }
        setDecryptedPasswords({ ...decryptedPasswords, [id]: decrypted });
        setShowPasswords({ ...showPasswords, [id]: true });
      }
    } catch (error) {
      alert('❌ Erreur: ' + (error instanceof Error ? error.message : 'Unknown'));
    }
  };

  const copyPassword = async (id: string, encrypted: string) => {
    try {
      const password = await decryptPassword(encrypted);
      if (!password) {
        alert('❌ Erreur: Impossible de décrypter le mot de passe');
        return;
      }
      await navigator.clipboard.writeText(password);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      alert('✅ Mot de passe copié!');
    } catch (error) {
      alert('❌ Erreur: ' + (error instanceof Error ? error.message : 'Unknown'));
    }
  };

  const handleDeleteIdentifiant = async (id: string) => {
    if (!confirm('Sûr de vouloir supprimer cet identifiant?')) return;
    try {
      const supabase = createClient();
      await supabase.from('identifiants').delete().eq('id', id);
      await fetchData();
      alert('✅ Identifiant supprimé!');
    } catch (error) {
      alert('❌ Erreur: ' + (error instanceof Error ? error.message : 'Unknown'));
    }
  };

  const handleEditIdentifiant = (id: Identifiant) => {
    setNewIdentifiant({
      nom_site: id.nom_site,
      email: id.email,
      password: '',
      url: id.url || '',
      notes: id.notes || '',
      categorie: id.categorie,
    });
    setEditingId(id.id);
    setShowAddIdentifiant(true);
  };

  const handleUpdateIdentifiant = async () => {
    try {
      if (!newIdentifiant.nom_site || !newIdentifiant.email) {
        alert('Remplis tous les champs!');
        return;
      }

      const supabase = createClient();
      const updates: any = {
        nom_site: newIdentifiant.nom_site,
        email: newIdentifiant.email,
        url: newIdentifiant.url,
        notes: newIdentifiant.notes,
        categorie: newIdentifiant.categorie,
      };

      if (newIdentifiant.password) {
        updates.password_encrypted = await encryptPassword(newIdentifiant.password);
      }

      const { error } = await supabase
        .from('identifiants')
        .update(updates)
        .eq('id', editingId);

      if (error) {
        alert('❌ Erreur: ' + error.message);
        return;
      }

      alert('✅ Identifiant modifié!');
      setNewIdentifiant({
        nom_site: '',
        email: '',
        password: '',
        url: '',
        notes: '',
        categorie: 'Autre',
      });
      setEditingId(null);
      setShowAddIdentifiant(false);
      await fetchData();
    } catch (error) {
      alert('❌ Erreur: ' + (error instanceof Error ? error.message : 'Unknown'));
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

  const handleSaveIdentifiant = async () => {
    try {
      if (!newIdentifiant.nom_site || !newIdentifiant.email || !newIdentifiant.password) {
        alert('Remplis tous les champs!');
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Erreur: Tu n\'es pas connecté!');
        return;
      }

      const encrypted = await encryptPassword(newIdentifiant.password);

      const { error } = await supabase
        .from('identifiants')
        .insert({
          user_id: user.id,
          nom_site: newIdentifiant.nom_site,
          email: newIdentifiant.email,
          password_encrypted: encrypted,
          url: newIdentifiant.url,
          notes: newIdentifiant.notes,
          categorie: newIdentifiant.categorie,
        });

      if (error) {
        alert('❌ Erreur d\'enregistrement: ' + error.message);
        console.error('Supabase error:', error);
        return;
      }

      alert('✅ Identifiant enregistré avec succès!');

      setNewIdentifiant({
        nom_site: '',
        email: '',
        password: '',
        url: '',
        notes: '',
        categorie: 'Autre',
      });
      setShowAddIdentifiant(false);

      await fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Erreur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
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

  // Fonctions pour les vues calendrier
  const getActivitesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return activites.filter(a => a.date_jour === dateStr);
  };

  const getActivitesForDateHour = (date: Date, hour: number) => {
    return getActivitesForDate(date).filter(a => {
      const [h] = a.heure_debut.split(':').map(Number);
      return h === hour;
    });
  };

  // Modal réutilisable
  const renderModalQuickAdd = (dateStr: string, hour: number) => (
    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-purple-600 rounded-2xl shadow-2xl p-6 z-50 w-96 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Titre */}
      <h3 className="text-white font-bold text-lg mb-4">✨ Nouvelle Activité</h3>

      <div className="space-y-4">
        {/* Champ Titre */}
        <div>
          <label className="text-xs text-gray-400 font-bold mb-2 block">TITRE</label>
          <input
            type="text"
            placeholder="Ex: Réunion, Pause café..."
            value={quickAddForm.titre}
            onChange={e => setQuickAddForm({ ...quickAddForm, titre: e.target.value })}
            className="w-full bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-all"
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="text-xs text-gray-400 font-bold mb-2 block">CATÉGORIE</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setQuickAddForm({ ...quickAddForm, categorie: 'Travail' })}
              className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                quickAddForm.categorie === 'Travail'
                  ? 'border-blue-600 bg-blue-600/20 text-blue-400'
                  : 'border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-blue-600'
              }`}
            >
              💼 Travail
            </button>
            <button
              onClick={() => setQuickAddForm({ ...quickAddForm, categorie: 'Perso' })}
              className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                quickAddForm.categorie === 'Perso'
                  ? 'border-pink-600 bg-pink-600/20 text-pink-400'
                  : 'border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-pink-600'
              }`}
            >
              🎮 Perso
            </button>
          </div>
        </div>

        {/* Heure */}
        <div>
          <label className="text-xs text-gray-400 font-bold mb-2 block">DURÉE</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={quickAddForm.heure_debut}
              onChange={e => setQuickAddForm({ ...quickAddForm, heure_debut: e.target.value })}
              className="bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-600 transition-all"
              onClick={e => e.stopPropagation()}
            />
            <input
              type="time"
              value={quickAddForm.heure_fin}
              onChange={e => setQuickAddForm({ ...quickAddForm, heure_fin: e.target.value })}
              className="bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-600 transition-all"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              handleAddActiviteQuick(dateStr, `${String(hour).padStart(2, '0')}:00`);
              setQuickAddForm({ titre: '', categorie: 'Travail', heure_debut: '09:00', heure_fin: '10:00' });
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all active:scale-95"
          >
            ✅ Ajouter
          </button>
          <button
            onClick={() => setQuickAddMenuOpen(null)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all"
          >
            ✕ Annuler
          </button>
        </div>
      </div>

      {/* Arrow pointer */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-600 border-2 border-purple-600 rotate-45 rounded-sm"></div>
    </div>
  );

  // VUE SEMAINE
  const renderViewSemaine = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-7 gap-2 mb-6">
          {days.map((day, i) => (
            <div key={i} className="text-center">
              <p className="text-sm font-bold text-gray-400">{['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][day.getDay()]}</p>
              <p className="text-2xl font-bold text-white">{day.getDate()}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 24 }).map((_, hour) => (
            <div key={hour} className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-16 text-right font-bold text-blue-400">{String(hour).padStart(2, '0')}h</span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
              </div>

              <div className="grid grid-cols-7 gap-2 ml-20">
                {days.map((day, dayIdx) => {
                  const dayStr = day.toISOString().split('T')[0];
                  const activitesHeure = getActivitesForDateHour(day, hour);
                  return (
                    <div
                      key={dayIdx}
                      className="relative min-h-24 bg-[#0a0a0a] border-2 border-gray-700 rounded-xl p-3 hover:border-purple-600 transition-all group cursor-pointer"
                    >
                      {activitesHeure.length > 0 ? (
                        <div className="space-y-2">
                          {activitesHeure.map(act => (
                            <div
                              key={act.id}
                              className="p-2 rounded-lg text-xs font-bold text-white truncate"
                              style={{ backgroundColor: `${act.couleur}40`, borderLeft: `3px solid ${act.couleur}` }}
                            >
                              <div className="truncate">{act.titre}</div>
                              <div className="text-xs opacity-75">{act.heure_debut}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => setQuickAddMenuOpen(`${dayStr}-${hour}`)}
                          className="flex items-center justify-center h-full w-full text-gray-600 hover:text-purple-400 transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      )}

                      {quickAddMenuOpen === `${dayStr}-${hour}` && renderModalQuickAdd(dayStr, hour)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // VUE MOIS
  const renderViewMois = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = Array.from({ length: daysInMonth }).map((_, i) => new Date(year, month, i + 1));
    const emptyDays = Array.from({ length: startDay });

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          {firstDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h2>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="text-center font-bold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="min-h-24 bg-[#0a0a0a]/50"></div>
          ))}
          {days.map((day, i) => {
            const dayStr = day.toISOString().split('T')[0];
            const dayActivites = getActivitesForDate(day);
            return (
              <div
                key={i}
                className="relative min-h-24 bg-[#1a1a1a] border-2 border-gray-700 rounded-xl p-2 hover:border-purple-600 transition-all cursor-pointer group"
              >
                <div className="font-bold text-white mb-1 flex justify-between items-center">
                  <span>{day.getDate()}</span>
                  <button
                    onClick={() => setQuickAddMenuOpen(`${dayStr}-12`)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-purple-600/30 rounded text-purple-400 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-1 text-xs">
                  {dayActivites.slice(0, 2).map(act => (
                    <div
                      key={act.id}
                      className="p-1 rounded text-white truncate"
                      style={{ backgroundColor: `${act.couleur}50` }}
                    >
                      {act.titre}
                    </div>
                  ))}
                  {dayActivites.length > 2 && (
                    <div className="text-gray-500 text-xs">+{dayActivites.length - 2} plus</div>
                  )}
                </div>

                {/* Modal pour Mois avec date picker */}
                {quickAddMenuOpen === `${dayStr}-12` && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-purple-600 rounded-2xl shadow-2xl p-8 w-96">
                      <h3 className="text-white font-bold text-2xl mb-6">✨ Nouvelle Activité</h3>

                      <div className="space-y-4">
                        {/* Titre */}
                        <div>
                          <label className="text-xs text-gray-400 font-bold mb-2 block">TITRE</label>
                          <input
                            type="text"
                            placeholder="Titre de l'activité..."
                            value={quickAddForm.titre}
                            onChange={e => setQuickAddForm({ ...quickAddForm, titre: e.target.value })}
                            className="w-full bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-600 transition-all"
                            autoFocus
                          />
                        </div>

                        {/* Catégorie */}
                        <div>
                          <label className="text-xs text-gray-400 font-bold mb-2 block">CATÉGORIE</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setQuickAddForm({ ...quickAddForm, categorie: 'Travail' })}
                              className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                                quickAddForm.categorie === 'Travail'
                                  ? 'border-blue-600 bg-blue-600/20 text-blue-400'
                                  : 'border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-blue-600'
                              }`}
                            >
                              💼 Travail
                            </button>
                            <button
                              onClick={() => setQuickAddForm({ ...quickAddForm, categorie: 'Perso' })}
                              className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                                quickAddForm.categorie === 'Perso'
                                  ? 'border-pink-600 bg-pink-600/20 text-pink-400'
                                  : 'border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-pink-600'
                              }`}
                            >
                              🎮 Perso
                            </button>
                          </div>
                        </div>

                        {/* Date */}
                        <div>
                          <label className="text-xs text-gray-400 font-bold mb-2 block">DATE</label>
                          <input
                            type="date"
                            value={quickAddForm.date || ''}
                            onChange={e => setQuickAddForm({ ...quickAddForm, date: e.target.value })}
                            className="w-full bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-600 transition-all cursor-pointer"
                            style={{
                              colorScheme: 'dark',
                            }}
                          />
                        </div>

                        {/* Heures */}
                        <div>
                          <label className="text-xs text-gray-400 font-bold mb-2 block">DURÉE</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              value={quickAddForm.heure_debut}
                              onChange={e => setQuickAddForm({ ...quickAddForm, heure_debut: e.target.value })}
                              className="bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-600 transition-all"
                            />
                            <input
                              type="time"
                              value={quickAddForm.heure_fin}
                              onChange={e => setQuickAddForm({ ...quickAddForm, heure_fin: e.target.value })}
                              className="bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-600 transition-all"
                            />
                          </div>
                        </div>

                        {/* Boutons */}
                        <div className="grid grid-cols-2 gap-3 pt-4">
                          <button
                            onClick={() => {
                              handleAddActiviteQuick(quickAddForm.date || dayStr, quickAddForm.heure_debut);
                              setQuickAddMenuOpen(null);
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                          >
                            ✅ Ajouter
                          </button>
                          <button
                            onClick={() => setQuickAddMenuOpen(null)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all"
                          >
                            ✕ Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // VUE JOUR
  const renderViewJour = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayActivites = getActivitesForDate(currentDate);

    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white mb-8">
          {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>

        {Array.from({ length: 24 }).map((_, hour) => {
          const activitesHeure = dayActivites.filter(a => {
            const [h] = a.heure_debut.split(':').map(Number);
            return h === hour;
          });

          return (
            <div key={hour} className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-16 text-right font-bold text-blue-400 text-lg">{String(hour).padStart(2, '0')}h</span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
              </div>

              <div className="ml-24 space-y-2">
                {activitesHeure.map(act => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl border-2 transition-all"
                    style={{ backgroundColor: `${act.couleur}20`, borderColor: act.couleur }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-lg">{act.titre}</h3>
                        <p className="text-sm text-gray-300">{act.heure_debut} - {act.heure_fin}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteActivite(act.id)}
                        className="p-2 hover:bg-red-600/50 rounded-lg"
                      >
                        <X size={18} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}

                {activitesHeure.length === 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setQuickAddMenuOpen(`${dateStr}-${hour}`)}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-600 transition-all flex items-center gap-2 text-gray-600 hover:text-purple-400 hover:bg-purple-600/5"
                    >
                      <Plus size={20} />
                      <span>Ajouter une activité</span>
                    </button>

                    {/* MENU DÉROULANT - RESTE OUVERT */}
                    {quickAddMenuOpen === `${dateStr}-${hour}` && renderModalQuickAdd(dateStr, hour)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // VUE ANNÉE
  const renderViewAnnee = () => {
    const year = currentDate.getFullYear();
    const months = Array.from({ length: 12 }).map((_, i) => new Date(year, i, 1));

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-bold text-white text-center flex-1">{year}</h2>
          <button
            onClick={() => {
              setQuickAddForm({
                titre: '',
                categorie: 'Travail',
                heure_debut: '09:00',
                heure_fin: '10:00',
                date: new Date().toISOString().split('T')[0],
              });
              setQuickAddMenuOpen('annee-add');
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            ➕ Ajouter
          </button>
        </div>

        {/* Modal pour Année */}
        {quickAddMenuOpen === 'annee-add' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-purple-600 rounded-2xl shadow-2xl p-8 w-96">
              <h3 className="text-white font-bold text-2xl mb-6">✨ Nouvelle Activité</h3>

              <div className="space-y-4">
                {/* Titre */}
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-2 block">TITRE</label>
                  <input
                    type="text"
                    placeholder="Titre de l'activité..."
                    value={quickAddForm.titre}
                    onChange={e => setQuickAddForm({ ...quickAddForm, titre: e.target.value })}
                    className="w-full bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-600 transition-all"
                    autoFocus
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-2 block">CATÉGORIE</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setQuickAddForm({ ...quickAddForm, categorie: 'Travail' })}
                      className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                        quickAddForm.categorie === 'Travail'
                          ? 'border-blue-600 bg-blue-600/20 text-blue-400'
                          : 'border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-blue-600'
                      }`}
                    >
                      💼 Travail
                    </button>
                    <button
                      onClick={() => setQuickAddForm({ ...quickAddForm, categorie: 'Perso' })}
                      className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                        quickAddForm.categorie === 'Perso'
                          ? 'border-pink-600 bg-pink-600/20 text-pink-400'
                          : 'border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-pink-600'
                      }`}
                    >
                      🎮 Perso
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-2 block">DATE</label>
                  <input
                    type="date"
                    value={quickAddForm.date || ''}
                    onChange={e => setQuickAddForm({ ...quickAddForm, date: e.target.value })}
                    className="w-full bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-600 transition-all cursor-pointer"
                    style={{
                      colorScheme: 'dark',
                    }}
                  />
                </div>

                {/* Heures */}
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-2 block">DURÉE</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={quickAddForm.heure_debut}
                      onChange={e => setQuickAddForm({ ...quickAddForm, heure_debut: e.target.value })}
                      className="bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-600 transition-all"
                    />
                    <input
                      type="time"
                      value={quickAddForm.heure_fin}
                      onChange={e => setQuickAddForm({ ...quickAddForm, heure_fin: e.target.value })}
                      className="bg-[#0a0a0a] border-2 border-gray-700 hover:border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-600 transition-all"
                    />
                  </div>
                </div>

                {/* Boutons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleAddActiviteQuick(quickAddForm.date || new Date().toISOString().split('T')[0], quickAddForm.heure_debut);
                      setQuickAddMenuOpen(null);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                  >
                    ✅ Ajouter
                  </button>
                  <button
                    onClick={() => setQuickAddMenuOpen(null)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-all"
                  >
                    ✕ Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {months.map((month, i) => {
            const monthActivites = activites.filter(a => {
              const [y, m] = a.date_jour.split('-').slice(0, 2);
              return parseInt(y) === year && parseInt(m) === i + 1;
            });

            return (
              <div key={i} className="bg-[#1a1a1a] border-2 border-gray-700 rounded-xl p-6">
                <h3 className="font-bold text-white text-lg mb-4">
                  {new Date(year, i, 1).toLocaleDateString('fr-FR', { month: 'long' })}
                </h3>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-400">{monthActivites.length}</div>
                  <div className="text-sm text-gray-400">activités</div>
                  <div className="mt-4 space-y-1">
                    {monthActivites.slice(0, 3).map((act, i) => (
                      <div key={i} className="text-xs text-gray-300 truncate">
                        • {act.titre}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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

          {/* Onglets principaux */}
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
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">

        {/* TIMELINE */}
        {activeTab === 'timeline' && (
          <div>
            {/* Sélecteur de vue */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-2">
                {['jour', 'semaine', 'mois', 'annee'].map(view => (
                  <button
                    key={view}
                    onClick={() => setViewType(view as any)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all capitalize ${
                      viewType === view
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#252525]'
                    }`}
                  >
                    {view === 'jour' ? '📅' : view === 'semaine' ? '📆' : view === 'mois' ? '📋' : '📊'} {view}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (viewType === 'jour') newDate.setDate(newDate.getDate() - 1);
                    else if (viewType === 'semaine') newDate.setDate(newDate.getDate() - 7);
                    else if (viewType === 'mois') newDate.setMonth(newDate.getMonth() - 1);
                    else if (viewType === 'annee') newDate.setFullYear(newDate.getFullYear() - 1);
                    setCurrentDate(newDate);
                  }}
                  className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-all"
                >
                  <ChevronLeft className="text-white" />
                </button>

                <div className="text-white font-bold min-w-40 text-center">
                  {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </div>

                <button
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (viewType === 'jour') newDate.setDate(newDate.getDate() + 1);
                    else if (viewType === 'semaine') newDate.setDate(newDate.getDate() + 7);
                    else if (viewType === 'mois') newDate.setMonth(newDate.getMonth() + 1);
                    else if (viewType === 'annee') newDate.setFullYear(newDate.getFullYear() + 1);
                    setCurrentDate(newDate);
                  }}
                  className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-all"
                >
                  <ChevronRight className="text-white" />
                </button>
              </div>
            </div>

            {/* Affichage selon la vue */}
            {viewType === 'jour' && renderViewJour()}
            {viewType === 'semaine' && renderViewSemaine()}
            {viewType === 'mois' && renderViewMois()}
            {viewType === 'annee' && renderViewAnnee()}
          </div>
        )}

        {/* IDENTIFIANTS */}
        {activeTab === 'identifiants' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-green-400">🔑 Mes Identifiants</h2>
              <button
                onClick={() => setShowAddIdentifiant(!showAddIdentifiant)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
              >
                <Plus size={20} />
                Ajouter
              </button>
            </div>

            {showAddIdentifiant && (
              <div className="bg-[#1a1a1a] border-2 border-green-600 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">{editingId ? '✏️ Modifier' : '➕ Ajouter'} un identifiant</h3>
                <input
                  type="text"
                  placeholder="Nom du site"
                  value={newIdentifiant.nom_site}
                  onChange={e => setNewIdentifiant({ ...newIdentifiant, nom_site: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newIdentifiant.email}
                  onChange={e => setNewIdentifiant({ ...newIdentifiant, email: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder={editingId ? "Mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
                  value={newIdentifiant.password}
                  onChange={e => setNewIdentifiant({ ...newIdentifiant, password: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-white"
                />
                <input
                  type="url"
                  placeholder="URL (optionnel)"
                  value={newIdentifiant.url}
                  onChange={e => setNewIdentifiant({ ...newIdentifiant, url: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-white"
                />
                <textarea
                  placeholder="Notes (optionnel)"
                  value={newIdentifiant.notes}
                  onChange={e => setNewIdentifiant({ ...newIdentifiant, notes: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-3 py-2 text-white resize-none h-20"
                />
                <div className="flex gap-3">
                  <button
                    onClick={editingId ? handleUpdateIdentifiant : handleSaveIdentifiant}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    {editingId ? 'Mettre à jour' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddIdentifiant(false);
                      setEditingId(null);
                      setNewIdentifiant({ nom_site: '', email: '', password: '', url: '', notes: '', categorie: 'Autre' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {identifiants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Aucun identifiant sauvegardé</p>
                <p className="text-gray-500 text-sm mt-2">Clique sur "Ajouter" pour en créer un</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {identifiants.map(id => (
                  <div key={id.id} className="bg-[#1a1a1a] border-2 border-green-700/50 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-green-400">{id.nom_site}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditIdentifiant(id)}
                          className="p-2 hover:bg-blue-600/50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteIdentifiant(id.id)}
                          className="p-2 hover:bg-red-600/50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={20} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-400">Email</p>
                        <p className="text-white font-mono">{id.email}</p>
                      </div>

                      <div>
                        <p className="text-gray-400">Mot de passe</p>
                        <div className="flex gap-2 items-center">
                          <p className="text-white font-mono flex-1 text-sm break-all">
                            {showPasswords[id.id] ? decryptedPasswords[id.id] || '••••••••' : '••••••••'}
                          </p>
                          <button
                            onClick={() => toggleShowPassword(id.id, id.password_encrypted)}
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all whitespace-nowrap"
                          >
                            {showPasswords[id.id] ? '🙈 Masquer' : '👁️ Voir'}
                          </button>
                          <button
                            onClick={() => copyPassword(id.id, id.password_encrypted)}
                            className={`px-3 py-1 text-xs text-white rounded font-bold transition-all whitespace-nowrap ${copiedId === id.id ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}`}
                          >
                            {copiedId === id.id ? '✅ Copié!' : '📋 Copier'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOTES */}
        {activeTab === 'notes' && (
          <div>
            <div className="bg-[#1a1a1a] border-2 border-yellow-600 rounded-xl p-8 h-96">
              <textarea
                value={notes?.contenu || ''}
                onChange={e => handleUpdateNotes(e.target.value)}
                placeholder="📝 Écris tes notes ici..."
                className="w-full h-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-yellow-600"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
