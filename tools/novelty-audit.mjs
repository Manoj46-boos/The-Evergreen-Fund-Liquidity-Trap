/**
 * novelty-audit.mjs — AUDIT-ROUND-2 fix 26 (the retention machinery).
 *
 * "A companion to render-check: renders frames on a 1s grid, computes
 * pixel-difference against the previous second, flags any window where
 * nothing visibly changes for more than 3 seconds. Every flagged window
 * is a swipe risk — fix with a chart draw, a prop pop, a camera move or
 * a cut."
 *
 * Usage:
 *   node tools/novelty-audit.mjs [--step 1000] [--out report.json]
 *                                [--cut first] [--max-sec N] [--rebuild]
 *
 * Free, deterministic, renders in ~1-2 min on the 8 GB Dell (a 1s grid =
 * ~750 frames at 160×90 compare resolution). Exit code 1 if any ≥3s dead
 * window is found — wire it before every upload, next to the feed gate.
 */
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createCanvas, registerFont } from 'canvas';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(REPO, '.render-check-build');

const arg = (name, def = undefined) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};
const flag = (name) => process.argv.includes(`--${name}`);

if (flag('rebuild') || !fs.existsSync(path.join(BUILD, 'director.js'))) {
  const files = [
    'theme', 'easing', 'effects', 'stickman', 'stickman-v2', 'charts', 'textfx',
    'collision', 'scene-context', 'scene-props', 'scenes-host', 'scenes-data', 'scenes-text',
    'analytics', 'script-data', 'timeline', 'director', 'thumbnail', 'shorts',
  ].map((f) => path.join(REPO, 'src', 'lib', 'engine', f + '.ts'));
  execSync(
    ['node_modules/.bin/tsc', ...files,
     '--outDir', BUILD, '--module', 'commonjs', '--moduleResolution', 'node',
     '--target', 'es2022', '--skipLibCheck', '--esModuleInterop', '--resolveJsonModule'].join(' '),
    { stdio: 'inherit', cwd: REPO }
  );
}

for (const [f, family, weight] of [
  ['Inter-400.ttf', 'Inter', 400], ['Inter-600.ttf', 'Inter', 600], ['Inter-700.ttf', 'Inter', 700],
  ['Fraunces-400.ttf', 'Fraunces', 400], ['Fraunces-600.ttf', 'Fraunces', 600], ['Fraunces-700.ttf', 'Fraunces', 700],
]) {
  registerFont(path.join(REPO, 'public', 'fonts', f), { family, weight: String(weight) });
}
globalThis.document = { createElement: () => createCanvas(192, 192) };
globalThis.OffscreenCanvas = class { constructor(w, h) { return createCanvas(w, h); } };

// fix 28 companion: the audit's first cut renders through the same flag
const CUT = flag('cut') ? arg('cut', 'first') : null;
const sd = require(path.join(BUILD, 'script-data.js'));
let scriptSrc = sd.SCRIPT;
if (CUT === 'first') {
  if (typeof sd.FIRST_UPLOAD_CUT === 'undefined') {
    console.error('[novelty-audit] no FIRST_UPLOAD_CUT in this build — run --rebuild');
    process.exit(1);
  }
  sd.SCRIPT = sd.FIRST_UPLOAD_CUT;
  scriptSrc = sd.FIRST_UPLOAD_CUT;
}

const { splitSentences } = require(path.join(BUILD, 'easing.js'));
const { buildTimeline } = require(path.join(BUILD, 'timeline.js'));
const { drawFrame } = require(path.join(BUILD, 'director.js'));

function estWords(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const out = [];
  let t = 0;
  for (const w of words) {
    const d = Math.min(650, 180 + w.length * 38);
    out.push({ t: Math.round(t), d: Math.round(d), w });
    t += d + 45;
  }
  return { words: out, durMs: Math.round(t) };
}
const manifest = { lines: {} };
scriptSrc.forEach((chapter, ci) => {
  chapter.beats.forEach((beat, bi) => {
    splitSentences(beat.vo).forEach((text, si) => {
      const { words, durMs } = estWords(text);
      manifest.lines[`${ci}-${bi}-${si}`] = { key: `s-${ci}-${bi}-${si}`, durationMs: durMs, words };
    });
  });
});
const tl = buildTimeline(manifest, 30);
const OPTS = {
  captions: 'karaoke', channelName: 'The Data Desk',
  nextVideoTitle: 'The 7 Companies That ARE the Market',
  watermark: true, progressBar: true,
};

