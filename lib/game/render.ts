import { Climber, LIMBS, distance } from './physics';
import type { Level, Point } from './level';
export type View = { scale: number; x: number; y: number };
export function draw(
  ctx: CanvasRenderingContext2D,
  g: Climber,
  l: Level,
  bg: HTMLImageElement | null,
  fg: HTMLImageElement | null,
  v: View,
  w: number,
  h: number,
  edit: boolean,
  selection: string | null,
  preview: { a: Point; b: Point; tool: string } | null,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1d332b';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.scale(v.scale, v.scale);
  if (bg?.complete && bg.naturalWidth)
    ctx.drawImage(bg, 0, 0, l.worldWidth, l.worldHeight);
  if (edit) {
    ctx.fillStyle = '#10251f35';
    ctx.fillRect(0, 0, l.worldWidth, l.worldHeight);
    ctx.strokeStyle = '#93e6f2';
    ctx.lineWidth = 2 / v.scale;
    ctx.setLineDash([8, 5]);
    const b = l.cameraBounds;
    ctx.strokeRect(b.x, b.y, b.width, b.height);
    ctx.setLineDash([]);
  }
  const circle = (p: Point, r: number, color: string, stroke?: string) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2 / v.scale;
      ctx.stroke();
    }
  };
  const label = (p: Point, t: string, color = '#fff9e5') => {
    ctx.font = `bold ${11 / v.scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#213f35dd';
    const ww = ctx.measureText(t).width + 14 / v.scale;
    ctx.fillRect(p.x - ww / 2, p.y - 16 / v.scale, ww, 21 / v.scale);
    ctx.fillStyle = color;
    ctx.fillText(t, p.x, p.y);
  };
  if (edit) {
    for (const c of l.colliders) {
      ctx.strokeStyle = c.id === selection ? '#fff' : '#ff886c';
      ctx.fillStyle = '#ff775530';
      ctx.lineWidth = 3 / v.scale;
      ctx.beginPath();
      if (c.type === 'edge') {
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x2, c.y2);
        ctx.stroke();
      } else {
        ctx.fillRect(c.x, c.y, c.x2 - c.x, c.y2 - c.y);
        ctx.strokeRect(c.x, c.y, c.x2 - c.x, c.y2 - c.y);
      }
    }
    for (const gp of l.gripPoints)
      circle(
        gp,
        5 / v.scale,
        gp.id === selection ? '#fff' : '#8ffbbb',
        '#173e30',
      );
    circle(l.playerSpawn, 10 / v.scale, '#78c8ff');
    label({ x: l.playerSpawn.x, y: l.playerSpawn.y - 18 }, 'SPAWN');
    for (const o of l.objectives) {
      circle(o, 13 / v.scale, '#ffdc67');
      label({ x: o.x, y: o.y - 20 }, o.name.toUpperCase());
    }
    for (const a of l.ropeAnchors) {
      circle(a, 8 / v.scale, '#d2adff');
      label({ x: a.x, y: a.y - 15 }, 'ROPE');
    }
    const z = l.completionTrigger;
    ctx.fillStyle = '#77fbbb30';
    ctx.fillRect(z.x, z.y, z.width, z.height);
    ctx.strokeStyle = '#91ffc7';
    ctx.strokeRect(z.x, z.y, z.width, z.height);
    label({ x: z.x + z.width / 2, y: z.y + 20 }, 'RETURN ZONE');
    if (preview) {
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      if (['rect', 'zone', 'camera'].includes(preview.tool))
        ctx.strokeRect(
          preview.a.x,
          preview.a.y,
          preview.b.x - preview.a.x,
          preview.b.y - preview.a.y,
        );
      else {
        ctx.moveTo(preview.a.x, preview.a.y);
        ctx.lineTo(preview.b.x, preview.b.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  } else {
    const a = l.ropeAnchors[0],
      hip = g.p.hip;
    ctx.strokeStyle = '#dbd387';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    const slack = Math.max(0, g.ropeLength - distance(a, hip));
    ctx.quadraticCurveTo(
      (a.x + hip.x) / 2 - slack * 0.4,
      (a.y + hip.y) / 2 + slack * 0.4,
      hip.x,
      hip.y,
    );
    ctx.stroke();
    circle(a, 5, '#d3cda1');
    const line = (a: string, b: string, color: string, width: number) => {
      ctx.strokeStyle = '#1e2a27';
      ctx.lineWidth = width + 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(g.p[a].x, g.p[a].y);
      ctx.lineTo(g.p[b].x, g.p[b].y);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };
    for (const s of ['left', 'right']) {
      line('hip', s + 'Knee', '#3e4946', 16);
      line(s + 'Knee', s + 'Foot', '#47514b', 12);
    }
    line('hip', 'neck', '#db9f42', 29);
    for (const s of ['left', 'right']) {
      line(s + 'Shoulder', s + 'Elbow', '#dea144', 14);
      line(s + 'Elbow', s + 'Hand', '#eeb455', 11);
    }
    line('leftShoulder', 'rightShoulder', '#efb750', 14);
    circle(g.p.head, 14, '#edd3a6', '#293f37');
    ctx.fillStyle = '#f2f2e4';
    ctx.beginPath();
    ctx.arc(g.p.head.x, g.p.head.y - 5, 16, Math.PI, 0);
    ctx.lineTo(g.p.head.x + 18, g.p.head.y - 2);
    ctx.lineTo(g.p.head.x - 18, g.p.head.y - 2);
    ctx.fill();
    line('hip', 'hip', '#263830', 23);
    ctx.strokeStyle = '#bccb73';
    ctx.lineWidth = 3;
    ctx.strokeRect(hip.x - 7, hip.y - 6, 14, 12);
    for (const limb of LIMBS) {
      const p = g.p[limb];
      circle(
        p,
        limb.endsWith('Hand') ? 7 : 9,
        limb.endsWith('Hand') ? '#edd2a2' : '#28362f',
      );
      if (g.grips[limb]) circle(p, 3, '#ccdda8');
      if (g.drag?.limb === limb) {
        const root = g.root(limb);
        ctx.strokeStyle = '#fff9d060';
        ctx.lineWidth = 1.5 / v.scale;
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        ctx.arc(root.x, root.y, g.reach(limb), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        circle(p, 13, '#fff0', '#fff6ce');
      }
    }
    if (g.drag) {
      const near = g.nearest(g.p[g.drag.limb], 27);
      if (near) {
        circle(near, 10, '#b4e17e70', '#f3ffd3');
      }
    }
    // Only the currently available interaction is highlighted; editor geometry stays hidden.
    const cat = g.cat;
    ctx.save();
    ctx.translate(cat.x, cat.y);
    ctx.font = '35px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#17271d';
    ctx.shadowBlur = 4;
    ctx.fillText('🐈', 0, -7);
    ctx.restore();
    if (!g.collected) label({ x: cat.x, y: cat.y - 35 }, 'PICKLES');
    for (const o of l.interactiveObjects) {
      if (o.type === 'customer') {
        ctx.font = '42px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧍🏻‍♀️', o.x, o.y);
        label({ x: o.x, y: o.y - 52 }, 'SARAH');
      }
    }
  }
  if (fg?.complete && fg.naturalWidth)
    ctx.drawImage(fg, 0, 0, l.worldWidth, l.worldHeight);
  ctx.restore();
}
