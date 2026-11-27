/**
 * evidence-d30-a5 — renders the D-30..D-33 (Family F — packaging & retention)
 * and A-1..A-5 (panel actions) evidence set. One artifact per defect/action,
 * labeled in-image so the panel can read the evidence without notes.
 *
 * BEFORE pass: run against the pre-fix build. AFTER pass: run after the
 * fixes compile. Same deterministic manifest clock as evidence-d20-29.mjs.
 *
 * Usage: node tools/evidence-d30-a5.mjs --tag BEFORE --out <dir>
 */
import path from 'node:path';
import fs from 'node:fs';
import { createCanvas, registerFont } from 'canvas';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BUILD = path.join(REPO, '.render-check-build');
const arg = (n, d = undefined) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const TAG = arg('tag', 'BEFORE');
const OUTDIR = arg('out', path.join(REPO, 'evidence', 'd30-a5'));
fs.mkdirSync(OUTDIR, { recursive: true });

for (const [f, family, weight] of [
  ['Inter-400.ttf', 'Inter', 400], ['Inter-600.ttf', 'Inter', 600], ['Inter-700.ttf', 'Inter', 700],
  ['Fraunces-400.ttf', 'Fraunces', 400], ['Fraunces-600.ttf', 'Fraunces', 600], ['Fraunces-700.ttf', 'Fraunces', 700],
]) registerFont(path.join(REPO, 'public', 'fonts', f), { family, weight: String(weight) });
globalThis.document = { createElement: () => createCanvas(192, 192) };
globalThis.OffscreenCanvas = class { constructor(w, h) { return createCanvas(w, h); } };

const { SCRIPT, FIRST_UPLOAD_CUT } = await import(path.join(BUILD, 'script-data.js'));
const { splitSentences } = await import(path.join(BUILD, 'easing.js'));
const { buildTimeline } = await import(path.join(BUILD, 'timeline.js'));
const { drawFrame } = await import(path.join(BUILD, 'director.js'));
const { drawThumbnail } = await import(path.join(BUILD, 'thumbnail.js'));

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
const OPTS = { captions: 'karaoke', channelName: 'The Data Desk', nextVideoTitle: 'NAV Lag Explained: Who Pays When the Mark Is Wrong', watermark: true, progressBar: true };

const beatOfKey = (key, nth = 0) => {
  const hits = tl.beats.filter((b) => b.beat.scene.sceneKey === key);
  return hits[Math.min(nth, hits.length - 1)];
};
const beatOf = (type, nth = 0) => {
  const hits = tl.beats.filter((b) => b.beat.scene.type === type);
  return hits[Math.min(nth, hits.length - 1)];
};

const W = 1920, H = 1080;
const frameCanvas = createCanvas(W, H);
const fctx = frameCanvas.getContext('2d');

function drawAt(tMs) {
  fctx.save();
  fctx.setTransform(1, 0, 0, 1, 0, 0);
  fctx.globalAlpha = 1;
  drawFrame(fctx, tl, Math.round(tMs), OPTS);
  fctx.restore();
}

function thumbAt(variant, w = 1280, h = 720) {
  const cv = createCanvas(w, h);
  const c = cv.getContext('2d');
  drawThumbnail(c, w, h, variant);
  return cv;
}

