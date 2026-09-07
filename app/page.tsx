'use client';
import { useState, useEffect } from 'react';
import {
  Mountain,
  ArrowUpRight,
  MapPin,
  Lock,
  Wallet,
  ArrowLeft,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Game from './game';
export default function Home() {
  const [screen, setScreen] = useState<'board' | 'listing' | 'play' | 'edit'>(
    'board',
  );
  const [money, setMoney] = useState(0);
  useEffect(() => {
    try {
      setMoney(Number(localStorage.getItem('oddjobs-money')) || 0);
    } catch {}
  }, []);
  return (
    <main>
      <header className="header">
        <a className="brand" href="/" aria-label="Odd Jobs home">
          <Mountain size={32} />
          <span>
            Odd Jobs<small>CLIMB HIGHER. DO GOODER.</small>
          </span>
        </a>
        <nav>
          <button
            className={
              screen === 'board' || screen === 'listing' ? 'nav-active' : ''
            }
            onClick={() => setScreen('board')}
          >
            Job board
          </button>
          <button
            className={screen === 'edit' ? 'nav-active' : ''}
            onClick={() => setScreen('edit')}
          >
            <SlidersHorizontal size={15} /> Level workshop
          </button>
        </nav>
        <div className="wallet">
          <Wallet size={16} />
          <span>
            ${money}
            <small> EARNED</small>
          </span>
        </div>
      </header>
      {screen === 'play' || screen === 'edit' ? (
        <Game
          editing={screen === 'edit'}
          onBack={() => setScreen('board')}
          onPaid={(amount) => {
            setMoney((m) => {
              const next = m + amount;
              try {
                localStorage.setItem('oddjobs-money', String(next));
              } catch {}
              return next;
            });
          }}
        />
      ) : (
        <div className="board">
          <div className="board-heading">
            <div>
              <p className="eyebrow">
                <span className="live-dot" /> YOUR NEIGHBOURHOOD NEEDS YOU
              </p>
              <h1>
                Small jobs.
                <br />
                <em>A little higher up.</em>
              </h1>
              <p>
                Professional climbing skills. Deeply unprofessional pay.
                <br />
                Find your next good deed in the neighbourhood.
              </p>
            </div>
            <div className="edition">
              EST. THIS MORNING
              <br />
              <strong>
                Good work.
                <br />
                Great heights.
              </strong>
              <span>LOCAL JOBS · BIG LITTLE ADVENTURES</span>
            </div>
          </div>
          <div className="section-line">
            <h2>
              {screen === 'listing'
                ? 'THE JOB DETAILS'
                : 'Around the neighbourhood'}
            </h2>
            <span>
              01 AVAILABLE JOB <i /> 5 COMING SOON
            </span>
          </div>
          <div className="job-grid">
            <article className="featured">
              <div className="job-photo">
                <img
                  src="/assets/cat-tree.png"
                  alt="Sunlit oak tree in a suburban backyard"
                />
                <span className="photo-badge">
                  <span className="live-dot" /> READY TO CLIMB
                </span>
                <span className="photo-caption">
                  A simple job.
                  <br />
                  <em>Or so they said.</em>
                </span>
                <span className="cat-pin">
                  🐈<small>Pickles is up here</small>
                </span>
                <div className="photo-footer">
                  <span>JOB NO. 001</span>
                  <span>RESCUE / RESIDENTIAL</span>
                </div>
              </div>
              <div className="job-info">
                <div className="job-title">
                  <div>
                    <p className="eyebrow">ONE TREE. ONE CAT. FOUR LIMBS.</p>
                    <h2>Cat stuck in tree</h2>
                  </div>
                  <div className="pay">
                    $40<small>ON COMPLETION</small>
                  </div>
                </div>
                <p className="quote">
                  “My cat Pickles climbed up the tree and won’t come down.
                  Please help.”
                </p>
                <div className="customer">
                  <span className="avatar">S</span>
                  <div>
                    <strong>Sarah, next door</strong>
                    <small>
                      <MapPin size={12} /> Residential · The backyard
                    </small>
                  </div>
                  <span className="verified">
                    <Check size={13} /> Neighbour verified
                  </span>
                </div>
                {screen === 'listing' && (
                  <div className="listing-details">
                    Climb the tree by moving each hand and foot. Grab Pickles
                    with one hand, then climb back down to Sarah. Your safety
                    rope will catch a fall. The return trip is half the job.
                  </div>
                )}
                <Button
                  className="accept"
                  onClick={() =>
                    setScreen(screen === 'board' ? 'listing' : 'play')
                  }
                >
                  {screen === 'board' ? 'View job' : 'Accept job'}
                  <ArrowUpRight size={20} />
                </Button>
                <p className="fineprint">
                  {screen === 'board'
                    ? 'No experience required. Except all the climbing experience.'
                    : 'Mouse or touch · No WASD · Your rope has your back'}
                </p>
              </div>
            </article>
            <aside className="upcoming">
              <div className="upcoming-heading">
                <span>ON THE HORIZON</span>
                <Lock size={13} />
              </div>
              {[
                [
                  '01',
                  'Clean my gutters',
                  '65',
                  'A little autumn maintenance.',
                ],
                [
                  '02',
                  'Clean solar panels',
                  '80',
                  'A brighter kind of dirty work.',
                ],
                [
                  '03',
                  'Ball stuck in tree',
                  '25',
                  'Same tree. Different problem.',
                ],
                [
                  '04',
                  'Church cross repair',
                  '250',
                  'A job with a higher calling.',
                ],
                [
                  '05',
                  'Tower light replacement',
                  '400',
                  'Definitely not a desk job.',
                ],
              ].map(([n, t, p, d]) => (
                <div className="locked-job" key={n}>
                  <span className="job-number">{n}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                    <span>
                      COMING SOON <Lock size={10} />
                    </span>
                  </div>
                  <strong>${p}</strong>
                </div>
              ))}
              <div className="note">
                <Mountain size={25} />
                <p>
                  Small jobs.
                  <br />
                  Brighter days.
                </p>
                <span>ONE GOOD DEED AT A TIME.</span>
              </div>
            </aside>
          </div>
          <footer>
            <span>ODD JOBS · A PHYSICS CLIMBING PROTOTYPE</span>
            <span>Four limbs. One very questionable career move.</span>
            <button onClick={() => setScreen('edit')}>
              Open level workshop <ArrowUpRight size={13} />
            </button>
          </footer>
        </div>
      )}
    </main>
  );
}
