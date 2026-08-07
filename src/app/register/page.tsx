'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Efface l'erreur quand l'utilisateur tape
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.companyName,
            company_name: formData.companyName
          }
        }
      });

      if (error) {
        // Gestion des erreurs spécifiques Supabase
        if (error.message.includes('User already registered')) {
          setError('Cet email est déjà utilisé. Essayez de vous connecter.');
        } else if (error.message.includes('Password should be at least')) {
          setError('Le mot de passe doit contenir au moins 6 caractères.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        // Si confirmation email requise
        if (data.user.identities && data.user.identities.length === 0) {
          setError('Un email de confirmation a été envoyé. Vérifiez votre boîte mail.');
        } else {
          router.push('/');
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      if (err.message.includes('fetch') || err.message.includes('network')) {
        setError('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      } else {
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e1e1e] rounded-2xl border border-gray-800 p-8 shadow-2xl">
        
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AZUL GESTION</h1>
          <p className="text-gray-400 text-sm">Créer votre espace professionnel</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Nom société */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nom de la société</label>
            <input
              type="text"
              name="companyName"
              required
              placeholder="Ex: Driss Trading"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email professionnel</label>
            <input
              type="email"
              name="email"
              required
              placeholder="nom@exemple.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Mot de passe avec IL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                aria-label={showPassword ? 'Cacher le mot de passe' : 'Voir le mot de passe'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Minimum 6 caractères requis</p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Bouton S'inscrire */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Inscription en cours...
              </span>
            ) : (
              "S'inscrire"
            )}
          </button>

          {/* Lien Connexion */}
          <p className="text-center text-sm text-gray-400 pt-2">
            Déjà un compte ?{' '}
            <button 
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4 transition-colors"
            >
              Se connecter
            </button>
          </p>

        </form>
      </div>
    </div>
  );
}