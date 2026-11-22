/**
 * gate-check.mjs — THE 320px REFEREE (AUDIT-ROUND-3, Fix 3).
 *
 * The external panel's phone-gate verdict on the shipped frames: "mid-tone
 * mush — the figure, the stage and the card all sit in the same band;
 * nothing separates at feed scale... It scrolls past like a hundred other
 * finance explainers." That is a VALUE-STRUCTURE failure, and value
 * structure is checkable: this tool renders checkpoint frames from the
 * real timeline, downsamples them to 320px (the scale where the median
 * high-RPM viewer actually judges the film), and measures the luminance
 * gap between the dark subject band and the bright field behind it.
 *
 * PASS: every checkpoint's subject-vs-background luminance gap >= 28/255
 *       (the threshold under which the panel read the frame as mush).
 * FAIL: exit 1 — do not upload; fix the value plan, not the numbers.
 *
 * Usage (same build/fonts as frame-dump.mjs):
 *   node tools/gate-check.mjs                 # every 8s of the film
 *   node tools/gate-check.mjs --step 4000     # denser sweep
 *   node tools/gate-check.mjs --out gate.json # machine-readable log
 */
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(REPO, '.render-check-build');
const repoRequire = createRequire(path.join(REPO, 'package.json'));
const { createCanvas, registerFont } = repoRequire('canvas');

// ── args ─────────────────────────────────────────────────────────────────────
const arg = (name, def = undefined) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};
const flag = (name) => process.argv.includes(`--${name}`);
const STEP = Number(arg('step', 8000)); // ms between checkpoints
const OUT = arg('out', undefined);
// U-10 (100-JUDGE VISUAL AUDIT — THE EVENT-CADENCE GATE): `--cadence` runs
// the per-group event floor instead of the value gap sweep.

