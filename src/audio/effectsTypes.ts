export type AudioEffectPresetId = 'off' | 'soft' | 'mosque' | 'bass' | 'clear' | 'custom';

export interface AudioEffectsSettings {
  enabled: boolean;
  preset: AudioEffectPresetId;
  /** Low-shelf gain in dB (−12 … 12) */
  bass: number;
  /** High-shelf gain in dB (−12 … 12) */
  treble: number;
  /** Echo wet amount (0 … 1) */
  echo: number;
  /** Reverb wet amount (0 … 1) */
  reverb: number;
}

export const DEFAULT_AUDIO_EFFECTS: AudioEffectsSettings = {
  enabled: false,
  preset: 'off',
  bass: 0,
  treble: 0,
  echo: 0,
  reverb: 0,
};

export type AudioEffectPresetMeta = {
  id: AudioEffectPresetId;
  label: string;
  description: string;
  settings: Omit<AudioEffectsSettings, 'preset'>;
};

export const AUDIO_EFFECT_PRESETS: AudioEffectPresetMeta[] = [
  {
    id: 'off',
    label: 'Off',
    description: 'Son original',
    settings: { enabled: false, bass: 0, treble: 0, echo: 0, reverb: 0 },
  },
  {
    id: 'soft',
    label: 'Doux',
    description: 'Chaleur légère',
    settings: { enabled: true, bass: 2.5, treble: 1, echo: 0.06, reverb: 0.16 },
  },
  {
    id: 'mosque',
    label: 'Mosquée',
    description: 'Espace ample',
    settings: { enabled: true, bass: 1.5, treble: -0.5, echo: 0.2, reverb: 0.52 },
  },
  {
    id: 'bass',
    label: 'Basses',
    description: 'Graves renforcés',
    settings: { enabled: true, bass: 8, treble: -1.5, echo: 0.04, reverb: 0.1 },
  },
  {
    id: 'clear',
    label: 'Clarté',
    description: 'Voix plus nette',
    settings: { enabled: true, bass: -1, treble: 5.5, echo: 0, reverb: 0.06 },
  },
];

const STORAGE_KEY = 'quran_streamer_audio_effects';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const normalizeAudioEffects = (
  partial: Partial<AudioEffectsSettings> | null | undefined
): AudioEffectsSettings => {
  const merged = { ...DEFAULT_AUDIO_EFFECTS, ...(partial ?? {}) };
  const preset = AUDIO_EFFECT_PRESETS.some((p) => p.id === merged.preset) || merged.preset === 'custom'
    ? merged.preset
    : 'off';

  return {
    enabled: Boolean(merged.enabled),
    preset,
    bass: clamp(Number(merged.bass) || 0, -12, 12),
    treble: clamp(Number(merged.treble) || 0, -12, 12),
    echo: clamp(Number(merged.echo) || 0, 0, 1),
    reverb: clamp(Number(merged.reverb) || 0, 0, 1),
  };
};

export const loadAudioEffects = (): AudioEffectsSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUDIO_EFFECTS;
    return normalizeAudioEffects(JSON.parse(raw) as Partial<AudioEffectsSettings>);
  } catch {
    return DEFAULT_AUDIO_EFFECTS;
  }
};

export const saveAudioEffects = (settings: AudioEffectsSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / private mode
  }
};

export const effectsNeedProcessing = (settings: AudioEffectsSettings): boolean => {
  if (!settings.enabled) return false;
  return (
    Math.abs(settings.bass) > 0.05 ||
    Math.abs(settings.treble) > 0.05 ||
    settings.echo > 0.01 ||
    settings.reverb > 0.01
  );
};
