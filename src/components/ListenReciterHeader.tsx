import React from 'react';
import { Disc } from 'lucide-react';
import type { Reciter, Moshaf } from '../types';
import { getGeneratedReciterAvatar, getReciterImage } from '../utils/images';
import { useReciterNavFusion } from '../hooks/useReciterNavFusion';

interface ListenReciterHeaderProps {
  activeReciter: Reciter;
  activeMoshaf: Moshaf | null;
  fusionEnabled: boolean;
  onFusionProgressChange: (progress: number) => void;
  onChangeReciter: () => void;
  onSelectMoshaf: (moshaf: Moshaf) => void;
  sectionRef?: React.RefObject<HTMLElement | null>;
}

export const ListenReciterHeader: React.FC<ListenReciterHeaderProps> = ({
  activeReciter,
  activeMoshaf,
  fusionEnabled,
  onFusionProgressChange,
  onChangeReciter,
  onSelectMoshaf,
  sectionRef,
}) => {
  const { progress, setHeaderRef, setSentinelRef } = useReciterNavFusion(fusionEnabled);

  React.useEffect(() => {
    onFusionProgressChange(progress);
  }, [progress, onFusionProgressChange]);

  React.useEffect(() => {
    if (!fusionEnabled) onFusionProgressChange(0);
  }, [fusionEnabled, onFusionProgressChange]);

  const mergeStyle = {
    ['--fusion-p' as string]: String(progress),
  } as React.CSSProperties;

  return (
    <>
      {/* Zero-height sentinel above sticky header (desktop fusion) — no visual gap */}
      <div ref={setSentinelRef} className="h-0 w-full overflow-hidden" aria-hidden />
      <section
        ref={(node) => {
          setHeaderRef(node);
          if (sectionRef && 'current' in sectionRef) {
            (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        }}
        className={`listen-surah-header sticky top-0 z-20 scroll-mt-6 md:top-24 ${
          fusionEnabled && progress > 0.01 ? 'is-fusing' : ''
        }`}
        style={fusionEnabled ? mergeStyle : undefined}
      >
        <div
          className={`listen-surah-header-inner reciter-fusion-card brand-card backdrop-blur-md flex flex-col gap-3 rounded-none md:rounded-2xl md:shadow-lg md:shadow-black/20 md:p-4 ${
            progress >= 0.92 ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="reciter-fusion-avatar w-12 h-12 rounded-xl overflow-hidden border border-[#46607b]/60 bg-[#111d2d] shrink-0">
              <img
                src={getReciterImage(activeReciter)}
                alt={activeReciter.name}
                width="48"
                height="48"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  const fallback = getGeneratedReciterAvatar(activeReciter);
                  if (img.src !== fallback) img.src = fallback;
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="reciter-fusion-step text-[10px] uppercase font-bold tracking-wider text-[#f0d1bc]">
                Étape 2 · Sourates
              </span>
              <h2 className="font-semibold text-[#f6f8fb] truncate">{activeReciter.name}</h2>
              {activeMoshaf && (
                <p className="text-xs text-[#b4c0ce] truncate">{activeMoshaf.name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onChangeReciter}
              className="brand-button-secondary shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition-colors tap-feedback"
              tabIndex={progress >= 0.92 ? -1 : 0}
            >
              Changer
            </button>
          </div>

          {activeReciter.moshaf.length > 1 && (
            <div className="reciter-fusion-riwaya flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#95a7ba] flex items-center gap-1.5">
                <Disc className="w-3 h-3 text-[#f0d1bc]" />
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
                      className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all tap-feedback ${
                        isMoshafSelected
                          ? 'bg-[#f0d1bc]/12 border-[#cea687]/35 text-[#f1d4c1]'
                          : 'bg-[#111d2d]/68 border-[#30455c] text-[#b4c0ce] hover:bg-[#162538] hover:text-[#e6edf5]'
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
