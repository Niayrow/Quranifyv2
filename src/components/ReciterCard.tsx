import React from 'react';
import type { Reciter, Moshaf } from '../types';
import { useAudio } from '../context/AudioContext';
import { Play, Volume2, Disc, Heart } from 'lucide-react';
import { RECITER_IMAGES } from '../utils/images';

interface ReciterCardProps {
  reciter: Reciter;
  isSelected: boolean;
  onSelect: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  searchQuery?: string;
}

export const ReciterCard: React.FC<ReciterCardProps> = ({ 
  reciter, 
  isSelected, 
  onSelect,
  isFavorite,
  onToggleFavorite,
  searchQuery
}) => {
  const { activeMoshaf, setActiveMoshaf, getAvailableSurahs, currentTrack, playbackStatus } = useAudio();

  // Accent-agnostic token match highlight function
  const highlightMatch = (text: string, query: string) => {
    if (!query || !query.trim()) return <span>{text}</span>;

    const normQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const tokens = normQuery.split(" ").filter(t => t.length > 0);
    if (tokens.length === 0) return <span>{text}</span>;

    const normText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Find the first token that matches a part of the text
    let matchedToken = "";
    let index = -1;
    for (const token of tokens) {
      index = normText.indexOf(token);
      if (index !== -1) {
        matchedToken = token;
        break;
      }
    }

    if (index === -1) return <span>{text}</span>;

    const before = text.substring(0, index);
    const match = text.substring(index, index + matchedToken.length);
    const after = text.substring(index + matchedToken.length);

    return (
      <span>
        {before}
        <span className="text-emerald-400 font-extrabold bg-emerald-400/10 px-0.5 rounded border-b border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
          {match}
        </span>
        {after}
      </span>
    );
  };


  // Get current active moshaf for this card (defaults to first in list)
  const currentCardMoshaf = isSelected && activeMoshaf && reciter.moshaf.some(m => m.id === activeMoshaf.id)
    ? activeMoshaf 
    : reciter.moshaf[0];

  const availableSurahs = getAvailableSurahs(reciter, currentCardMoshaf);
  const isPlayingThisReciter = currentTrack?.reciter.id === reciter.id && playbackStatus === 'playing';
  const imageUrl = RECITER_IMAGES[reciter.id];

  const handleMoshafChange = (e: React.MouseEvent, moshaf: Moshaf) => {
    if (!isSelected) return;
    e.stopPropagation();
    setActiveMoshaf(moshaf);
  };

  return (
    <div
      onClick={onSelect}
      className={`glass-panel-interactive cursor-pointer p-5 rounded-2xl flex flex-col justify-between gap-4 tap-feedback relative overflow-hidden group ${
        isSelected 
          ? 'border-emerald-500/40 bg-slate-900/80 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20' 
          : 'hover:border-slate-800'
      }`}
    >
      {/* Decorative Gradient Background for active cards */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none -mr-8 -mt-8" />
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          
          {/* Avatar Area */}
          <div className={`relative w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center font-bold text-lg overflow-hidden transition-transform duration-300 ${
            isSelected 
              ? 'bg-gradient-to-tr from-emerald-500 to-amber-500 text-slate-950 shadow-lg ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950' 
              : 'bg-gradient-to-tr from-slate-800 to-slate-900 text-slate-400 border border-slate-700/50 group-hover:border-emerald-500/40 group-hover:text-emerald-400'
          }`}>
            {imageUrl ? (
              <>
                <img 
                  src={imageUrl} 
                  alt={reciter.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="hidden">{reciter.letter}</span>
              </>
            ) : (
              <span>{reciter.letter}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isPlayingThisReciter && (
              <div className="mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  <Volume2 className="w-3 h-3 animate-playback-pulse" /> Lecture en cours
                </span>
              </div>
            )}
            <h3 className={`font-semibold text-lg truncate transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-100 group-hover:text-emerald-400'}`}>
              {highlightMatch(reciter.name, searchQuery || '')}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleFavorite}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border tap-feedback ${
              isFavorite
                ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:text-red-400 hover:bg-red-500/10'
            }`}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button 
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isSelected 
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:bg-emerald-500 hover:text-slate-950'
            }`}
          >
            {isPlayingThisReciter ? (
              <div className="flex gap-0.5 items-end justify-center h-4 w-4">
                <div className="w-1 bg-current animate-[shimmer_0.8s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 bg-current animate-[shimmer_0.8s_infinite_alternate] h-3/4 rounded-full" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-1 bg-current animate-[shimmer_0.8s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.5s' }}></div>
              </div>
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>


      {/* Narration Styles (Riwaiat) Selection Section */}
      <div className="mt-2 flex flex-col gap-2">
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <Disc className="w-3.5 h-3.5 text-emerald-400" />
          <span>Récitations / Versions :</span>
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {reciter.moshaf.map((m) => {
            const isMoshafSelected = isSelected && activeMoshaf?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={(e) => handleMoshafChange(e, m)}
                className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-all ${
                  isMoshafSelected
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Surahs Count Badge */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-3">
        <span>Sourates disponibles :</span>
        <span className="font-semibold text-emerald-400">{availableSurahs.length} / 114</span>
      </div>
    </div>
  );
};
