import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Music2, Pause, SkipBack, SkipForward, Play } from 'lucide-react';

type Track = { name: string; detail: string; file: string };

const TRACKS: Track[] = [
  {
    name: 'Y2K Jungle',
    detail: 'PS1 / Dreamcast DnB mix',
    file: 'music-y2k-jungle.m4a',
  },
  {
    name: 'Ambient Jungle',
    detail: 'Intelligent DnB mix',
    file: 'music-ambient-jungle.m4a',
  },
  {
    name: 'Forest Atmosphere',
    detail: 'Ghibli inspired ambience',
    file: 'music-forest-atmosphere.m4a',
  },
  {
    name: 'Nia Archives',
    detail: 'The Lot Radio set',
    file: 'music-nia-archives.m4a',
  },
];

const clock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
};

export default function PhoneMusic({
  basePath = '',
  controlsTarget,
}: {
  basePath?: string;
  controlsTarget: HTMLDivElement | null;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // While a drag is in progress the bar follows the finger, not playback, so a
  // timeupdate mid-drag cannot yank the handle back.
  const [scrub, setScrub] = useState<number | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const track = TRACKS[selected];
  const shown = scrub ?? currentTime;
  const position = duration ? Math.min(100, (shown / duration) * 100) : 0;
  const source = `${basePath}/audio/${track.file}`;

  useEffect(() => {
    const media = audio.current;
    if (!media) return;
    media.pause();
    media.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    setScrub(null);
    setPlaying(false);
  }, [source]);

  const togglePlayback = () => {
    const media = audio.current;
    if (!media) return;
    if (media.paused) {
      void media
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      media.pause();
      setPlaying(false);
    }
  };
  const seek = (clientX: number) => {
    const rect = bar.current?.getBoundingClientRect();
    const media = audio.current;
    if (!rect || !rect.width || !media || !duration) return;
    const fraction = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / rect.width),
    );
    const time = fraction * duration;
    media.currentTime = time;
    setCurrentTime(time);
    setScrub(time);
  };
  const nudge = (delta: number) => {
    const media = audio.current;
    if (!media || !duration) return;
    const time = Math.min(duration, Math.max(0, (scrub ?? currentTime) + delta));
    media.currentTime = time;
    setCurrentTime(time);
  };
  const skip = (delta: number) =>
    setSelected((value) => (value + delta + TRACKS.length) % TRACKS.length);

  return (
    <>
      <audio
        ref={audio}
        src={source}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => {
          if (scrub === null) setCurrentTime(event.currentTarget.currentTime);
        }}
        onEnded={() => setPlaying(false)}
      />
      {controlsTarget &&
        createPortal(
          <div className="phone-music">
            <header>
              <small>YOUR MUSIC</small>
              <h2>Something for the climb.</h2>
            </header>
            <div className="music-art" aria-hidden="true">
              <Music2 size={52} strokeWidth={1.3} />
            </div>
            <h3>{track.name}</h3>
            <p>{track.detail}</p>
            <div
              className={`music-scrub${scrub === null ? '' : ' scrubbing'}`}
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration) || 0}
              aria-valuenow={Math.round(scrub ?? currentTime)}
              aria-valuetext={clock(scrub ?? currentTime)}
              onPointerDown={(event) => {
                if (!duration) return;
                // Capture keeps the drag alive past the edges of a 4px bar, but
                // it is not worth losing the seek over if the browser refuses.
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {}
                seek(event.clientX);
              }}
              onPointerMove={(event) => {
                if (scrub !== null) seek(event.clientX);
              }}
              onPointerUp={(event) => {
                if (scrub === null) return;
                try {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                } catch {}
                setScrub(null);
              }}
              onPointerCancel={() => setScrub(null)}
              onKeyDown={(event) => {
                const step =
                  event.key === 'ArrowLeft'
                    ? -5
                    : event.key === 'ArrowRight'
                      ? 5
                      : event.key === 'PageDown'
                        ? -30
                        : event.key === 'PageUp'
                          ? 30
                          : 0;
                if (!step) return;
                event.preventDefault();
                nudge(step);
              }}
            >
              <div className="music-progress" ref={bar}>
                <span style={{ width: `${position}%` }} />
              </div>
              <i
                className="music-thumb"
                style={{ left: `${position}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="music-times">
              <span>{clock(shown)}</span>
              <span>{clock(duration)}</span>
            </div>
            <div className="music-transport">
              <button
                type="button"
                onClick={() => skip(-1)}
                aria-label="Previous track"
              >
                <SkipBack size={22} />
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause size={25} /> : <Play size={28} />}
              </button>
              <button
                type="button"
                onClick={() => skip(1)}
                aria-label="Next track"
              >
                <SkipForward size={22} />
              </button>
            </div>
            <section className="music-library">
              <h3>Library</h3>
              {TRACKS.map((item, index) => (
                <button
                  type="button"
                  key={item.file}
                  className={`music-track ${index === selected ? 'selected' : ''}`}
                  onClick={() => setSelected(index)}
                >
                  <span>{item.name}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </section>
          </div>,
          controlsTarget,
        )}
    </>
  );
}
