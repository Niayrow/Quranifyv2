import React from 'react';
import { Headphones } from '../icons/motion';
import type { Reciter, Moshaf } from '../types';
import { getGeneratedReciterAvatar, getReciterImage } from '../utils/images';
import type { NavDesktopStyle } from '../utils/navDesktopStyle';
import { useNavMotionIcons, type NavTabIcon } from '../hooks/useNavMotionIcons';
import { NavbarDesktopClassic } from './NavbarDesktopClassic';

type NavTabId = 'home' | 'listen' | 'moments' | 'favorites' | 'more';

export interface ReciterNavFusionProps {
  progress: number;
  reciter: Reciter;
  activeMoshaf: Moshaf | null;
  onChangeReciter: () => void;
}

export interface ExploreNavFusionProps {
  progress: number;
  onExplore: () => void;
}

interface NavbarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  /** When true on mobile, navbar visually docks with the player bar */
  dockWithPlayer?: boolean;
  /** Desktop only: floating dock (V1) or full-width classic bar (V2) */
  desktopStyle?: NavDesktopStyle;
  reciterFusion?: ReciterNavFusionProps | null;
  exploreFusion?: ExploreNavFusionProps | null;
}

const LOGO_SRC = '/icons/sansfond.webp';

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dockWithPlayer = false,
  desktopStyle = 'dock',
  reciterFusion = null,
  exploreFusion = null,
}) => {
  const useClassicDesktop = desktopStyle === 'classic';
  const { ready: motionReady, icons, MotionIconConfig } = useNavMotionIcons();

  const mainTabs: Array<{ id: Exclude<NavTabId, 'more'>; label: string; icon: NavTabIcon }> = [
    { id: 'home', label: 'Accueil', icon: icons.home },
    { id: 'listen', label: 'Écouter', icon: icons.listen },
    { id: 'moments', label: 'Moments', icon: icons.moments },
    { id: 'favorites', label: 'Favoris', icon: icons.favorites },
  ];

  const renderTab = (
    id: NavTabId,
    label: string,
    Icon: NavTabIcon,
  ) => {
    const isActive = activeTab === id;

    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        data-motion-icon-group={motionReady ? '' : undefined}
        className={`nav-tab group relative flex flex-1 flex-col items-center justify-center h-full px-1 py-1 transition-all duration-300 md:flex-none md:rounded-none md:px-3 md:py-1.5 ${
          isActive ? 'nav-tab--active' : 'nav-tab--idle'
        } ${motionReady ? 'nav-tab--draw-motion' : ''}`}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="nav-tab__indicator md:hidden" aria-hidden />
        <span className="nav-tab__inner relative z-10 flex flex-col items-center gap-0.5 transition-transform duration-100 ease-out group-active:scale-95 md:gap-1">
          <span
            className={`nav-tab__icon flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 md:h-auto md:w-auto md:rounded-none md:bg-transparent ${
              isActive ? 'bg-[#f0d1bc]/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:bg-transparent md:shadow-none' : ''
            }`}
          >
            <Icon
              size={18}
              strokeWidth={isActive ? 2.45 : 2}
              {...(motionReady
                ? { trigger: 'parent-hover' as const, mode: 'signature' as const, duration: 0.55 }
                : {})}
              className={`nav-tab__glyph transition-colors duration-300 md:h-[17px] md:w-[17px] ${
                isActive
                  ? 'text-[#f0d1bc] drop-shadow-[0_0_10px_rgba(240,209,188,0.35)] md:drop-shadow-none'
                  : 'text-[#7f93a8] group-hover:text-[#e8eef5] md:group-hover:text-[#f1d4c1]'
              }`}
            />
          </span>
          <span
            className={`nav-tab__label text-[10px] font-semibold tracking-wide transition-colors duration-300 md:text-[12px] md:leading-none ${
              isActive
                ? 'text-[#f1d4c1] md:font-bold'
                : 'text-[#7a8fa3] group-hover:text-[#e8eef5] md:font-medium md:text-[#9fb1c3]'
            }`}
          >
            {label}
          </span>
          <span className="nav-tab__aurora hidden md:block" aria-hidden />
        </span>
      </button>
    );
  };

  const fusionProgress = reciterFusion?.progress ?? exploreFusion?.progress ?? 0;
  const isFusing =
    (Boolean(reciterFusion) || Boolean(exploreFusion)) && fusionProgress > 0.01;
  const fusionStyle =
    reciterFusion || exploreFusion
      ? ({ ['--fusion-p' as string]: String(fusionProgress) } as React.CSSProperties)
      : undefined;

  const tabs = (
    <>
      {useClassicDesktop && (
        <NavbarDesktopClassic
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reciterFusion={reciterFusion}
          exploreFusion={exploreFusion}
          icons={icons}
          motionReady={motionReady}
        />
      )}

      <nav
        style={useClassicDesktop ? undefined : fusionStyle}
        className={`fixed z-50 glass-panel-opaque backdrop-blur-2xl transition-[box-shadow] duration-300 ease-out overflow-hidden nav-reciter-fusion-shell
          left-0 right-0 w-full max-w-none translate-x-0 bottom-0
          h-[calc(4.35rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)]
          rounded-none border-x-0 border-b-0
          ${dockWithPlayer ? 'border-t-0 max-md:!border-t-0 max-md:!shadow-none' : 'border-t'} mobile-dock-chrome mobile-bar-nav
          ${dockWithPlayer ? 'max-md:mobile-bar-nav-docked' : ''}
          ${
            useClassicDesktop
              ? 'md:hidden'
              : 'md:left-8 md:right-8 md:translate-x-0 md:w-auto md:max-w-6xl md:mx-auto md:bottom-auto md:top-6 md:h-auto md:pb-0 md:rounded-[1.35rem] md:border md:border-[#46607b]/40 md:px-4 md:pt-3 md:pb-3.5 md:shadow-2xl md:shadow-black/40'
          }
          ${!useClassicDesktop && isFusing ? 'is-fusing' : ''}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-full items-stretch justify-between gap-0 md:hidden">
            {mainTabs.map((tab) => renderTab(tab.id, tab.label, tab.icon))}
            {renderTab('more', 'Options', icons.more)}
          </div>

          {!useClassicDesktop && (
            <div className="relative hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3">
              <div className="flex items-center justify-start gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  aria-label="Sawra — Accueil"
                  className="group/nav-brand flex shrink-0 items-center gap-2 rounded-2xl px-2 py-1.5 transition-all duration-300 hover:bg-[#162538]/60 tap-feedback"
                >
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[0.85rem] bg-[radial-gradient(circle_at_50%_35%,rgba(240,209,188,0.14),rgba(17,29,45,0.92)_68%)] ring-1 ring-[#cea687]/25 shadow-[0_6px_22px_rgba(206,166,135,0.14),inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <img
                      src={LOGO_SRC}
                      alt=""
                      width="52"
                      height="52"
                      decoding="async"
                      className="h-[3.25rem] w-[3.25rem] object-contain scale-[1.18] drop-shadow-[0_2px_16px_rgba(206,166,135,0.42)] transition-transform duration-300 group-hover/nav-brand:scale-[1.22]"
                      draggable={false}
                    />
                  </span>
                  <span className="flex flex-col items-start justify-center leading-none">
                    <span className="text-[1.05rem] font-black tracking-[-0.03em] text-[#f6f8fb]">
                      Sawra
                    </span>
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#cea687]/80">
                      Coran
                    </span>
                  </span>
                </button>
                <span className="h-7 w-px shrink-0 bg-[#46607b]/40" aria-hidden />
              </div>

              <div className="flex items-center justify-center gap-1">
                {mainTabs.map((tab) => renderTab(tab.id, tab.label, tab.icon))}
              </div>

              <div className="flex items-center justify-end gap-3 min-w-0">
                <span className="h-7 w-px shrink-0 bg-[#46607b]/40" aria-hidden />
                {renderTab('more', 'Options', icons.more)}
              </div>
            </div>
          )}

          {!useClassicDesktop && reciterFusion && (
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

          {!useClassicDesktop && exploreFusion && !reciterFusion && (
            <div
              className="nav-explore-fusion-dock nav-reciter-fusion-dock hidden md:flex items-center gap-3 px-3 pb-3 pt-0"
              aria-hidden={fusionProgress < 0.05}
              style={{ pointerEvents: fusionProgress >= 0.85 ? 'auto' : 'none' }}
            >
              <div className="nav-reciter-fusion-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#cea687]/35 bg-[#f0d1bc]/12 text-[#f0d1bc]">
                <Headphones className="h-4 w-4" />
              </div>
              <div className="nav-reciter-fusion-meta min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#f0d1bc]/90">
                  Explorer
                </p>
                <p className="text-sm font-semibold text-[#f6f8fb] truncate">Les voix</p>
                <p className="text-[11px] text-[#b4c0ce] truncate">Récitateurs &amp; sourates</p>
              </div>
              <button
                type="button"
                onClick={exploreFusion.onExplore}
                className="brand-button-primary shrink-0 rounded-xl px-3.5 py-2 text-[11px] font-bold transition-colors tap-feedback"
                tabIndex={fusionProgress >= 0.85 ? 0 : -1}
              >
                Ouvrir
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );

  if (MotionIconConfig) {
    return (
      <MotionIconConfig trigger="hover" mode="signature" duration={0.5}>
        {tabs}
      </MotionIconConfig>
    );
  }

  return tabs;
};
