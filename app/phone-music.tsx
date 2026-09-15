import { Music2, SkipBack, SkipForward, Play } from 'lucide-react';
export default function PhoneMusic() {
  return (
    <div className="phone-music">
      <header>
        <small>YOUR MUSIC</small>
        <h2>Something for the climb.</h2>
      </header>
      <div className="music-art">
        <Music2 size={52} strokeWidth={1.3} />
      </div>
      <h3>No track selected</h3>
      <p>Your music library will live here.</p>
      <div className="music-progress" aria-hidden="true">
        <span />
      </div>
      <div className="music-times">
        <span>0:00</span>
        <span>0:00</span>
      </div>
      <div className="music-transport">
        <button disabled aria-label="Previous track">
          <SkipBack size={22} />
        </button>
        <button disabled aria-label="Play — no tracks available">
          <Play size={28} />
        </button>
        <button disabled aria-label="Next track">
          <SkipForward size={22} />
        </button>
      </div>
      <section className="music-library">
        <h3>Library</h3>
        <strong>No music added yet</strong>
        <p>
          Track selection is coming in a future update. For now, enjoy the
          outback ambience.
        </p>
      </section>
    </div>
  );
}
