import React, { useState } from 'react';
import { LogIn, LogOut, UserPlus, Mail, Lock, User, ShieldCheck, Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccountPanel: React.FC = () => {
  const {
    configured,
    loading,
    user,
    profile,
    authError,
    signIn,
    signUp,
    signOut,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  if (!configured) {
    return (
      <div className="glass-panel rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h3 className="font-bold text-slate-100">Compte cloud indisponible</h3>
        <p className="mt-2 text-sm text-slate-400">
          Ajoutez <code className="text-amber-300">VITE_SUPABASE_URL</code> et{' '}
          <code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code> dans{' '}
          <code className="text-slate-300">.env.local</code> puis relancez le serveur.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="shimmer-loader h-40 rounded-3xl border border-slate-900" />;
  }

  if (user) {
    return (
      <div className="flex flex-col gap-4">
        <section className="glass-panel rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Connecté</p>
              <h3 className="mt-1 text-lg font-black text-slate-100 truncate">
                {profile?.display_name || 'Compte Quranify'}
              </h3>
              <p className="mt-1 text-sm text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
              Favoris synchronisés dans le cloud
            </li>
            <li className="flex items-center gap-2">
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
              Reprise d&apos;écoute sauvegardée automatiquement
            </li>
          </ul>

          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-xs font-bold text-slate-200 hover:border-rose-400/40 hover:text-rose-300 tap-feedback"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </section>
      </div>
    );
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setInfo(null);
    clearAuthError();

    if (mode === 'signin') {
      const result = await signIn(email.trim(), password);
      setBusy(false);
      if (result.message) setInfo(result.message);
      return;
    }

    const result = await signUp(email.trim(), password, displayName.trim());
    setBusy(false);

    // Compte déjà existant → bascule vers Connexion
    if (!result.ok && /existe déjà|already registered/i.test(result.message || '')) {
      setMode('signin');
      setInfo('Ce compte existe déjà (peut-être via GoMuslimLife.com). Utilisez « Se connecter ».');
      return;
    }

    if (result.message) setInfo(result.message);
  };

  return (
    <div className="glass-panel rounded-3xl border border-slate-800/80 p-5">
      <div className="flex items-center gap-2 mb-1">
        {mode === 'signin' ? (
          <LogIn className="h-4 w-4 text-emerald-400" />
        ) : (
          <UserPlus className="h-4 w-4 text-emerald-400" />
        )}
        <h3 className="text-lg font-black text-slate-100">
          {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-5">
        {mode === 'signin'
          ? 'Utilisez le même e-mail / mot de passe que GoMuslimLife.com si vous avez déjà un compte.'
          : 'Créez un compte, ou connectez-vous si vous êtes déjà inscrit sur GoMuslimLife.com.'}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            clearAuthError();
            setInfo(null);
          }}
          className={`rounded-xl border px-3 py-2 text-xs font-bold ${
            mode === 'signin'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-800 text-slate-400'
          }`}
        >
          Se connecter
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            clearAuthError();
            setInfo(null);
          }}
          className={`rounded-xl border px-3 py-2 text-xs font-bold ${
            mode === 'signup'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-800 text-slate-400'
          }`}
        >
          S&apos;inscrire
        </button>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {mode === 'signup' && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pseudo</span>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex. Ahmed"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/70 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500/40 focus:outline-none"
              />
            </div>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-mail</span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@email.com"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/70 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500/40 focus:outline-none"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mot de passe</span>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/70 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500/40 focus:outline-none"
            />
          </div>
        </label>

        {(authError || info) && (
          <p className={`text-xs rounded-xl border px-3 py-2 ${authError ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
            {authError || info}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-60 tap-feedback"
        >
          {busy ? 'Patientez…' : mode === 'signin' ? 'Connexion' : 'Créer mon compte'}
        </button>
      </form>
    </div>
  );
};