/** one labeled evidence file: header bar + a grid of cells */
function tile({ name, title, cells, cols, cellW, cellH, note }) {
  const pad = 14, headH = 64, labelH = 34;
  cols = cols || cells.length;
  const rows = Math.ceil(cells.length / cols);
  const Wt = cols * (cellW + pad) + pad;
  const Ht = headH + rows * (cellH + labelH + pad) + pad + (note ? 40 : 12);
  const cv = createCanvas(Wt, Ht);
  const c = cv.getContext('2d');
  c.fillStyle = '#0A1220'; c.fillRect(0, 0, Wt, Ht);
  c.fillStyle = '#E9E4D6';
  c.font = '700 28px Inter, sans-serif';
  c.fillText(`${TAG} — ${title}`, pad, 42);
  cells.forEach((cell, i) => {
    const cx0 = pad + (i % cols) * (cellW + pad);
    const cy0 = headH + Math.floor(i / cols) * (cellH + labelH + pad);
    c.fillStyle = '#111B2E'; c.fillRect(cx0, cy0, cellW, cellH);
    let src;
    if (cell.thumb !== undefined) src = thumbAt(cell.thumb);
    else if (cell.custom) src = cell.custom();
    else { drawAt(cell.t); src = frameCanvas; }
    if (cell.rw) {
      // crop rect (design px) scaled into the cell
      const s = Math.min(cellW / cell.rw, cellH / cell.rh);
      const dw = cell.rw * s, dh = cell.rh * s;
      c.imageSmoothingEnabled = true;
      c.drawImage(src, cell.rx, cell.ry, cell.rw, cell.rh,
        cx0 + (cellW - dw) / 2, cy0 + (cellH - dh) / 2, dw, dh);
      c.strokeStyle = 'rgba(201,162,39,0.85)'; c.lineWidth = 2;
      c.strokeRect(cx0 + (cellW - dw) / 2, cy0 + (cellH - dh) / 2, dw, dh);
    } else {
      const s = Math.min(cellW / src.width, cellH / src.height);
      const dw = src.width * s, dh = src.height * s;
      c.imageSmoothingEnabled = true;
      c.drawImage(src, cx0 + (cellW - dw) / 2, cy0 + (cellH - dh) / 2, dw, dh);
      c.strokeStyle = 'rgba(201,162,39,0.85)'; c.lineWidth = 2;
      c.strokeRect(cx0 + (cellW - dw) / 2, cy0 + (cellH - dh) / 2, dw, dh);
    }
    c.fillStyle = '#9FB0C8'; c.font = '600 20px Inter, sans-serif';
    c.fillText(cell.label, cx0, cy0 + cellH + 24);
  });
  if (note) {
    c.fillStyle = '#C9A227'; c.font = '600 20px Inter, sans-serif';
    c.fillText(note, pad, Ht - 14);
  }
  const out = path.join(OUTDIR, `${TAG}_${name}.png`);
  fs.writeFileSync(out, cv.toBuffer('image/png'));
  console.log('saved', out);
}

// ── D-30 — six thumbnails, one composition ──────────────────────────────────
tile({
  name: 'D30_thumb_variants_matrix',
  title: 'D-30 the six Test & Compare thumbnails (v0..v5)',
  cols: 3, cellW: 420, cellH: 236,
  cells: [0, 1, 2, 3, 4, 5].map((v) => ({ thumb: v, label: `variant ${v}` })),
  note: 'before: six copies of ONE composition (coin + dart + layout, copy only) vs after: six distinct compositions — object scale, face size and framing all differ',
});

// ── D-31 — the generic hook image ───────────────────────────────────────────
tile({
  name: 'D31_hook_classes',
  title: 'D-31 the hook-image classes the set must cover',
  cols: 2, cellW: 560, cellH: 315,
  cells: [
    { thumb: 0, label: 'control — the pull (v0)' },
    { thumb: 1, label: 'FACE CLOSE-UP (the rig draws one)' },
    { thumb: 2, label: 'BEFORE/AFTER ($1M → $50K)' },
    { thumb: 3, label: 'CURIOSITY-GAP (the slice is the question mark dot)' },
  ],
  note: 'before: no face-close-up, no before/after, no curiosity-gap variant existed vs after: all three classes ship',
});

// ── D-32 — the end screen's next click ──────────────────────────────────────
{
  const b = beatOf('endScreen');
  tile({
    name: 'D32_endscreen_loopback',
    title: `D-32 the end screen (t+3.2s and t+5.5s of b125)`,
    cols: 2, cellW: 640, cellH: 360,
    cells: [
      { t: b.startMs + 3200, label: 't+3.2s', rx: 0, ry: 0, rw: 1920, rh: 1080 },
      { t: b.startMs + 5500, label: 't+5.5s', rx: 0, ry: 0, rw: 1920, rh: 1080 },
    ],
    note: 'before: card + subscribe only — no animated hook, no loop-back vs after: the opening question returns on a plated strip and the brass wedge rides the rail to WATCH NEXT on a loop',
  });
}