// ── build (same recipe as frame-dump.mjs) ────────────────────────────────────
if (!fs.existsSync(path.join(BUILD, 'director.js'))) {
  const files = [
    'theme', 'easing', 'effects', 'stickman', 'stickman-v2', 'charts', 'textfx',
    'collision', 'scene-context', 'scene-props', 'scenes-host', 'scenes-data', 'scenes-text',
    'analytics', 'script-data', 'timeline', 'director', 'thumbnail', 'shorts',
  ].map((f) => path.join(REPO, 'src', 'lib', 'engine', f + '.ts'));
  const list = files.filter((f) => fs.existsSync(f));
  execSync(
    ['node_modules/.bin/tsc', ...list,
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

const { SCRIPT } = require(path.join(BUILD, 'script-data.js'));
const { splitSentences } = require(path.join(BUILD, 'easing.js'));
const { buildTimeline } = require(path.join(BUILD, 'timeline.js'));
const { drawFrame } = require(path.join(BUILD, 'director.js'));

// the frame-dump estimator manifest (identical word model — the gate only
// needs REAL pixels, and the real pixels come from the real drawers)
const manifest = { lines: {} };
SCRIPT.forEach((ch, ci) => {
  ch.beats.forEach((b, bi) => {
    splitSentences(b.vo).forEach((text, si) => {
      const words = []; let tt = 0;
      for (const w of text.split(/\s+/).filter(Boolean)) {
        const d = Math.min(650, 180 + w.length * 38);
        words.push({ t: Math.round(tt), d: Math.round(d), w });
        tt += d + 45;
      }
      manifest.lines[`${ci}-${bi}-${si}`] = { key: `s-${ci}-${bi}-${si}`, durationMs: Math.round(tt), words };
    });
  });
});
const tl = buildTimeline(manifest, 30);
const OPTS = { captions: 'off', channelName: 'The Data Desk', nextVideoTitle: 'x', watermark: false, progressBar: false };

// ── the gates ────────────────────────────────────────────────────────────────
const W = 1920, H = 1080;
const FW = 320, FH = 180;           // the phone-feed twin
const GAP_FLOOR = 28;               // /255 — under this the panel read "mush"

const frame = createCanvas(W, H);
const fctx = frame.getContext('2d');
fctx.imageSmoothingQuality = 'high';
const feed = createCanvas(FW, FH);
const fx = feed.getContext('2d');
fx.imageSmoothingQuality = 'high';

const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

// ══ U-10 — THE EVENT-CADENCE GATE ════════════════════════════════════════════
// The audit's B-13 finding: 31.5% of the payoff material's 166 ms windows
// show no new content event (longest run 1.8 s) — ambient motion without
// meaning. This gate converts that measurement into a PERMANENT harness
// floor, per scene group:
//
//   PASS: no scene group holds more than 15% of its 166 ms windows below
//         1% content change (caption band masked), and no dead RUN longer
//         than 0.8 s.
//
// Measurement: render the group at 166 ms steps (the karaoke caption ON,
// its band MASKED — the audit masks the caption band), downsample each
// frame to the 320 twin, and count the pixels whose luminance moved more
// than the 6/255 perception floor. A window is DEAD when < 1% of the
// content pixels moved. Scrub-safe: the same engine, the same clocks.
//
// Usage: node tools/gate-check.mjs --cadence [--all] [--max-groups 60] [--out cadence.json]
if (flag('cadence')) {
  const WIN = 166;                    // the audit's window
  const CHANGE_FLOOR = 0.01;          // 1% of content pixels
  const SHARE_FLOOR = 0.15;           // 15% of windows
  const DEAD_MAX_MS = 800;            // the longest dead run
  const PIXEL_FLOOR = 6;              // /255 — the luminance step that counts
  const MASK_TOP = Math.round(FH * 0.72); // the caption band masked (the 320 twin)
  const OPTS_CAD = { captions: 'karaoke', channelName: 'The Data Desk', nextVideoTitle: 'x', watermark: true, progressBar: true };

  // the scene groups (the same clock the director's exit grammar runs on)
  const groups = [];
  tl.beats.forEach((b) => {
    const key = b.beat.scene.sceneKey;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.endMs = b.endMs;
    else groups.push({ key, type: b.beat.scene.type, startMs: b.startMs, endMs: b.endMs });
  });
  // bound the runtime: the longest groups first (dead air concentrates in
  // the long statement holds), unless --all is passed.
  let check = groups.map((g, i) => ({ ...g, idx: i })).filter((g) => g.endMs - g.startMs >= 1400);
  if (!flag('all')) {
    const maxGroups = Number(arg('max-groups', 60));
    check = check
      .sort((a, b) => (b.endMs - b.startMs) - (a.endMs - a.startMs))
      .slice(0, maxGroups)
      .sort((a, b) => a.startMs - b.startMs);
  }

  const rows = [];
  let failedGroups = 0;
  let worst = { key: '', share: 0, run: 0 };
  for (const g of check) {
    const t0 = g.startMs + 120;
    const t1 = g.endMs - 80;
    const dead = [];
    let prev = null;
    for (let t = t0; t + WIN <= t1; t += WIN) {
      drawFrame(fctx, tl, t, OPTS_CAD);
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
      // cache luminance for the next diff
      if (prev === null) prev = new Float32Array(FW * MASK_TOP);
      for (let y = 0; y < MASK_TOP; y++) {
        for (let x = 0; x < FW; x++) {
          prev[y * FW + x] = lum(d, (y * FW + x) * 4);
        }
      }
    }
    const windows = dead.length;
    const deadCount = dead.reduce((n, v) => n + (v ? 1 : 0), 0);
    let run = 0, maxRun = 0;
    for (const v of dead) {
      run = v ? run + 1 : 0;
      maxRun = Math.max(maxRun, run);
    }
    const share = windows ? deadCount / windows : 0;
    const runMs = maxRun * WIN;
    const ok = share <= SHARE_FLOOR && runMs <= DEAD_MAX_MS;
    if (!ok) failedGroups++;
    if (share > worst.share) worst = { key: g.key, share, run: runMs };
    rows.push({ key: g.key, type: g.type, startMs: g.startMs, windows, deadShare: Math.round(share * 1000) / 1000, maxDeadRunMs: runMs, ok });
    console.log(`${g.key} (${g.type})  windows=${windows}  dead=${Math.round(share * 100)}%  maxRun=${runMs}ms  ${ok ? 'PASS' : 'FAIL'}`);
  }
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ win: WIN, shareFloor: SHARE_FLOOR, deadMaxMs: DEAD_MAX_MS, rows, failedGroups }, null, 2));
  console.log(failedGroups === 0
    ? `\ncadence gate: PASS — ${rows.length} groups, no group over ${SHARE_FLOOR * 100}% dead windows, no dead run over ${DEAD_MAX_MS} ms`
    : `\ncadence gate: FAIL — ${failedGroups}/${rows.length} groups over the floor (worst: ${worst.key} ${Math.round(worst.share * 100)}%, run ${worst.run}ms)`);
  process.exit(failedGroups === 0 ? 0 : 1);
}

// ── the value gap gate (the 320px referee, unchanged) ────────────────────────

const rows = [];
let fails = 0;
for (let t = 2000; t < tl.durationMs; t += STEP) {
  drawFrame(fctx, tl, t, OPTS);
  fx.drawImage(frame, 0, 0, FW, FH);
  const d = fx.getImageData(0, 0, FW, FH).data;
  // the subject band: the center-left/center columns where the host or the
  // content mass lives (the stage grammar keeps the subject near center);
  // the background band: the outer thirds, skipping the caption strip.
  let sMin = 255, bMax = 0;
  for (let y = 36; y < 168; y++) {
    for (let x = 0; x < FW; x++) {
      const L = lum(d, (y * FW + x) * 4);
      const center = x >= FW * 0.30 && x <= FW * 0.70;
      if (center) sMin = Math.min(sMin, L);
      else bMax = Math.max(bMax, L);
    }
  }
  const gap = bMax - sMin;
  const ok = gap >= GAP_FLOOR;
  if (!ok) fails++;
  rows.push({ t, gap: Math.round(gap), ok });
  console.log(`t=${(t / 1000).toFixed(1)}s  subject-bg gap ${Math.round(gap)}/255  ${ok ? 'PASS' : 'FAIL'}`);
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ gapFloor: GAP_FLOOR, step: STEP, rows, fails }, null, 2));
console.log(fails === 0
  ? `\ngate-check: PASS — ${rows.length} checkpoints, all >= ${GAP_FLOOR}/255`
  : `\ngate-check: FAIL — ${fails}/${rows.length} checkpoints under ${GAP_FLOOR}/255 (fix the value plan, not the numbers)`);
process.exit(fails === 0 ? 0 : 1);
