import React, { useEffect, useMemo, useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { useComparePlayers, type CompareSide } from '../hooks/useComparePlayers';
import { SURAHS } from '../data/surahs';
import type { Reciter, Surah } from '../types';
import { getGeneratedReciterAvatar, getReciterImage } from '../utils/images';
import { getDefaultMoshaf } from '../utils/audioUrl';
import {
  ArrowLeftRight, Pause, Play, Search, GitCompare, RefreshCw, AlertCircle,
} from 'lucide-react';

const DEFAULT_COMPARE_IDS = [123, 54] as const;

const formatTime = (time: number) => {
  if (!Number.isFinite(time) || time < 0) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface ReciterSlotPickerProps {
  label: string;
  side: CompareSide;
  accentClass: string;
  borderClass: string;
  reciter: Reciter | null;
  reciters: Reciter[];
  isActive: boolean;
  status: string;
  onSelect: (reciter: Reciter) => void;
}

const ReciterSlotPicker: React.FC<ReciterSlotPickerProps> = ({
  label,
  side,
  accentClass,
  borderClass,
  reciter,
  reciters,
  isActive,
  status,
  onSelect,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return reciters.slice(0, 8);
    const q = query.toLowerCase();
    return reciters.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 8);
  }, [reciters, query]);

  const imageUrl = reciter ? getReciterImage(reciter) : '';
  const fallback = reciter ? getGeneratedReciterAvatar(reciter) : '';

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all ${borderClass} ${isActive ? 'ring-1 ring-emerald-500/30 shadow-lg' : 'bg-slate-900/40'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-black uppercase tracking-widest ${accentClass}`}>{label}</span>
        {isActive && status === 'playing' && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 animate-pulse">En lecture</span>
        )}
      </div>

      {reciter ? (
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 shrink-0">
            <img
              src={imageUrl}
              alt={reciter.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                if (fallback) e.currentTarget.src = fallback;
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-slate-100 truncate">{reciter.name}</p>
            <p className="text-[10px] text-slate-500 truncate">
              {getDefaultMoshaf(reciter.moshaf)?.name ?? '—'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Choisissez un récitateur</p>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Récitateur ${side}…`}
          className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
        />
      </div>

      {query.trim() && (
        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onSelect(r);
                setQuery('');
              }}
              className={`text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                reciter?.id === r.id
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface CompareSlotControlsProps {
  side: CompareSide;
  reciter: Reciter | null;
  status: string;
  isActive: boolean;
  accentClass: string;
  onToggle: () => void;
}

const CompareSlotControls: React.FC<CompareSlotControlsProps> = ({
  side,
  reciter,
  status,
  isActive,
  accentClass,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    disabled={!reciter}
    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all tap-feedback disabled:opacity-40 disabled:cursor-not-allowed ${
      isActive && status === 'playing'
        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
        : 'bg-slate-900 border border-slate-800 text-slate-200 hover:border-emerald-500/40'
    }`}
  >
    {status === 'buffering' ? (
      <RefreshCw className={`w-4 h-4 animate-spin ${accentClass}`} />
    ) : isActive && status === 'playing' ? (
      <Pause className="w-4 h-4 fill-current" />
    ) : (
      <Play className="w-4 h-4 fill-current ml-0.5" />
    )}
    {status === 'buffering' ? 'Chargement…' : isActive && status === 'playing' ? 'Pause' : `Écouter ${side}`}
  </button>
);

