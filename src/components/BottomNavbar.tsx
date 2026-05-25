import React from 'react';
import { Users, Music, Heart, Info } from 'lucide-react';

interface BottomNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({ activeTab, setActiveTab }) => {

  const tabs = [
    { id: 'reciters', label: 'Récitateurs', icon: Users },
    { id: 'surahs', label: 'Sourates', icon: Music },
    { id: 'favorites', label: 'Favoris', icon: Heart },
    { id: 'about', label: 'À propos', icon: Info },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-800/80 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40 px-3 pb-safe pt-2 md:top-0 md:bottom-auto md:h-screen md:right-auto md:w-24 md:rounded-none md:border-t-0 md:border-r md:px-0 md:pt-8 md:pb-28 md:bg-slate-950/90 md:backdrop-blur-xl">
      <div className="max-w-md mx-auto flex items-center justify-between h-16 md:flex-col md:h-full md:justify-start md:gap-8 md:w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 h-full min-w-[48px] tap-feedback relative md:flex-none md:w-full md:h-20"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active Tab Glow Bar */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse md:top-auto md:left-0 md:w-1 md:h-12 md:-translate-y-1/2 md:mt-10" />
              )}

              <Icon 
                className={`w-5 h-5 transition-all duration-300 md:w-6 md:h-6 ${
                  isActive 
                    ? 'text-emerald-400 scale-110 shadow-emerald-500/20' 
                    : 'text-slate-500 hover:text-slate-350'
                }`} 
              />
              
              <span 
                className={`text-[10px] font-semibold tracking-wider mt-1 transition-colors uppercase md:mt-2 md:text-[9px] ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
