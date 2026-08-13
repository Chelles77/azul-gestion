'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface SelectWithAddProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onAddOption: (value: string) => void;
  table: string;
}

export default function SelectWithAdd({
  label,
  value,
  onChange,
  options,
  onAddOption,
  table,
}: SelectWithAddProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!newValue.trim()) {
      setError('La valeur ne peut pas être vide');
      return;
    }

    if (options.includes(newValue)) {
      setError('Cette valeur existe déjà');
      return;
    }

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setError('Non authentifié');
      return;
    }

    const { error: insertError } = await supabase.from(table).insert([{
      nom: newValue,
      user_id: userData.user.id
    }]);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onAddOption(newValue);
    onChange(newValue);
    setNewValue('');
    setIsAdding(false);
    setError('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      {!isAdding ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
          >
            <option value="">Sélectionner...</option>
            {options.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            +
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={e => {
              setNewValue(e.target.value);
              setError('');
            }}
            placeholder="Nouvelle valeur..."
            autoFocus
            className="flex-1 bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewValue('');
              setError('');
            }}
            className="px-4 py-3 bg-[#252525] hover:bg-[#333] border border-gray-700 text-gray-300 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  );
}
