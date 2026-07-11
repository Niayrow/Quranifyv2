import React from 'react';
import { BookOpenText, Heart, Home, LayoutGrid, Settings } from 'lucide-react';

type NavTabId = 'home' | 'listen' | 'ayah' | 'favorites' | 'more';

interface NavbarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const mainTabs: Array<{ id: NavTabId; label: string; icon: typeof Home }> = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'listen', label: 'Écouter', icon: LayoutGrid },
    { id: 'ayah', label: 'Lecture', icon: BookOpenText },
    { id: 'favorites', label: 'Favoris', icon: Heart },
  ];

  return (
    <nav className="fixed z-50 bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-md md:max-w-4xl md:w-auto md:top-6 md:bottom-auto glass-panel-opaque rounded-3xl md:rounded-full border border-slate-700/50 shadow-2xl shadow-emerald-500/10 px-2.5 py-2.5 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-1 md:gap-6">
        
        {/* Main Navigation */}
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
                    ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                aria-label={tab.label}
              >
                {isActive && (
                  <span className="absolute -top-3 md:-top-0.5 md:-bottom-0.5 md:left-0 md:right-0 md:h-auto md:w-full h-1 w-8 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                )}
                
                <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 relative z-10">
                  <Icon 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`w-5 h-5 md:w-[22px] md:h-[22px] transition-all duration-300 ${
                      isActive 
                        ? 'text-emerald-300 scale-110 drop-shadow-[0_0_6px_rgba(110,231,183,0.6)]' 
                        : 'group-hover:scale-110 group-hover:text-white'
                    }`} 
                  />
                  <span className={`text-[10px] md:text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-emerald-200' : ''}`}>
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}
          
          <div className="w-px h-10 bg-slate-700/50 hidden md:block mx-2" />
          
          {/* Action / Settings */}
          <button
            onClick={() => setActiveTab('more')}
            className={`group relative flex flex-col md:flex-row items-center justify-center flex-1 md:flex-none rounded-2xl md:rounded-full px-2 md:px-4 py-2 transition-all duration-300 tap-feedback ${
              activeTab === 'more'
                ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-lg'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            {activeTab === 'more' && (
              <span className="absolute -top-3 md:-top-0.5 md:-bottom-0.5 md:left-0 md:right-0 md:h-auto md:w-full h-1 w-8 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            )}
            <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 relative z-10">
              <Settings 
                strokeWidth={activeTab === 'more' ? 2.5 : 2}
                className={`w-5 h-5 md:w-[22px] md:h-[22px] transition-transform duration-500 ${
                  activeTab === 'more' ? 'text-emerald-300 rotate-90 scale-110 drop-shadow-[0_0_6px_rgba(110,231,183,0.6)]' : 'group-hover:rotate-45 group-hover:scale-110 group-hover:text-white'
                }`} 
              />
              <span className={`text-[10px] md:text-xs font-bold tracking-wide transition-colors ${activeTab === 'more' ? 'text-emerald-200' : ''}`}>
                Options
              </span>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};
