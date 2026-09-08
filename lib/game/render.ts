import { Climber } from './physics';
import type { Level, Point, Grip } from './level';
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
    let shapeScale = 1;
    const polygon = (points: Point[], fill: string, stroke = '#26372f') => {
      ctx.beginPath();
      points.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.2 * shapeScale;
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

    const objective = l.objectives[0];
    if (objective.type === 'repair') {
      if (objective.kind === 'bulb') {
        if (g.complete) {
          const glow = ctx.createRadialGradient(
            objective.x,
            objective.y + 10,
            3,
            objective.x,
            objective.y + 10,
            54,
          );
          glow.addColorStop(0, '#fff5aaca');
          glow.addColorStop(0.38, '#ffd45c66');
          glow.addColorStop(1, '#ffd45c00');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(objective.x, objective.y + 10, 54, 0, Math.PI * 2);
          ctx.fill();
        }
        polygon(
          [
            { x: objective.x - 7, y: objective.y - 7 },
            { x: objective.x + 7, y: objective.y - 7 },
            { x: objective.x + 6, y: objective.y + 1 },
            { x: objective.x - 6, y: objective.y + 1 },
          ],
          '#69706c',
          '#28332f',
        );
        circle(
          { x: objective.x, y: objective.y + 10 },
          11,
          g.complete ? '#ffe37c' : '#78919a',
          '#303b36',
        );
        if (g.complete)
          circle({ x: objective.x - 3, y: objective.y + 7 }, 3, '#fffbd0');
      } else if (objective.kind && objective.kind !== 'cross') {
        ctx.save();
        ctx.translate(objective.x, objective.y);
        const repaired = g.complete;
        const metal = repaired ? '#b0c5c4' : '#98694c';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#253438';
        if (objective.kind === 'valve' || objective.kind === 'gear') {
          ctx.fillStyle = '#55696a';
          ctx.fillRect(-7, -24, 14, 48);
          ctx.rotate(repaired ? Math.PI / 2 : -0.3);
          const count = objective.kind === 'gear' ? 16 : 8;
          const points = Array.from({ length: count }, (_, i) => {
            const angle = (i * Math.PI * 2) / count;
            const r = objective.kind === 'gear' && i % 2 ? 14 : 21;
            return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
          });
          polygon(points, metal);
          for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(16, 0);
            ctx.stroke();
          }
          circle({ x: 0, y: 0 }, 5, '#e4d7b3');
        } else if (objective.kind === 'cap') {
          ctx.rotate(repaired ? 0 : 0.22);
          polygon(
            [
              { x: -30, y: 6 },
              { x: -24, y: -8 },
              { x: 0, y: -15 },
              { x: 24, y: -8 },
              { x: 30, y: 6 },
            ],
            metal,
          );
          ctx.fillStyle = '#45595b';
          ctx.fillRect(-21, 6, 5, 15);
          ctx.fillRect(16, 6, 5, 15);
        } else {
          polygon(
            [
              { x: -17, y: -23 },
              { x: 17, y: -23 },
              { x: 19, y: 23 },
              { x: -19, y: 23 },
            ],
            '#637777',
          );
          ctx.fillStyle = '#243b3b';
          ctx.fillRect(-11, -15, 22, 12);
          ctx.fillStyle = repaired ? '#ffdf85' : '#b5533c';
          ctx.fillRect(-7, -11, 14, 4);
          ctx.save();
          ctx.rotate(repaired ? 0 : 0.6);
          ctx.fillStyle = '#e2d1a8';
          ctx.fillRect(-3, 1, 6, 16);
          ctx.restore();
        }
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(objective.x, objective.y);
        ctx.rotate(g.complete ? 0 : 0.28);
        polygon(
          [
            { x: -7, y: 2 },
            { x: -8, y: -88 },
            { x: 7, y: -91 },
            { x: 7, y: 2 },
          ],
          '#777d78',
          '#303934',
        );
        polygon(
          [
            { x: -43, y: -68 },
            { x: 43, y: -70 },
            { x: 42, y: -54 },
            { x: -43, y: -52 },
          ],
          '#858b85',
          '#303934',
        );
        ctx.fillStyle = '#c4c7b655';
        ctx.beginPath();
        ctx.moveTo(-5, -86);
        ctx.lineTo(5, -89);
        ctx.lineTo(5, -2);
        ctx.lineTo(0, -11);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        circle(objective, 7, g.complete ? '#dfe5aa' : '#6d746c', '#303934');
      }
    }

    const bodyScale = g.scale;
    shapeScale = bodyScale;

    // Limbs sit behind a rigid torso and visibly originate at its shoulder and hip corners.
    for (const side of ['left', 'right']) {
      taperedLimb(
        g.p[side + 'Hip'],
        g.p[side + 'Knee'],
        8.5 * bodyScale,
        7 * bodyScale,
        '#465550',
        '#303d39',
      );
      taperedLimb(
        g.p[side + 'Knee'],
        g.p[side + 'Foot'],
        7 * bodyScale,
        5.5 * bodyScale,
        '#59635d',
        '#3b4842',
      );
      facetedJoint(g.p[side + 'Knee'], 7.2 * bodyScale, '#58655f', '#35433e');
      extremity(
        g.p[side + 'Knee'],
        g.p[side + 'Foot'],
        9 * bodyScale,
        6.5 * bodyScale,
        '#22312d',
        (side === 'left' ? 3 : -3) * bodyScale,
      );
    }
    for (const side of ['left', 'right']) {
      taperedLimb(
        g.p[side + 'Shoulder'],
        g.p[side + 'Elbow'],
        7.2 * bodyScale,
        5.8 * bodyScale,
        '#f0b44e',
        '#c98731',
      );
      taperedLimb(
        g.p[side + 'Elbow'],
        g.p[side + 'Hand'],
        5.8 * bodyScale,
        4.2 * bodyScale,
        '#e9c795',
        '#c89d6d',
      );
      facetedJoint(g.p[side + 'Elbow'], 5.6 * bodyScale, '#e5bd87', '#b98d60');
      extremity(
        g.p[side + 'Elbow'],
        g.p[side + 'Hand'],
        3.5 * bodyScale,
        5.2 * bodyScale,
        '#d8ad78',
      );
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
        { x: leftHip.x - 2 * bodyScale, y: leftHip.y - 2 * bodyScale },
        { x: rightHip.x + 2 * bodyScale, y: rightHip.y - 2 * bodyScale },
        { x: rightHip.x + 4 * bodyScale, y: rightHip.y + 9 * bodyScale },
        { x: leftHip.x - 4 * bodyScale, y: leftHip.y + 9 * bodyScale },
      ],
      '#293a34',
    );

    // Neck and head follow the torso instead of floating above it.
    taperedLimb(
      g.p.neck,
      g.p.head,
      6 * bodyScale,
      7 * bodyScale,
      '#e9c795',
      '#c89d6d',
    );
    const head = g.p.head,
      headAngle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x,
      );
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(headAngle);
    ctx.scale(bodyScale, bodyScale);
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
    polygon(
      [
        { x: -12, y: -5 },
        { x: -9, y: -14 },
        { x: -2, y: -17 },
        { x: 3, y: -14 },
        { x: 9, y: -16 },
        { x: 12, y: -8 },
        { x: 7, y: -10 },
        { x: 2, y: -6 },
        { x: -4, y: -10 },
      ],
      '#49362b',
      '#2c2924',
    );
    ctx.restore();
    // Short surface-edge highlights replace floating targets and range rings.
    const edgeMark = (p: Grip, strength: number, width = 8) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.scale(bodyScale, bodyScale);
      ctx.globalAlpha = strength;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-width, 2);
      ctx.lineTo(-width * 0.2, -1);
      ctx.lineTo(width, 0);
      ctx.strokeStyle = '#201b16';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.translate(0, -1);
      ctx.strokeStyle = l.id === 'telephone-tower-bulb' ? '#e7f0f3' : '#fff2cf';
      ctx.lineWidth = 1.7;
      ctx.stroke();
      ctx.restore();
    };
    if (g.drag) {
      const ready = g.grabPreview();
      const { limb, target } = g.drag;
      const nearby = l.gripPoints
        .filter(
          (hold) =>
            Math.hypot(hold.x - target.x, hold.y - target.y) < 75 * bodyScale &&
            Math.hypot(hold.x - g.root(limb).x, hold.y - g.root(limb).y) <=
              g.reach(limb) + 8 * bodyScale,
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - target.x, a.y - target.y) -
            Math.hypot(b.x - target.x, b.y - target.y),
        )
        .slice(0, 8);
      for (const hold of nearby) {
        const proximity = Math.hypot(hold.x - target.x, hold.y - target.y);
        if (
          proximity < 75 * bodyScale &&
          Math.hypot(hold.x - g.root(limb).x, hold.y - g.root(limb).y) <=
            g.reach(limb) + 8 * bodyScale
        ) {
          edgeMark(hold, 0.12 + 0.28 * (1 - proximity / (75 * bodyScale)), 5);
        }
      }
      if (ready) edgeMark(ready, 1, 10);
    }
    for (const hold of Object.values(g.grips)) edgeMark(hold, 0.55, 5);
    for (const event of g.catches) {
      const t = event.age / 0.38;
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.fillStyle = '#f8e5bb';
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI * (1.1 + i * 0.2);
        const travel = (4 + t * 17) * bodyScale;
        ctx.fillRect(
          event.x + Math.cos(angle) * travel,
          event.y + Math.sin(angle) * travel + t * t * 14 * bodyScale,
          2 * bodyScale,
          2 * bodyScale,
        );
      }
      ctx.restore();
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
