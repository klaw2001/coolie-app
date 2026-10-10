import { AREAS, type Area } from '@/data/areas';
import { STATIONS } from '@/data/stations';
import type { LatLng } from '@/store/types';

/**
 * The drawn city map: a made-up but stable street grid, parks, railway lines and station complexes.
 * Everything is generated from world coordinates, so the same streets come back when you pan away and return.
 */

/** Camera: centre in world metres, zoom in screen pixels per metre, and metres per degree of longitude for this city. */
export interface Cam {
  x: number;
  y: number;
  s: number;
  kx: number;
}

export interface Pad {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** What gets drawn: the visible map plus `ox`/`oy` pixels of overscan on each side, so a drag never shows an empty edge. */
export interface Frame {
  cam: Cam;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

export const MAP_COLORS = {
  land: '#F1EBE5',
  block: '#E8DFD7',
  block2: '#E5D7CF',
  park: '#D5E9C9',
  tree: '#BCDBAB',
  water: '#C8E1F2',
  street: '#FFFFFF',
  majorCase: '#E3D5CD',
  avenueCase: '#EACB7C',
  avenue: '#FBE8B4',
  plaza: '#F6F1EC',
  railBed: '#E2D7CF',
  tie: '#C6B8B1',
  rail: '#8D7D78',
  precinct: '#F8E3E0',
  precinctLine: '#EDC6C1',
  platform: '#FFFFFF',
  concourse: '#EDBDB8',
  train: '#D3252B',
  engine: '#A8161C',
  label: '#A89790',
};

const KY = 110_574;
export const MIN_S = 0.008;
export const MAX_S = 1.8;

export function kxFor(lat: number): number {
  return 111_320 * Math.cos((Math.round(lat) * Math.PI) / 180);
}

export function toWorld(p: LatLng, kx: number) {
  return { x: p.longitude * kx, y: p.latitude * KY };
}

export function toLatLng(x: number, y: number, kx: number): LatLng {
  return { latitude: y / KY, longitude: x / kx };
}

/** Screen position (inside the overscanned drawing) of a world point. */
export function project(f: Frame, p: LatLng) {
  const w = toWorld(p, f.cam.kx);
  return { X: f.ox + f.w / 2 + (w.x - f.cam.x) * f.cam.s, Y: f.oy + f.h / 2 - (w.y - f.cam.y) * f.cam.s };
}

/** Camera that fits all points inside the padded viewport (or centres a single point at `zoom`). */
export function fitCam(points: LatLng[], w: number, h: number, pad: Pad, zoom: number): Cam {
  const first = points[0] ?? { latitude: 18.94, longitude: 72.835 };
  const kx = kxFor(first.latitude);
  const ws = points.map((p) => toWorld(p, kx));
  if (ws.length === 0) ws.push(toWorld(first, kx));
  const xs = ws.map((p) => p.x);
  const ys = ws.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const availW = Math.max(w * 0.4, w - pad.left - pad.right);
  const availH = Math.max(h * 0.4, h - pad.top - pad.bottom);
  const spanX = maxX - minX, spanY = maxY - minY;
  let s = zoom;
  if (spanX > 1 || spanY > 1) s = Math.min(availW / Math.max(spanX, 1), availH / Math.max(spanY, 1));
  s = Math.min(MAX_S, Math.max(MIN_S, s));
  return {
    kx,
    s,
    x: (minX + maxX) / 2 - (pad.left - pad.right) / 2 / s,
    y: (minY + maxY) / 2 + (pad.top - pad.bottom) / 2 / s,
  };
}

function hash(a: number, b: number, c: number): number {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Which way the tracks leave each station (compass bearing) and whether it is a terminus.
 * Bearings are chosen so the gates, parking and stands (fixed offsets in stations.ts) sit beside the tracks, not on them.
 */
const RAIL: Record<string, { bearing: number; terminus?: boolean }> = {
  CSMT: { bearing: 58, terminus: true },
  NDLS: { bearing: 64 },
  HWH: { bearing: 236, terminus: true },
  MAS: { bearing: 242, terminus: true },
  SBC: { bearing: 52 },
  PUNE: { bearing: 68 },
  ADI: { bearing: 55 },
  LKO: { bearing: 245 },
  JP: { bearing: 62 },
  HYB: { bearing: 232, terminus: true },
};

// Station complex size in metres.
const PRECINCT_LEN = 230;
const PRECINCT_WID = 75;
const PLAZA_LEN = 340;
const PLAZA_WID = 230;

/** Street spacing ladder (metres). The map picks the rung that keeps blocks 46–92 px wide at the current zoom. */
const LADDER = [70, 140, 280, 560, 1120, 2240, 4480, 8960, 17920];

export interface Drawing {
  blocks: string;
  blocks2: string;
  parks: string;
  water: string;
  trees: string;
  minor: string;
  majorCase: string;
  major: string;
  avenueCase: string;
  avenue: string;
  plaza: string;
  railBed: string;
  railBedWidth: number;
  ties: string;
  rails: string;
  precinct: string;
  tracks: string;
  platforms: string;
  platformWidth: number;
  concourse: string;
  train: string;
  engine: string;
  trainWidth: number;
  labels: { key: string; X: number; Y: number; area: Area }[];
}

type Kind = 'minor' | 'major' | 'avenue';
const HALF: Record<Kind, number> = { minor: 2.5, major: 5.5, avenue: 6.5 };

export function drawCity(f: Frame): Drawing {
  const { cam, w, h, ox, oy } = f;
  const s = cam.s;
  const lvl = LADDER.findIndex((m) => m * s >= 46);
  const level = lvl === -1 ? LADDER.length - 1 : lvl;
  const sp = LADDER[level];

  // Each city gets its own slightly rotated grid, so it never looks like graph paper.
  const lat = cam.y / KY;
  const lng = cam.x / cam.kx;
  const theta = (hash(Math.round(lat), Math.round(lng), 7) - 0.5) * 0.6;
  const cos = Math.cos(theta), sin = Math.sin(theta);

  const cx = ox + w / 2, cy = oy + h / 2;
  // Grid (rotated) space, relative to the camera centre → drawing pixels.
  const gp = (gx: number, gy: number) => {
    const wx = gx * cos - gy * sin;
    const wy = gx * sin + gy * cos;
    return `${r1(cx + wx * s)},${r1(cy - wy * s)}`;
  };
  const gcx = cam.x * cos + cam.y * sin;
  const gcy = -cam.x * sin + cam.y * cos;
  const hx = (w / 2 + ox) / s, hy = (h / 2 + oy) / s;
  const ex = hx * Math.abs(cos) + hy * Math.abs(sin);
  const ey = hx * Math.abs(sin) + hy * Math.abs(cos);

  const i0 = Math.floor((gcx - ex) / sp) - 1, i1 = Math.ceil((gcx + ex) / sp) + 1;
  const j0 = Math.floor((gcy - ey) / sp) - 1, j1 = Math.ceil((gcy + ey) / sp) + 1;
  const colX = (i: number) => i * sp + (hash(i, level, 11) - 0.5) * sp * 0.36 - gcx;
  const rowY = (j: number) => j * sp + (hash(j, level, 12) - 0.5) * sp * 0.36 - gcy;
  const kindOf = (n: number): Kind => (mod(n, 16) === 0 ? 'avenue' : mod(n, 4) === 0 ? 'major' : 'minor');
  // Minor streets skip a block now and then; the gap reads as a lane between two blocks.
  const vOpen = (i: number, j: number) => kindOf(i) !== 'minor' || hash(i, j, 21 + level) < 0.86;
  const hOpen = (i: number, j: number) => kindOf(j) !== 'minor' || hash(i, j, 22 + level) < 0.86;

  const xs: number[] = [];
  for (let i = i0; i <= i1; i++) xs.push(colX(i));
  const ys: number[] = [];
  for (let j = j0; j <= j1; j++) ys.push(rowY(j));

  let minor = '', major = '', avenue = '';
  const addLine = (kind: Kind, d: string) => {
    if (kind === 'minor') minor += d;
    else if (kind === 'major') major += d;
    else avenue += d;
  };
  // Vertical streets, merging consecutive open segments into one stroke.
  for (let a = 0; a < xs.length; a++) {
    const i = i0 + a;
    const kind = kindOf(i);
    let start = -1;
    for (let b = 0; b <= ys.length - 1; b++) {
      const open = b < ys.length - 1 && vOpen(i, j0 + b);
      if (open && start < 0) start = b;
      if (!open && start >= 0) {
        addLine(kind, `M${gp(xs[a], ys[start])}L${gp(xs[a], ys[b])}`);
        start = -1;
      }
    }
  }
  for (let b = 0; b < ys.length; b++) {
    const j = j0 + b;
    const kind = kindOf(j);
    let start = -1;
    for (let a = 0; a <= xs.length - 1; a++) {
      const open = a < xs.length - 1 && hOpen(i0 + a, j);
      if (open && start < 0) start = a;
      if (!open && start >= 0) {
        addLine(kind, `M${gp(xs[start], ys[b])}L${gp(xs[a], ys[b])}`);
        start = -1;
      }
    }
  }

  // City blocks, parks and ponds.
  let blocks = '', blocks2 = '', parks = '', water = '', trees = '';
  const rect = (x0: number, y0: number, x1: number, y1: number) => `M${gp(x0, y0)}L${gp(x1, y0)}L${gp(x1, y1)}L${gp(x0, y1)}Z`;
  const circle = (gx: number, gy: number, rPx: number) => {
    const [X, Y] = gp(gx, gy).split(',').map(Number);
    const r = r1(rPx);
    return `M${r1(X - r)},${Y}a${r},${r} 0 1,0 ${r1(2 * r)},0a${r},${r} 0 1,0 ${r1(-2 * r)},0Z`;
  };
  const inset = (kind: Kind, open: boolean) => (open ? HALF[kind] + 4 : 2.6) / s;
  for (let a = 0; a < xs.length - 1; a++) {
    for (let b = 0; b < ys.length - 1; b++) {
      const i = i0 + a, j = j0 + b;
      const x0 = xs[a] + inset(kindOf(i), vOpen(i, j));
      const x1 = xs[a + 1] - inset(kindOf(i + 1), vOpen(i + 1, j));
      const y0 = ys[b] + inset(kindOf(j), hOpen(i, j));
      const y1 = ys[b + 1] - inset(kindOf(j + 1), hOpen(i, j + 1));
      if (x1 - x0 < 6 / s || y1 - y0 < 6 / s) continue;
      const kindRoll = hash(i, j, 31 + level);
      if (kindRoll < 0.075) {
        parks += rect(x0, y0, x1, y1);
        const bw = x1 - x0, bh = y1 - y0;
        const pond = hash(i, j, 34) < 0.35;
        if (pond) water += circle(x0 + bw * 0.32, y0 + bh * 0.4, Math.min(bw, bh) * 0.24 * s);
        const n = 3 + Math.floor(hash(i, j, 35) * 4);
        for (let k = 0; k < n; k++) {
          const u = pond ? 0.6 + 0.28 * hash(i, j, 40 + k) : 0.14 + 0.72 * hash(i, j, 40 + k);
          const v = 0.16 + 0.68 * hash(i, j, 50 + k);
          trees += circle(x0 + bw * u, y0 + bh * v, 2.6 + 2.2 * hash(i, j, 60 + k));
        }
        continue;
      }
      if (kindRoll < 0.12) continue;
      const tone = hash(i, j, 32) < 0.3;
      const split = hash(i, j, 33);
      const lane = 2 / s;
      const parts: [number, number, number, number][] = [];
      if (split < 0.14) {
        const mx = x0 + (x1 - x0) * (0.4 + 0.2 * hash(i, j, 36));
        const my = y0 + (y1 - y0) * (0.4 + 0.2 * hash(i, j, 37));
        parts.push([x0, y0, mx - lane, my - lane], [mx + lane, y0, x1, my - lane], [x0, my + lane, mx - lane, y1], [mx + lane, my + lane, x1, y1]);
      } else if (split < 0.5) {
        const t = 0.38 + 0.24 * hash(i, j, 38);
        if (x1 - x0 > y1 - y0) {
          const m = x0 + (x1 - x0) * t;
          parts.push([x0, y0, m - lane, y1], [m + lane, y0, x1, y1]);
        } else {
          const m = y0 + (y1 - y0) * t;
          parts.push([x0, y0, x1, m - lane], [x0, m + lane, x1, y1]);
        }
      } else {
        parts.push([x0, y0, x1, y1]);
      }
      const d = parts.map((p) => rect(...p)).join('');
      if (tone) blocks2 += d;
      else blocks += d;
    }
  }

  // Railway lines and station complexes (screen space, unrotated).
  let plaza = '', railBed = '', ties = '', rails = '', precinct = '', tracks = '', platforms = '', concourse = '', train = '', engine = '';
  const diag = Math.hypot(hx, hy);
  const P = (x: number, y: number) => `${r1(x)},${r1(y)}`;
  const railBedWidth = Math.min(34, Math.max(14, 46 * s));
  const Lh = Math.max(14, PRECINCT_LEN * s), Wh = Math.max(6, PRECINCT_WID * s);
  const platformWidth = Math.max(1.5, Math.min(10, Wh * 0.2));
  const trainWidth = Math.max(1.5, Math.min(8, Wh * 0.14));
  for (const st of STATIONS) {
    const cfg = RAIL[st.code] ?? { bearing: 60 };
    const W = toWorld(st.coord, cam.kx);
    const rx = W.x - cam.x, ry = W.y - cam.y;
    if (Math.hypot(rx, ry) > 60_000) continue; // another city
    const b = (cfg.bearing * Math.PI) / 180;
    const ux = Math.sin(b), uy = Math.cos(b); // world direction
    if (Math.abs(rx * uy - ry * ux) > diag + 400) continue; // line misses the drawing
    const sx = cx + rx * s, sy = cy - ry * s; // station on screen
    const dx = ux, dy = -uy; // screen direction along the tracks
    const nx = -dy, ny = dx; // across the tracks
    const at = (along: number, across: number) => P(sx + dx * along + nx * across, sy + dy * along + ny * across);
    const box = (a0: number, a1: number, c0: number, c1: number) => `M${at(a0, c0)}L${at(a1, c0)}L${at(a1, c1)}L${at(a0, c1)}Z`;
    const far = (Math.hypot(rx, ry) + diag) * s;
    const back = cfg.terminus ? -Lh * 0.62 : -far;
    const near = Math.hypot(rx, ry) < diag + PLAZA_LEN;

    if (near) plaza += box(-PLAZA_LEN * s, PLAZA_LEN * s, -PLAZA_WID * s, PLAZA_WID * s);
    const line = `M${at(back, 0)}L${at(far, 0)}`;
    railBed += line;
    ties += line;
    rails += `M${at(back, -2.6)}L${at(far, -2.6)}M${at(back, 2.6)}L${at(far, 2.6)}`;
    if (!near) continue;

    precinct += box(-Lh, Lh, -Wh, Wh);
    if (Lh < 40) continue;
    for (const o of [-0.72, -0.36, 0, 0.36, 0.72]) tracks += `M${at(-Lh * 0.62, o * Wh)}L${at(Lh, o * Wh)}`;
    for (const o of [-0.54, -0.18, 0.18, 0.54]) platforms += `M${at(-Lh * 0.6, o * Wh)}L${at(Lh * 0.72, o * Wh)}`;
    concourse += box(-Lh, -Lh * 0.66, -Wh * 0.92, Wh * 0.92);
    // A train waiting at the middle platform track.
    const cars = 7;
    const t0 = -Lh * 0.52, t1 = Lh * 0.78;
    const len = (t1 - t0) / cars;
    for (let k = 0; k < cars; k++) {
      const seg = `M${at(t0 + k * len + trainWidth * 0.6, 0)}L${at(t0 + (k + 1) * len - trainWidth * 0.6, 0)}`;
      if (k === 0) engine += seg;
      else train += seg;
    }
  }

  // Area names (Colaba, Bandra West…) wherever they fall inside the drawing.
  const labels: Drawing['labels'] = [];
  for (const [code, list] of Object.entries(AREAS)) {
    list.forEach((area, n) => {
      const q = project(f, area.coord);
      if (q.X < 0 || q.Y < 0 || q.X > w + 2 * ox || q.Y > h + 2 * oy) return;
      labels.push({ key: `${code}-${n}`, X: q.X, Y: q.Y, area });
    });
  }

  return {
    blocks,
    blocks2,
    parks,
    water,
    trees,
    minor,
    majorCase: major,
    major,
    avenueCase: avenue,
    avenue,
    plaza,
    railBed,
    railBedWidth,
    ties,
    rails,
    precinct,
    tracks,
    platforms,
    platformWidth,
    concourse,
    train,
    engine,
    trainWidth,
    labels,
  };
}
