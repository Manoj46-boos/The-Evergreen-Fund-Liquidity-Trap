/**
 * evidence-programs — renders the Programs B..F evidence set (the 100-Judge
 * audit's action tables: B-1..B-5 signature kit, C-1..C-5 rigging/performance,
 * D-1..D-4 classical principles, E-1..E-6 retention engineering, F-1..F-3
 * packaging). One labeled artifact per action, in-image labeled so the panel
 * can read the evidence without notes.
 *
 * BEFORE pass: run against the pre-fix build. AFTER pass: run after the fixes
 * compile. Same deterministic manifest clock as the other evidence tools.
 *
 * Usage: node tools/evidence-programs.mjs --tag BEFORE --out <dir>
 */
import path from 'node:path';
import fs from 'node:fs';
import { createCanvas, registerFont } from 'canvas';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BUILD = path.join(REPO, '.render-check-build');
const arg = (n, d = undefined) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const TAG = arg('tag', 'BEFORE');
const OUTDIR = arg('out', path.join(REPO, 'evidence', 'programs'));
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
const OPTS = {
  captions: 'karaoke', channelName: 'The Data Desk',
  nextVideoTitle: 'NAV Lag Explained: Who Pays When the Mark Is Wrong (With the Math)',
  watermark: true, progressBar: true,
};

const startOf = (type, nth = 0) => {
  const hits = tl.beats.filter((b) => b.beat.scene.type === type);
  const b = hits[Math.min(nth, hits.length - 1)];
  return b ? b.startMs : 0;
};
const startOfKey = (key, nth = 0) => {
  const hits = tl.beats.filter((b) => b.beat.scene.sceneKey === key);
  const b = hits[Math.min(nth, hits.length - 1)];
  return b ? b.startMs : 0;
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
  return frameCanvas;
}