// ── D-33 — the shipping order ───────────────────────────────────────────────
{
  // designed comparison card: the two cuts, side by side
  const cellW = 640, cellH = 500;
  const Wt = cellW * 2 + 42, Ht = 64 + cellH + 34 + 52;
  const cv = createCanvas(Wt, Ht);
  const c = cv.getContext('2d');
  c.fillStyle = '#0A1220'; c.fillRect(0, 0, Wt, Ht);
  c.fillStyle = '#E9E4D6'; c.font = '700 28px Inter, sans-serif';
  c.fillText(`${TAG} — D-33 the shipping order (panel endorsement: the first-upload cut ships FIRST)`, 14, 42);
  const drawCut = (x0, chapters, title, sub, hot) => {
    c.fillStyle = '#111B2E'; c.fillRect(x0, 64, cellW, cellH);
    c.strokeStyle = hot ? 'rgba(201,162,39,0.95)' : 'rgba(120,140,170,0.5)';
    c.lineWidth = hot ? 3 : 1.5;
    c.strokeRect(x0, 64, cellW, cellH);
    c.fillStyle = hot ? '#C9A227' : '#8FA3BF'; c.font = '700 26px Inter, sans-serif';
    c.fillText(title, x0 + 24, 108);
    c.fillStyle = '#7E93B0'; c.font = '600 19px Inter, sans-serif';
    c.fillText(sub, x0 + 24, 138);
    chapters.forEach((ch, i) => {
      const y = 176 + i * 66;
      c.fillStyle = hot ? 'rgba(201,162,39,0.14)' : 'rgba(120,140,170,0.10)';
      c.fillRect(x0 + 24, y, cellW - 48, 52);
      c.fillStyle = '#E9E4D6'; c.font = '700 20px Inter, sans-serif';
      c.fillText(`${i + 1}. ${ch.title}`.slice(0, 46), x0 + 40, y + 26);
      c.fillStyle = '#9FB0C8'; c.font = '600 16px Inter, sans-serif';
      c.fillText(`${ch.beats.length} beats`, x0 + 40, y + 46);
    });
  };
  drawCut(14, SCRIPT, 'EXTENDED CUT — 26.4 min · 9 chapters', 'ships AFTER the first cut earns it', false);
  drawCut(14 + cellW + 14, FIRST_UPLOAD_CUT, 'FIRST-UPLOAD CUT — ships FIRST', 'cold open + structural shift + audit + conclusion', true);
  c.fillStyle = '#C9A227'; c.font = '600 20px Inter, sans-serif';
  c.fillText('before: the full 26.4-min cut was the only shipping target vs after: SHIPPING_CUT defaults the master render + upload kit to the first-upload cut (--cut full opts back in)', 14, Ht - 16);
  const out = path.join(OUTDIR, `${TAG}_D33_shipping_order.png`);
  fs.writeFileSync(out, cv.toBuffer('image/png'));
  console.log('saved', out);
}

// ── A-1 — the left-third reservation retired ────────────────────────────────
{
  const b = beatOfKey('c1-semi', 1);
  tile({
    name: 'A1_flip_blocking',
    title: 'A-1 the editorial blocking flip (host beat, t+3s)',
    cols: 1, cellW: 1160, cellH: 650,
    cells: [
      { t: b.startMs + 3000, label: 'the whole frame — host zone vs type column', rx: 0, ry: 0, rw: 1920, rh: 1080 },
    ],
    note: 'before: host parked in the left-third reservation (0.235-0.325), column right vs after: host INSIDE the content zone (0.52-0.62), column at 0.14-0.48 — composition flipped per scene',
  });
}

