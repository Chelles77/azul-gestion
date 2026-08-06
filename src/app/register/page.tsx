'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: companyName }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        alert("Compte créé avec succès ! Connectez-vous maintenant.");
        router.push('/login');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
      <div className="w-full max-w-md bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-800 p-8">
        
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AZUL GESTION</h1>
          <p className="text-gray-400 text-sm">Créer votre espace professionnel</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleRegister} className="space-y-5">
          
          {/* Nom Société */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Nom de la société</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ex: Ma Société SARL"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required 
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Email professionnel</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Mot de passe</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required 
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Bouton S'inscrire */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Création en cours...
              </span>
            ) : (
              "S'inscrire"
            )}
          </button>

        </form>

        {/* Lien Connexion */}
        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            Déjà un compte ?{' '}
            <a href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
              Se connecter
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}