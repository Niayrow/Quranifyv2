import React from 'react';
import { BookOpenText, Heart, Home, LayoutGrid, Settings } from 'lucide-react';

type NavTabId = 'home' | 'listen' | 'ayah' | 'favorites' | 'more';

interface NavbarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  /** When true on mobile, navbar visually docks with the player bar */
  dockWithPlayer?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dockWithPlayer = false,
}) => {
  const mainTabs: Array<{ id: NavTabId; label: string; icon: typeof Home }> = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'listen', label: 'Écouter', icon: LayoutGrid },
    { id: 'ayah', label: 'Lecture', icon: BookOpenText },
    { id: 'favorites', label: 'Favoris', icon: Heart },
  ];

  return (
    <nav
      className={`fixed z-50 left-1/2 -translate-x-1/2 w-[95%] max-w-md md:max-w-4xl md:w-auto md:top-6 md:bottom-auto glass-panel-opaque border shadow-2xl shadow-black/40 px-2.5 py-2.5 backdrop-blur-2xl transition-all duration-300 ${
        dockWithPlayer
          ? 'bottom-[calc(0.65rem+env(safe-area-inset-bottom,0px))] rounded-t-none rounded-b-3xl border-slate-700/50 border-t-0 shadow-[0_12px_28px_rgba(0,0,0,0.4)] md:rounded-full md:border md:border-slate-700/50 md:shadow-2xl md:shadow-black/40'
          : 'bottom-6 rounded-3xl md:rounded-full border-slate-700/50'
      }`}
    >
      <div className="flex items-center justify-between gap-1 md:gap-6">
        <div className="flex items-center justify-between w-full md:w-auto md:gap-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex flex-col md:flex-row items-center justify-center flex-1 md:flex-none rounded-2xl md:rounded-full px-2 md:px-4 py-2 transition-all duration-300 tap-feedback ${
                  isActive
                    ? 'bg-slate-900 text-white ring-1 ring-white/10'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
                aria-label={tab.label}
              >
                {isActive && (
                  <span className="absolute -top-3 md:-top-0.5 md:-bottom-0.5 md:left-0 md:right-0 md:h-auto md:w-full h-1 w-8 rounded-full bg-[#2dd4a0]" />
                )}

                <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 relative z-10">
                  <Icon
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`w-5 h-5 md:w-[22px] md:h-[22px] transition-all duration-300 ${
                      isActive
                        ? 'text-white scale-110'
                        : 'text-slate-400 group-hover:scale-110 group-hover:text-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[10px] md:text-xs font-bold tracking-wide transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}

          <div className="w-px h-10 bg-slate-700/50 hidden md:block mx-2" />

          <button
            onClick={() => setActiveTab('more')}
            className={`group relative flex flex-col md:flex-row items-center justify-center flex-1 md:flex-none rounded-2xl md:rounded-full px-2 md:px-4 py-2 transition-all duration-300 tap-feedback ${
              activeTab === 'more'
                ? 'bg-slate-900 text-white ring-1 ring-white/10'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            {activeTab === 'more' && (
              <span className="absolute -top-3 md:-top-0.5 md:-bottom-0.5 md:left-0 md:right-0 md:h-auto md:w-full h-1 w-8 rounded-full bg-[#2dd4a0]" />
            )}
            <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 relative z-10">
              <Settings
                strokeWidth={activeTab === 'more' ? 2.5 : 2}
                className={`w-5 h-5 md:w-[22px] md:h-[22px] transition-transform duration-500 ${
                  activeTab === 'more'
                    ? 'text-white rotate-90 scale-110'
                    : 'text-slate-400 group-hover:rotate-45 group-hover:scale-110 group-hover:text-slate-200'
                }`}
              />
              <span
                className={`text-[10px] md:text-xs font-bold tracking-wide transition-colors ${
                  activeTab === 'more' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Options
              </span>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};
