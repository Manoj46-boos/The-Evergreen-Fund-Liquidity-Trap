/**
 * Targeted cadence probe (U-10): runs the event-cadence measurement on ONE
 * scene group (by sceneKey) — IDENTICAL algorithm to tools/gate-check.mjs
 * --cadence (full 1080p render → 320×180 downsample → luminance diff),
 * scoped so a single group can be measured in the sandbox.
 *
 *   node scripts/cadence-probe.mjs c1-open
 */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createCanvas, registerFont } from 'canvas';

const require = createRequire(import.meta.url);
globalThis.document = { createElement: () => createCanvas(192, 192) };
globalThis.OffscreenCanvas = class { constructor(w, h) { return createCanvas(w, h); } };
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = process.argv[3] || path.join(REPO, '.render-check-build');

for (const [f, family, weight] of [
  ['Inter-400.ttf', 'Inter', 400], ['Inter-600.ttf', 'Inter', 600], ['Inter-700.ttf', 'Inter', 700],
  ['Fraunces-400.ttf', 'Fraunces', 400], ['Fraunces-600.ttf', 'Fraunces', 600], ['Fraunces-700.ttf', 'Fraunces', 700],
]) registerFont(path.join(REPO, 'public', 'fonts', f), { family, weight: String(weight) });

const { buildTimeline } = require(path.join(BUILD, 'timeline.js'));
const { drawFrame } = require(path.join(BUILD, 'director.js'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, '.render-assets', 'manifest.json'), 'utf8'));

const KEY = process.argv[2] || 'c1-open';
const WIN = 166;
const CHANGE_FLOOR = 0.01;
const DEAD_MAX_MS = 800;
const PIXEL_FLOOR = 6;
const FW = 320, FH = 180;
const MASK_TOP = Math.round(FH * 0.72);
const OPTS = { captions: 'karaoke', channelName: 'The Data Desk', nextVideoTitle: 'x', watermark: true, progressBar: true };

const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

const tl = buildTimeline(manifest, 24);
const groups = [];
tl.beats.forEach((b) => {
  const key = b.beat.scene.sceneKey;
  const last = groups[groups.length - 1];
  if (last && last.key === key) last.endMs = b.endMs;
  else groups.push({ key, type: b.beat.scene.type, startMs: b.startMs, endMs: b.endMs });
});
const g = groups.find((x) => x.key === KEY);
if (!g) { console.error(`no group ${KEY}`); process.exit(2); }

// the FULL-resolution frame + the 320 twin (exactly the gate's pipeline)
const frame = createCanvas(1920, 1080);
const fctx = frame.getContext('2d', { willReadFrequently: true });
fctx.imageSmoothingQuality = 'high';
const twin = createCanvas(FW, FH);
const fx = twin.getContext('2d', { willReadFrequently: true });

const t0 = g.startMs + 120;
const t1 = g.endMs - 80;
const dead = [];
let prev = null;
for (let t = t0; t + WIN <= t1; t += WIN) {
  drawFrame(fctx, tl, t, OPTS);
  fx.drawImage(frame, 0, 0, FW, FH);
  const d = fx.getImageData(0, 0, FW, FH).data;
  if (prev !== null) {
    let moved = 0, total = 0;
    for (let y = 0; y < MASK_TOP; y++) {
      for (let x = 0; x < FW; x++) {
        const L = lum(d, (y * FW + x) * 4);
        total++;
        if (Math.abs(L - prev[y * FW + x]) > PIXEL_FLOOR) moved++;
      }
    }
    dead.push(moved / total < CHANGE_FLOOR);
  }
  if (prev === null) prev = new Float32Array(FW * MASK_TOP);
  for (let y = 0; y < MASK_TOP; y++) {
    for (let x = 0; x < FW; x++) prev[y * FW + x] = lum(d, (y * FW + x) * 4);
  }
}
const windows = dead.length;
const deadCount = dead.reduce((n, v) => n + (v ? 1 : 0), 0);
let run = 0, maxRun = 0;
for (const v of dead) { run = v ? run + 1 : 0; maxRun = Math.max(maxRun, run); }
const share = windows ? deadCount / windows : 0;
const runMs = maxRun * WIN;
const ok = share <= 0.15 && runMs <= DEAD_MAX_MS;
console.log(`${g.key} (${g.type})  windows=${windows}  dead=${Math.round(share * 100)}%  maxRun=${runMs}ms  ${ok ? 'PASS' : 'FAIL'}`);
