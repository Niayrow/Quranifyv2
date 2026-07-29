import React, { useMemo } from 'react';
import { Disc, Heart, Play } from 'lucide-react';
import type { Reciter, Moshaf } from '../types';
import { getGeneratedReciterAvatar, getReciterImage } from '../utils/images';
import { useReciterNavFusion } from '../hooks/useReciterNavFusion';
import { RECITER_CATEGORIES } from '../data/reciterCategories';

interface ListenReciterHeaderProps {
  activeReciter: Reciter;
  activeMoshaf: Moshaf | null;
  fusionEnabled: boolean;
  isFavorite: boolean;
  onFusionProgressChange: (progress: number) => void;
  onChangeReciter: () => void;
  onSelectMoshaf: (moshaf: Moshaf) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onPlay: () => void;
  sectionRef?: React.RefObject<HTMLElement | null>;
}

function getReciterBadge(reciterId: number, moshafName?: string): string {
  const location = RECITER_CATEGORIES.find(
    (c) => c.id !== 'quranify' && c.reciterIds.includes(reciterId),
  );
  if (location) return location.title;
  const editorial = RECITER_CATEGORIES.find(
    (c) => c.id === 'quranify' && c.reciterIds.includes(reciterId),
  );
  if (editorial) return editorial.title;
  return moshafName || 'Récitation';
}

function getAvailableSurahCount(moshaf: Moshaf | null): number {
  if (!moshaf?.surah_list) return 0;
  return moshaf.surah_list
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean).length;
}

export const ListenReciterHeader: React.FC<ListenReciterHeaderProps> = ({
  activeReciter,
  activeMoshaf,
  fusionEnabled,
  isFavorite,
  onFusionProgressChange,
  onChangeReciter,
  onSelectMoshaf,
  onToggleFavorite,
  onPlay,
  sectionRef,
}) => {
  const { progress, setHeaderRef, setSentinelRef } = useReciterNavFusion(fusionEnabled);

  React.useEffect(() => {
    onFusionProgressChange(progress);
  }, [progress, onFusionProgressChange]);

  React.useEffect(() => {
    if (!fusionEnabled) onFusionProgressChange(0);
  }, [fusionEnabled, onFusionProgressChange]);

  const badge = useMemo(
    () => getReciterBadge(activeReciter.id, activeMoshaf?.name),
    [activeReciter.id, activeMoshaf?.name],
  );
  const availableSurahCount = useMemo(
    () => getAvailableSurahCount(activeMoshaf),
    [activeMoshaf],
  );

  const mergeStyle = {
    ['--fusion-p' as string]: String(progress),
  } as React.CSSProperties;

  const controlsDisabled = progress >= 0.92;

  return (
    <>
      <div ref={setSentinelRef} className="h-0 w-full overflow-hidden" aria-hidden />
      <section
        ref={(node) => {
          setHeaderRef(node);
          if (sectionRef && 'current' in sectionRef) {
            (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        }}
        className={`listen-surah-header relative sticky top-0 z-20 md:top-24 md:scroll-mt-6 ${
          fusionEnabled && progress > 0.01 ? 'is-fusing' : ''
        }`}
        style={fusionEnabled ? mergeStyle : undefined}
      >
        <div
          className={`listen-surah-header-inner reciter-fusion-card brand-card backdrop-blur-md flex flex-col gap-3 rounded-none md:rounded-2xl md:shadow-lg md:shadow-black/20 md:gap-4 md:p-5 ${
            controlsDisabled ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center gap-3.5 pt-0 md:gap-4">
            <div className="reciter-fusion-avatar relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-full border-2 border-[#cea687]/40 bg-[#111d2d] shadow-[0_0_28px_rgba(206,166,135,0.18)] sm:h-24 sm:w-24">
              <img
                src={getReciterImage(activeReciter)}
                alt={activeReciter.name}
                width="96"
                height="96"
                className="h-full w-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  const fallback = getGeneratedReciterAvatar(activeReciter);
                  if (img.src !== fallback) img.src = fallback;
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <span className="brand-chip reciter-fusion-step inline-flex max-w-full items-center truncate rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                {badge}
              </span>
              <h2 className="reciter-fusion-name mt-2 text-xl font-black leading-tight tracking-tight text-[#f6f8fb] sm:text-2xl">
                {activeReciter.name}
              </h2>
              {(availableSurahCount > 0 || (activeMoshaf && badge !== activeMoshaf.name)) && (
                <p className="mt-1 truncate text-xs font-medium text-[#b4c0ce]">
                  {activeMoshaf && badge !== activeMoshaf.name ? activeMoshaf.name : null}
                  {activeMoshaf && badge !== activeMoshaf.name && availableSurahCount > 0 ? (
                    <span className="px-1 text-[#5f7388]">·</span>
                  ) : null}
                  {availableSurahCount > 0 ? (
                    <span className="font-semibold text-[#95a7ba]">
                      {availableSurahCount} sourates disponibles
                    </span>
                  ) : null}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 reciter-fusion-actions">
            <button
              type="button"
              onClick={onPlay}
              className="brand-button-primary inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold tap-feedback"
              tabIndex={controlsDisabled ? -1 : 0}
            >
              <Play className="h-4 w-4 fill-current" />
              Lire
            </button>
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              aria-pressed={isFavorite}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors tap-feedback ${
                isFavorite
                  ? 'border-[#cea687]/45 bg-[#f0d1bc]/16 text-[#f0d1bc]'
                  : 'border-[#46607b] bg-[#162538]/70 text-[#aab7c5] hover:text-[#f6f8fb]'
              }`}
              tabIndex={controlsDisabled ? -1 : 0}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onChangeReciter}
              className="brand-button-secondary shrink-0 rounded-full px-4 py-3 text-[12px] font-bold transition-colors tap-feedback"
              tabIndex={controlsDisabled ? -1 : 0}
            >
              Changer
            </button>
          </div>

          {activeReciter.moshaf.length > 1 && (
            <div className="reciter-fusion-riwaya flex flex-col gap-1.5 border-t border-[#30455c]/40 pt-3">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#95a7ba]">
                <Disc className="h-3 w-3 text-[#f0d1bc]" />
                Riwaya
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeReciter.moshaf.map((m) => {
                  const isMoshafSelected = activeMoshaf?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSelectMoshaf(m)}
                      className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all tap-feedback ${
                        isMoshafSelected
                          ? 'border-[#cea687]/35 bg-[#f0d1bc]/12 text-[#f1d4c1]'
                          : 'border-[#30455c] bg-[#111d2d]/68 text-[#b4c0ce] hover:bg-[#162538] hover:text-[#e6edf5]'
                      }`}
                      tabIndex={progress >= 0.35 ? -1 : 0}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
