import React from 'react';
import { Heart, Home, Headphones, Play, Settings } from 'lucide-react';
import type { Reciter, Moshaf } from '../types';
import { getGeneratedReciterAvatar, getReciterImage } from '../utils/images';

type NavTabId = 'home' | 'listen' | 'moments' | 'favorites' | 'more';

export interface ReciterNavFusionProps {
  progress: number;
  reciter: Reciter;
  activeMoshaf: Moshaf | null;
  onChangeReciter: () => void;
}

interface NavbarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  /** When true on mobile, navbar visually docks with the player bar */
  dockWithPlayer?: boolean;
  reciterFusion?: ReciterNavFusionProps | null;
}

const LOGO_SRC = '/icons/sansfond.png';

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dockWithPlayer = false,
  reciterFusion = null,
}) => {
  const mainTabs: Array<{ id: NavTabId; label: string; icon: typeof Home }> = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'listen', label: 'Écouter', icon: Headphones },
    { id: 'moments', label: 'Moments', icon: Play },
    { id: 'favorites', label: 'Favoris', icon: Heart },
  ];

  const tabIds: NavTabId[] = [...mainTabs.map((t) => t.id), 'more'];

  const renderTab = (
    id: NavTabId,
    label: string,
    Icon: typeof Home,
    options?: { rotateActive?: boolean },
  ) => {
    const isActive = activeTab === id;
    const index = tabIds.indexOf(id);
    const isFirst = index === 0;
    const isLast = index === tabIds.length - 1;

    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        className={`group relative flex flex-col md:flex-row items-center justify-center flex-1 md:flex-none h-full md:h-auto px-1.5 md:px-3.5 py-1.5 md:py-2 transition-all duration-300 overflow-hidden md:overflow-visible ${
          isFirst ? 'rounded-bl-[1.35rem] md:rounded-full' : ''
        } ${isLast ? 'rounded-br-[1.35rem] md:rounded-full' : ''} ${
          !isFirst && !isLast ? 'md:rounded-full' : ''
        } ${
          isActive
            ? 'md:bg-gradient-to-b md:from-[#243850] md:to-[#162538] md:text-[#f6f8fb] md:ring-1 md:ring-[#f0d1bc]/45 md:shadow-[inset_0_1px_0_rgba(240,209,188,0.18),0_0_22px_rgba(206,166,135,0.16)]'
            : 'text-[#9fb1c3] hover:bg-[#162538]/70 hover:text-[#eef3f8]'
        }`}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Mobile: full-height navy selection column */}
        {isActive && (
          <span
            className={`pointer-events-none absolute inset-y-0 md:hidden bg-gradient-to-b from-[#243850] to-[#162538] ${
              dockWithPlayer ? '-top-px' : ''
            } ${
              isFirst
                ? 'left-0 right-0 rounded-bl-[1.35rem]'
                : isLast
                  ? 'left-0 right-0 rounded-br-[1.35rem]'
                  : 'left-0 right-0'
            }`}
            aria-hidden
          />
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-transform duration-100 ease-out group-active:scale-95">
          <Icon
            strokeWidth={isActive ? 2.6 : 2}
            className={`w-5 h-5 md:w-[20px] md:h-[20px] transition-all duration-300 ${
              isActive
                ? `scale-110 text-[#f0d1bc] drop-shadow-[0_0_10px_rgba(240,209,188,0.35)] ${
                    options?.rotateActive ? 'rotate-90' : ''
                  }`
                : `text-[#9fb1c3] group-hover:scale-110 group-hover:text-[#eef3f8] ${
                    options?.rotateActive ? 'group-hover:rotate-45' : ''
                  }`
            }`}
          />
          <span
            className={`text-[10px] md:text-xs font-bold tracking-wide transition-colors ${
              isActive ? 'text-[#f6f8fb] md:text-[#f1d4c1]' : 'text-[#9fb1c3] group-hover:text-[#eef3f8]'
            }`}
          >
            {label}
          </span>
        </div>
      </button>
    );
  };

  const fusionProgress = reciterFusion?.progress ?? 0;
  const isFusing = Boolean(reciterFusion) && fusionProgress > 0.01;
  const fusionStyle = reciterFusion
    ? ({ ['--fusion-p' as string]: String(fusionProgress) } as React.CSSProperties)
    : undefined;

  return (
    <nav
      style={fusionStyle}
      className={`fixed z-50 left-1/2 -translate-x-1/2 w-[95%] max-w-md md:max-w-4xl md:w-auto md:top-6 md:bottom-auto md:h-auto glass-panel-opaque border px-0 py-0 md:px-2.5 md:py-2 backdrop-blur-2xl transition-[border-radius,box-shadow] duration-300 ease-out overflow-hidden md:overflow-hidden nav-reciter-fusion-shell ${
        isFusing ? 'is-fusing' : ''
      } ${
        dockWithPlayer
          ? 'mobile-dock-chrome mobile-dock-nav bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))] h-[4.35rem] md:h-auto rounded-t-none rounded-b-3xl border-t-0 md:rounded-full md:border md:border-[#46607b]/40 md:shadow-2xl md:shadow-black/40'
          : 'bottom-6 h-[4.35rem] md:h-auto rounded-3xl md:rounded-full border-[#46607b]/40 shadow-2xl shadow-black/40'
      }`}
    >
      <div className="flex h-full flex-col">
      <div className="flex h-full items-stretch md:items-center justify-between gap-0 md:gap-3 shrink-0">
        {/* Brand — desktop only */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          aria-label="Quranify — Accueil"
          className="group hidden md:flex shrink-0 items-center gap-2.5 rounded-full pl-1 pr-3.5 py-1 hover:bg-[#162538]/70 transition-colors tap-feedback"
        >
          <img
            src={LOGO_SRC}
            alt=""
            className="h-12 w-12 object-contain drop-shadow-[0_2px_12px_rgba(206,166,135,0.35)] transition-transform duration-300 group-hover:scale-105"
            draggable={false}
          />
          <span className="text-[15px] font-bold tracking-tight text-[#f6f8fb] pr-0.5">
            Quranify
          </span>
        </button>

        <div className="w-px h-10 bg-[#46607b]/40 hidden md:block shrink-0" />

        <div className="flex items-stretch md:items-center justify-between w-full md:w-auto md:gap-1.5 min-w-0 h-full md:h-auto">
          {mainTabs.map((tab) => renderTab(tab.id, tab.label, tab.icon))}

          <div className="w-px h-8 bg-[#46607b]/40 hidden md:block mx-1 self-center" />

          {renderTab('more', 'Options', Settings, { rotateActive: true })}
        </div>
      </div>

      {reciterFusion && (
        <div
          className="nav-reciter-fusion-dock items-center gap-3 px-3 pb-3 pt-0"
          aria-hidden={fusionProgress < 0.05}
          style={{ pointerEvents: fusionProgress >= 0.85 ? 'auto' : 'none' }}
        >
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#46607b]/55 bg-[#111d2d] shrink-0">
            <img
              src={getReciterImage(reciterFusion.reciter)}
              alt={reciterFusion.reciter.name}
              width="36"
              height="36"
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                const fallback = getGeneratedReciterAvatar(reciterFusion.reciter);
                if (img.src !== fallback) img.src = fallback;
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#f0d1bc]/90">
              Récitateur
            </p>
            <p className="text-sm font-semibold text-[#f6f8fb] truncate">{reciterFusion.reciter.name}</p>
            {reciterFusion.activeMoshaf && (
              <p className="text-[11px] text-[#b4c0ce] truncate">{reciterFusion.activeMoshaf.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={reciterFusion.onChangeReciter}
            className="brand-button-secondary shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition-colors tap-feedback"
            tabIndex={fusionProgress >= 0.85 ? 0 : -1}
          >
            Changer
          </button>
        </div>
      )}
      </div>
    </nav>
  );
};
