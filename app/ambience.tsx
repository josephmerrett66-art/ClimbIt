'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '@/components/ui/popover';
import {
  DEFAULT_SOUND,
  readSoundSettings,
  saveSoundSettings,
  type SoundSettings,
} from '@/lib/game/sound-settings';

export default function Ambience({ basePath = '' }: { basePath?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const mutedRef = useRef(false);
  const started = useRef(false);
  const [settings, setSettings] = useState(DEFAULT_SOUND);
  useEffect(() => {
    const media = audio.current!;
    const sync = () => {
      const next = readSoundSettings();
      setSettings(next);
      mutedRef.current = next.muted;
      media.volume = next.ambience;
      if (next.muted || next.ambience === 0) media.pause();
      else if (started.current && !document.hidden)
        void media.play().catch(() => {});
    };
    sync();
    window.addEventListener('oddjobs-sound-change', sync);
    const play = () => {
      if (!mutedRef.current && media.volume > 0 && !document.hidden) {
        started.current = true;
        void media.play().catch(() => {
          /* Retry on the next user gesture. */
        });
      }
    };
    const visibility = () => {
      if (document.hidden) media.pause();
      else if (started.current) play();
    };
    // Browsers require an actual gesture before starting audible playback.
    document.addEventListener('pointerdown', play, { passive: true });
    document.addEventListener('keydown', play);
    document.addEventListener('visibilitychange', visibility);
    // Attempt autoplay on app open; browsers that block it retry on gesture.
    play();
    return () => {
      document.removeEventListener('pointerdown', play);
      document.removeEventListener('keydown', play);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('oddjobs-sound-change', sync);
      media.pause();
    };
  }, [basePath]);
  const change = (patch: Partial<SoundSettings>) => {
    started.current = true;
    saveSoundSettings({ ...readSoundSettings(), ...patch });
  };
  return (
    <>
      <audio
        ref={audio}
        src={`${basePath}/audio/quorn-outback-ambience.mp3`}
        loop
        preload="none"
      />
      <Popover>
        <PopoverTrigger
          className="phone-launch ambience-toggle"
          aria-label="Sound settings"
          title="Sound settings"
        >
          {settings.muted || (settings.ambience === 0 && settings.sfx === 0) ? (
            <VolumeX size={20} />
          ) : (
            <Volume2 size={20} />
          )}
        </PopoverTrigger>
        <PopoverContent
          side="left"
          align="end"
          sideOffset={12}
          className="sound-settings"
        >
          <PopoverTitle>Sound settings</PopoverTitle>
          {(
            [
              ['sfx', 'Sound effects'],
              ['ambience', 'Ambience'],
            ] as const
          ).map(([key, label]) => (
            <div className="sound-setting" key={key}>
              <div>
                <span id={`sound-${key}`}>{label}</span>
                <output>{Math.round(settings[key] * 100)}%</output>
              </div>
              <Slider
                aria-labelledby={`sound-${key}`}
                value={[Math.round(settings[key] * 100)]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) =>
                  change({
                    [key]: (Array.isArray(value) ? value[0] : value) / 100,
                  })
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="sound-mute"
            aria-pressed={settings.muted}
            onClick={() => change({ muted: !settings.muted })}
          >
            {settings.muted ? 'Unmute all sound' : 'Mute all sound'}
          </button>
        </PopoverContent>
      </Popover>
    </>
  );
}
