/* behavior-probe — renders a host beat at 300ms steps over one scene span
 * and prints a compact visual map: which sample shows walk poses (arms
 * extended) vs standing poses, so the D-24 evidence tiles can pick the
 * windows where the behavior clock is actually live. */
import path from 'node:path';
import fs from 'node:fs';
import { createCanvas, registerFont } from 'canvas';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BUILD = path.join(REPO, '.render-check-build');
for (const [f, family, weight] of [
  ['Inter-400.ttf', 'Inter', 400], ['Inter-600.ttf', 'Inter', 600], ['Inter-700.ttf', 'Inter', 700],
  ['Fraunces-400.ttf', 'Fraunces', 400], ['Fraunces-600.ttf', 'Fraunces', 600], ['Fraunces-700.ttf', 'Fraunces', 700],
]) registerFont(path.join(REPO, 'public', 'fonts', f), { family, weight: String(weight) });
globalThis.document = { createElement: () => createCanvas(192, 192) };
globalThis.OffscreenCanvas = class { constructor(w, h) { return createCanvas(w, h); } };

const { SCRIPT } = await import(path.join(BUILD, 'script-data.js'));
const { splitSentences } = await import(path.join(BUILD, 'easing.js'));
const { buildTimeline } = await import(path.join(BUILD, 'timeline.js'));
const { drawFrame } = await import(path.join(BUILD, 'director.js'));

function estWords(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const out = []; let t = 0;
  for (const w of words) {
    const d = Math.min(650, 180 + w.length * 38);
    out.push({ t: Math.round(t), d: Math.round(d), w });
    t += d + 45;
  }
  return { words: out, durMs: Math.round(t) };
}
const manifest = { lines: {} };
SCRIPT.forEach((ch, ci) => ch.beats.forEach((beat, bi) => {
  splitSentences(beat.vo).forEach((text, si) => {
    const { words, durMs } = estWords(text);
    manifest.lines[`${ci}-${bi}-${si}`] = { key: `s-${ci}-${bi}-${si}`, durationMs: durMs, words };
  });
}));
const tl = buildTimeline(manifest, 30);
const OPTS = { captions: 'off', channelName: 'The Data Desk', nextVideoTitle: 'x', watermark: false, progressBar: false };

const key = process.argv[2] || 'c3-eltif-frame';
const nth = Number(process.argv[3] || 0);
const hits = tl.beats.filter((b) => b.beat.scene.sceneKey === key);
const b = hits[Math.min(nth, hits.length - 1)];
console.log(`beat ${key}#${nth} ${b.startMs / 1000}s..${b.endMs / 1000}s`);

// render each sample, measure the host's arm-tip spread (walk poses push
// the hands far horizontally; standing/behavior poses keep them closer)
const W = 1920, H = 1080;
const cv = createCanvas(W, H);
const ctx = cv.getContext('2d');
const rows = [];
for (let st = 2000; st < Math.min(b.endMs - b.startMs, 26000); st += 250) {
  drawFrame(ctx, tl, b.startMs + st, OPTS);
  // probe the host zone (blocks 451-624, ground 729): find the leftmost +
  // rightmost dark ink inside y [420..640] (arm band) at x [250..1000]
  const d = ctx.getImageData(250, 400, 800, 260).data;
  let minX = -1, maxX = -1;
  for (let y = 0; y < 260; y += 2) {
    for (let x = 0; x < 800; x += 2) {
      const i = (y * 800 + x) * 4;
      if (d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 90) {
        if (minX < 0) minX = x;
        maxX = x;
      }
    }
  }
  const spread = maxX >= 0 ? maxX - minX : -1;
  const wt = (st - 2400) % 4200;
  const behave = st >= 2400 && wt < 1700 ? ['ledger', 'pen', 'back'][Math.floor((st - 2400) / 4200) % 3] : '-';
  rows.push(`st=${(st / 1000).toFixed(2)}s spread=${String(spread).padStart(4)} window=${behave}`);
}
console.log(rows.join('\n'));
