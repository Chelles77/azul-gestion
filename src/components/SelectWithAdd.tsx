'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface SelectWithAddProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onAddOption: (option: string) => void;
  table: 'marques' | 'categories' | 'etat_produit' | 'etat_emballage';
}

export default function SelectWithAdd({ label, value, onChange, options, onAddOption, table }: SelectWithAddProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddNew = async () => {
    if (!inputValue.trim()) {
      setError('Veuillez entrer une valeur');
      return;
    }

    if (options.includes(inputValue.trim())) {
      setError('Cette valeur existe déjà');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const { error: insertError } = await supabase.from(table).insert([
        {
          user_id: userData.user.id,
          nom: inputValue.trim(),
        },
      ]);

      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          setError('Cette valeur existe déjà');
        } else {
          throw insertError;
        }
      } else {
        onAddOption(inputValue.trim());
        onChange(inputValue.trim());
        setInputValue('');
        setIsAdding(false);
        setError('');
        setIsOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>

      <div className="relative">
        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none flex justify-between items-center"
        >
          <span>{value || 'Sélectionner...'}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#252525] border border-gray-700 rounded-lg shadow-lg z-50">
            {/* Search Input */}
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Chercher..."
              className="w-full bg-[#1a1a1a] border-b border-gray-700 px-4 py-2 text-white outline-none focus:ring-0"
            />

            {/* Options List */}
            <div className="max-h-40 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setInputValue('');
                      setError('');
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-[#333] transition-colors ${
                      value === option ? 'bg-blue-600/30 text-blue-400' : 'text-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))
              ) : inputValue ? (
                <div className="px-4 py-2 text-gray-500 text-sm">Aucune correspondance</div>
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">Tapez pour chercher...</div>
              )}
            </div>

            {/* Add New Button */}
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="w-full border-t border-gray-700 px-4 py-2 text-blue-400 hover:bg-[#333] flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Ajouter "{inputValue || 'nouvelle'}"
            </button>

            {/* Add New Form */}
            {isAdding && (
              <div className="border-t border-gray-700 p-3 space-y-2 bg-[#1a1a1a]">
                <div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => {
                      setInputValue(e.target.value);
                      setError('');
                    }}
                    placeholder="Nouvelle valeur..."
                    className="w-full bg-[#252525] border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setError('');
                    }}
                    className="flex-1 px-3 py-2 bg-[#252525] border border-gray-700 rounded text-gray-300 hover:bg-[#333] text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNew}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded text-white font-bold text-sm flex items-center justify-center gap-1"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Ajout...
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Ajouter
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
