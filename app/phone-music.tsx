import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Music2, Pause, SkipBack, SkipForward, Play } from 'lucide-react';

type Track = { name: string; detail: string; file: string };

const TRACKS: Track[] = [
  { name: 'Y2K Jungle', detail: 'PS1 / Dreamcast DnB mix', file: 'music-y2k-jungle.m4a' },
  { name: 'Ambient Jungle', detail: 'Intelligent DnB mix', file: 'music-ambient-jungle.m4a' },
  { name: 'Forest Atmosphere', detail: 'Ghibli inspired ambience', file: 'music-forest-atmosphere.m4a' },
  { name: 'Nia Archives', detail: 'The Lot Radio set', file: 'music-nia-archives.m4a' },
];

const clock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
};

export default function PhoneMusic({ basePath = '', controlsTarget }: { basePath?: string; controlsTarget: HTMLDivElement | null }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const track = TRACKS[selected];
  const source = `${basePath}/audio/${track.file}`;

  useEffect(() => {
    const media = audio.current;
    if (!media) return;
    media.pause();
    media.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
  }, [source]);

  const togglePlayback = () => {
    const media = audio.current;
    if (!media) return;
    if (media.paused) {
      void media.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      media.pause();
      setPlaying(false);
    }
  };
  const skip = (delta: number) => setSelected((value) => (value + delta + TRACKS.length) % TRACKS.length);

  return (
    <>
      <audio
        ref={audio}
        src={source}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
      />
      {controlsTarget && createPortal(<div className="phone-music">
      <header>
        <small>YOUR MUSIC</small>
        <h2>Something for the climb.</h2>
      </header>
      <div className="music-art" aria-hidden="true"><Music2 size={52} strokeWidth={1.3} /></div>
      <h3>{track.name}</h3>
      <p>{track.detail}</p>
      <div className="music-progress" aria-hidden="true">
        <span style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
      </div>
      <div className="music-times"><span>{clock(currentTime)}</span><span>{clock(duration)}</span></div>
      <div className="music-transport">
        <button type="button" onClick={() => skip(-1)} aria-label="Previous track"><SkipBack size={22} /></button>
        <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={25} /> : <Play size={28} />}</button>
        <button type="button" onClick={() => skip(1)} aria-label="Next track"><SkipForward size={22} /></button>
      </div>
      <section className="music-library">
        <h3>Library</h3>
        {TRACKS.map((item, index) => (
          <button type="button" key={item.file} className={`music-track ${index === selected ? 'selected' : ''}`} onClick={() => setSelected(index)}>
            <span>{item.name}</span><small>{item.detail}</small>
          </button>
        ))}
      </section>
    </div>, controlsTarget)}
    </>
  );
}