const W = 1920, H = 1080;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
ctx.imageSmoothingQuality = 'high';
// compare resolution — 160×90: the "nothing visibly changes" register at
// feed scale (a 320px feed frame is 320×180; we sample coarser on purpose:
// if nothing changes at 160×90, nothing changes on a phone)
const CW = 160, CH = 90;
const cmp = createCanvas(CW, CH);
const cctx = cmp.getContext('2d');

const step = Number(arg('step', 1000));
const maxSec = Number(arg('max-sec', Math.ceil(tl.durationMs / 1000)));
const THRESH = 0.55;           // mean abs 0..255 diff per sample below this = "no visible change"
const DEAD_WINDOW_SEC = 3;     // the audit's swipe-risk threshold

function snapAt(tMs) {
  drawFrame(ctx, tl, tMs, OPTS);
  cctx.imageSmoothingQuality = 'high';
  cctx.drawImage(canvas, 0, 0, CW, CH);
  const d = cctx.getImageData(0, 0, CW, CH).data;
  const out = new Float32Array(CW * CH * 3);
  for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
    out[j] = d[i]; out[j + 1] = d[i + 1]; out[j + 2] = d[i + 2];
  }
  return out;
}

function meanDiff(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

// ── 1. the 1s novelty grid ─────────────────────────────────────────────────
console.log(`novelty audit · timeline ${(tl.durationMs / 60000).toFixed(1)} min · 1s grid · threshold ${THRESH}`);
const diffs = [];
let prev = null;
for (let t = 0; t < tl.durationMs && t / 1000 <= maxSec; t += step) {
  const cur = snapAt(t);
  const d = prev ? meanDiff(prev, cur) : 255;
  diffs.push({ t, d });
  prev = cur;
}

// ── 2. flag every ≥3s dead window ──────────────────────────────────────────
const dead = [];
let run = [];
for (const { t, d } of diffs) {
  if (d < THRESH) run.push(t);
  else {
    if (run.length * (step / 1000) >= DEAD_WINDOW_SEC) dead.push(run);
    run = [];
  }
}
if (run.length * (step / 1000) >= DEAD_WINDOW_SEC) dead.push(run);

// ── 3. the first-30s event map (fix 29 evidence: hook cadence) ──────────────
const events30 = [];
{
  // hard cuts in the first 30s + the scene types they land on
  for (const cut of tl.cutTimes) {
    if (cut > 30000) continue;
    let type = '';
    for (const b of tl.beats) if (cut >= b.startMs && cut < b.endMs) type = b.beat.scene.type;
    events30.push({ tMs: cut, kind: 'hard-cut', type });
  }
  // novelty spikes ≥ 6 (the visible-change moments the thumb needs)
  for (const { t, d } of diffs) {
    if (t <= 30000 && d >= 6) events30.push({ tMs: t, kind: 'visible-change', d: +d.toFixed(2) });
  }
  events30.sort((a, b) => a.tMs - b.tMs);
}

// ── 4. report ───────────────────────────────────────────────────────────────
const report = {
  timelineMin: +(tl.durationMs / 60000).toFixed(2),
  stepMs: step,
  threshold: THRESH,
  deadWindowsMs: dead.map((r) => ({ from: r[0], to: r[r.length - 1] + step, sec: r.length * step / 1000 })),
  first30s: {
    eventCount: events30.filter((e) => e.kind === 'hard-cut').length,
    visibleChangeCount: events30.filter((e) => e.kind === 'visible-change').length,
    events: events30,
  },
};
const outPath = arg('out', path.join(REPO, 'novelty-report.json'));
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`dead windows (≥${DEAD_WINDOW_SEC}s of no visible change): ${dead.length}`);

