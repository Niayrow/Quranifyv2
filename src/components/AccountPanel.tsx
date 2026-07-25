import React, { useState } from 'react';
import {
  LogIn, LogOut, UserPlus, Mail, Lock, User, ShieldCheck, Cloud,
  Heart, MonitorSmartphone, SlidersHorizontal, ExternalLink,
} from 'lucide-react';
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
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
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
    const initial = (profile?.display_name || user.email || 'Q').trim().charAt(0).toUpperCase();

    return (
      <div className="flex flex-col gap-4 pb-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#0a1220_0%,#0f172a_45%,#0a1628_100%)]" aria-hidden="true" />
          <div className="absolute -top-14 -right-10 h-36 w-36 rounded-full bg-slate-500/15 blur-3xl" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/25 to-transparent" aria-hidden="true" />

          <div className="relative z-10 p-5 sm:p-6">
            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-lg font-black text-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Connecté
                </p>
                <h3 className="mt-1 text-lg font-black text-white truncate">
                  {profile?.display_name || 'Compte Quranify'}
                </h3>
                <p className="mt-0.5 text-sm text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <ul className="mt-5 grid gap-2">
              {[
                { icon: Heart, label: 'Favoris synchronisés' },
                { icon: MonitorSmartphone, label: 'Lecture multi-appareils' },
                { icon: SlidersHorizontal, label: 'Préférences & boucle cloud' },
                { icon: Cloud, label: 'Reprise d’écoute auto' },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs text-slate-300"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500/15 text-slate-300">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            <a
              href="https://gomuslimlife.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-slate-100 hover:border-white/20 hover:bg-white/[0.04] transition-all"
            >
              Ouvrir GoMuslimLife.com
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>

            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/15 transition-colors tap-feedback"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
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

    if (!result.ok && /existe déjà|already registered/i.test(result.message || '')) {
      setMode('signin');
      setInfo('Ce compte existe déjà (peut-être via GoMuslimLife.com). Utilisez « Se connecter ».');
      return;
    }

    if (result.message) setInfo(result.message);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] pb-2 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#0a1220_0%,#0f172a_55%,#0a1628_100%)]" aria-hidden="true" />
      <div className="absolute -top-12 -left-8 h-32 w-32 rounded-full bg-slate-500/15 blur-3xl" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/25 to-transparent" aria-hidden="true" />

      <div className="relative z-10 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          {mode === 'signin' ? (
            <LogIn className="h-4 w-4 text-slate-300" />
          ) : (
            <UserPlus className="h-4 w-4 text-slate-300" />
          )}
          <h3 className="text-lg font-black text-white">
            {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          {mode === 'signin'
            ? 'Utilisez le même e-mail / mot de passe que GoMuslimLife.com si vous avez déjà un compte.'
            : 'Créez un compte, ou connectez-vous si vous êtes déjà inscrit sur GoMuslimLife.com.'}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.08] bg-black/20 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              clearAuthError();
              setInfo(null);
            }}
            className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
              mode === 'signin'
                ? 'bg-slate-200 text-slate-950 shadow-[0_4px_14px_rgba(0,0,0,0.25)]'
                : 'text-slate-400 hover:text-slate-200'
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
            className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
              mode === 'signup'
                ? 'bg-slate-200 text-slate-950 shadow-[0_4px_14px_rgba(0,0,0,0.25)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            S&apos;inscrire
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pseudo</span>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex. Ahmed"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400/40 focus:outline-none"
                />
              </div>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">E-mail</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400/40 focus:outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mot de passe</span>
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
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400/40 focus:outline-none"
              />
            </div>
          </label>

          {(authError || info) && (
            <p
              className={`text-xs rounded-xl border px-3 py-2 ${
                authError
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {authError || info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-2xl bg-gradient-to-b from-slate-200 to-slate-300 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:from-white hover:to-slate-200 disabled:opacity-60 tap-feedback"
          >
            {busy ? 'Patientez…' : mode === 'signin' ? 'Connexion' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
};
