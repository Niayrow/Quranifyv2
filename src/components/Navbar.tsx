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

  const renderTab = (
    id: NavTabId,
    label: string,
    Icon: typeof Home,
    options?: { rotateActive?: boolean },
  ) => {
    const isActive = activeTab === id;

    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        className={`group relative flex flex-col md:flex-row items-center justify-center flex-1 md:flex-none h-full md:h-auto px-1 md:px-3 md:py-1.5 py-1 transition-all duration-300 md:rounded-xl ${
          isActive
            ? 'md:bg-[#1b2d43] md:ring-1 md:ring-[#cea687]/40 md:shadow-[inset_0_1px_0_rgba(240,209,188,0.12)]'
            : 'text-[#9fb1c3] md:hover:bg-[#162538]/70 hover:text-[#eef3f8]'
        }`}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-0.5 md:gap-2 transition-transform duration-100 ease-out group-active:scale-95">
          <span
            className={`flex items-center justify-center rounded-lg transition-all duration-300 md:bg-transparent ${
              isActive ? 'h-8 w-8 bg-[#f0d1bc]/12 md:h-auto md:w-auto md:bg-transparent' : 'h-8 w-8 md:h-auto md:w-auto'
            }`}
          >
            <Icon
              strokeWidth={isActive ? 2.4 : 2}
              className={`w-[18px] h-[18px] transition-colors duration-300 ${
                isActive
                  ? `text-[#f0d1bc] ${options?.rotateActive ? 'md:rotate-90' : ''}`
                  : `text-[#8fa3b0] group-hover:text-[#eef3f8] ${
                      options?.rotateActive ? 'group-hover:rotate-45' : ''
                    }`
              }`}
            />
          </span>
          <span
            className={`text-[10px] md:text-[13px] font-semibold tracking-wide transition-colors duration-300 ${
              isActive
                ? 'text-[#f0d1bc]'
                : 'text-[#8295aa] group-hover:text-[#eef3f8] md:text-[#9fb1c3]'
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
      className={`fixed z-50 glass-panel-opaque backdrop-blur-2xl transition-[box-shadow] duration-300 ease-out overflow-hidden nav-reciter-fusion-shell
        left-0 right-0 w-full max-w-none translate-x-0 bottom-0
        h-[calc(4.35rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)]
        rounded-none border-x-0 border-b-0
        ${dockWithPlayer ? 'border-t-0 max-md:!border-t-0 max-md:!shadow-none' : 'border-t'} mobile-dock-chrome mobile-bar-nav
        ${dockWithPlayer ? 'max-md:mobile-bar-nav-docked' : ''}
        md:left-8 md:right-8 md:translate-x-0 md:w-auto md:max-w-6xl md:mx-auto md:bottom-auto md:top-6 md:h-auto md:pb-0
        md:rounded-[1.35rem] md:border md:border-[#46607b]/40 md:px-4 md:pt-3 md:pb-3.5 md:shadow-2xl md:shadow-black/40
        ${isFusing ? 'is-fusing' : ''}
      `}
    >
      <div className="flex h-full flex-col">
        {/* Mobile row */}
        <div className="flex h-full items-stretch justify-between gap-0 md:hidden">
          {mainTabs.map((tab) => renderTab(tab.id, tab.label, tab.icon))}
          {renderTab('more', 'Options', Settings, { rotateActive: true })}
        </div>

        {/* Desktop row — brand | centered tabs | options */}
        <div className="relative hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3">
          <div className="flex items-center justify-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              aria-label="Quranify — Accueil"
              className="group flex shrink-0 items-center gap-2.5 rounded-xl pl-0.5 pr-3 py-1 hover:bg-[#162538]/70 transition-colors tap-feedback"
            >
              <img
                src={LOGO_SRC}
                alt=""
                className="h-9 w-9 object-contain drop-shadow-[0_2px_12px_rgba(206,166,135,0.35)] transition-transform duration-300 group-hover:scale-105"
                draggable={false}
              />
              <span className="text-[15px] font-bold tracking-tight text-[#f6f8fb]">
                Quranify
              </span>
            </button>
            <span className="h-6 w-px shrink-0 bg-[#46607b]/45" aria-hidden />
          </div>

          <div className="flex items-center justify-center gap-1">
            {mainTabs.map((tab) => renderTab(tab.id, tab.label, tab.icon))}
          </div>

          <div className="flex items-center justify-end gap-3 min-w-0">
            <span className="h-6 w-px shrink-0 bg-[#46607b]/45" aria-hidden />
            {renderTab('more', 'Options', Settings, { rotateActive: true })}
          </div>
        </div>

        {reciterFusion && (
          <div
            className="nav-reciter-fusion-dock hidden md:flex items-center gap-3 px-3 pb-3 pt-0"
            aria-hidden={fusionProgress < 0.05}
            style={{ pointerEvents: fusionProgress >= 0.85 ? 'auto' : 'none' }}
          >
            <div className="nav-reciter-fusion-avatar w-9 h-9 rounded-lg overflow-hidden border border-[#46607b]/55 bg-[#111d2d] shrink-0">
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
            <div className="nav-reciter-fusion-meta min-w-0 flex-1">
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
