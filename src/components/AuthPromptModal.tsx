import React from 'react';
import { Cloud, Heart, Headphones, X, LogIn } from 'lucide-react';

interface AuthPromptModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  open,
  onClose,
  onConnect,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-prompt-title"
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl border border-emerald-500/25 bg-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.55)] animate-[slide-up_0.28s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.18),transparent_50%)] pointer-events-none" />

        <div className="relative px-5 pt-4 pb-5">
          <div className="flex justify-center sm:hidden mb-3">
            <span className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                <Cloud className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Compte Quranify
                </p>
                <h2 id="auth-prompt-title" className="text-lg font-black text-slate-100 leading-tight">
                  Gardez vos favoris et votre lecture
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100 tap-feedback"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Connectez-vous pour sauvegarder vos récitateurs préférés et reprendre
            l&apos;écoute exactement où vous vous êtes arrêté, sur tous vos appareils.
          </p>

          <ul className="mt-4 space-y-2.5">
            <li className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
                <Heart className="h-3.5 w-3.5" />
              </span>
              Favoris synchronisés dans le cloud
            </li>
            <li className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <Headphones className="h-3.5 w-3.5" />
              </span>
              Reprise automatique de votre dernière sourate
            </li>
          </ul>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onConnect}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 tap-feedback"
            >
              <LogIn className="h-4 w-4" />
              Se connecter
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm font-bold text-slate-300 hover:text-slate-100 tap-feedback"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