export const ReciterCompare: React.FC = () => {
  const { reciters } = useAudio();
  const {
    slotA, slotB, activeSide, activeSlot,
    syncSources, toggleSide, switchActiveSide, seekActive, pauseAll,
  } = useComparePlayers();

  const [reciterA, setReciterA] = useState<Reciter | null>(null);
  const [reciterB, setReciterB] = useState<Reciter | null>(null);
  const [surah, setSurah] = useState<Surah>(SURAHS[0]);
  const [surahSearch, setSurahSearch] = useState('');

  useEffect(() => {
    if (reciters.length === 0) return;
    if (!reciterA) {
      setReciterA(reciters.find((r) => r.id === DEFAULT_COMPARE_IDS[0]) ?? reciters[0]);
    }
    if (!reciterB) {
      setReciterB(
        reciters.find((r) => r.id === DEFAULT_COMPARE_IDS[1])
          ?? reciters.find((r) => r.id !== reciterA?.id)
          ?? reciters[1]
          ?? reciters[0]
      );
    }
  }, [reciters, reciterA, reciterB]);

  useEffect(() => {
    if (reciterA && reciterB && surah) {
      syncSources(reciterA, reciterB, surah);
    }
  }, [reciterA, reciterB, surah, syncSources]);

  const filteredSurahs = useMemo(() => {
    if (!surahSearch.trim()) return SURAHS;
    const q = surahSearch.toLowerCase();
    return SURAHS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.arabicName.includes(surahSearch) ||
        s.id.toString().includes(q)
    );
  }, [surahSearch]);

  const progressPercent = activeSlot.duration > 0
    ? (activeSlot.currentTime / activeSlot.duration) * 100
    : 0;

  const hasError = slotA.status === 'error' || slotB.status === 'error';
  const canCompare = reciterA && reciterB && reciterA.id !== reciterB.id;

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-panel p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5">
        <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-sky-400" />
          Comparateur A / B
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Écoutez la même sourate avec deux récitateurs. Basculez instantanément entre les voix au même instant de lecture.
        </p>
      </div>

      {!canCompare && reciterA && reciterB && reciterA.id === reciterB.id && (
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Choisissez deux récitateurs différents pour comparer.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Sourate à comparer</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={surahSearch}
            onChange={(e) => setSurahSearch(e.target.value)}
            placeholder="Rechercher une sourate…"
            className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/40"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {(surahSearch.trim() ? filteredSurahs : SURAHS.filter((s) => [1, 18, 36, 55, 67, 112].includes(s.id))).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSurah(s);
                setSurahSearch('');
                pauseAll();
              }}
              className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                surah.id === s.id
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.id}. {s.name}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-slate-300">
          <span className="font-serif arabic-text text-sky-300 text-lg mr-2">{surah.arabicName}</span>
          {surah.name} — {surah.englishTranslation}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReciterSlotPicker
          label="Voix A"
          side="A"
          accentClass="text-sky-400"
          borderClass={activeSide === 'A' ? 'border-sky-500/40 bg-sky-500/5' : 'border-slate-800/60'}
          reciter={reciterA}
          reciters={reciters}
          isActive={activeSide === 'A'}
          status={slotA.status}
          onSelect={setReciterA}
        />
        <ReciterSlotPicker
          label="Voix B"
          side="B"
          accentClass="text-violet-400"
          borderClass={activeSide === 'B' ? 'border-violet-500/40 bg-violet-500/5' : 'border-slate-800/60'}
          reciter={reciterB}
          reciters={reciters}
          isActive={activeSide === 'B'}
          status={slotB.status}
          onSelect={setReciterB}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CompareSlotControls
          side="A"
          reciter={reciterA}
          status={slotA.status}
          isActive={activeSide === 'A'}
          accentClass="text-sky-400"
          onToggle={() => void toggleSide('A')}
        />
        <CompareSlotControls
          side="B"
          reciter={reciterB}
          status={slotB.status}
          isActive={activeSide === 'B'}
          accentClass="text-violet-400"
          onToggle={() => void toggleSide('B')}
        />
      </div>

      <button
        onClick={() => {
          if (!activeSide) {
            void toggleSide('A');
            return;
          }
          void switchActiveSide(activeSide === 'A' ? 'B' : 'A');
        }}
        disabled={!canCompare}
        className="w-full py-3.5 rounded-2xl border border-slate-700 bg-slate-900/70 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 hover:border-emerald-500/40 hover:text-emerald-300 transition-all tap-feedback disabled:opacity-40"
      >
        <ArrowLeftRight className="w-4 h-4" />
        Basculer A ↔ B (même position)
      </button>

      <div className="glass-panel p-4 rounded-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>{formatTime(activeSlot.currentTime)}</span>
          <span className="uppercase tracking-widest font-bold">
            {activeSide ? `Voix ${activeSide}` : 'Aucune lecture'}
          </span>
          <span>{formatTime(activeSlot.duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={activeSlot.duration || 100}
          step={0.1}
          value={activeSlot.currentTime}
          onChange={(e) => seekActive(parseFloat(e.target.value))}
          disabled={!activeSide}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
          style={{
            background: activeSide
              ? `linear-gradient(to right, ${activeSide === 'A' ? '#0ea5e9' : '#8b5cf6'} 0%, ${activeSide === 'A' ? '#0ea5e9' : '#8b5cf6'} ${progressPercent}%, #1e293b ${progressPercent}%, #1e293b 100%)`
              : undefined,
          }}
        />
      </div>

      {hasError && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Impossible de charger un flux audio. Vérifiez la connexion ou changez de récitateur.
        </div>
      )}
    </div>
  );
};