function thumbAt(variant, w = 1280, h = 720) {
  const cv = createCanvas(w, h);
  drawThumbnail(cv.getContext('2d'), w, h, variant);
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
  c.fillText(`${TAG} — ${title}`.slice(0, 118), pad, 42);
  cells.forEach((cell, i) => {
    const cx0 = pad + (i % cols) * (cellW + pad);
    const cy0 = headH + Math.floor(i / cols) * (cellH + labelH + pad);
    c.fillStyle = '#111B2E'; c.fillRect(cx0, cy0, cellW, cellH);
    let src;
    if (cell.thumb !== undefined) src = thumbAt(cell.thumb, cell.tw || 1280, cell.th || 720);
    else if (cell.custom) src = cell.custom();
    else src = drawAt(cell.t);
    if (cell.rw) {
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
    c.fillStyle = '#9FB0C8'; c.font = '600 19px Inter, sans-serif';
    c.fillText(String(cell.label).slice(0, 66), cx0, cy0 + cellH + 23);
  });
  if (note) {
    c.fillStyle = '#C9A227'; c.font = '600 19px Inter, sans-serif';
    c.fillText(String(note).slice(0, 150), pad, Ht - 14);
  }
  const out = path.join(OUTDIR, `${TAG}_${name}.png`);
  fs.writeFileSync(out, cv.toBuffer('image/png'));
  console.log('saved', out);
}

// ── B-1 — one draw path for film and poster ─────────────────────────────────
tile({
  name: 'B1_one_draw_path',
  title: 'B-1 one draw path: the poster figure vs the film figure (same drawHost, one faceScale law)',
  cols: 2, cellW: 560, cellH: 315,
  cells: [
    { thumb: 0, label: 'poster v0 — host through drawHost (SC 2.5)' },
    { t: startOfKey('c1-open') + 1500, rw: 760, rx: 260, ry: 60, label: 'film hero — hostSceneV2 (rig 2.4)' },
  ],
  note: 'the click promise matches the film: one costume, one render path, no bespoke jaw overrides',
});

// ── B-2 — the signature kit at 320px ────────────────────────────────────────
{
  const t = startOfKey('c2-launchcount') + 2200;
  const full = drawAt(t);
  const feed = createCanvas(320, 180);
  const fc = feed.getContext('2d');
  fc.imageSmoothingEnabled = true;
  fc.drawImage(full, 0, 0, 320, 180);
  const torso = createCanvas(640, 640);
  const tc = torso.getContext('2d');
  tc.imageSmoothingEnabled = true;
  // the host's torso zone at the editorial staging (design px)
  tc.drawImage(full, 300, 300, 640, 640, 0, 0, 640, 640);
  tile({
    name: 'B2_signature_kit_320',
    title: 'B-2 the signature kit survives 320px: glasses rim 6px + cyan glint, gold suspenders, three-tone brass pocket square, scarf',
    cols: 2, cellW: 480, cellH: 480,
    cells: [
      { custom: () => torso, label: 'torso crop — the four hooks' },
      { custom: () => feed, label: 'the 320px phone-feed twin' },
    ],
    note: 'any one hook alone is subtle — the four together are nameable at phone scale',
  });
}

// ── B-3 — three-finger mitts above rig 2 ────────────────────────────────────
tile({
  name: 'B3_hand_glyph_rigs',
  title: 'B-3 handGlyph: knuckle notch at hero scale, mitten below rig 2.0, count gestures only above rig 2.0',
  cols: 3, cellW: 420, cellH: 300,
  cells: [
    { t: startOf('bigText', 0) + 1200, rw: 480, rx: 1150, ry: 260, label: 'count hand at hero rig (notch)' },
    { t: startOf('bigText', 0) + 3000, rw: 480, rx: 1150, ry: 260, label: 'the count vocabulary' },
    { t: startOf('host', 0) + 2600, rw: 480, rx: 1200, ry: 300, label: 'side-host rig — mitten holds' },
  ],
  note: 'one knuckle notch turns the blob into a hand where it reads; the feed keeps the mitten',
});

// ── B-4 — the world color frozen ────────────────────────────────────────────
tile({
  name: 'B4_world_color',
  title: 'B-4 the world color: bgTop/bgBottom locked, per-chapter wash capped at 3-4%',
  cols: 3, cellW: 420, cellH: 236,
  cells: [
    { t: startOf('host', 0) + 2500, label: 'ch1 — navy world' },
    { t: startOf('caseFiles', 0) + 2500, label: 'ch5 — the trap chapters' },
    { t: startOf('takeaways', 0) + 2500, label: 'ch9 — the conclusion' },
  ],
  note: 'one navy world with accent shifts — the purple/maroon mid-film reads as the same show now',
});

// ── B-5 — one ink law for guests ────────────────────────────────────────────
tile({
  name: 'B5_guest_ink_law',
  title: 'B-5 one ink law: the ownerWorker pair draws through the host\'s own renderer',
  cols: 1, cellW: 640, cellH: 360,
  cells: [
    { t: startOf('ownerWorker', 0) + 2600, label: 'owner + worker — same stroke, shadow and face law' },
  ],
  note: 'guest figures inherit the host renderer — line weight and shadow discipline match',
});

// ── C-1 — expression keyed gesture pools ────────────────────────────────────
tile({
  name: 'C1_expression_gesture_pools',
  title: 'C-1 the pose library, reachable: urgency draws shock/wry, reveals aha, calm close/leanIn',
  cols: 3, cellW: 420, cellH: 300,
  cells: [
    { t: startOfKey('c1-open') + 800, rw: 620, rx: 40, ry: 180, label: 'urgency register — shock pool' },
    { t: startOfKey('c4-trade') + 1800, rw: 620, rx: 40, ry: 180, label: 'reveal register — aha pool' },
    { t: startOf('host', 0) + 2600, rw: 620, rx: 40, ry: 180, label: 'calm register — close/leanIn pool' },
  ],
  note: 'the gesture cycle is keyed to the beat\'s expression, not one hard-coded list',
});

// ── C-2 — the face talks with the hands ─────────────────────────────────────
{
  const b = tl.beats.filter((x) => x.beat.scene.type === 'bigText')[0];
  const t0 = b ? b.startMs : 0;
  tile({
    name: 'C2_face_talks_with_hands',
    title: 'C-2 the face articulates the narration: brow rides content-word accents, blink at sentence boundaries',
    cols: 3, cellW: 420, cellH: 300,
    cells: [
      { t: t0 + 900, rw: 480, rx: 980, ry: 200, label: 'content-word accent — brow up' },
      { t: t0 + 610, rw: 480, rx: 980, ry: 200, label: 'sentence boundary — the blink' },
      { t: t0 + 2000, rw: 480, rx: 980, ry: 200, label: 'hold — the composed read' },
    ],
    note: 'the face no longer holds one smile under moving lips',
  });
}

// ── C-3 — head follow-through on glance changes ─────────────────────────────
{
  const t0 = startOf('host', 1);
  tile({
    name: 'C3_head_follow_through',
    title: 'C-3 head follow-through: the glance yaw runs 105ms behind the shoulders',
    cols: 3, cellW: 420, cellH: 300,
    cells: [
      { t: t0 + 4880, rw: 560, rx: 180, ry: 140, label: 'seam — shoulders turn' },
      { t: t0 + 4990, rw: 560, rx: 180, ry: 140, label: '+105ms — the head arrives' },
      { t: t0 + 5400, rw: 560, rx: 180, ry: 140, label: 'held glance' },
    ],
    note: 'the cheapest trained-animator tell, on every idle glance',
  });
}

// ── C-4 — keyed idle behaviors ──────────────────────────────────────────────
tile({
  name: 'C4_keyed_idle_behaviors',
  title: 'C-4 idle becomes performance: the behavior clock (stack straighten / ledger / pen tap / step-back) + the data-host edge tap',
  cols: 4, cellW: 330, cellH: 260,
  cells: [
    { t: startOf('host', 0) + 4300, rw: 520, rx: 60, ry: 300, label: 'behavior window 1' },
    { t: startOf('host', 0) + 6300, rw: 520, rx: 60, ry: 300, label: 'behavior window 2' },
    { t: startOf('host', 0) + 8300, rw: 520, rx: 60, ry: 300, label: 'behavior window 3' },
    { t: startOf('chartJourney', 0) + 3400, rw: 520, rx: 60, ry: 300, label: 'data host — edge tap on accents' },
  ],
  note: 'one behavior per family, keyed to the seam clock; the host acts on his own set',
});

// ── C-5 — contact verbs get two frames of weight ────────────────────────────
{
  const t0 = startOfKey('c2-launchcount') + 2200;
  tile({
    name: 'C5_contact_weight',
    title: 'C-5 contact verbs get two frames of weight: the shoulder dips 3px as the palm lands',
    cols: 3, cellW: 420, cellH: 300,
    cells: [
      { t: t0, rw: 560, rx: 200, ry: 260, label: 'approach' },
      { t: t0 + 480, rw: 560, rx: 200, ry: 260, label: 'LAND — the dip' },
      { t: t0 + 900, rw: 560, rx: 200, ry: 260, label: 'settled hold' },
    ],
    note: 'the hand acquires mass — the difference between a gesture and an interaction',
  });
}

// ── D-1 — the slamStrike grammar ────────────────────────────────────────────
tile({
  name: 'D1_slam_strike_grammar',
  title: 'D-1 slamStrike(t0, mass) on every impact: 6% vertical squash + 3% horizontal stretch + negative overshoot',
  cols: 3, cellW: 420, cellH: 300,
  cells: [
    { t: startOf('navGap', 0) + 1180, rw: 640, rx: 300, ry: 300, label: 'navGap bar arrival' },
    { t: startOf('wrapperMatrix', 0) + 560, rw: 640, rx: 340, ry: 260, label: 'wrapperMatrix card arrival' },
    { t: startOf('stampCard', 0) + 520, rw: 640, rx: 500, ry: 240, label: 'stampCard slam (mass 1.0)' },
  ],
  note: 'volume deformation on impact — the single clearest expensive-animation signal in 2D',
});

// ── D-2 — the anticipation law ──────────────────────────────────────────────
tile({
  name: 'D2_anticipation_law',
  title: 'D-2 the anticipation law: the slice shears back, bars dip, plates lift — every entry above 80px counter-moves first',
  cols: 3, cellW: 420, cellH: 300,
  cells: [
    { t: startOfKey('c1-open') + 2150, rw: 640, rx: 300, ry: 240, label: 'the 5% slice — shear-back before launch' },
    { t: startOf('navGap', 0) + 480, rw: 640, rx: 300, ry: 300, label: 'navGap bars — the pre-rise dip' },
    { t: startOf('feeStack', 0) + 1600, rw: 640, rx: 300, ry: 220, label: 'fee plates — lift before the deal' },
  ],
  note: 'nothing above 80px enters without a 120ms counter-move',
});

// ── D-3 — follow-through as the default entrance ────────────────────────────
tile({
  name: 'D3_easeOutBack_entrances',
  title: 'D-3 follow-through entrances: cards overshoot ~4% and settle (easeOutBack default)',
  cols: 3, cellW: 420, cellH: 300,
  cells: [
    { t: startOf('wrapperMatrix', 0) + 500, rw: 640, rx: 340, ry: 260, label: 'overshoot frame' },
    { t: startOf('wrapperMatrix', 0) + 760, rw: 640, rx: 340, ry: 260, label: 'settle frame' },
    { t: startOf('takeaways', 0) + 800, rw: 640, rx: 300, ry: 240, label: 'takeaways card — the same law' },
  ],
  note: 'objects stop landing dead on easeOutCubic — everything the host releases recoils',
});

// ── D-4 — secondary motion on the world ─────────────────────────────────────
{
  const t0 = startOfKey('c2-launchcount');
  tile({
    name: 'D4_world_flutter',
    title: 'D-4 secondary motion: the desk papers flutter 1-2px keyed to the walk phase',
    cols: 3, cellW: 420, cellH: 300,
    cells: [
      { t: t0 + 60, rw: 420, rx: 60, ry: 760, label: 'walk phase 0.1 — flutter' },
      { t: t0 + 200, rw: 420, rx: 60, ry: 760, label: 'walk phase 0.4 — impulse' },
      { t: t0 + 2400, rw: 420, rx: 60, ry: 760, label: 'settled — still' },
    ],
    note: 'the set stops being painted furniture and becomes a place',
  });
}

// ── E-1 — zero dead frames ──────────────────────────────────────────────────
tile({
  name: 'E1_zero_dead_frames',
  title: 'E-1 zero dead frames: the plate paints before the first drawer frame; the sweep gates frame-zero occupancy',
  cols: 2, cellW: 560, cellH: 315,
  cells: [
    { t: startOf('wrapperMatrix', 1), label: 'group boundary frame 0 — the room paints' },
    { t: startOfKey('c1-open'), label: 'the film\'s first frame — the poster promise' },
  ],
  note: 'frame-zero occupancy floor 20% + the emptiness probe fail any blank frame before upload',
});

// ── E-3 — feed-gate floors ──────────────────────────────────────────────────
tile({
  name: 'E3_source_chip_row',
  title: 'E-3 the source citation chip row: 1px chips, only in the final 10% of the beat',
  cols: 2, cellW: 560, cellH: 315,
  cells: [
    { t: startOf('barsCompare', 0) + 2200, rw: 900, rx: 200, ry: 880, label: 'first 90% — no citation row' },
    { t: startOf('barsCompare', 0) + 4600, rw: 900, rx: 200, ry: 880, label: 'final 10% — the chip row lands' },
  ],
  note: 'the citation waits where a pause-reader can catch it; numbers own the frame until then',
});

// ── E-4 — caption dedup everywhere ──────────────────────────────────────────
tile({
  name: 'E4_caption_dedup',
  title: 'E-4 caption dedup everywhere: data drawers declare their on-screen numbers; the pill stands down',
  cols: 2, cellW: 560, cellH: 315,
  cells: [
    { t: startOf('dotGrid', 0) + 2600, label: 'dotGrid — declared, pill deduped' },
    { t: startOf('fundSplit', 0) + 3000, label: 'fundSplit — declared, pill deduped' },
  ],
  note: 'the karaoke pill never repeats what the scene already says in the serif',
});

// ── E-5 — break the long runs ───────────────────────────────────────────────
tile({
  name: 'E5_break_long_runs',
  title: 'E-5 the long runs re-block: caseFiles sub-stagings, auditChecklist alternates, wrapperMatrix hero trucks',
  cols: 3, cellW: 420, cellH: 300,
  cells: [
    { t: startOf('caseFiles', 0) + 2600, label: 'caseFiles — framing A' },
    { t: startOf('caseFiles', 1) + 2600, label: 'caseFiles — framing B' },
    { t: startOf('wrapperMatrix', 0) + 2800, label: 'wrapperMatrix — per-focus truck' },
  ],
  note: '15-beat holds re-stage every ~5 beats; the checklist host walks his own list',
});

// ── E-6 — density bands ─────────────────────────────────────────────────────
tile({
  name: 'E6_density_bands',
  title: 'E-6 density bands 25-60%: splitNumbers sheds a layer to a second beat; quoteCard carries the pull-quote stat chip',
  cols: 2, cellW: 560, cellH: 315,
  cells: [
    { t: startOf('splitNumbers', 0) + 2800, label: 'splitNumbers — two layers, not three' },
    { t: startOf('quoteCard', 0) + 2800, label: 'quoteCard — the dotPayoff stat chip' },
  ],
  note: 'every frame lands between 25% and 60% occupancy — dense enough to read, light enough to scan',
});

// ── F-1 — three thumbnail families ──────────────────────────────────────────
tile({
  name: 'F1_three_thumb_families',
  title: 'F-1 three thumbnail families, two of each: A face close-up / B object-only / C full scene',
  cols: 3, cellW: 420, cellH: 236,
  cells: [0, 1, 2, 3, 4, 5].map((v) => ({ thumb: v, label: `variant ${v}` })),
  note: 'the Test & Compare now measures FAMILY (face / object / scene), two variants per family',
});

// ── F-2 — the end screen sells the session ──────────────────────────────────
tile({
  name: 'F2_end_screen',
  title: 'F-2 the end screen sells the session: 40%+ next-video card, the animated hook loop, the start-here chip',
  cols: 1, cellW: 900, cellH: 506,
  cells: [
    { t: startOf('endScreen', 0) + 3200, label: 'the farewell frame' },
  ],
  note: 'the next click is sold by a moving hook frame + a start-here chip for new viewers',
});

// ── F-3 — the 10-12 minute cut ships first ──────────────────────────────────
{
  const cutDur = FIRST_UPLOAD_CUT ? 'cut defined' : 'missing';
  tile({
    name: 'F3_first_upload_cut',
    title: `F-3 the first-upload cut is the shipping default (${cutDur})`,
    cols: 2, cellW: 560, cellH: 315,
    cells: [
      { t: startOfKey('c1-open') + 1500, label: 'the cut opens on the cold open' },
      { t: startOf('takeaways', 0) + 2600, label: 'the cut closes on the takeaways' },
    ],
    note: 'the 26-minute director\'s cut waits until an audience exists (SHIPPING_CUT law)',
  });
}

console.log(`\nevidence-programs ${TAG} pass complete → ${OUTDIR}`);