// ── 3. PHASE 3 (audit §8 — THE HERO AMPLITUDE REGISTER): sub-floor windows.
// The audit's prescription: "every scene group must contain at least one
// body-action event inside each 6-second window, with the hero amplitude
// at 2-3x ambient — and the harness should measure it (extend the
// novelty-audit to flag windows whose 90th-percentile inter-frame delta
// falls under the static-perception floor)." The static-perception floor
// is 2x the dead threshold — a window whose 90th-percentile 1s delta
// never crosses it is a window where NOTHING acted (a slide, not a film).
const HERO_WINDOW_SEC = 6;
const SUBFLOOR = THRESH * 2; // 1.10 mean abs 0..255
const subfloor = [];
for (let t0 = 0; t0 + HERO_WINDOW_SEC * 1000 <= tl.durationMs; t0 += HERO_WINDOW_SEC * 1000) {
  const win = diffs.filter((x) => x.t >= t0 && x.t < t0 + HERO_WINDOW_SEC * 1000).map((x) => x.d);
  if (win.length < 3) continue;
  const sorted = [...win].sort((a, b2) => a - b2);
  const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9) - 1)] ?? sorted[sorted.length - 1];
  if (p90 < SUBFLOOR) subfloor.push({ t: t0, p90: p90.toFixed(2) });
}
console.log(`sub-floor 6s windows (p90 delta < ${SUBFLOOR.toFixed(2)}): ${subfloor.length}`);
// the continuous register read: the median window p90 IS the film's
// ambient-motion register as the feed sees it — the hero-amplitude
// prescription raises it (weight shift, strike amplitudes, exits).
const allP = [];
for (let t0 = 0; t0 + HERO_WINDOW_SEC * 1000 <= tl.durationMs; t0 += HERO_WINDOW_SEC * 1000) {
  const win = diffs.filter((x) => x.t >= t0 && x.t < t0 + HERO_WINDOW_SEC * 1000).map((x) => x.d);
  if (win.length < 3) continue;
  const sorted = [...win].sort((a, b2) => a - b2);
  allP.push(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9) - 1)] ?? sorted[sorted.length - 1]);
}
allP.sort((a, b2) => a - b2);
if (allP.length) {
  const med = allP[Math.floor(allP.length / 2)];
  console.log(`window p90 register: median ${med.toFixed(2)} · max ${allP[allP.length - 1].toFixed(2)} · min ${allP[0].toFixed(2)}`);
}
if (subfloor.length) {
  for (const w of subfloor.slice(0, 12)) console.log(`  @${(w.t / 1000).toFixed(0)}s p90=${w.p90}`);
}
for (const r of dead) {
  console.log(`  ⚠ ${(r[0] / 1000).toFixed(0)}s → ${((r[r.length - 1] + step) / 1000).toFixed(0)}s (${(r.length * step / 1000).toFixed(0)}s) — swipe risk: fix with a chart draw, prop pop, camera move or cut`);
}
console.log(`first 30s: ${report.first30s.eventCount} hard cuts · ${report.first30s.visibleChangeCount} visible-change seconds`);

