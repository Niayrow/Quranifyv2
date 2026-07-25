import React from 'react';
import { Compass, Cloud, HardDrive, Headphones, Shield, Sparkles, Trash2, Wifi } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

const APP_VERSION = '1.0.1';

export const AboutPanel: React.FC = () => {
  const { cacheInfo, clearCache } = useAudio();

  const handleClear = async () => {
    if (confirm('Voulez-vous supprimer toutes les sourates téléchargées pour l\'écoute hors-ligne ?')) {
      await clearCache();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />

        <div className="border-b border-slate-900 pb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            À propos de Quranify
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Lecteur coranique simple et rapide : choisissez un récitateur, une sourate, et écoutez —
            sur mobile comme sur ordinateur. Version {APP_VERSION}.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Headphones className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Écoute en streaming</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Des centaines de récitateurs et riwayates, reprise automatique de la lecture,
                contrôles depuis l’écran de verrouillage et les notifications.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <HardDrive className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Mode hors-ligne</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Téléchargez des sourates pour les écouter sans connexion. Volume, vitesse et
                position d’écoute sont aussi mémorisés sur l’appareil.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Cloud className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Compte cloud</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Connectez-vous avec le même compte que{' '}
                <a
                  href="https://gomuslimlife.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  GoMuslimLife.com
                </a>{' '}
                pour synchroniser vos favoris et reprendre votre lecture sur un autre appareil.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Données &amp; confidentialité</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Sans compte, tout reste local sur votre appareil. Avec un compte, seuls les favoris
                et la reprise de lecture sont synchronisés — pas d’historique de navigation commercialisé.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-slate-200">Cache hors-ligne</h4>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Actif
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400">Sourates téléchargées</span>
              <span className="text-slate-200 font-bold">{cacheInfo?.count ?? 0} sourate(s)</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-slate-400">Espace utilisé</span>
              <span className="text-slate-200 font-bold">{cacheInfo?.totalSizeMb ?? 0} Mo</span>
            </div>
          </div>

          {cacheInfo && cacheInfo.count > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-400 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Vider le cache hors-ligne</span>
            </button>
          )}
        </div>

        <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Conçu pour une écoute sereine : interface claire, navigation rapide, et respect du
            Coran au centre de l’expérience.
          </p>
        </div>

        <div className="border-t border-slate-900 pt-4 flex items-center justify-between text-[11px] text-slate-500 gap-3 flex-wrap">
          <span>Quranify © {new Date().getFullYear()} · v{APP_VERSION}</span>
          <a
            href="https://sofianeweb.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <span>Créé par sofianeweb.fr</span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
};
