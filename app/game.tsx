'use client';
import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { catLevel, parseLevel, type Level, type Point } from '@/lib/game/level';
import { Climber, LIMBS, distance, type Limb } from '@/lib/game/physics';
import { draw, type View } from '@/lib/game/render';
type Tool =
  | 'select'
  | 'grip'
  | 'edge'
  | 'rect'
  | 'spawn'
  | 'objective'
  | 'zone'
  | 'rope'
  | 'camera';
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const time = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(s % 60)
    .toString()
    .padStart(2, '0')}`;
export default function Game({
  editing,
  onBack,
  onPaid,
}: {
  editing: boolean;
  onBack: () => void;
  onPaid: (n: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    level = useRef<Level>(clone(catLevel)),
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
      grips: 0,
      message: 'Drag a hand or boot onto the bark.',
      rope: false,
    }),
    [paused, setPaused] = useState(false),
    [zoom, setZoom] = useState(1),
    [fullscreen, setFullscreen] = useState(false),
    [hintVisible, setHintVisible] = useState(true),
    [selected, setSelected] = useState<string | null>(null),
    [notice, setNotice] = useState(''),
    [chosen, setChosen] = useState<Limb | null>(null);
  const settings = useRef({
    edit,
    editing,
    tool,
    paused,
    zoom,
    selected,
    chosen,
  });
  settings.current = { edit, editing, tool, paused, zoom, selected, chosen };
  const active = useRef<number | null>(null),
    gesture = useRef<{
      a: Point;
      b: Point;
      tool: Tool;
      id?: string;
      original?: any;
    } | null>(null),
    history = useRef<Level[]>([]),
    paid = useRef(false),
    paidCallback = useRef(onPaid);
  paidCallback.current = onPaid;
  const bgUpload = useRef<HTMLInputElement>(null),
    jsonUpload = useRef<HTMLInputElement>(null),
    fgUpload = useRef<HTMLInputElement>(null);
  const snapshot = () => {
    history.current.push(clone(level.current));
    if (history.current.length > 40) history.current.shift();
  };
  const reset = () => {
    game.current = new Climber(level.current, editing);
    paid.current = false;
    setHud({
      seconds: 0,
      carrying: false,
      complete: false,
      grips: 0,
      message: 'Drag a hand or boot onto the bark.',
      rope: false,
    });
    setChosen(null);
    setPaused(false);
    active.current = null;
    gesture.current = null;
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
    const cat = new Image();
    cat.src = "/assets/pickles.png";
    images.current = { bg, fg, cat };
  };
  useEffect(() => {
    const timer = window.setTimeout(() => setHintVisible(false), 12000);
    const changed = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', changed);
    return () => { window.clearTimeout(timer); document.removeEventListener('fullscreenchange', changed); };
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await canvas.current?.closest('.game-shell')?.requestFullscreen();
    } catch { setNotice('Fullscreen is unavailable here. The game still fills this window.'); }
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
      if (!s.edit && !s.paused && !g.complete) {
        accum += dt;
        while (accum >= 1 / 60) {
          g.step();
          accum -= 1 / 60;
        }
      } else accum = 0;
      const bounds = l.cameraBounds;
      const base = (s.edit ? Math.min : Math.max)(w / bounds.width, h / bounds.height),
        scale = base * (s.edit ? 1 : s.zoom);
      const contentW = bounds.width * scale,
        contentH = bounds.height * scale;
      let tx = (w - contentW) / 2 - bounds.x * scale,
        ty = (h - contentH) / 2 - bounds.y * scale;
      if (!s.edit) {
        const focus = g.p.hip;
        tx =
          contentW > w
            ? Math.max(
                w - (bounds.x + bounds.width) * scale,
                Math.min(-bounds.x * scale, w / 2 - focus.x * scale),
              )
            : tx;
        ty =
          contentH > h
            ? Math.max(
                h - (bounds.y + bounds.height) * scale,
                Math.min(-bounds.y * scale, h * 0.58 - focus.y * scale),
              )
            : ty;
      }
      const v = view.current;
      v.scale = s.edit ? scale : Math.max(base, v.scale + (scale - v.scale) * 0.15);
      v.x += (tx - v.x) * 0.1;
      v.y += (ty - v.y) * 0.1;
      if (!s.edit) {
        v.x = Math.max(w - (bounds.x + bounds.width) * v.scale, Math.min(-bounds.x * v.scale, v.x));
        v.y = Math.max(h - (bounds.y + bounds.height) * v.scale, Math.min(-bounds.y * v.scale, v.y));
      }
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
      );
      if (now - notify > 140) {
        notify = now;
        setHud({
          seconds: g.elapsed,
          carrying: g.collected,
          complete: g.complete,
          grips: Object.keys(g.grips).length,
          message: g.message,
          rope: g.ropeCaught,
        });
      }
      if (g.complete && !paid.current) {
        paid.current = true;
        if (!s.editing) paidCallback.current(l.pay);
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
      if (e.key === 'Escape') {
        
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
      if (edit && e.key === ' ') {
        e.preventDefault();
        setPaused((v) => !v);
      }
      if (!edit && ['1', '2', '3', '4'].includes(e.key))
        setChosen(LIMBS[Number(e.key) - 1]);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
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
              seconds: Math.floor(g.elapsed),
              grips: Object.keys(g.grips),
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
    if (active.current !== null || paused || (hud.complete && !edit)) return;
    const p = world(e);
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
      const limb =
        chosen ||
        LIMBS.filter((l) => l !== g.carrying).sort(
          (a, b) => distance(g.p[a], p) - distance(g.p[b], p),
        )[0];
      if (
        limb &&
        (chosen ||
          distance(g.p[limb], p) < Math.max(22, 30 / view.current.scale))
      ) {
        g.begin(limb, p);
        setChosen(limb);
      } else {
        active.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
      }
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
    } else game.current?.move(p);
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
        if (s.tool === 'rope') l.ropeAnchors[0] = p;
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
      game.current?.end(cancel);
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
          l.ropeAnchors.forEach(scale);
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
    <div className={"game-shell " + (edit ? "workshop-stage" : "immersive-stage")}>
      {edit && <div className="game-topbar">
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
      </div>}
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
                : 'Climbing game. Drag individual hands and feet to the tree. Use limb buttons for easier selection.'
            }
          />
          {edit && (
            <span className="editor-world-label">
              {level.current.worldWidth} × {level.current.worldHeight} ·{' '}
              {level.current.gripPoints.length} GRIPS ·{' '}
              {level.current.colliders.length} COLLIDERS
            </span>
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
                  ['rope', '⌁', 'Rope anchor'],
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

    </div>
  );
}
