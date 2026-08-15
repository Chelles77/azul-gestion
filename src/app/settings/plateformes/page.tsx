'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

interface Plateforme {
  id: string;
  nom: string;
  couleur: string;
  icone: string;
}

export default function PlateformesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [plateformes, setPlateformes] = useState<Plateforme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nom: '', couleur: '#3b82f6', icone: '📱' });

  useEffect(() => {
    fetchPlateformes();
  }, []);

  async function fetchPlateformes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('plateformes')
      .select('*')
      .eq('user_id', user.id)
      .order('nom', { ascending: true });

    setPlateformes(data || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!formData.nom.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('plateformes')
      .insert([{ ...formData, user_id: user.id }]);

    if (!error) {
      setFormData({ nom: '', couleur: '#3b82f6', icone: '📱' });
      setIsAdding(false);
      fetchPlateformes();
    } else {
      alert('Erreur: ' + error.message);
    }
  }

  async function handleUpdate(id: string) {
    if (!formData.nom.trim()) return;

    const { error } = await supabase
      .from('plateformes')
      .update({ nom: formData.nom, couleur: formData.couleur, icone: formData.icone })
      .eq('id', id);

    if (!error) {
      setFormData({ nom: '', couleur: '#3b82f6', icone: '📱' });
      setEditingId(null);
      fetchPlateformes();
    } else {
      alert('Erreur: ' + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer cette plateforme?')) return;

    const { error } = await supabase
      .from('plateformes')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchPlateformes();
    } else {
      alert('Erreur: ' + error.message);
    }
  }

  function startEdit(plat: Plateforme) {
    setEditingId(plat.id);
    setFormData({ nom: plat.nom, couleur: plat.couleur, icone: plat.icone });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({ nom: '', couleur: '#3b82f6', icone: '📱' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gérer les Plateformes</h1>
          <p className="text-gray-400">Ajouter, modifier ou supprimer vos plateformes de vente</p>
        </div>

        {/* Formulaire Ajouter */}
        {isAdding && (
          <div className="bg-[#1a1a1a] border border-blue-700 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Nouvelle Plateforme</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="ex: Shopify"
                  className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Couleur</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.couleur}
                      onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.couleur}
                      onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                      className="flex-1 bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Icone</label>
                  <input
                    type="text"
                    value={formData.icone}
                    onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                    maxLength={2}
                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white text-center text-xl"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Check size={18} /> Ajouter
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <X size={18} /> Annuler
              </button>
            </div>
          </div>
        )}

        {/* Liste des plateformes */}
        <div className="space-y-3 mb-8">
          {plateformes.length > 0 ? (
            plateformes.map((plat) => (
              <div key={plat.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all">
                {editingId === plat.id ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Nom</label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Couleur</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={formData.couleur}
                              onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                              className="w-12 h-10 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.couleur}
                              onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                              className="flex-1 bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Icone</label>
                          <input
                            type="text"
                            value={formData.icone}
                            onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                            maxLength={2}
                            className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white text-center text-xl"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleUpdate(plat.id)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <Check size={18} /> Sauvegarder
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <X size={18} /> Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{plat.icone}</div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{plat.nom}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-6 h-6 rounded-lg border border-gray-600"
                            style={{ backgroundColor: plat.couleur }}
                          ></div>
                          <span className="text-sm text-gray-400">{plat.couleur}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(plat)}
                        className="p-2 bg-[#252525] hover:bg-[#333] text-blue-400 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(plat.id)}
                        className="p-2 bg-[#252525] hover:bg-red-900/20 text-red-400 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-gray-800">
              <p className="text-gray-400">Aucune plateforme. Ajoutes-en une!</p>
            </div>
          )}
        </div>

        {/* Bouton Ajouter */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Ajouter une Plateforme
          </button>
        )}
      </div>
    </div>
  );
}