// ── A-2 — refusal → contact ─────────────────────────────────────────────────
{
  const bs = beatOfKey('c9-window', 0);
  // dotGrid is in the drawer table but not staged in the shipped script —
  // render it through a one-beat mini timeline so the pin is provable.
  const sd2 = await import(path.join(BUILD, 'script-data.js'));
  const miniScript = [{
    id: 'mini', title: 'mini', beats: [{
      vo: 'Ten of the five hundred companies drive the index. Ten.',
      scene: { type: 'dotGrid', sceneKey: 'mini-dot', total: 500, highlight: 10, caption: 'drive the whole index' },
    }],
  }];
  const { buildTimeline: bt2 } = await import(path.join(BUILD, 'timeline.js'));
  const m2 = { lines: {} };
  miniScript.forEach((ch, ci) => ch.beats.forEach((beat, bi) => {
    splitSentences(beat.vo).forEach((text, si) => {
      const { words, durMs } = estWords(text);
      m2.lines[`${ci}-${bi}-${si}`] = { key: `m-${ci}-${bi}-${si}`, durationMs: durMs, words };
    });
  }));
  // buildTimeline reads the module's own SCRIPT — swap it in, build the
  // mini timeline, restore (the same live-binding swap frame-dump.mjs
  // uses; the CJS exports object is mutable, the ESM namespace is not)
  const { createRequire } = await import('node:module');
  const requireMini = createRequire(import.meta.url);
  const sdMini = requireMini(path.join(BUILD, 'script-data.js'));
  const savedScript = sdMini.SCRIPT;
  sdMini.SCRIPT = miniScript;
  const tl2 = bt2(m2, 30);
  sdMini.SCRIPT = savedScript;
  const miniFrame = (t) => {
    const cv = createCanvas(W, H);
    const c = cv.getContext('2d');
    drawFrame(c, tl2, Math.round(t), OPTS);
    return cv;
  };
  tile({
    name: 'A2_refusal_to_contact',
    title: 'A-2 the two sanctioned refusals converted to contact verbs',
    cols: 2, cellW: 560, cellH: 330,
    cells: [
      { t: bs.startMs + 620, label: 'stampCard — the slam press (host zone)', rx: 60, ry: 60, rw: 1100, rh: 760 },
      { custom: () => miniFrame(4400), label: 'dotGrid — the gold band pin (host + band zone)', rx: 240, ry: 60, rw: 1680, rh: 760 },
    ],
    note: 'before: refusal sanctioned (plate unreachable, band 1300px away) vs after: both palms press the plate on the slam clock; the palm pins the band',
  });
}

// ── A-3 — the five occlusion scenes re-staged ───────────────────────────────
{
  const bt = (key, nth, dt) => beatOfKey(key, nth).startMs + dt;
  tile({
    name: 'A3_occlusion_restage',
    title: 'A-3 five occlusion scenes re-staged as interaction',
    cols: 3, cellW: 430, cellH: 250,
    cells: [
      { t: bt('c7-capital', 0, 9000), label: 'chartJourney — axis walkway, points UP', rx: 60, ry: 200, rw: 1500, rh: 800 },
      { t: bt('c6-mech', 2, 5000), label: 'navGap — stands ON the 100 bar', rx: 60, ry: 120, rw: 1800, rh: 900 },
      { t: bt('c9-map', 1, 5000), label: 'systemMap — walks the ring', rx: 200, ry: 120, rw: 1500, rh: 880 },
      { t: bt('c4-flow', 0, 6000), label: 'flowLiquidity — carries the payout coin', rx: 500, ry: 120, rw: 1420, rh: 880 },
      { t: bt('c6-fees', 0, 5000), label: 'feeStack — lifts each plate as it lands', rx: 40, ry: 150, rw: 1500, rh: 850 },
      { t: bt('c6-fees', 0, 9000), label: 'feeStack — the fist rides the newest plate', rx: 40, ry: 150, rw: 1500, rh: 850 },
    ],
    note: 'before: hosts parked beside/behind the data vs after: the host walks, mounts, carries and lifts the hero objects',
  });
}

// ── A-4 — the thumbnail promise in frame one ────────────────────────────────
{
  const b = beatOfKey('c1-open', 0);
  tile({
    name: 'A4_thumbnail_promise_motion',
    title: 'A-4 the cold open delivers the poster promise in motion (the rope pull)',
    cols: 3, cellW: 430, cellH: 250,
    cells: [3400, 4600, 5800].map((bt, i) => ({
      t: b.startMs + bt, label: `beat-local ${bt}ms`, rx: 100, ry: 100, rw: 1750, rh: 900,
    })),
    note: 'before: the wedge fired at the viewer, host planted static vs after: the host hauls the 5% wedge out of the brass disc BY ROPE and walks it to the $50,000 strike',
  });
}

// ── A-5 — the hand lands, every time ────────────────────────────────────────
{
  const b = beatOfKey('c3-eltif-frame', 0);
  tile({
    name: 'A5_hand_lands',
    title: 'A-5 contact poses routed through scene-space targets (editorial host + exhibit)',
    cols: 3, cellW: 430, cellH: 260,
    cells: [3000, 6500, 11000].map((st, i) => ({
      t: b.startMs + st, label: `sceneT ${st / 1000}s — the palm ON the exhibit edge`, rx: 260, ry: 380, rw: 900, rh: 560,
    })),
    note: 'harness rule added: >=40% of each staged beat duration must have the hand inside the hero object bounding box (asserted per beat in tools/render-check.mjs)',
  });
}

console.log('done ->', OUTDIR);
