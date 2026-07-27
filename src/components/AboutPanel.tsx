import React from 'react';
import {
  Compass, Cloud, HardDrive, Headphones, Shield, Sparkles, Trash2, Wifi,
  MonitorSmartphone, ListMusic, Smartphone, BookOpenText, ExternalLink, History,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export const APP_VERSION = '1.2.0';

const UPDATE_HISTORY: Array<{
  version: string;
  date: string;
  title: string;
  items: string[];
}> = [
  {
    version: '1.2.0',
    date: '27 juil. 2026',
    title: 'Identité & expérience mobile',
    items: [
      'Nouveau logo et icônes PWA / app (fond transparent).',
      'Accueil redesigné : hero compact, accès rapide, lieux et favoris.',
      'Navbar mobile : sélection marine, dock collé au lecteur, sans logo.',
      'Player bar : temps, progression seekable, swipe plein écran, liste des sourates au tap.',
      'Lecture distante : contrôles grisés + masquage temps/progression hors appareil local.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026',
    title: 'Sync & lecteur V2',
    items: [
      'Lecteur V2 personnalisable (thèmes, densité, contrôles).',
      'Synchronisation cloud des favoris, préférences et boucle de sourates.',
      'Bandeau multi-appareils « Basculer ici » et reprise de lecture.',
      'Palette marine et accents UI harmonisés.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026',
    title: 'Première version publique',
    items: [
      'Streaming des récitateurs, favoris et mode hors-ligne.',
      'Lecture ayah par ayah et installation PWA.',
      'Compte GoMuslimLife partagé.',
    ],
  },
];

export const AboutPanel: React.FC = () => {
  const { cacheInfo, clearCache } = useAudio();

  const handleClear = async () => {
    if (confirm('Voulez-vous supprimer toutes les sourates téléchargées pour l\'écoute hors-ligne ?')) {
      await clearCache();
    }
  };

  const features = [
    {
      icon: Headphones,
      title: 'Écoute en streaming',
      body: 'Des centaines de récitateurs, lecteur personnalisable, reprise automatique et contrôles depuis l’écran de verrouillage.',
    },
    {
      icon: MonitorSmartphone,
      title: 'Multi-appareils',
      body: 'Lecture en temps réel entre téléphone et ordinateur : basculez ici, reprise de position, arrêt automatique sur l’autre appareil.',
    },
    {
      icon: ListMusic,
      title: 'Boucle de sourates',
      body: 'Sélectionnez les sourates à répéter. La sélection, le thème, le volume et la vitesse suivent votre compte cloud.',
    },
    {
      icon: HardDrive,
      title: 'Mode hors-ligne',
      body: 'Téléchargez des sourates pour les écouter sans connexion. Vos réglages locaux restent mémorisés sur l’appareil.',
    },
    {
      icon: BookOpenText,
      title: 'Lecture ayah par ayah',
      body: 'Parcourez le texte du Coran sourate par sourate dans l’onglet dédié, en complément de l’écoute audio.',
    },
    {
      icon: Cloud,
      title: 'Compte GoMuslimLife',
      body: 'Un seul compte pour Quranify et GoMuslimLife.com : favoris, reprise d’écoute et préférences synchronisés.',
    },
    {
      icon: Smartphone,
      title: 'Applications mobiles',
      body: 'Versions iOS et Android en préparation (bientôt sur l’App Store et Google Play).',
    },
    {
      icon: Shield,
      title: 'Données & confidentialité',
      body: 'Sans compte, tout reste local. Avec un compte : favoris, reprise et préférences — pas de pub ni d’historique commercialisé.',
    },
  ];

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-sky-500/[0.08] to-slate-950/40 p-6">
        <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <img
              src="/icons/sansfond.png"
              alt=""
              className="h-11 w-11 object-contain drop-shadow-[0_2px_10px_rgba(122,145,159,0.35)]"
              draggable={false}
            />
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-300" />
                <h2 className="text-xl font-bold text-slate-100">À propos de Quranify</h2>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                Lecteur coranique simple et rapide — web &amp; bientôt en app.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-200">
              v{APP_VERSION}
            </span>
            <span className="text-[11px] text-slate-500">Dernière maj · 27 juil. 2026</span>
          </div>
          <a
            href="https://gomuslimlife.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.07] hover:text-slate-100 transition-colors"
          >
            Découvrir GoMuslimLife.com
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800/70 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-300" />
          <h3 className="text-sm font-bold text-slate-100">Historique des mises à jour</h3>
        </div>

        <div className="relative flex flex-col gap-5 pl-1">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-800" aria-hidden />
          {UPDATE_HISTORY.map((release, index) => (
            <div key={release.version} className="relative pl-6">
              <span
                className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                  index === 0
                    ? 'border-sky-300 bg-sky-500/40'
                    : 'border-slate-600 bg-slate-900'
                }`}
                aria-hidden
              />
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-bold text-slate-100">v{release.version}</span>
                <span className="text-[11px] text-slate-500">{release.date}</span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-sky-200/80">{release.title}</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {release.items.map((item) => (
                  <li key={item} className="text-[12px] leading-relaxed text-slate-400 flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800/70 p-5 flex flex-col gap-4">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-500/10 text-slate-300">
              <Icon className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800/70 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-slate-300" />
            <h4 className="text-sm font-semibold text-slate-200">Cache hors-ligne</h4>
          </div>
          <span className="text-[10px] bg-slate-500/10 text-slate-300 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
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

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-slate-400 shrink-0" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Conçu pour une écoute sereine : interface claire, sync entre appareils, et le Coran au centre.
        </p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 gap-3 flex-wrap px-1">
        <span>Quranify © {new Date().getFullYear()} · v{APP_VERSION}</span>
        <a
          href="https://sofianeweb.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-slate-200"
        >
          <span>Créé par sofianeweb.fr</span>
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
        </a>
      </div>
    </div>
  );
};