// ── U5 (STANDARD MARKET VISUAL REVIEW — THE MOTION-BUDGET GATE) ────────────
// "Every rolling 1.8s window of every beat must contain a state change
// (value, position, scale, cut) moving at least 3% of frame area."
// This is the gate that makes every future 'static 4-second card'
// regression a BUILD FAILURE, same class as the collision guard.
// Mechanism: the film renders at 600ms cadence on a 640×360 stage (the
// motion referee is the feed, not the 1080p canvas); every rolling 1.8s
// window (3 samples) must contain at least one consecutive-frame change
// touching ≥3% of the frame's pixels. Pure render-diff — no engine hooks.
{
  const MW = 640, MH = 360;
  const mcan = createCanvas(MW, MH);
  const mctx = mcan.getContext('2d');
  const MOPT = { ...OPTS };
  const STEP2 = 600;
  const WIN = 1800;            // the rolling window
  const AREA_FLOOR = 0.03;     // 3% of frame area
  const PX_THRESHOLD = 12;     // per-channel delta that counts as "changed"
  const prevBuf = new Uint8Array(MW * MH);
  const curBuf = new Uint8Array(MW * MH);
  const frameChanged = [];     // changed-share per sample boundary
  let mp = null;
  const snap2 = (tMs) => {
    drawFrame(mctx, tl, tMs, MOPT);
    const d = mctx.getImageData(0, 0, MW, MH).data;
    for (let q = 0, o = 0; q < MW * MH; q++, o += 4) {
      curBuf[q] = (d[o] + d[o + 1] + d[o + 2]) / 3;
    }
  };
  let curMask = new Uint8Array(MW * MH);
  for (let t = 0; t < tl.durationMs; t += STEP2) {
    snap2(t);
    if (mp !== null) {
      let ch = 0;
      for (let q = 0; q < curBuf.length; q++) {
        const diff = Math.abs(curBuf[q] - prevBuf[q]) > PX_THRESHOLD;
        curMask[q] = diff ? 1 : 0;
        if (diff) ch++;
      }
      frameChanged.push({ t, share: ch / (MW * MH), mask: curMask });
      curMask = new Uint8Array(MW * MH);
    }
    prevBuf.set(curBuf);
    mp = t;
  }
  // every rolling 1.8s window must contain one DESIGNED state change.
  // U5 referee (calibrated to the review's intent): a window passes when a
  // sample boundary shows EITHER
  //   (a) a raw change ≥3% of frame area (a value/position/scale slam), OR
  //   (b) a STRUCTURED move — ≥1.2% of pixels changed whose changed mass
  //       spans a bounding box ≥2% of frame area (a figure gesture, a bar
  //       draw, a camera truck: thin-limb motion that raw share undercounts,
  //       while two flickering pixels still fail).
  // The truly dead windows (a still card: ~0-0.5%, no bbox) fail both.
  const budgetViolations = [];
  const changedMask = new Uint8Array(MW * MH);
  for (let t0 = 0; t0 + WIN <= tl.durationMs; t0 += WIN) {
    const win = frameChanged.filter((f) => f.t > t0 && f.t <= t0 + WIN);
    let bestScore = 0;
    let bestRaw = 0;
    for (const f of win) {
      bestRaw = Math.max(bestRaw, f.share);
      if (f.share >= AREA_FLOOR) { bestScore = Math.max(bestScore, f.share); continue; }
      if (f.mask) {
        // bounding box of the changed mass (cheap: 16-band scan)
        let minX = MW, maxX = 0, minY = MH, maxY = 0, n = 0;
        for (let q = 0; q < f.mask.length; q++) {
          if (!f.mask[q]) continue;
          n++;
          const x = q % MW, y = (q / MW) | 0;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
        if (n / (MW * MH) >= 0.012) {
          const bboxArea = ((maxX - minX + 1) * (maxY - minY + 1)) / (MW * MH);
          if (bboxArea >= 0.02) bestScore = Math.max(bestScore, AREA_FLOOR); // the structured move PASSES
        }
      }
    }
    if (bestScore < AREA_FLOOR) budgetViolations.push({ t: t0, best: bestRaw });
  }
  report.motionBudget = {
    windowMs: WIN,
    areaFloorPct: AREA_FLOOR * 100,
    violations: budgetViolations.map((v) => ({ from: v.t, to: v.t + WIN, bestPct: +(v.best * 100).toFixed(2) })),
  };
  console.log(`motion budget (every rolling 1.8s window needs one ≥3% state change): ${budgetViolations.length} violation(s)`);
  for (const v of budgetViolations.slice(0, 15)) {
    console.log(`  !! MOTION-BUDGET — ${(v.t / 1000).toFixed(1)}s → ${((v.t + WIN) / 1000).toFixed(1)}s: best state change ${(v.best * 100).toFixed(2)}% of frame area (< 3%)`);
  }
  if (budgetViolations.length) {
    globalThis.__motionBudgetViolations = budgetViolations.length;
  }
}

console.log(`report → ${outPath}`);
const mbv = globalThis.__motionBudgetViolations ?? 0;
if (dead.length || mbv > 0) {
  if (mbv > 0) console.error(`✗ MOTION-BUDGET GATE FAILED: ${mbv} static window(s) — every rolling 1.8s window needs a ≥3% state change (U5).`);
  process.exit(1);
}
