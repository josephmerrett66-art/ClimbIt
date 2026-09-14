export type SoundSettings = { ambience: number; sfx: number; muted: boolean };
export const DEFAULT_SOUND: SoundSettings = {
  ambience: 0.3,
  sfx: 1,
  muted: false,
};
const key = 'oddjobs-sound-settings';
let memory: SoundSettings | null = null;
const volume = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.max(0, Math.min(1, v))
    : fallback;
export function readSoundSettings(): SoundSettings {
  if (memory) return memory;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    memory =
      saved && typeof saved === 'object'
        ? {
            ambience: volume(saved.ambience, DEFAULT_SOUND.ambience),
            sfx: volume(saved.sfx, DEFAULT_SOUND.sfx),
            muted: saved.muted === true,
          }
        : {
            ...DEFAULT_SOUND,
            muted: localStorage.getItem('oddjobs-ambience-muted') === 'true',
          };
  } catch {
    memory = { ...DEFAULT_SOUND };
  }
  return memory;
}
export function saveSoundSettings(next: SoundSettings) {
  memory = {
    ambience: volume(next.ambience, 0.3),
    sfx: volume(next.sfx, 1),
    muted: next.muted === true,
  };
  try {
    localStorage.setItem(key, JSON.stringify(memory));
  } catch {}
  window.dispatchEvent(new Event('oddjobs-sound-change'));
}
