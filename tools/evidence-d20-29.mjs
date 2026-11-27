/**
 * evidence-d20-29 — renders the D-20..D-29 audit evidence set (Family D —
 * motion; Family E — typography & data design). One artifact per defect,
 * labeled in-image so the panel can read the evidence without notes.
 *
 * BEFORE pass: run against the pre-fix build. AFTER pass: run after the
 * fixes compile. Same deterministic manifest clock as render-evidence.mjs.
 *
 * Usage: node tools/evidence-d20-29.mjs --tag BEFORE --out <dir>
 */
import path from 'node:path';
import fs from 'node:fs';
import { createCanvas, registerFont } from 'canvas';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BUILD = path.join(REPO, '.render-check-build');
const arg = (n, d = undefined) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const TAG = arg('tag', 'BEFORE');
const OUTDIR = arg('out', path.join(REPO, 'evidence', 'd20-29'));
fs.mkdirSync(OUTDIR, { recursive: true });

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
const OPTS = { captions: 'karaoke', channelName: 'The Data Desk', nextVideoTitle: 'x', watermark: true, progressBar: true };

const beatsOf = (type) => tl.beats.filter((b) => b.beat.scene.type === type);
const beatOfKey = (key, nth = 0) => {
  const hits = tl.beats.filter((b) => b.beat.scene.sceneKey === key);
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

/** one labeled evidence file: header bar + a grid of crops from full frames */
function tile({ name, title, cells, cols, cellW, cellH, note }) {
  const pad = 14, headH = 64, labelH = 34;
  cols = cols || cells.length;
  const rows = Math.ceil(cells.length / cols);
  const Wt = cols * (cellW + pad) + pad;
  const Ht = headH + rows * (cellH + labelH + pad) + pad + 40;
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
    drawAt(cell.t);
    // source crop rect (design px), scaled into the cell
    const s = Math.min(cellW / cell.rw, cellH / cell.rh);
    const dw = cell.rw * s, dh = cell.rh * s;
    if (cell.feed) {
      // render the crop through a 320px-wide feed pass, then upscale — the
      // phone-feed legibility the judge actually gate-keeps
      const fw = 320, fh = Math.max(1, Math.round(H * (fw / W)));
      const fcv = createCanvas(fw, fh); const fc = fcv.getContext('2d');
      fc.imageSmoothingQuality = 'high';
      fc.drawImage(frameCanvas, 0, 0, W, H, 0, 0, fw, fh);
      const cw = Math.max(1, Math.round(cell.rw / (W / fw))), chh = Math.max(1, Math.round(cell.rh / (H / fh)));
      const cxp = Math.max(0, Math.min(fw - 1, Math.round(cell.rx / (W / fw)))), cyp = Math.max(0, Math.min(fh - 1, Math.round(cell.ry / (H / fh))));
      const cw2 = Math.min(fw - cxp, cw), ch2 = Math.min(fh - cyp, chh);
      c.imageSmoothingEnabled = false;
      c.drawImage(fcv, cxp, cyp, cw2, ch2, cx0 + (cellW - dw) / 2, cy0 + (cellH - dh) / 2, dw, dh);
      c.imageSmoothingEnabled = true;
    } else {
      c.drawImage(frameCanvas, cell.rx, cell.ry, cell.rw, cell.rh,
        cx0 + (cellW - dw) / 2, cy0 + (cellH - dh) / 2, dw, dh);
    }
    c.strokeStyle = 'rgba(201,162,39,0.85)'; c.lineWidth = 2;
    c.strokeRect(cx0 + (cellW - dw) / 2, cy0 + (cellH - dh) / 2, dw, dh);
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

// the editorial host crop (BLOCKS W*0.235..0.325 = 451..624, ground 0.675H = 729, scale 2.65)
const hostCrop = { rx: 230, ry: 60, rw: 740, rh: 790 };

// ── D-20 — poses teleport: 6 phases across a mid-beat gesture window ────────
{
  const b = beatOfKey('c1-semi');
  // sample ACROSS a sentence boundary: the pose spring fires at sentence starts
  const sents = (b.sentences || []).map((x) => x.startMs).filter((ms) => ms > b.startMs + 1500 && ms < b.endMs - 1500);
  const sb = sents.length ? sents[0] : b.startMs + 2000;
  tile({
    name: 'D20_pose_weight_strip',
    title: `D-20 pose spring across a sentence boundary, six 80ms phases (host c1-semi @${((sb - b.startMs) / 1000).toFixed(1)}s)`,
    cols: 3, cellW: 420, cellH: 480,
    cells: [0, 80, 160, 240, 320, 400].map((dt, i) => ({
      t: sb + dt - 80, label: `phase ${i} (${dt - 80 >= 0 ? '+' : ''}${dt - 80}ms)`, rx: hostCrop.rx, ry: hostCrop.ry, rw: hostCrop.rw, rh: hostCrop.rh,
    })),
    note: 'watch the PELVIS / HIP LINE / PLANTED FEET across phases — arms swap, body planted (before) vs weight transfer (after)',
  });
}

// ── D-21 — the real impacts carry no volume deformation ─────────────────────
{
  // a) the statement slam (lands ~340ms) — crop the block
  const bt = beatsOf('bigText')[0];
  // b) the bar arrival (landT 400+495 for row 0) — crop bar row 1
  const bb = beatOfKey('c2-launches') ?? beatsOf('barsCompare')[0];
  // c) the dossier flap (lands ~1050ms) — crop the card top band
  const bc = beatOfKey('c5-cliffwater');
  tile({
    name: 'D21_impact_volume',
    title: 'D-21 volume deformation at the film\'s real impacts — each impact: the frame BEFORE vs +60ms',
    cols: 2, cellW: 560, cellH: 190,
    cells: [
      { t: bt.startMs + 330, label: 'stamp slam — pre-impact', rx: 120, ry: 250, rw: 1060, rh: 300 },
      { t: bt.startMs + 400, label: 'stamp slam — +60ms (SQUASHED wide/short)', rx: 120, ry: 250, rw: 1060, rh: 300 },
      { t: bb.startMs + 890, label: 'bar arrival — pre-impact', rx: 170, ry: 390, rw: 920, rh: 130 },
      { t: bb.startMs + 955, label: 'bar arrival — +60ms (SQUASHED about the track)', rx: 170, ry: 390, rw: 920, rh: 130 },
      { t: bc.startMs + 1040, label: 'dossier flap — pre-landing', rx: 160, ry: 280, rw: 1080, rh: 220 },
      { t: bc.startMs + 1105, label: 'dossier flap — +55ms (SQUASHED about the base)', rx: 160, ry: 280, rw: 1080, rh: 220 },
    ],
    note: 'each pair: identical composition — only the volume differs (uniform scale before vs the squash+counter-bounce after)',
  });
}

// ── D-22 — stat numerals enter with no wind-up ──────────────────────────────
{
  const b = beatsOf('statReveal')[1]; // c1-open 7.2s, mode setup (non-cold-open)
  tile({
    name: 'D22_stat_windup_strip',
    title: 'D-22 stat numeral entrance, six phases (statReveal c1-open, +0.5s..+1.2s)',
    cols: 3, cellW: 420, cellH: 400,
    cells: [500, 600, 700, 800, 950, 1200].map((bt, i) => ({
      t: b.startMs + bt, label: `phase ${i} (bt ${bt}ms)`, rx: 880, ry: 240, rw: 860, rh: 330,
    })),
    note: 'the numeral: fades/slides from rest (before) vs pulls back then releases (after — the wind-up)',
  });
}

// ── D-23 — props stop dead + scarf invisible below rig 1.5 ──────────────────
{
  const b = beatOfKey('c5-cliffwater');
  tile({
    name: 'D23_followthrough_strip',
    title: 'D-23 prop follow-through after the card lands (caseFiles, land..land+400ms)',
    cols: 3, cellW: 420, cellH: 400,
    cells: [1000, 1080, 1160, 1240, 1320, 1400].map((bt, i) => ({
      t: b.startMs + bt, label: `+${bt}ms`, rx: 150, ry: 270, rw: 1100, rh: 330,
    })),
    note: 'frames after the landing: identical (before — dead stop) vs decaying settle wobble (after)',
  });
  // D-23 scarf evidence: the feeStack teller at rig 1.6 (scarf ON — the
  // class the rig-1.7 gate silenced) — the neck/shoulder zone at 1080p and
  // through the 320px feed pass (8x zoom), where the gold tail died before
  // the fix.
  const bf = beatOfKey('c6-fees');
  tile({
    name: 'D23_scarf_feed320',
    title: 'D-23 the scarf tail at host rig 1.6 (feeStack teller — neck zone, 1080p + the 320px feed)',
    cols: 2, cellW: 420, cellH: 260,
    cells: [
      { t: bf.startMs + 4000, label: '1080p neck zone (rig 1.6)', rx: 60, ry: 260, rw: 240, rh: 170 },
      { t: bf.startMs + 4000, label: 'the SAME zone at the 320px feed (8x)', rx: 60, ry: 260, rw: 240, rh: 170, feed: true },
    ],
    note: 'before: knot only — the tail removed below rig 1.7 (invisible); after: the gold flick at every rig (width floor 1.4px at feed)',
  });
}

// ── D-24 — idle life: behavior, not boilerplate ─────────────────────────────
{
  // c3-eltif-frame (20.3s host beat, no walkAcross): behavior windows
  // verified live by tools/behavior-sheet.mjs — ledger peak 3.25s, pen-cup
  // tap peak 7.45s, step-back look peak 11.65s, plus a control outside.
  const b = beatOfKey('c3-eltif-frame');
  const st = (bt) => b.startMs + bt;
  tile({
    name: 'D24_hold_life_strip',
    title: 'D-24 hold behavior windows (host c3-eltif-frame: ledger check, pen-cup tap, step-back look)',
    cols: 3, cellW: 420, cellH: 480,
    cells: [
      { t: st(3250), label: 'sceneT 3.3s — LEDGER CHECK peak', rx: hostCrop.rx, ry: hostCrop.ry, rw: hostCrop.rw, rh: hostCrop.rh },
      { t: st(7450), label: 'sceneT 7.5s — PEN-CUP TAP peak', rx: hostCrop.rx, ry: hostCrop.ry, rw: hostCrop.rw, rh: hostCrop.rh },
      { t: st(11650), label: 'sceneT 11.7s — STEP-BACK LOOK peak', rx: hostCrop.rx, ry: hostCrop.ry, rw: hostCrop.rw, rh: hostCrop.rh },
      { t: st(4400), label: 'sceneT 4.4s — between windows', rx: hostCrop.rx, ry: hostCrop.ry, rw: hostCrop.rw, rh: hostCrop.rh },
      { t: st(8600), label: 'sceneT 8.6s — between windows', rx: hostCrop.rx, ry: hostCrop.ry, rw: hostCrop.rw, rh: hostCrop.rh },
      { t: st(19800), label: 'sceneT 19.8s — pen cycle 2', rx: hostCrop.rx, ry: hostCrop.ry, rw: hostCrop.rw, rh: hostCrop.rh },
    ],
    note: 'the hold: boil + weight shift only (before) vs ledger check / pen-cup tap / step-back look (after)',
  });
}

// ── D-25 — exits: the host walks the scene out ──────────────────────────────
{
  // a host-led group whose exitStyle lands on 0 (probe: c3-four group#26 ch3 ends 261.5s, style 0)
  const b = beatOfKey('c3-four');
  const endMs = b.endMs;
  tile({
    name: 'D25_exit_walkout_strip',
    title: 'D-25 exit window, four phases (host-led group c3-four, style 0, ends 261.5s)',
    cols: 4, cellW: 420, cellH: 280,
    cells: [420, 280, 160, 40].map((back, i) => ({
      t: endMs - back, label: `exit ${(Math.round(((endMs - 420) / 420) * 0) + ((420 - back) / 420 * 100)).toFixed(0)}%`,
      rx: 340, ry: 90, rw: 1240, rh: 800,
    })),
    note: 'the last 420ms: camera truck, host planted (before) vs the host mid-stride taking the scene out (after)',
  });
}

// ── D-26 — card walls of text ───────────────────────────────────────────────
{
  const b = beatOfKey('c5-bcred');
  tile({
    name: 'D26_casefiles_words',
    title: 'D-26 the caseFiles card word wall (BCRED beat, t+3s)',
    cols: 1, cellW: 900, cellH: 500,
    cells: [{ t: b.startMs + 3000, label: 'the dossier card', rx: 140, ry: 250, rw: 1300, rh: 620 }],
    note: 'on-card copy: ~10-word labels + 5-row fee plates (before) vs the numeral owns the card, qualifiers compressed (after)',
  });
  const bf = beatOfKey('c6-fees', 1); // the stage-2 beat — the side card + all five plates
  tile({
    name: 'D26_feestack_sidecard',
    title: 'D-26 the feeStack side card + labeled bars (c6-fees stage 2, t+6s)',
    cols: 1, cellW: 900, cellH: 500,
    cells: [{ t: bf.startMs + 6000, label: 'the fee stack + right rail', rx: 140, ry: 250, rw: 1500, rh: 620 }],
    note: 'the side card carries a 17-word paragraph (before) vs a ≤9-word question (after); the plates carry the data',
  });
}

// ── D-27 — number hierarchy drift ───────────────────────────────────────────
{
  const bs = beatsOf('statReveal')[1];
  const bc = beatOfKey('c5-obdc', 2); // runIdx 2 -> framing C (the read-out cells)
  const cp = beatsOf('commentPrompt')[0];
  tile({
    name: 'D27_number_law',
    title: 'D-27 the number that owns the frame — three registers, one law',
    cols: 3, cellW: 420, cellH: 360,
    cells: [
      { t: bs.startMs + 1600, label: 'statReveal hero numeral (NUM.hero 120)', rx: 880, ry: 240, rw: 800, rh: 300 },
      { t: bc.startMs + 2600, label: 'caseFiles read-out cell (96 -> NUM.hero 120)', rx: 150, ry: 430, rw: 900, rh: 300 },
      { t: cp.startMs + 2500, label: 'commentPrompt question (fixed 84 -> NUM.sub)', rx: 300, ry: 360, rw: 1320, rh: 280 },
    ],
    note: 'after: one law — NUM.hero 120 owns the frame, NUM.sub 84 supports, NUM.chip 56 plates (theme.ts, consumed scene-wide)',
  });
}

// ── D-28 — kicker repetition ────────────────────────────────────────────────
{
  const b1 = beatsOf('statReveal')[1];
  const b2 = beatsOf('statReveal')[2];
  const h1 = beatOfKey('c3-four');
  const h2 = beatOfKey('c3-prorate', 0);
  tile({
    name: 'D28_kicker_repeat',
    title: 'D-28 the kicker line on consecutive beats (statReveal ch + host beats)',
    cols: 2, cellW: 560, cellH: 220,
    cells: [
      { t: b1.startMs + 1500, label: 'statReveal beat 2 (7.2s)', rx: 120, ry: 100, rw: 900, rh: 140 },
      { t: b2.startMs + 1500, label: 'statReveal beat 3 (18.8s)', rx: 120, ry: 100, rw: 900, rh: 140 },
      { t: h1.startMs + 2200, label: 'host b022 (c3-four) kicker chip', rx: 880, ry: 130, rw: 940, rh: 150 },
      { t: h2.startMs + 2200, label: 'host b023 (c3-prorate) kicker chip', rx: 880, ry: 130, rw: 940, rh: 150 },
    ],
    note: 'before: identical brand lines print on consecutive beats — automation; after: ident once, then the beat\'s own line',
  });
}

// ── D-29 — source tags sub-legible ──────────────────────────────────────────
{
  const b = beatOfKey('c2-launches') ?? beatsOf('barsCompare')[0];
  tile({
    name: 'D29_source_citation',
    title: 'D-29 the citation strip (barsCompare, t+3s — bottom band, 1:1 and feed)',
    cols: 2, cellW: 700, cellH: 170,
    cells: [
      { t: b.startMs + 3000, label: '1080p citation row', rx: 80, ry: 950, rw: 1760, rh: 110 },
      { t: b.startMs + 3000, label: 'the same band at 320px feed (×2.2)', rx: 80, ry: 950, rw: 1760, rh: 110, feed: true },
    ],
    note: 'before: 34px grey whisper at 0.55 alpha — noise; after: a designed gold-ruled citation row that earns the strip',
  });
}

console.log('done ->', OUTDIR);
