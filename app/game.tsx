'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Ambience from './ambience';
import { GripAudio } from '@/lib/game/grip-audio';
import { readSoundSettings } from '@/lib/game/sound-settings';
import StoryInbox from './story-inbox';
import PhoneMusic from './phone-music';
import { magpieFor } from '@/lib/game/magpie';
import { drawMagpie } from '@/lib/game/magpie-render';
import { cigaretteFor } from '@/lib/game/cigarette';
import { drawCigarette } from '@/lib/game/cigarette-render';
import { jumpFor } from '@/lib/game/jump';
import { storyMessages, debtPayment } from '@/lib/game/story';
import { efficiencyBonus } from '@/lib/game/scoring';
import {
  ArrowLeft,
  RotateCcw,
  Play,
  Download,
  Upload,
  Undo2,
  Trash2,
  Plus,
  Minus,
  Pause,
  MousePointer2,
  Hand,
  Footprints,
  Check,
  Maximize,
  Minimize,
  X,
  Smartphone,
  BriefcaseBusiness,
  Landmark,
  MessageSquare,
  Music2,
  MapPin,
  ChevronRight,
  Cigarette,
  CircleSlash,
  ArrowUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseLevel, type Level, type Point } from '@/lib/game/level';
import { Climber, LIMBS, distance, type Limb } from '@/lib/game/physics';
import { draw, type View } from '@/lib/game/render';
import { pubJob } from '@/lib/game/pub-level';
import { jumpLabJob } from '@/lib/game/jump-lab';
import { AUSTRALIAN_JOBS } from '@/lib/game/australian-jobs';
import {
  START_ZOOM,
  cameraTarget,
  selectLimb,
  dragTarget,
} from '@/lib/game/controls';
type Tool =
  | 'select'
  | 'grip'
  | 'edge'
  | 'rect'
  | 'spawn'
  | 'objective'
  | 'zone'
  | 'camera';
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const time = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(s % 60)
    .toString()
    .padStart(2, '0')}`;
const STARTING_DEBT = 12000;
type Finances = {
  balance: number;
  debt: number;
  lifetimeEarnings: number;
  completedJobs: string[];
};
type Payout = {
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bonus?: number;
  moves?: number;
};
const EMPTY_FINANCES: Finances = {
  balance: 0,
  debt: STARTING_DEBT,
  lifetimeEarnings: 0,
  completedJobs: [],
};
const JOBS = [jumpLabJob, pubJob, ...AUSTRALIAN_JOBS];
const money = (amount: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);
export default function Game({
  editing,
  onBack,
  onPaid,
  initialLevel = AUSTRALIAN_JOBS[0].level,
  basePath = '',
}: {
  editing: boolean;
  onBack: () => void;
  onPaid: (n: number) => void;
  initialLevel?: Level;
  basePath?: string;
}) {
  const [storyRead, setStoryRead] = useState<string[]>([]);
  const [storyReady, setStoryReady] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const gripAudio = useRef<GripAudio | null>(null);
  const [musicControlsTarget, setMusicControlsTarget] =
    useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const sound = new GripAudio(basePath);
    gripAudio.current = sound;
    const syncMute = () => {
      const settings = readSoundSettings();
      sound.setMuted(settings.muted);
      sound.setVolume(settings.sfx);
    };
    syncMute();
    window.addEventListener('oddjobs-sound-change', syncMute);
    return () => {
      window.removeEventListener('oddjobs-sound-change', syncMute);
      sound.dispose();
      gripAudio.current = null;
    };
  }, [basePath]);
  const canvas = useRef<HTMLCanvasElement>(null),
    level = useRef<Level>(clone(initialLevel)),
    game = useRef<Climber | null>(null),
    view = useRef<View>({ scale: 1, x: 0, y: 0 }),
    images = useRef<{
      bg: HTMLImageElement | null;
      fg: HTMLImageElement | null;
      cat: HTMLImageElement | null;
    }>({ bg: null, fg: null, cat: null });
  const [edit, setEdit] = useState(editing),
    [tool, setTool] = useState<Tool>('select'),
    [revision, setRevision] = useState(0),
    [hud, setHud] = useState({
      seconds: 0,
      carrying: false,
      complete: false,
      failed: false,
      grips: 0,
      moves: 0,
      message: 'Drag a hand or boot onto a solid edge.',
      jumpState: 'idle',
      jumpCharge: 0,
    }),
    [paused, setPaused] = useState(false),
    [zoom, setZoom] = useState(
      initialLevel.testMode === 'jump' ? 1.15 : START_ZOOM,
    ),
    [touchControls, setTouchControls] = useState(false),
    [fullscreen, setFullscreen] = useState(false),
    [hintVisible, setHintVisible] = useState(true),
    [selected, setSelected] = useState<string | null>(null),
    [notice, setNotice] = useState(''),
    [debug, setDebug] = useState(false),
    [chosen, setChosen] = useState<Limb | null>(null),
    [phoneOpen, setPhoneOpen] = useState(false),
    [phoneTab, setPhoneTab] = useState<'jobs' | 'bank' | 'messages' | 'music'>(
      'jobs',
    ),
    [finances, setFinances] = useState<Finances>(EMPTY_FINANCES),
    [phoneUnread, setPhoneUnread] = useState(false),
    [payout, setPayout] = useState<Payout | null>(null);
  const settings = useRef({
    edit,
    editing,
    tool,
    paused,
    zoom,
    selected,
    chosen,
    debug,
  });
  settings.current = {
    edit,
    editing,
    tool,
    paused,
    zoom,
    selected,
    chosen,
    debug,
  };
  const cameraReady = useRef(false),
    viewport = useRef({ width: 0, height: 0 }),
    dragOffset = useRef<Point>({ x: 0, y: 0 }),
    active = useRef<number | null>(null),
    gesture = useRef<{
      a: Point;
      b: Point;
      tool: Tool;
      id?: string;
      original?: any;
    } | null>(null),
    history = useRef<Level[]>([]),
    paid = useRef(false),
    paidCallback = useRef(onPaid),
    financesRef = useRef<Finances>(EMPTY_FINANCES);
  paidCallback.current = onPaid;
  financesRef.current = finances;
  const bgUpload = useRef<HTMLInputElement>(null),
    jsonUpload = useRef<HTMLInputElement>(null),
    fgUpload = useRef<HTMLInputElement>(null);
  const snapshot = () => {
    history.current.push(clone(level.current));
    if (history.current.length > 40) history.current.shift();
  };
  const reset = () => {
    cameraReady.current = false;
    game.current = new Climber(level.current, !editing);
    paid.current = false;
    setHud({
      seconds: 0,
      carrying: false,
      complete: false,
      failed: false,
      grips: 0,
      moves: 0,
      message: 'Drag a hand or boot onto a solid edge.',
      jumpState: 'idle',
      jumpCharge: 0,
    });
    setChosen(null);
    setPayout(null);
    setPaused(false);
    active.current = null;
    gesture.current = null;
  };
  const saveFinances = (next: Finances) => {
    financesRef.current = next;
    setFinances(next);
    try {
      localStorage.setItem('oddjobs-finances', JSON.stringify(next));
    } catch {}
  };
  const recordPay = (
    jobId: string,
    amount: number,
    detail?: { bonus: number; moves: number },
  ) => {
    const current = financesRef.current,
      next = {
        balance: current.balance + amount,
        debt: current.debt,
        lifetimeEarnings: current.lifetimeEarnings + amount,
        completedJobs: current.completedJobs.includes(jobId)
          ? current.completedJobs
          : [...current.completedJobs, jobId],
      };
    saveFinances(next);
    setPayout({
      amount,
      balanceBefore: current.balance,
      balanceAfter: next.balance,
      bonus: detail?.bonus,
      moves: detail?.moves,
    });
    setPhoneUnread(true);
  };
  const messages = storyMessages(finances);
  const unreadStory = messages.filter(
    (message) => !message.outgoing && !storyRead.includes(message.id),
  ).length;
  const openPhone = () => {
    game.current?.end(true);
    active.current = null;
    setChosen(null);
    setPhoneOpen(true);
    setPaused(true);
    setPhoneUnread(false);
  };
  const closePhone = () => {
    setPhoneOpen(false);
    setPaused(false);
  };
  const openPhoneTo = (tab: 'jobs' | 'bank' | 'messages' | 'music') => {
    setPayout(null);
    setPhoneTab(tab);
    openPhone();
  };
  const payDebt = () => {
    const payment = debtPayment(finances.balance, finances.debt, paymentAmount);
    if (!payment) return;
    saveFinances({
      ...finances,
      balance: finances.balance - payment,
      debt: finances.debt - payment,
    });
    setPaymentAmount('');
  };
  const loadImages = () => {
    const bg = new Image();
    bg.onload = () => setRevision((r) => r + 1);
    bg.onerror = () =>
      setNotice('Background could not load. Import a PNG in the workshop.');
    bg.src = level.current.backgroundImage;
    let fg: HTMLImageElement | null = null;
    if (level.current.foregroundImage) {
      fg = new Image();
      fg.src = level.current.foregroundImage;
    }
    let cat: HTMLImageElement | null = null;
    if (level.current.objectives[0].type === 'carry') {
      cat = new Image();
      cat.src = `${basePath}/assets/pickles.png`;
    }
    images.current = { bg, fg, cat };
  };
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('oddjobs-finances') || 'null',
      );
      if (
        saved &&
        Number.isFinite(saved.balance) &&
        Number.isFinite(saved.debt) &&
        Number.isFinite(saved.lifetimeEarnings) &&
        Array.isArray(saved.completedJobs)
      )
        saveFinances({
          balance: Math.max(0, saved.balance),
          debt: Math.max(0, saved.debt),
          lifetimeEarnings: Math.max(0, saved.lifetimeEarnings),
          completedJobs: saved.completedJobs.filter(
            (id: unknown): id is string => typeof id === 'string',
          ),
        });
    } catch {}
  }, []);
  useEffect(() => {
    const coarse = window.matchMedia('(any-pointer: coarse)');
    const updateTouch = () => setTouchControls(coarse.matches);
    updateTouch();
    coarse.addEventListener('change', updateTouch);
    const timer = window.setTimeout(() => setHintVisible(false), 12000);
    const changed = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', changed);
    return () => {
      coarse.removeEventListener('change', updateTouch);
      window.clearTimeout(timer);
      document.removeEventListener('fullscreenchange', changed);
    };
  }, []);
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem('oddjobs-story-intro') === 'seen';
      const read = JSON.parse(
        localStorage.getItem('oddjobs-story-read') || '[]',
      );
      if (Array.isArray(read))
        setStoryRead(read.filter((id) => typeof id === 'string'));
    } catch {}
    setStoryReady(true);
    if (editing || seen || level.current.testMode === 'jump') return;
    const timer = window.setTimeout(() => {
      setPhoneTab('messages');
      openPhone();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [editing]);
  useEffect(() => {
    if (!storyReady || !phoneOpen || phoneTab !== 'messages') return;
    try {
      localStorage.setItem('oddjobs-story-intro', 'seen');
    } catch {}
  }, [storyReady, phoneOpen, phoneTab]);
  const readConversation = useCallback((ids: string[]) => {
    setStoryRead((previous) => {
      const next = [...new Set([...previous, ...ids])];
      try {
        localStorage.setItem('oddjobs-story-read', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  useEffect(() => {
    const racketKeys = (event: KeyboardEvent) => {
      if (
        edit ||
        paused ||
        phoneOpen ||
        event.repeat ||
        (event.target instanceof Element &&
          event.target.closest('input,textarea,button,[role="slider"]'))
      )
        return;
      const g = game.current;
      if (!g || !magpieFor(g)) return;
      if (event.code === 'KeyR') {
        magpieFor(g)!.equip();
        setChosen(null);
        setRevision((r) => r + 1);
      }
    };
    window.addEventListener('keydown', racketKeys);
    return () => window.removeEventListener('keydown', racketKeys);
  }, [edit, paused, phoneOpen]);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await canvas.current?.closest('.game-shell')?.requestFullscreen();
    } catch {
      setNotice(
        'Fullscreen is unavailable here. The game still fills this window.',
      );
    }
  }
  useEffect(() => {
    setEdit(editing);
    reset();
  }, [editing]);
  useEffect(() => {
    if (editing) {
      try {
        const saved = localStorage.getItem('oddjobs-level');
        if (saved) level.current = parseLevel(saved);
      } catch {}
    }
    reset();
    loadImages();
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    let frame = 0,
      last = 0,
      accum = 0,
      notify = 0;
    const tick = (now: number) => {
      const rect = c.getBoundingClientRect(),
        w = rect.width,
        h = rect.height,
        dpr = Math.min(devicePixelRatio || 1, 2);
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = settings.current,
        g = game.current!,
        l = level.current;
      const dt = Math.min((now - last) / 1000 || 0, 0.05);
      last = now;
      if (!s.edit && !s.paused && !g.complete && !g.failed) {
        accum += dt;
        while (accum >= 1 / 60) {
          g.step();
          jumpFor(g)?.step(1 / 60);
          const bird = magpieFor(g);
          const phase = bird?.phase;
          bird?.step(1 / 60);
          cigaretteFor(g).step(1 / 60);
          if (bird && phase !== bird.phase) {
            if (bird.phase === 'feint' || bird.phase === 'dive') {
              gripAudio.current?.warning();
            }
            if (bird.phase === 'falling') gripAudio.current?.play();
          }
          accum -= 1 / 60;
        }
      } else accum = 0;
      const resized =
        viewport.current.width !== w || viewport.current.height !== h;
      if (resized && g.drag) {
        g.end(true);
        active.current = null;
        setChosen(null);
      }
      viewport.current = { width: w, height: h };
      const target = cameraTarget(
        w,
        h,
        l,
        g.p.hip,
        s.zoom,
        s.edit,
      );
      const v = view.current;
      if (!cameraReady.current || resized || s.edit) {
        Object.assign(v, target);
        cameraReady.current = true;
      } else if (!g.drag) {
        // Keep the surface still under a finger; follow the body after release.
        const ease = 1 - Math.exp(-8 * dt);
        v.scale = target.scale;
        v.x += (target.x - v.x) * ease;
        v.y += (target.y - v.y) * ease;
      }
      g.selectedLimb = s.chosen;
      draw(
        ctx,
        g,
        l,
        images.current.bg,
        images.current.fg,
        images.current.cat,
        v,
        w,
        h,
        s.edit,
        s.selected,
        gesture.current,
        s.chosen,
        s.debug,
      );
      if (!s.edit) drawMagpie(ctx, g, v);
      if (!s.edit) drawCigarette(ctx, g, v);
      if (now - notify > 140) {
        notify = now;
        const jump = jumpFor(g);
        setHud({
          seconds: g.elapsed,
          carrying: g.collected,
          complete: g.complete,
          failed: g.failed,
          grips: Object.keys(g.grips).length,
          moves: g.moves,
          message: g.message,
          jumpState: jump?.state ?? 'idle',
          jumpCharge: jump?.charge ?? 0,
        });
      }
      if (g.complete && !paid.current) {
        paid.current = true;
        if (!s.editing) {
          const bonus = efficiencyBonus(l, g.moves),
            total = l.pay + bonus;
          recordPay(
            l.id,
            total,
            l.moveTarget ? { bonus, moves: g.moves } : undefined,
          );
          paidCallback.current(total);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const visibility = () => {
      if (document.hidden) {
        game.current?.end(true);
        active.current = null;
        if (settings.current.edit) setPaused(true);
      }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea,select')) return;
      if (e.key === 'F2') {
        e.preventDefault();
        setDebug((v) => !v);
      }
      if (e.key === 'Escape') {
        if (phoneOpen) {
          closePhone();
          return;
        }
        game.current?.end(true);
        active.current = null;
        gesture.current = null;
        setChosen(null);
      }
      if (edit && ['Delete', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        remove();
      }
      if (edit && (e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (!edit && e.key.toLowerCase() === 'r') reset();
      if (!edit && e.key.toLowerCase() === 'f') void toggleFullscreen();
      if (!edit && e.code === 'Space' && level.current.testMode === 'jump') {
        e.preventDefault();
        if (!e.repeat) jumpFor(game.current!)?.startCharge();
      }
      if (edit && e.key === ' ') {
        e.preventDefault();
        setPaused((v) => !v);
      }
      if (!edit && ['1', '2', '3', '4'].includes(e.key))
        setChosen(LIMBS[Number(e.key) - 1]);
    };
    const keyUp = (e: KeyboardEvent) => {
      if (!edit && e.code === 'Space' && level.current.testMode === 'jump') {
        e.preventDefault();
        jumpFor(game.current!)?.release();
      }
    };
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', keyUp);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', keyUp);
    };
  });
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    Promise.resolve(
      context.registerTool(
        {
          name: 'read_climbing_job',
          description:
            'Read the current job objective, elapsed time, held grips, and completion state.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: (input: any) => {
            if (input && Object.keys(input).length)
              throw Error('No arguments expected');
            const g = game.current!;
            return {
              level: level.current.name,
              mode: settings.current.edit ? 'edit' : 'play',
              carrying: g.collected,
              complete: g.complete,
              failed: g.failed,
              seconds: Math.floor(g.elapsed),
              grips: Object.keys(g.grips),
              ...(g.level.fatigue && settings.current.debug
                ? {
                    stamina: g.stamina,
                    estimatedLoad: g.loads,
                    discoveredHolds: Object.values(g.holdVisibility).filter(
                      (a) => a > 0.01,
                    ).length,
                  }
                : {}),
            };
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, []);
  function undo() {
    const prev = history.current.pop();
    if (prev) {
      level.current = prev;
      loadImages();
      setSelected(null);
      setRevision((r) => r + 1);
    }
  }
  function remove() {
    if (!selected) return;
    snapshot();
    level.current.gripPoints = level.current.gripPoints.filter(
      (g) => g.id !== selected,
    );
    level.current.colliders = level.current.colliders.filter(
      (g) => g.id !== selected,
    );
    setSelected(null);
    setRevision((r) => r + 1);
  }
  const world = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect(),
      v = view.current;
    return {
      x: (e.clientX - r.left - v.x) / v.scale,
      y: (e.clientY - r.top - v.y) / v.scale,
    };
  };
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    if (
      active.current !== null ||
      paused ||
      ((hud.complete || hud.failed) && !edit)
    )
      return;
    gripAudio.current?.unlock();
    const p = world(e);
    if (!edit && level.current.testMode === 'jump') {
      const jump = jumpFor(game.current!);
      const result = jump?.select(p);
      if (result && result !== 'none') {
        if (result === 'caught') gripAudio.current?.playGrab('leftHand');
        setRevision((r) => r + 1);
        e.preventDefault();
        return;
      }
    }
    active.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (edit) {
      snapshot();
      let id: string | undefined;
      let original: any;
      if (tool === 'select') {
        const l = level.current,
          g = l.gripPoints.find(
            (g) => distance(g, p) < 14 / view.current.scale,
          );
        if (g) {
          id = g.id;
          original = clone(g);
        } else {
          const c = l.colliders.find((c) => {
            if (c.type === 'rect')
              return (
                p.x >= Math.min(c.x, c.x2) &&
                p.x <= Math.max(c.x, c.x2) &&
                p.y >= Math.min(c.y, c.y2) &&
                p.y <= Math.max(c.y, c.y2)
              );
            const dx = c.x2 - c.x,
              dy = c.y2 - c.y,
              t = Math.max(
                0,
                Math.min(
                  1,
                  ((p.x - c.x) * dx + (p.y - c.y) * dy) /
                    (dx * dx + dy * dy || 1),
                ),
              );
            return (
              distance(p, { x: c.x + t * dx, y: c.y + t * dy }) <
              12 / view.current.scale
            );
          });
          if (c) {
            id = c.id;
            original = clone(c);
          }
        }
        setSelected(id || null);
      }
      gesture.current = { a: p, b: p, tool, id, original };
    } else {
      const g = game.current!;
      const touch = e.pointerType === 'touch';
      if (touch) setTouchControls(true);
      const limb = selectLimb(g, p, view.current.scale, touch, chosen);
      if (limb) {
        // Touch and selected-limb controls drag relative to the endpoint,
        // allowing thumb movement away from the artwork without a jump.
        const relative = touch || Boolean(chosen);
        const endpoint = g.p[limb];
        dragOffset.current = relative
          ? { x: endpoint.x - p.x, y: endpoint.y - p.y }
          : { x: 0, y: 0 };
        if (g.begin(limb, dragTarget(p, dragOffset.current))) {
          setChosen(limb);
          e.preventDefault();
          return;
        }
      }
      active.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (active.current !== e.pointerId) return;
    const p = world(e);
    if (edit && gesture.current) {
      const s = gesture.current;
      s.b = p;
      if (s.tool === 'select' && s.id && s.original) {
        const g =
          level.current.gripPoints.find((g) => g.id === s.id) ||
          level.current.colliders.find((g) => g.id === s.id);
        if (g) {
          g.x = s.original.x + p.x - s.a.x;
          g.y = s.original.y + p.y - s.a.y;
          if ('x2' in g && 'y2' in g) {
            g.x2 = s.original.x2 + p.x - s.a.x;
            g.y2 = s.original.y2 + p.y - s.a.y;
          }
        }
      }
    } else game.current?.move(dragTarget(p, dragOffset.current));
  }
  function up(e: React.PointerEvent<HTMLCanvasElement>, cancel = false) {
    if (active.current !== e.pointerId) return;
    active.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (edit && gesture.current) {
      const s = gesture.current,
        l = level.current,
        p = s.b,
        id = crypto.randomUUID();
      if (cancel) {
        const prev = history.current.pop();
        if (prev) level.current = prev;
      } else {
        if (s.tool === 'grip') {
          l.gripPoints.push({ ...p, id });
          setSelected(id);
        }
        if (s.tool === 'spawn') l.playerSpawn = p;
        if (s.tool === 'objective')
          l.objectives[0] = { ...l.objectives[0], ...p };
        if (['edge', 'rect'].includes(s.tool) && distance(s.a, p) > 8) {
          l.colliders.push({
            id,
            type: s.tool as 'edge' | 'rect',
            x: s.a.x,
            y: s.a.y,
            x2: p.x,
            y2: p.y,
          });
          setSelected(id);
        }
        if (['zone', 'camera'].includes(s.tool) && distance(s.a, p) > 12) {
          const box = {
            x: Math.min(p.x, s.a.x),
            y: Math.min(p.y, s.a.y),
            width: Math.abs(p.x - s.a.x),
            height: Math.abs(p.y - s.a.y),
          };
          if (s.tool === 'zone') l.completionTrigger = box;
          else l.cameraBounds = box;
        }
      }
      gesture.current = null;
      setRevision((r) => r + 1);
    } else {
      const climber = game.current;
      const before = climber?.catches.length ?? 0;
      const grabbedLimb = climber?.drag?.limb;
      climber?.end(cancel);
      if (!cancel && climber && grabbedLimb && climber.catches.length > before)
        gripAudio.current?.playGrab(grabbedLimb);
      setChosen(null);
    }
  }
  async function importPng(file: File | undefined, foreground = false) {
    if (!file) return;
    if (file.type !== 'image/png') {
      setNotice('Choose a PNG image.');
      return;
    }
    if (file.size > 15_000_000) {
      setNotice('Use a PNG smaller than 15 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        snapshot();
        const l = level.current;
        if (foreground) l.foregroundImage = String(reader.result);
        else {
          l.backgroundImage = String(reader.result);
          const sx = image.width / l.worldWidth,
            sy = image.height / l.worldHeight;
          const scale = (p: Point) => {
            p.x *= sx;
            p.y *= sy;
          };
          scale(l.playerSpawn);
          l.gripPoints.forEach(scale);
          l.objectives.forEach(scale);
          l.interactiveObjects.forEach(scale);
          l.colliders.forEach((c) => {
            scale(c);
            c.x2 *= sx;
            c.y2 *= sy;
          });
          for (const box of [l.cameraBounds, l.completionTrigger]) {
            scale(box);
            box.width *= sx;
            box.height *= sy;
          }
          l.worldWidth = image.width;
          l.worldHeight = image.height;
        }
        loadImages();
        setNotice(
          foreground
            ? 'Foreground imported.'
            : 'Background imported. Existing geometry scaled to the image.',
        );
      };
      image.onerror = () => setNotice('This PNG could not be read.');
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }
  async function importJson(file: File | undefined) {
    if (!file) return;
    try {
      const l = parseLevel(await file.text());
      snapshot();
      level.current = l;
      loadImages();
      reset();
      setSelected(null);
      setNotice('Level loaded. Continue tracing or play test.');
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function save() {
    try {
      localStorage.setItem('oddjobs-level', JSON.stringify(level.current));
      setNotice('Workshop saved on this device.');
    } catch {
      setNotice('Device storage is full. Export JSON to keep your level.');
    }
  }
  async function download() {
    const exported = clone(level.current);
    try {
      for (const key of ['backgroundImage', 'foregroundImage'] as const) {
        const path = exported[key];
        if (path && !path.startsWith('data:')) {
          const blob = await (await fetch(path)).blob();
          exported[key] = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = reject;
            r.readAsDataURL(blob);
          });
        }
      }
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
          type: 'application/json',
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = url;
      a.download = `${exported.id}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setNotice('JSON exported with PNG artwork embedded.');
    } catch {
      setNotice('Could not embed the artwork. Check the image URL.');
    }
  }
  const toggle = () => {
    setEdit(!edit);
    setSelected(null);
    reset();
  };
  return (
    <div
      className={'game-shell ' + (edit ? 'workshop-stage' : 'immersive-stage')}
    >
      {edit && (
        <div className="game-topbar">
          <button onClick={onBack}>
            <ArrowLeft size={15} /> Back to climb
          </button>
          <div>
            <span className="eyebrow">
              {editing ? 'LEVEL WORKSHOP' : 'JOB NO. 001'}
            </span>
            <strong>{level.current.name}</strong>
          </div>
          <div className="game-top-actions">
            {editing && (
              <Button onClick={toggle}>
                <Play size={13} />
                {edit ? 'Play test' : 'Return to editor'}
              </Button>
            )}
            <button onClick={reset} aria-label="Restart job">
              <RotateCcw size={16} />
            </button>
            {!edit && (
              <button
                onClick={() => setPaused((v) => !v)}
                aria-label={paused ? 'Resume' : 'Pause'}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            )}
          </div>
        </div>
      )}
      <div className={'play-layout ' + (edit ? 'with-editor' : '')}>
        <div className="canvas-wrap">
          <canvas
            ref={canvas}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={(e) => up(e)}
            onPointerCancel={(e) => up(e, true)}
            onLostPointerCapture={(e) => {
              if (active.current === e.pointerId) up(e, true);
            }}
            aria-label={
              edit
                ? 'Level artwork editor. Choose a tool and click or drag to place geometry.'
                : 'Climbing game. Drag hands and feet onto solid edges. On touch screens, select a limb then drag anywhere to move it; release to grab.'
            }
          />
          {!edit && level.current.testMode === 'jump' && !phoneOpen && !hud.failed && !hud.complete && (
            <div className="jump-lab-controls">
              <div className="jump-lab-instruction">
                <strong>JUMP LAB</strong>
                <span>Tap target · two hands + one foot · hold · release · tap to catch</span>
              </div>
              <button
                type="button"
                className={'jump-charge-button ' + hud.jumpState}
                aria-label="Hold to charge jump and release to launch"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  jumpFor(game.current!)?.startCharge();
                  setRevision((r) => r + 1);
                }}
                onPointerUp={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId))
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  jumpFor(game.current!)?.release();
                  setRevision((r) => r + 1);
                }}
                onPointerCancel={() => jumpFor(game.current!)?.cancelCharge()}
                disabled={
                  paused ||
                  hud.jumpState === 'propelling' ||
                  hud.jumpState === 'airborne'
                }
              >
                <span style={{ '--charge': hud.jumpCharge } as React.CSSProperties} />
                <ArrowUp size={25} />
                <small>
                  {hud.jumpState === 'charging'
                    ? 'RELEASE'
                    : hud.jumpState === 'propelling'
                      ? 'PUSH'
                      : 'HOLD'}
                </small>
              </button>
            </div>
          )}
          {!edit &&
            !phoneOpen &&
            (level.current.testMode === 'jump' ||
              (!hud.complete && !hud.failed)) && (
            <label
              className={
                'camera-zoom-control' +
                (level.current.testMode === 'jump' ? ' jump-lab-camera' : '')
              }
            >
              <Minus size={14} aria-hidden="true" />
              <input
                type="range"
                min="0.65"
                max="2.2"
                step="0.05"
                value={zoom}
                onChange={(event) => {
                  cameraReady.current = false;
                  setZoom(Number(event.target.value));
                }}
                aria-label="Camera zoom"
              />
              <Plus size={14} aria-hidden="true" />
              {level.current.testMode === 'jump' && <b>ZOOM</b>}
            </label>
          )}
          {!edit && level.current.testMode !== 'jump' && !phoneOpen && !hud.complete && !hud.failed && (
            <div className="prop-controls">
              {game.current && magpieFor(game.current) && (
                <button
                  disabled={paused}
                  aria-label={
                    game.current?.racketHand
                      ? 'Put racket away'
                      : 'Equip racket'
                  }
                  title="Racket — drag the equipped hand to swing"
                  aria-pressed={Boolean(game.current?.racketHand)}
                  onClick={() => {
                    const g = game.current;
                    if (!g) return;
                    const bird = magpieFor(g)!;
                    bird.equip();
                    setChosen(null);
                    setRevision((r) => r + 1);
                  }}
                >
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                  >
                    <ellipse
                      cx="15"
                      cy="8"
                      rx="5"
                      ry="7"
                      transform="rotate(35 15 8)"
                    />
                    <path d="M11 14 4 22M12 4l7 7M10 7l6 7M13 2l7 7M11 11l7-7" />
                  </svg>
                </button>
              )}
              <button
                className="dart-button"
                aria-label={
                  game.current?.cigaretteHand ? 'Put dart out' : 'Smoke a dart'
                }
                title={
                  game.current?.cigaretteHand
                    ? 'Put dart out'
                    : 'Dart — drag the equipped hand to your mouth'
                }
                aria-pressed={Boolean(game.current?.cigaretteHand)}
                disabled={paused || Boolean(game.current?.racketHand)}
                onClick={() => {
                  const g = game.current;
                  if (!g) return;
                  const cigarette = cigaretteFor(g);
                  const puttingOut = Boolean(g.cigaretteHand);
                  cigarette.toggle();
                  if (puttingOut) gripAudio.current?.playCough();
                  setChosen(null);
                  setRevision((r) => r + 1);
                }}
              >
                {game.current?.cigaretteHand ? (
                  <CircleSlash size={23} />
                ) : (
                  <Cigarette size={23} />
                )}
              </button>
            </div>
          )}
          {edit && (
            <span className="editor-world-label">
              {level.current.worldWidth} × {level.current.worldHeight} ·{' '}
              {level.current.gripPoints.length} GRIPS ·{' '}
              {level.current.colliders.length} COLLIDERS
            </span>
          )}
          {!edit &&
            !phoneOpen &&
            !hud.failed &&
            !hud.complete &&
            Boolean(level.current.moveTarget) && (
              <div className="move-counter" role="status">
                {hud.moves} MOVES
              </div>
            )}
          {!edit &&
            !hud.failed &&
            !hud.complete &&
            hud.message === 'Grab with a hand before moving your feet.' && (
              <div className="hand-support-hint" role="status">
                <Hand size={17} /> Grab with a hand before moving your feet.
              </div>
            )}
        </div>
        {edit && (
          <aside className="editor-panel">
            <p className="eyebrow">BUILD YOUR NEXT ODD JOB</p>
            <h2>Level workshop</h2>
            <p>Import the art. Trace the climb.</p>
            <div className="editor-assets">
              <Button
                variant="outline"
                onClick={() => bgUpload.current?.click()}
              >
                <Upload size={14} /> Background PNG
              </Button>
              <Button
                variant="outline"
                onClick={() => fgUpload.current?.click()}
              >
                <Upload size={14} /> Foreground PNG
              </Button>
            </div>
            <label className="editor-label">
              LEVEL NAME
              <input
                value={level.current.name}
                onChange={(e) => {
                  level.current.name = e.target.value;
                  setRevision((r) => r + 1);
                }}
              />
            </label>
            <span className="editor-label">TRACING TOOLS</span>
            <div className="tool-grid">
              {(
                [
                  ['select', '↖', 'Select / move'],
                  ['grip', '●', 'Grip point'],
                  ['edge', '╱', 'Edge collider'],
                  ['rect', '▧', 'Rectangle'],
                  ['spawn', '◎', 'Player spawn'],
                  ['objective', '★', 'Pickles'],
                  ['zone', '▣', 'Return zone'],
                  ['camera', '⊞', 'Camera bounds'],
                ] as [Tool, string, string][]
              ).map(([t, i, n]) => (
                <button
                  key={t}
                  className={tool === t ? 'active' : ''}
                  onClick={() => setTool(t)}
                >
                  <span>{i}</span>
                  {n}
                </button>
              ))}
            </div>
            <p className="tool-help">
              {tool === 'select'
                ? 'Drag grips or colliders. Select one and press Delete to remove it.'
                : ['edge', 'rect', 'zone', 'camera'].includes(tool)
                  ? 'Click and drag across the image to trace this shape.'
                  : 'Click the image to place this item.'}
            </p>
            <div className="editor-actions">
              <Button
                variant="outline"
                onClick={undo}
                disabled={!history.current.length}
              >
                <Undo2 size={14} /> Undo
              </Button>
              <Button variant="outline" onClick={remove} disabled={!selected}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
            <div className="editor-legend">
              <span>● Grips</span>
              <span>━ Collision</span>
              <span>● Spawn</span>
              <span>■ Return</span>
            </div>
            <Button className="save-level" onClick={save}>
              Save on this device
            </Button>
            <div className="editor-actions">
              <Button variant="outline" onClick={download}>
                <Download size={13} /> Export JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => jsonUpload.current?.click()}
              >
                <Upload size={13} /> Load JSON
              </Button>
            </div>
            <p className="export-note">
              Exports include PNG artwork. Play testing never earns money.
            </p>
            {notice && (
              <p role="status" className="editor-notice">
                {notice}
              </p>
            )}
            <input
              hidden
              ref={bgUpload}
              type="file"
              accept="image/png"
              onChange={(e) => {
                importPng(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              hidden
              ref={fgUpload}
              type="file"
              accept="image/png"
              onChange={(e) => {
                importPng(e.target.files?.[0], true);
                e.target.value = '';
              }}
            />
            <input
              hidden
              ref={jsonUpload}
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                importJson(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </aside>
        )}
      </div>
      {!edit && (
        <>
          <Ambience basePath={basePath} />
          <PhoneMusic
            basePath={basePath}
            controlsTarget={musicControlsTarget}
          />
          {touchControls && !phoneOpen && !hud.complete && !hud.failed && (
            <div
              className="touch-climb-controls"
              aria-label="Choose a climbing limb"
            >
              <p>
                {chosen
                  ? 'Drag anywhere · release to grab'
                  : 'Drag a limb, or select one below'}
              </p>
              <div>
                {LIMBS.map((limb) => (
                  <button
                    key={limb}
                    type="button"
                    className={chosen === limb ? 'chosen' : ''}
                    aria-label={`Select ${limb.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                    aria-pressed={chosen === limb}
                    disabled={hud.carrying && game.current?.carrying === limb}
                    onClick={() => {
                      if (active.current === null)
                        setChosen(chosen === limb ? null : limb);
                    }}
                  >
                    {limb.endsWith('Hand') ? (
                      <Hand size={18} />
                    ) : (
                      <Footprints size={18} />
                    )}
                    <span>
                      {limb.startsWith('left') ? 'L' : 'R'}{' '}
                      {limb.endsWith('Hand') ? 'hand' : 'foot'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {hud.failed && !phoneOpen && (
            <div
              className="failure-layer"
              role="dialog"
              aria-label="Job failed"
            >
              <section className="failure-card">
                <span>JOB FAILED</span>
                <h2>You fell.</h2>
                <p>
                  No payment this time. Get back up there and finish the job.
                </p>
                <button onClick={reset}>
                  <RotateCcw size={15} /> Try again
                </button>
                <button onClick={() => openPhoneTo('jobs')}>
                  Choose another job
                </button>
              </section>
            </div>
          )}
          {payout && !phoneOpen && (
            <div
              className="completion-layer"
              role="dialog"
              aria-label="Job payment complete"
            >
              <section className="completion-card">
                <div className="deposit-coins" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, index) => (
                    <span key={index}>$</span>
                  ))}
                </div>
                <span className="completion-kicker">JOB COMPLETE</span>
                <h2>{money(payout.amount)}</h2>
                {payout.moves === undefined ? (
                  <p>
                    Payment received and deposited into your everyday account.
                  </p>
                ) : (
                  <p>
                    {payout.moves} moves
                    {payout.bonus
                      ? ` · ${money(payout.bonus)} efficiency bonus`
                      : ' · no efficiency bonus this time'}
                    . Paid into your everyday account.
                  </p>
                )}
                <div className="deposit-account">
                  <Landmark size={21} />
                  <span>
                    <small>COMMON CENTS · EVERYDAY</small>
                    <strong>{money(payout.balanceAfter)}</strong>
                  </span>
                  <em>
                    {money(payout.balanceBefore)} <ChevronRight size={12} />{' '}
                    {money(payout.balanceAfter)}
                  </em>
                </div>
                <div className="completion-actions">
                  <button onClick={() => openPhoneTo('bank')}>
                    View banking
                  </button>
                  <button onClick={() => openPhoneTo('jobs')}>
                    Find next job
                  </button>
                  <button
                    className="completion-replay"
                    onClick={() => {
                      setPayout(null);
                      reset();
                    }}
                  >
                    Replay job
                  </button>
                </div>
              </section>
            </div>
          )}
          <button
            className="phone-launch"
            onClick={openPhone}
            aria-label="Open phone"
          >
            <Smartphone size={21} />
            {(phoneUnread || unreadStory > 0) && (
              <span className="phone-unread" />
            )}
          </button>
          {phoneOpen && (
            <div className="phone-layer" role="dialog" aria-label="Phone">
              <button
                className="phone-dismiss"
                onClick={closePhone}
                aria-label="Close phone"
              />
              <section className="phone-device">
                <div className="phone-speaker" />
                <header className="phone-header">
                  <span>9:41</span>
                  <strong>Odd Jobs</strong>
                  <button onClick={closePhone} aria-label="Close phone">
                    <X size={17} />
                  </button>
                </header>
                <nav className="phone-tabs" aria-label="Phone apps">
                  <button
                    className={phoneTab === 'jobs' ? 'active' : ''}
                    onClick={() => setPhoneTab('jobs')}
                  >
                    <BriefcaseBusiness size={15} /> Jobs
                  </button>
                  <button
                    className={phoneTab === 'bank' ? 'active' : ''}
                    onClick={() => setPhoneTab('bank')}
                  >
                    <Landmark size={15} /> Banking
                  </button>
                  <button
                    className={phoneTab === 'messages' ? 'active' : ''}
                    onClick={() => setPhoneTab('messages')}
                  >
                    <MessageSquare size={15} /> Messages
                    {unreadStory > 0 ? ` (${unreadStory})` : ''}
                  </button>
                  <button
                    className={phoneTab === 'music' ? 'active' : ''}
                    onClick={() => setPhoneTab('music')}
                  >
                    <Music2 size={15} /> Music
                  </button>
                </nav>
                <div className="phone-screen">
                  {phoneTab === 'messages' ? (
                    <StoryInbox
                      messages={messages}
                      readIds={storyRead}
                      onRead={readConversation}
                      onJobs={() => setPhoneTab('jobs')}
                    />
                  ) : phoneTab === 'music' ? (
                    <div ref={setMusicControlsTarget} />
                  ) : phoneTab === 'jobs' ? (
                    <div className="phone-jobs">
                      <div className="phone-section-title">
                        <span>AVAILABLE LOCALLY</span>
                        <strong>{JOBS.length} jobs</strong>
                      </div>
                      {JOBS.map((job) => {
                        const activeJob = level.current.id === job.id;
                        const complete = finances.completedJobs.includes(
                          job.id,
                        );
                        return (
                          <a
                            key={job.id}
                            href={`${basePath}${job.href}`}
                            className={activeJob ? 'current' : ''}
                          >
                            <span
                              className="phone-job-image"
                              style={{
                                backgroundImage: `url(${basePath}${job.image})`,
                              }}
                            />
                            <span className="phone-job-copy">
                              <small>
                                <MapPin size={10} /> {job.client}
                              </small>
                              <strong>{job.name}</strong>
                              <span>
                                {money(job.pay)}
                                {complete && <em>COMPLETED</em>}
                              </span>
                              <small>
                                {activeJob ? 'ON SITE' : 'ACCEPT JOB'}
                              </small>
                            </span>
                            <ChevronRight size={17} />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="phone-bank">
                      <div className="bank-brand">
                        <Landmark size={17} />
                        <span>
                          <small>ONLINE BANKING</small>
                          <strong>Common Cents</strong>
                        </span>
                      </div>
                      <section className="bank-balance">
                        <small>EVERYDAY ACCOUNT</small>
                        <strong>{money(finances.balance)}</strong>
                        <span>Available balance</span>
                      </section>
                      <section className="debt-card">
                        <small>AMOUNT OWED</small>
                        <span>
                          {finances.debt === 0
                            ? 'Settled. You’re out.'
                            : 'Due Friday · No extensions'}
                        </span>
                        <strong>{money(finances.debt)}</strong>
                        <div className="debt-track">
                          <i
                            style={{
                              width: `${Math.min(
                                100,
                                ((STARTING_DEBT - finances.debt) /
                                  STARTING_DEBT) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                        <p>
                          {money(STARTING_DEBT - finances.debt)} paid ·{' '}
                          {money(finances.lifetimeEarnings)} earned from jobs
                        </p>
                      </section>
                      {finances.debt > 0 && finances.balance > 0 && (
                        <div className="repayment-choice">
                          <label htmlFor="repayment-amount">
                            How much can you send?
                          </label>
                          <input
                            id="repayment-amount"
                            type="number"
                            min="1"
                            step="1"
                            max={Math.min(finances.balance, finances.debt)}
                            value={paymentAmount}
                            placeholder={String(
                              Math.min(finances.balance, finances.debt),
                            )}
                            onChange={(event) =>
                              setPaymentAmount(event.target.value)
                            }
                          />
                          <div>
                            <button
                              onClick={() =>
                                setPaymentAmount(
                                  String(
                                    Math.min(
                                      finances.debt,
                                      Math.max(
                                        1,
                                        Math.floor(finances.balance / 2),
                                      ),
                                    ),
                                  ),
                                )
                              }
                            >
                              Half my balance
                            </button>
                            <button onClick={() => setPaymentAmount('')}>
                              All I can
                            </button>
                          </div>
                        </div>
                      )}
                      <button
                        className="debt-payment"
                        disabled={
                          !finances.balance ||
                          !finances.debt ||
                          (paymentAmount !== '' &&
                            (!Number.isFinite(Number(paymentAmount)) ||
                              Number(paymentAmount) < 1))
                        }
                        onClick={payDebt}
                      >
                        {finances.debt === 0
                          ? 'DEBT CLEARED'
                          : finances.balance
                            ? `PAY ${money(Math.min(finances.balance, finances.debt, paymentAmount === '' ? finances.balance : Math.max(0, Math.floor(Number(paymentAmount) || 0))))}`
                            : 'COMPLETE A JOB TO GET PAID'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="phone-home-indicator" />
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
