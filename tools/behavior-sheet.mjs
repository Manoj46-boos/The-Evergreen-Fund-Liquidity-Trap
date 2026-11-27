/* behavior-sheet — renders labeled host crops at chosen scene-time offsets
 * of a host beat, tiled (the D-24 evidence contact sheet). */
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
const outPath = process.argv[4] || '/tmp/behavior-sheet.png';
const times = (process.argv[5] || '3250,7450,11650,15850,20050,4400').split(',').map(Number);
const labels = (process.argv[6] || 'ledger-peak,pen-peak,back-peak,ledger2-peak,pen2-peak,control').split(',');

const hits = tl.beats.filter((b) => b.beat.scene.sceneKey === key);
const b = hits[Math.min(nth, hits.length - 1)];
const W = 1920, H = 1080;
const cv = createCanvas(W, H);
const ctx = cv.getContext('2d');

const cellW = 380, cellH = 420, pad = 12, headH = 56, labelH = 30;
const cols = Math.min(3, times.length);
const rowsN = Math.ceil(times.length / cols);
const Wt = cols * (cellW + pad) + pad;
const Ht = headH + rowsN * (cellH + labelH + pad) + pad;
const sheet = createCanvas(Wt, Ht);
const sc = sheet.getContext('2d');
sc.fillStyle = '#0A1220'; sc.fillRect(0, 0, Wt, Ht);
sc.fillStyle = '#E9E4D6'; sc.font = '700 26px Inter, sans-serif';
sc.fillText(`host behavior sheet — ${key}#${nth} (sceneT labels)`, pad, 38);

times.forEach((st, i) => {
  drawFrame(ctx, tl, Math.round(b.startMs + st), OPTS);
  const cx0 = pad + (i % cols) * (cellW + pad);
  const cy0 = headH + Math.floor(i / cols) * (cellH + labelH + pad);
  // host crop: blocks 451-624 → x 250..980, ground 729 → y 40..780
  const rx = 250, ry = 40, rw = 730, rh = 740;
  const s = Math.min(cellW / rw, cellH / rh);
  sc.fillStyle = '#111B2E'; sc.fillRect(cx0, cy0, cellW, cellH);
  sc.drawImage(cv, rx, ry, rw, rh, cx0, cy0, rw * s, rh * s);
  sc.strokeStyle = 'rgba(201,162,39,0.85)'; sc.lineWidth = 2;
  sc.strokeRect(cx0, cy0, rw * s, rh * s);
  sc.fillStyle = '#9FB0C8'; sc.font = '600 19px Inter, sans-serif';
  sc.fillText(`${labels[i] ?? ''} (sceneT ${(st / 1000).toFixed(1)}s)`, cx0, cy0 + cellH + 22);
});
fs.writeFileSync(outPath, sheet.toBuffer('image/png'));
console.log('saved', outPath);
