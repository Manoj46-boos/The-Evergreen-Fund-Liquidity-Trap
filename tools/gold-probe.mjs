/* gold-probe — scans the barsCompare host's neck zone for gold ink (the
 * scarf tail) to verify the D-23 fix draws at rig 1.5. */
import path from 'node:path';
import { createCanvas, registerFont } from 'canvas';

const REPO = process.cwd();
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
  for (const w of words) { const d = Math.min(650, 180 + w.length * 38); out.push({ t: Math.round(t), d: Math.round(d), w }); t += d + 45; }
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
const b = tl.beats.filter((x) => x.beat.scene.sceneKey === 'c2-launches')[0];
const cv = createCanvas(1920, 1080); const ctx = cv.getContext('2d');
drawFrame(ctx, tl, b.startMs + 3000, { captions: 'off', channelName: 'x', nextVideoTitle: 'x', watermark: false, progressBar: false });
const d = ctx.getImageData(0, 280, 340, 460).data;
const gold = [];
for (let y = 0; y < 460; y += 2) for (let x = 0; x < 340; x += 2) {
  const i = (y * 260 + x) * 4;
  if (d[i] > 150 && d[i + 1] > 105 && d[i + 2] < 100) gold.push([x, 280 + y]);
}
console.log('gold pixel count in figure zone:', gold.length);
// cluster into rows for a quick map
const rows = {};
for (const [x, y] of gold) { const k = Math.floor(y / 20) * 20; (rows[k] = rows[k] || []).push(x); }
Object.keys(rows).map(Number).sort((a, b) => a - b).forEach((k) => console.log('y~' + k, 'x', Math.min(...rows[k]) + '..' + Math.max(...rows[k]), 'n=' + rows[k].length));
if (gold.length) {
  console.log('gold bbox: x', Math.min(...gold.map(g => g[0])), '..', Math.max(...gold.map(g => g[0])),
    ' y', Math.min(...gold.map(g => g[1])), '..', Math.max(...gold.map(g => g[1])));
}
