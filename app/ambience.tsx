'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function Ambience({ basePath = '' }: { basePath?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const mutedRef = useRef(false);
  const started = useRef(false);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    const media = audio.current!;
    try {
      mutedRef.current =
        localStorage.getItem('oddjobs-ambience-muted') === 'true';
    } catch {}
    setMuted(mutedRef.current);
    media.volume = 0.3;
    const play = () => {
      if (!mutedRef.current && !document.hidden) {
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
    return () => {
      document.removeEventListener('pointerdown', play);
      document.removeEventListener('keydown', play);
      document.removeEventListener('visibilitychange', visibility);
      media.pause();
    };
  }, [basePath]);
  const toggle = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    try {
      localStorage.setItem('oddjobs-ambience-muted', String(next));
    } catch {}
    if (next) audio.current?.pause();
    else {
      started.current = true;
      void audio.current?.play().catch(() => {});
    }
  };
  return (
    <>
      <audio
        ref={audio}
        src={`${basePath}/audio/quorn-outback-ambience.mp3`}
        loop
        preload="none"
      />
      <button
        type="button"
        className="phone-launch ambience-toggle"
        onClick={toggle}
        aria-label={muted ? 'Unmute ambience' : 'Mute ambience'}
        aria-pressed={muted}
        title={muted ? 'Unmute ambience' : 'Mute ambience'}
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </>
  );
}
