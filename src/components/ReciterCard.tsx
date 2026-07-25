import React from 'react';
import type { Reciter } from '../types';
import { useAudio } from '../context/AudioContext';
import { Play, Volume2, Heart } from 'lucide-react';
import { getGeneratedReciterAvatar, getReciterImage } from '../utils/images';

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
  const { getAvailableSurahs, currentTrack, playbackStatus } = useAudio();

  const highlightMatch = (text: string, query: string) => {
    if (!query || !query.trim()) return <span>{text}</span>;

    const normQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tokens = normQuery.split(' ').filter(t => t.length > 0);
    if (tokens.length === 0) return <span>{text}</span>;

    const normText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let matchedToken = '';
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

  const currentCardMoshaf = reciter.moshaf[0];
  const availableSurahs = getAvailableSurahs(reciter, currentCardMoshaf);
  const isPlayingThisReciter = currentTrack?.reciter.id === reciter.id && playbackStatus === 'playing';
  const imageUrl = getReciterImage(reciter);
  const fallbackImage = getGeneratedReciterAvatar(reciter);

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`glass-panel-interactive content-visibility-auto cursor-pointer p-4 rounded-2xl flex items-center justify-between gap-4 tap-feedback relative overflow-hidden group ${
        isSelected
          ? 'border-emerald-500/40 bg-slate-900/80 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20'
          : 'hover:border-slate-800'
      }`}
    >
      {isSelected && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none -mr-8 -mt-8" />
      )}

      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`relative w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center font-bold text-lg overflow-hidden transition-transform duration-300 ${
          isSelected
            ? 'bg-gradient-to-tr from-emerald-500 to-amber-500 text-slate-950 shadow-lg ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950'
            : 'bg-gradient-to-tr from-slate-800 to-slate-900 text-slate-400 border border-slate-700/50 group-hover:border-emerald-500/40'
        }`}>
          <img
            src={imageUrl}
            alt={reciter.name}
            width="56"
            height="56"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== fallbackImage) {
                img.src = fallbackImage;
              }
            }}
          />
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
          <p className="text-xs text-slate-400 mt-0.5">
            {availableSurahs.length} sourates
            {reciter.moshaf.length > 1 ? ` · ${reciter.moshaf.length} riwayat` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border tap-feedback ${
            isFavorite
              ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:text-red-400 hover:bg-red-500/10'
          }`}
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <span
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 border border-slate-700/50 group-hover:bg-emerald-500 group-hover:text-slate-950'
          }`}
        >
          {isPlayingThisReciter ? (
            <div className="flex gap-0.5 items-end justify-center h-4 w-4">
              <div className="w-1 bg-current animate-[shimmer_0.8s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 bg-current animate-[shimmer_0.8s_infinite_alternate] h-3/4 rounded-full" style={{ animationDelay: '0.3s' }} />
              <div className="w-1 bg-current animate-[shimmer_0.8s_infinite_alternate] h-full rounded-full" style={{ animationDelay: '0.5s' }} />
            </div>
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </span>
      </div>
    </div>
  );
};
