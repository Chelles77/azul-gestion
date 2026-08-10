'use client';

import { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

export default function SetupPage() {
  const [copied, setCopied] = useState(false);

  const sqlQuery = `CREATE TABLE IF NOT EXISTS collaborateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  collaborateur_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'collaborateur',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE collaborateurs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own collaborators" ON collaborateurs;
CREATE POLICY "Users can see their own collaborators" ON collaborateurs
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert collaborators" ON collaborateurs;
CREATE POLICY "Users can insert collaborators" ON collaborateurs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete collaborators" ON collaborateurs;
CREATE POLICY "Users can delete collaborators" ON collaborateurs
  FOR DELETE USING (owner_id = auth.uid());`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Configuration Supabase</h1>

        <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">1️⃣ Accédez à Supabase Dashboard</h2>
            <p className="text-gray-400">
              Allez sur <a href="https://supabase.com" target="_blank" className="text-blue-400 hover:text-blue-300">supabase.com</a> et connectez-vous à votre projet
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">2️⃣ Ouvrez SQL Editor</h2>
            <p className="text-gray-400">
              Dans le menu de gauche, cliquez sur <strong>SQL Editor</strong> → <strong>New Query</strong>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">3️⃣ Copiez et collez ce SQL</h2>
            <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-sm overflow-x-auto mb-3 border border-gray-700">
              <pre className="text-gray-300">{sqlQuery}</pre>
            </div>
            <button
              onClick={handleCopy}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
            >
              {copied ? (
                <>
                  <CheckCircle size={18} /> Copié!
                </>
              ) : (
                <>
                  <Copy size={18} /> Copier le SQL
                </>
              )}
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">4️⃣ Exécutez la requête</h2>
            <p className="text-gray-400">
              Collez le code dans Supabase SQL Editor et cliquez sur <strong>Run</strong> (bouton bleu en haut à droite)
            </p>
          </div>

          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <p className="text-green-300">
              ✅ Une fois fait, la table <strong>collaborateurs</strong> sera créée et vous pourrez inviter des collaborateurs!
            </p>
          </div>
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            💡 <strong>Note:</strong> Cette table stocke les collaborateurs de votre app. Elle a des permissions RLS (Row Level Security) pour la sécurité.
          </p>
        </div>
      </div>
    </div>
  );
}
