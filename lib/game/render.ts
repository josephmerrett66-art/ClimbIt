import { Climber, LIMBS, distance } from './physics';
import type { Level, Point } from './level';
export type View = { scale: number; x: number; y: number };
export function draw(
  ctx: CanvasRenderingContext2D,
  g: Climber,
  l: Level,
  bg: HTMLImageElement | null,
  fg: HTMLImageElement | null,
  catSprite: HTMLImageElement | null,
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
    const polygon = (points: Point[], fill: string, stroke = '#26372f') => {
      ctx.beginPath();
      points.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.stroke();
    };
    const taperedLimb = (
      from: Point,
      to: Point,
      fromWidth: number,
      toWidth: number,
      light: string,
      dark: string,
    ) => {
      const dx = to.x - from.x,
        dy = to.y - from.y,
        length = Math.hypot(dx, dy) || 1,
        nx = -dy / length,
        ny = dx / length;
      const a = { x: from.x + nx * fromWidth, y: from.y + ny * fromWidth },
        b = { x: to.x + nx * toWidth, y: to.y + ny * toWidth },
        c = { x: to.x - nx * toWidth, y: to.y - ny * toWidth },
        d = { x: from.x - nx * fromWidth, y: from.y - ny * fromWidth },
        middle = {
          x: (from.x + to.x) / 2 + nx * 1.5,
          y: (from.y + to.y) / 2 + ny * 1.5,
        };
      polygon([a, b, c, d], dark);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(middle.x, middle.y);
      ctx.closePath();
      ctx.fillStyle = light;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(middle.x, middle.y);
      ctx.lineTo(d.x, d.y);
      ctx.closePath();
      ctx.fillStyle = '#ffffff18';
      ctx.fill();
    };
    const facetedJoint = (
      p: Point,
      radius: number,
      light: string,
      dark: string,
    ) => {
      polygon(
        [
          { x: p.x, y: p.y - radius },
          { x: p.x + radius, y: p.y },
          { x: p.x, y: p.y + radius },
          { x: p.x - radius, y: p.y },
        ],
        dark,
      );
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - radius);
      ctx.lineTo(p.x + radius, p.y);
      ctx.lineTo(p.x, p.y);
      ctx.lineTo(p.x - radius, p.y);
      ctx.closePath();
      ctx.fillStyle = light;
      ctx.fill();
    };
    const extremity = (
      from: Point,
      to: Point,
      length: number,
      width: number,
      fill: string,
      toe = 0,
    ) => {
      const dx = to.x - from.x,
        dy = to.y - from.y,
        d = Math.hypot(dx, dy) || 1,
        ux = dx / d,
        uy = dy / d,
        nx = -uy,
        ny = ux,
        tip = {
          x: to.x + ux * length + nx * toe,
          y: to.y + uy * length + ny * toe,
        };
      polygon(
        [
          { x: to.x + nx * width, y: to.y + ny * width },
          {
            x: tip.x + nx * width * 0.45,
            y: tip.y + ny * width * 0.45,
          },
          {
            x: tip.x - nx * width * 0.75,
            y: tip.y - ny * width * 0.75,
          },
          { x: to.x - nx * width, y: to.y - ny * width },
        ],
        fill,
      );
    };

    // Limbs sit behind a rigid torso and visibly originate at its shoulder and hip corners.
    for (const side of ['left', 'right']) {
      taperedLimb(
        g.p[side + 'Hip'],
        g.p[side + 'Knee'],
        8.5,
        7,
        '#465550',
        '#303d39',
      );
      taperedLimb(
        g.p[side + 'Knee'],
        g.p[side + 'Foot'],
        7,
        5.5,
        '#59635d',
        '#3b4842',
      );
      facetedJoint(g.p[side + 'Knee'], 7.2, '#58655f', '#35433e');
      extremity(
        g.p[side + 'Knee'],
        g.p[side + 'Foot'],
        9,
        6.5,
        '#22312d',
        side === 'left' ? 3 : -3,
      );
    }
    for (const side of ['left', 'right']) {
      taperedLimb(
        g.p[side + 'Shoulder'],
        g.p[side + 'Elbow'],
        7.2,
        5.8,
        '#f0b44e',
        '#c98731',
      );
      taperedLimb(
        g.p[side + 'Elbow'],
        g.p[side + 'Hand'],
        5.8,
        4.2,
        '#e9c795',
        '#c89d6d',
      );
      facetedJoint(g.p[side + 'Elbow'], 5.6, '#e5bd87', '#b98d60');
      extremity(g.p[side + 'Elbow'], g.p[side + 'Hand'], 3.5, 5.2, '#d8ad78');
    }

    const leftShoulder = g.p.leftShoulder,
      rightShoulder = g.p.rightShoulder,
      leftHip = g.p.leftHip,
      rightHip = g.p.rightHip,
      torsoCenter = {
        x: (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4,
        y: (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4,
      };
    polygon([leftShoulder, rightShoulder, rightHip, leftHip], '#d69234');
    const torsoFacets = [
      [leftShoulder, rightShoulder, torsoCenter, '#efb54d'],
      [rightShoulder, rightHip, torsoCenter, '#bd7629'],
      [rightHip, leftHip, torsoCenter, '#cc842e'],
      [leftHip, leftShoulder, torsoCenter, '#e4a03a'],
    ] as const;
    for (const [p1, p2, p3, color] of torsoFacets) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    polygon(
      [
        { x: leftHip.x - 2, y: leftHip.y - 2 },
        { x: rightHip.x + 2, y: rightHip.y - 2 },
        { x: rightHip.x + 4, y: rightHip.y + 9 },
        { x: leftHip.x - 4, y: leftHip.y + 9 },
      ],
      '#293a34',
    );

    // Neck and head follow the torso instead of floating above it.
    taperedLimb(g.p.neck, g.p.head, 6, 7, '#e9c795', '#c89d6d');
    const head = g.p.head,
      headAngle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x,
      );
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(headAngle);
    polygon(
      [
        { x: -11, y: -13 },
        { x: 8, y: -15 },
        { x: 14, y: -3 },
        { x: 10, y: 12 },
        { x: -7, y: 14 },
        { x: -14, y: 4 },
      ],
      '#d9b47f',
    );
    ctx.beginPath();
    ctx.moveTo(-11, -3);
    ctx.lineTo(14, -3);
    ctx.lineTo(8, -15);
    ctx.lineTo(-6, -15);
    ctx.closePath();
    ctx.fillStyle = '#f1eee3';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.lineTo(15, -2);
    ctx.lineTo(11, 2);
    ctx.lineTo(-13, 2);
    ctx.closePath();
    ctx.fillStyle = '#d8d9d1';
    ctx.fill();
    ctx.restore();

    // Harness connects the torso, pelvis and rope into one readable body.
    ctx.strokeStyle = '#bfcd72';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(leftShoulder.x, leftShoulder.y + 4);
    ctx.lineTo(rightHip.x, rightHip.y + 3);
    ctx.moveTo(rightShoulder.x, rightShoulder.y + 4);
    ctx.lineTo(leftHip.x, leftHip.y + 3);
    ctx.stroke();
    polygon(
      [
        { x: hip.x - 6, y: hip.y - 5 },
        { x: hip.x + 6, y: hip.y - 5 },
        { x: hip.x + 7, y: hip.y + 5 },
        { x: hip.x - 7, y: hip.y + 5 },
      ],
      '#aebc64',
      '#334239',
    );
    for (const limb of LIMBS) {
      const p = g.p[limb];
      if (g.grips[limb]) circle(p, 3, '#ccdda8');
      if (g.drag?.limb === limb) {
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
    if (catSprite?.complete && catSprite.naturalWidth) {
      const height = g.collected ? 40 : 48;
      const width = (height * catSprite.naturalWidth) / catSprite.naturalHeight;
      ctx.save();
      ctx.translate(cat.x, cat.y);
      if (g.collected) ctx.rotate(-0.14);
      ctx.drawImage(catSprite, -width / 2, -height + 6, width, height);
      ctx.restore();
    }
  }
  if (fg?.complete && fg.naturalWidth)
    ctx.drawImage(fg, 0, 0, l.worldWidth, l.worldHeight);
  ctx.restore();
}
