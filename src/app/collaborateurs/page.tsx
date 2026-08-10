'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Users, Plus, Trash2, Mail, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CollaborateursPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [collaborateurs, setCollaborateurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);
      await loadCollaborateurs(user.id);
    } finally {
      setLoading(false);
    }
  };

  const loadCollaborateurs = async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('collaborateurs')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    setCollaborateurs(data || []);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();

      // Créer un nouvel utilisateur collaborateur
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-12), // Mot de passe temporaire
      });

      if (signupError) throw signupError;

      // Ajouter à la table collaborateurs
      if (data.user) {
        const { error: insertError } = await supabase
          .from('collaborateurs')
          .insert({
            owner_id: user.id,
            collaborateur_id: data.user.id,
            email,
            status: 'pending',
            role: 'collaborateur'
          });

        if (insertError) throw insertError;

        setSuccess(`Invitation envoyée à ${email}! Un email de confirmation a été envoyé.`);
        setEmail('');
        await loadCollaborateurs(user.id);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (collaborateurId: string) => {
    if (!window.confirm('Confirmer la suppression de ce collaborateur?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('collaborateurs')
        .delete()
        .eq('collaborateur_id', collaborateurId)
        .eq('owner_id', user.id);

      if (error) throw error;

      await loadCollaborateurs(user.id);
      setSuccess('Collaborateur supprimé');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users size={32} className="text-blue-500" />
            <h1 className="text-3xl font-bold">Collaborateurs</h1>
          </div>
          <p className="text-gray-400">Gérez les accès à votre application</p>
        </div>

        {/* Invite Form */}
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Inviter un collaborateur</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="flex-1 bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                required
              />
              <button
                type="submit"
                disabled={inviting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {inviting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <Plus size={20} /> Inviter
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-800">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-400 text-sm bg-green-900/20 p-3 rounded border border-green-800">
                ✅ {success}
              </p>
            )}
          </form>
        </div>

        {/* Collaborateurs List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold mb-4">Collaborateurs actifs</h2>

          {collaborateurs.length === 0 ? (
            <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-8 text-center">
              <Users size={48} className="mx-auto text-gray-600 mb-4 opacity-50" />
              <p className="text-gray-400">Aucun collaborateur encore</p>
              <p className="text-sm text-gray-500 mt-2">Invitez des collaborateurs pour qu'ils puissent accéder à l'app</p>
            </div>
          ) : (
            collaborateurs.map((collab) => (
              <div
                key={collab.collaborateur_id}
                className="bg-[#1e1e1e] rounded-lg border border-gray-800 p-4 flex items-center justify-between hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <Mail size={20} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{collab.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{collab.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {collab.status === 'active' ? (
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle size={16} /> Actif
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Clock size={16} /> En attente
                    </div>
                  )}

                  <button
                    onClick={() => handleRemove(collab.collaborateur_id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            💡 <strong>Infos:</strong> Les collaborateurs reçoivent un email d'invitation. Une fois connectés, ils peuvent modifier les produits, les lots et les statuts. Vous pouvez les retirer à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
}
