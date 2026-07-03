/**
 * Generates a hand-drawn marker "circle" (ellipse loop) that matches the rough
 * brush texture of the hero underline (hero-brush-stroke.svg).
 *
 * The hero stroke is a single filled #C4110D path with a rough, variable-width,
 * marker-like edge. We emulate the same feel here: an ellipse traced a little
 * past a full turn (so the ends overshoot / cross like a real marker circle),
 * with a wobbling centerline, a variable band width, and tapered ends.
 *
 * Deterministic (seeded) so the asset is stable across regenerations.
 */
import { writeFileSync } from "node:fs";

// White so the shape works as a CSS luminance/alpha mask; the visible colour is
// supplied by `background: var(--red)` on the element that uses this as a mask.
const FILL = "#fff";

// --- deterministic PRNG (mulberry32) ---
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260704);

const VB_W = 240;
const VB_H = 132;
const cx = VB_W / 2;
const cy = VB_H / 2 + 1;

// base ellipse radii for the centre-line of the marker band
const RX = 104;
const RY = 52;

// draw a little past one full turn so the stroke overshoots and crosses
const START = -Math.PI * 0.62; // begin up & slightly right, like a natural hand start
const TURNS = 1.075;
const TOTAL = Math.PI * 2 * TURNS;
const STEPS = 480;

// layered low-frequency wobble for an organic, hand-drawn edge
function wobble(theta, amp, freqs) {
  let v = 0;
  for (const [f, p, w] of freqs) v += Math.sin(theta * f + p) * w;
  return v * amp;
}
const rxNoise = [
  [3, 0.7, 1],
  [7, 2.1, 0.45],
  [13, 4.4, 0.22],
];
const ryNoise = [
  [3, 1.9, 1],
  [8, 0.4, 0.4],
  [15, 5.1, 0.2],
];

// band (stroke) half-width along the path: fairly thick like a marker, tapering
// to a point at both ends, with subtle brushy variation in the middle.
function halfWidth(t) {
  const tip = Math.pow(Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)), 0.55); // 0 at ends, 1 mid
  const base = 6.4;
  const vary = 1.0 * Math.sin(t * Math.PI * 2 * 5 + 0.8) + 0.6 * Math.sin(t * Math.PI * 2 * 11 + 2.3);
  return Math.max(0.4, tip * (base + vary) + (rng() - 0.5) * 0.5);
}

const outer = [];
const inner = [];
for (let i = 0; i <= STEPS; i++) {
  const t = i / STEPS;
  const theta = START + t * TOTAL;

  const rx = RX + wobble(theta, 3.2, rxNoise);
  const ry = RY + wobble(theta, 2.4, ryNoise);

  const px = cx + rx * Math.cos(theta);
  const py = cy + ry * Math.sin(theta);

  // outward radial unit vector (good-enough normal for a marker ring)
  const dx = px - cx;
  const dy = py - cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const hw = halfWidth(t);
  outer.push([px + ux * hw, py + uy * hw]);
  inner.push([px - ux * hw, py - uy * hw]);
}

const fmt = n => n.toFixed(2);
function toPath(pts) {
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`).join(" ");
}

// forward along outer edge, back along inner edge, close -> filled brush band
const d = `${toPath(outer)} ${toPath([...inner].reverse().map(p => p))} Z`.replace(/ L/g, "L");

const svg = `<svg width="${VB_W}" height="${VB_H}" viewBox="0 0 ${VB_W} ${VB_H}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="${FILL}"/></svg>`;

const out = new URL("../public/images/landing/hero-brush-circle.svg", import.meta.url);
writeFileSync(out, svg);
console.log("wrote", out.pathname, `(${svg.length} bytes)`);
