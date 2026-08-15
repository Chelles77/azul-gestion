'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Calendar, Clock, User } from 'lucide-react';

interface Appointment {
  id: string;
  titre: string;
  avec_qui: string;
  date_heure: string;
  description?: string;
}

export default function AppointmentCard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data } = await supabase
          .from('rendez_vous')
          .select('*')
          .eq('user_id', user.id)
          .gte('date_heure', today.toISOString())
          .lt('date_heure', tomorrow.toISOString())
          .order('date_heure', { ascending: true });

        setAppointments(data || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, []);

  const calculateTimeLeft = (appointmentTime: string): string => {
    const apt = new Date(appointmentTime);
    const now = currentTime;
    const diff = apt.getTime() - now.getTime();

    if (diff < 0) return 'Passé';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${minutes}min`;
    return `${hours}h ${minutes}min`;
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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Calendar size={20} className="text-blue-400" />
        </div>
        <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">Agenda du jour</span>
      </div>

      <div className="mb-6 p-4 bg-[#0a0a0a] border border-gray-700 rounded-lg">
        <p className="text-sm text-gray-300 mb-2">
          <span className="font-semibold text-white">{greeting}</span> Aujourd'hui <span className="text-blue-300 font-semibold">{today}</span> il est <span className="text-blue-300 font-semibold">{time}</span>
        </p>

        {loading ? (
          <p className="text-xs text-gray-500 mt-3">Chargement des rendez-vous...</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-emerald-400 mt-3">✅ Vous n'avez rien de prévu aujourd'hui</p>
        ) : (
          <div className="mt-4 space-y-3">
            {appointments.map((apt, index) => (
              <div key={apt.id} className="bg-[#1a1a1a] border border-gray-600 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                      {new Date(apt.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-semibold text-white">{apt.titre}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    calculateTimeLeft(apt.date_heure).includes('Passé')
                      ? 'text-gray-400 bg-gray-800/30'
                      : 'text-yellow-300 bg-yellow-900/30'
                  }`}>
                    dans {calculateTimeLeft(apt.date_heure)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <User size={14} />
                  <span>avec {apt.avec_qui}</span>
                </div>
                {apt.description && (
                  <p className="text-xs text-gray-500 mt-2">📝 {apt.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
