'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Plus, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

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

const COULEURS_CATEGORIE: Record<string, string> = {
  'Travail': '#3b82f6',
  'Perso': '#ec4899',
};

export default function Organisateur() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    titre: '',
    categorie: 'Travail' as const,
    heure_debut: '09:00',
    heure_fin: '10:00',
    priorite: 3,
  });

  const calculateDuration = (debut: string, fin: string) => {
    const [hd, md] = debut.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    const mins = (hf * 60 + mf) - (hd * 60 + md);
    const heures = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${heures}h${minutes > 0 ? minutes + 'm' : ''}`;
  };

  const fetchActivites = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('activites')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_jour', today)
        .order('heure_debut', { ascending: true });

      setActivites(data as Activite[] || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddActivite = async () => {
    try {
      if (!formData.titre || !formData.heure_debut || !formData.heure_fin) return;

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      await supabase.from('activites').insert({
        user_id: user.id,
        ...formData,
        couleur: COULEURS_CATEGORIE[formData.categorie],
        date_jour: new Date().toISOString().split('T')[0],
      });

      setFormData({ titre: '', categorie: 'Travail', heure_debut: '09:00', heure_fin: '10:00', priorite: 3 });
      setShowForm(false);
      await fetchActivites();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteActivite = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase.from('activites').delete().eq('id', id);
      await fetchActivites();
    } catch (error) {
      console.error(error);
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

        await fetchActivites();
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
      {/* Header Époustouflant */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-2">⏱️ Métronome</h1>
              <p className="text-blue-100 text-lg">Ton jour parfait en une vue</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-2xl"
            >
              <Plus size={24} /> Ajouter
            </button>
          </div>

          {/* Stats brillantes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <p className="text-white/80 text-sm mb-2">⏰ Travail planifié</p>
              <p className="text-3xl font-bold text-white">
                {Math.floor((tempsParCategorie['Travail'] || 0) / 60)}h
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <p className="text-white/80 text-sm mb-2">🎮 Perso planifié</p>
              <p className="text-3xl font-bold text-white">
                {Math.floor((tempsParCategorie['Perso'] || 0) / 60)}h
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <p className="text-white/80 text-sm mb-2">📋 Activités du jour</p>
              <p className="text-3xl font-bold text-white">{activites.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-[#1a1a1a] border-b-2 border-purple-600">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <input
                type="text"
                placeholder="Titre activité"
                value={formData.titre}
                onChange={e => setFormData({ ...formData, titre: e.target.value })}
                className="md:col-span-2 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
              />
              <select
                value={formData.categorie}
                onChange={e => setFormData({ ...formData, categorie: e.target.value as any })}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option>Travail</option>
                <option>Perso</option>
              </select>
              <input
                type="time"
                value={formData.heure_debut}
                onChange={e => setFormData({ ...formData, heure_debut: e.target.value })}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <input
                type="time"
                value={formData.heure_fin}
                onChange={e => setFormData({ ...formData, heure_fin: e.target.value })}
                className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddActivite}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
                >
                  ✅ Ajouter
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline époustouflante */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-16 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>

          {/* Curseur temps réel */}
          {currentPercent < 100 && (
            <div
              style={{ top: `${currentPercent * 8}px` }}
              className="absolute left-0 right-0 h-1 bg-green-400 z-50 shadow-lg"
            >
              <div className="absolute left-0 w-20 h-4 bg-green-400 rounded-full -top-1.5 shadow-lg"></div>
            </div>
          )}

          {/* Heures */}
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="ml-40 mb-20 relative">
              <div className="absolute -left-24 top-0 w-20 text-right">
                <div className="text-3xl font-bold text-blue-400">{String(i).padStart(2, '0')}h</div>
                <div className="text-xs text-gray-500">
                  {i === 0 ? '🌙 Minuit' : i === 6 ? '🌅 Aube' : i === 12 ? '☀️ Midi' : i === 18 ? '🌆 Soir' : ''}
                </div>
              </div>

              {/* Ligne tiret */}
              <div className="absolute -left-2 top-2 w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="h-px bg-gradient-to-r from-gray-700 to-transparent"></div>

              {/* Activités pour cette heure */}
              <div className="space-y-3 mt-4">
                {activites
                  .filter(a => {
                    const [hd] = a.heure_debut.split(':').map(Number);
                    return hd === i;
                  })
                  .map(activite => (
                    <div
                      key={activite.id}
                      className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-2xl cursor-pointer group backdrop-blur-sm ${
                        activite.statut === 'terminee'
                          ? 'opacity-50 bg-gray-800 border-gray-700'
                          : `bg-opacity-20 border-opacity-50 hover:border-opacity-100 hover:shadow-lg`
                      }`}
                      style={{
                        backgroundColor: `${activite.couleur}20`,
                        borderColor: activite.couleur,
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-white text-lg">{activite.titre}</h3>
                            <span className="text-xs px-2 py-1 bg-white/10 rounded-full" style={{ color: activite.couleur }}>
                              {activite.categorie}
                            </span>
                            {activite.priorite >= 4 && (
                              <AlertCircle size={16} className="text-red-500" />
                            )}
                          </div>
                          <div className="flex gap-3 text-sm text-gray-300">
                            <span>⏱️ {activite.heure_debut} - {activite.heure_fin}</span>
                            <span>({calculateDuration(activite.heure_debut, activite.heure_fin)})</span>
                          </div>
                          {activite.description && (
                            <p className="text-gray-400 text-sm mt-2">{activite.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteActivite(activite.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2 hover:bg-red-600/50 rounded-lg"
                        >
                          <X size={18} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
