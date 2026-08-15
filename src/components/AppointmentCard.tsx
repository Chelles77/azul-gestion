'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface Activite {
  id: string;
  titre: string;
  heure_debut: string;
  heure_fin: string;
  description?: string;
  date_jour: string;
  categorie: string;
  statut: string;
}

export default function AppointmentCard() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activite[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const today = new Date();
        const dateStr = today.getFullYear() + '-' +
          String(today.getMonth() + 1).padStart(2, '0') + '-' +
          String(today.getDate()).padStart(2, '0');

        const { data } = await supabase
          .from('activites')
          .select('*')
          .eq('user_id', user.id)
          .eq('date_jour', dateStr)
          .order('heure_debut', { ascending: true });

        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const calculateTimeLeft = (heureDebut: string): string => {
    const [hours, minutes] = heureDebut.split(':').map(Number);
    const apt = new Date();
    apt.setHours(hours, minutes, 0);

    const now = currentTime;
    const diff = apt.getTime() - now.getTime();

    if (diff < 0) return 'Passé';

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (h === 0) return `${m}min`;
    return `${h}h ${m}min`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const formatTime = (time: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(time);
  };

  const greeting = `Bonjour,`;
  const today = formatDate(currentTime);
  const time = formatTime(currentTime);

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-6 rounded-xl border border-blue-700 shadow-lg col-span-full mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Calendar size={20} className="text-blue-400" />
          </div>
          <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">Agenda du jour</span>
        </div>
        <button
          onClick={() => router.push('/organisateur')}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 hover:bg-blue-900/20 rounded transition-all"
        >
          Voir agenda <ArrowRight size={12} />
        </button>
      </div>

      <div className="mb-6 p-4 bg-[#0a0a0a] border border-gray-700 rounded-lg">
        <p className="text-sm text-gray-300 mb-2">
          <span className="font-semibold text-white">{greeting}</span> Aujourd'hui <span className="text-blue-300 font-semibold">{today}</span> il est <span className="text-blue-300 font-semibold">{time}</span>
        </p>

        {loading ? (
          <p className="text-xs text-gray-500 mt-3">Chargement des activités...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-emerald-400 mt-3">✅ Vous n'avez rien de prévu aujourd'hui</p>
        ) : (
          <div className="mt-4 space-y-3">
            {activities.map((act) => (
              <div key={act.id} className="bg-[#1a1a1a] border border-gray-600 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                      {act.heure_debut} → {act.heure_fin}
                    </span>
                    <span className="font-semibold text-white">{act.titre}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      act.categorie === 'Travail'
                        ? 'bg-blue-900/30 text-blue-300'
                        : 'bg-pink-900/30 text-pink-300'
                    }`}>
                      {act.categorie}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    calculateTimeLeft(act.heure_debut).includes('Passé')
                      ? 'text-gray-400 bg-gray-800/30'
                      : 'text-yellow-300 bg-yellow-900/30'
                  }`}>
                    dans {calculateTimeLeft(act.heure_debut)}
                  </span>
                </div>
                {act.description && (
                  <p className="text-xs text-gray-500 mt-2">📝 {act.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
