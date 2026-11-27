
import path from 'node:path';
import fs from 'node:fs';
import { createCanvas, registerFont } from 'canvas';
const REPO = process.cwd();
const BUILD = path.join(REPO, '.render-check-build');
for (const [f, family, weight] of [['Inter-400.ttf','Inter',400],['Inter-600.ttf','Inter',600],['Inter-700.ttf','Inter',700],['Fraunces-400.ttf','Fraunces',400],['Fraunces-600.ttf','Fraunces',600],['Fraunces-700.ttf','Fraunces',700]])
  registerFont(path.join(REPO, 'public', 'fonts', f), { family, weight: String(weight) });
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
const key = process.argv[3] || 'c6-fees';
const off = Number(process.argv[4] || 4000);
const b = tl.beats.filter((x) => x.beat.scene.sceneKey === key)[0];
const cv = createCanvas(1920, 1080); const ctx = cv.getContext('2d');
drawFrame(ctx, tl, b.startMs + off, { captions: 'off', channelName: 'x', nextVideoTitle: 'x', watermark: false, progressBar: false });
fs.writeFileSync(process.argv[2], cv.toBuffer('image/png'));
console.log('saved', process.argv[2]);
