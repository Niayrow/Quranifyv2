import React from 'react';
import { Compass, Shield, Layers, HardDrive, Smartphone, Sparkles } from 'lucide-react';

export const AboutPanel: React.FC = () => (
  <div className="flex flex-col gap-5">
    <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />

      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Compass className="w-5.5 h-5.5 text-emerald-400 animate-pulse" />
          Moteur Quranify V1.0
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Client de streaming audio haute performance, conçu pour mobile et synchronisé en temps réel avec les API coraniques officielles.
        </p>
      </div>

      <div className="flex flex-col gap-4.5">
        <div className="flex gap-3">
          <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Architecture Tactile Mobile-First</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Adaptations strictes de l'affichage, barres d'action élastiques et zones tactiles agrandies adaptées à l'ergonomie mobile iOS et Android.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Layers className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Contrôle en Arrière-plan (W3C Media Session)</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Intégration directe avec l'écran de verrouillage et les centres de notifications de vos téléphones. Lecture ininterrompue en arrière-plan.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <HardDrive className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Persistance Locale (LocalStorage)</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Sauvegarde automatique du volume, de la vitesse de lecture, du récitateur sélectionné et de la position d'écoute même après redémarrage.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Moteur Tailwind CSS v4</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Rendu ultra-rapide et effets de flou translucides (glassmorphism) accélérés par processeur graphique (GPU).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-2xl flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Système de design épuré aux couleurs traditionnelles vertes émeraude et dorées, rendant hommage à la beauté de la calligraphie coranique.
        </p>
      </div>

      <div className="border-t border-slate-900 pt-4 flex items-center justify-between text-[11px] text-slate-500">
        <span>Quranify © {new Date().getFullYear()}</span>
        <a 
          href="https://sofianeweb.fr" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold transition-colors"
        >
          Créé par sofianeweb.fr
        </a>
      </div>
    </div>
  </div>
);
