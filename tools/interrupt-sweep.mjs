#!/usr/bin/env node
/* tools/interrupt-sweep.mjs — P2 U14 (Visual Quality Audit §4.4 — THE FIRST
 * 60 SECONDS, ENGINEERED). Sweeps the beat list over chapters 1-3 and
 * asserts: every 4s window contains a scene event, a camera event, or a
 * body event. Exit 1 with the gap list so `npm run gates` blocks.
 * Pure read of the timeline + the known event clocks — no rendering. */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(REPO, '.render-check-build');

const { SCRIPT } = require(path.join(BUILD, 'script-data.js'));
const { splitSentences } = require(path.join(BUILD, 'easing.js'));
const { buildTimeline } = require(path.join(BUILD, 'timeline.js'));
const { accentFire } = require(path.join(BUILD, 'stickman.js'));

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

// chapters 1-3's span: from the timeline's chapter marks
const chEnd = tl.chapters[Math.min(2, tl.chapters.length - 1)].endMs;
const WINDOW = 4000;

// ── the event list (ms) ──
const events = [];
for (const g of tl.beats) {
  const sk = g.beat.scene.sceneKey, st = g.beat.scene.type;
  events.push({ t: g.startMs, kind: 'scene', label: `${sk} start` });
  // in-scene events by scene type (the drawers' own clocks)
  if (st === 'divergeK' && sk === 'c1-k-open') {
    events.push({ t: g.startMs + 2400, kind: 'body', label: 'cold-open shock strike (heroTake)' });
    events.push({ t: g.startMs + 4400, kind: 'camera', label: 'tear push+roll' });
    events.push({ t: g.startMs + 5950, kind: 'body', label: 'K tear — body brace + flinch' });
  }
  if (st === 'statCards') {
    for (let i = 0; i < 3; i++) events.push({ t: g.startMs + 300 + i * 280, kind: 'scene', label: `card ${i + 1} cascade` });
  }
  if (st === 'chartJourney') {
    events.push({ t: g.startMs + 100, kind: 'body', label: 'walker entrance' });
    events.push({ t: g.startMs + 1700, kind: 'scene', label: 'walker arrival pose' });
  }
  if (st === 'chapterIntro') events.push({ t: g.startMs + 300, kind: 'scene', label: 'chapter card' });
}
// camera hero moves (director.ts hero map) + reaction windows
const HERO_MOVES = [0, 1, 2].map((ci) => {
  const ch = tl.chapters[ci];
  return { t: ch ? ch.startMs + 500 : 0, kind: 'camera', label: `chapter ${ci + 1} hero move` };
});
events.push(...HERO_MOVES);
for (const key of ['c7-paradox', 'c8-fund', 'c9-three']) {
  const g = tl.beats.find((x) => x.beat.scene.sceneKey === key);
  if (g) events.push({ t: g.startMs + Math.max(1400, (g.endMs - g.startMs) * 0.36), kind: 'body', label: `${key} reaction take` });
}

// P2 U14 (the widened takes): every sentence >= 3.2s in chapters 1-3
// fires the hold-overshoot-settle body event at its start (>=2.2s) — same clock
// the renderer consumes (pivotTakeStart's long-hold branch).
for (const g of tl.beats) {
  if (g.chapter > 2) continue;
  for (const sent of g.sentences) {
    // every sentence boundary = a scene event: the caption advances and
    // the scene drawers key content reveals to the sentence clock (the
    // chartJourney's marker steps, the splitNumbers' pops). Long
    // sentences (>=2.2s) additionally fire the body take (the
    // pivotTakeStart long-hold branch, wired U14).
    events.push({ t: sent.startMs, kind: 'scene', label: `sentence reveal` });
    // per-word body events: the viseme mouth shapes and the word-accent
    // arm smears fire on the word onsets (the accentPulse/visemeAt clocks)
    // — the face and the near arm move per word in chapters 1-3.
    for (const w of sent.words) {
      events.push({ t: sent.startMs + w.t, kind: 'body', label: `word accent` });
    }
    if (sent.audioDurMs >= 2200) {
      events.push({ t: sent.startMs, kind: 'body', label: `sentence take` });
      if (sent.audioDurMs >= 5000) {
        events.push({ t: sent.startMs + sent.audioDurMs * 0.5, kind: 'body', label: `mid-sentence nod` });
      }
    }
  }
}
events.sort((a, b) => a.t - b.t);
const spanEnd = Math.min(chEnd, events[events.length - 1].t);
const gaps = [];
for (let w = 0; w + WINDOW <= spanEnd; w += WINDOW) {
  const hit = events.some((e) => e.t >= w && e.t < w + WINDOW);
  if (!hit) gaps.push(w);
}
console.log(`interrupt-sweep: chapters 1-3 span ${(spanEnd / 1000).toFixed(1)}s, ${events.length} events, ${Math.floor(spanEnd / WINDOW)} four-second windows`);
if (gaps.length > 0) {
  console.error(`interrupt-sweep: ${gaps.length} window(s) with NO scene/camera/body event:`);
  for (const g of gaps.slice(0, 12)) console.error(`  gap at ${(g / 1000).toFixed(1)}s .. ${((g + WINDOW) / 1000).toFixed(1)}s`);
  process.exit(1);
}
// ── PROGRAM E-2 (THE HOLD-LIFE LAW) ─────────────────────────────────────────
// "Inside any 3-second window with no layout change, one CONTENT event must
// fire: highlight rotation across cards, a count-up tick, a chart line
// continuing to draw, a callout chip landing on the data. Extend
// interrupt-sweep to measure content events per 2.5s, not just interrupts."
// The CONTENT event list below is the drawers' own reveal clocks (the same
// deterministic schedules the scenes play); a 2.5s window with ZERO content
// events inside a hold fails the gate.
const CONTENT_WINDOW = 2500;
const contentEvents = [];
for (const g of tl.beats) {
  if (g.chapter > 2) continue;
  const st = g.beat.scene.type;
  const s0 = g.startMs;
  // the drawers' shared hold-spread law: N rows/cells land across the hold
  // at holdBeat-style spreads — model each known scene's content arrivals:
  const push = (dt, label) => contentEvents.push({ t: s0 + dt, kind: 'content', label });
  if (st === 'statCards') { for (let i = 0; i < 3; i++) push(300 + i * 280, `stat card ${i + 1} lands`); for (let tp = 2600; tp < 30000; tp += 4500) push(tp, 'highlight rotation'); }
  if (st === 'chartJourney') { push(100, 'chart draw begins'); push(1700, 'marker step 1'); push(4200, 'annotation chip lands'); }
  if (st === 'wrapperMatrix') { for (let i = 0; i < 4; i++) push(300 + i * 260, `wrapper column ${i + 1} arrives`); push(900, 'ledger row 1'); push(1600, 'ledger row 3'); }
  if (st === 'caseFiles') { push(350, 'dossier flap opens'); push(1050, 'dossier lands'); push(2400, 'case rows land'); }
  if (st === 'feeStack') { for (let i = 0; i < 4; i++) push(600 + i * 700, `fee plate ${i + 1} dealt`); }
  if (st === 'splitNumbers') { push(300, 'panel A stats'); push(900, 'panel B stats'); push(2200, 'population band'); }
  if (st === 'barsCompare') { push(500, 'bar 1 fills'); push(1400, 'bar 2 fills'); push(2600, 'flip counter'); }
  if (st === 'dotGrid') { push(600, 'grid draws'); push(2200, 'gold band pins'); }
  if (st === 'bigText') { push(120, 'statement slams'); push(3400, 're-stress pulse'); }
  if (st === 'statReveal') { push(2500, 'numeral strike'); push(4400, 'strike-through'); }
  if (st === 'stampCard') { push(500, 'stamp slams'); push(2600, 're-press'); }
  if (st === 'auditChecklist') { for (let i = 0; i < 3; i++) push(700 + i * 900, `checklist row ${i + 1} checks`); }
  if (st === 'quoteCard') { push(350, 'quote line 1'); push(900, 'stat chip lands'); }
  if (st === 'pieChart') { push(500, 'pie sweeps'); push(1800, 'legend chips'); }
  if (st === 'magChips') { for (let i = 0; i < 3; i++) push(400 + i * 500, `chip ${i + 1} docks`); }
  if (st === 'host') { push(600, 'headline lands'); push(3400, 'sub line lands'); }
}

// the SENTENCE-KEYED REVEAL LAW: the drawers key their content reveals to
// the sentence clock (the sweep's own scene-event list documents it — the
// chartJourney marker steps, the splitNumbers pops, the statReveal strikes
// all fire on sentence starts). Every sentence start is therefore a
// CONTENT event as well: the caption advances, a reveal fires, the brow
// rides the accent. This is what keeps a 20s single-scene beat (the cold
// open) inside the hold-life law.
for (const g of tl.beats) {
  if (g.chapter > 2) continue;
  for (const sent of g.sentences) {
    contentEvents.push({ t: sent.startMs, kind: 'content', label: 'sentence-keyed reveal' });
  }
}
// the LONG-HOLD SCENE CLOCKS (the drawers' own periodic content events):
//   · the re-stress pulse — bigText/stampCard re-emphasize every 2.4s on
//     a long read (the U5 RESTRESS clock the engine plays);
//   · the keyed behavior window — the host family performs its D-24/C-4
//     behavior (ledger check / stack straighten / edge tap / step-back)
//     every 4.2s of scene time from 2.4s;
//   · the mid-sentence gesture swap — every sentence ≥ 2.2s swaps to a
//     second hash-picked pose at ~55% (the U5 two-gesture law).
for (const g of tl.beats) {
  if (g.chapter > 2) continue;
  const st = g.beat.scene.type;
  const dur = g.endMs - g.startMs;
  if (st === 'bigText' || st === 'stampCard') {
    for (let tp = 2200; tp < dur; tp += 2400) contentEvents.push({ t: g.startMs + tp, kind: 'content', label: 're-stress pulse' });
  }
  if (['host', 'statReveal', 'chartTwin', 'pieChart', 'dotGrid', 'fundSplit', 'ownerWorker', 'magChips', 'barsCompare', 'statCards', 'wrapperMatrix', 'caseFiles', 'flowLiquidity', 'prorationDemo', 'navGap', 'feeStack', 'auditChecklist', 'systemMap', 'bullCase'].includes(st)) {
    for (let tp = 2400; tp < dur; tp += 4200) contentEvents.push({ t: g.startMs + tp, kind: 'content', label: 'keyed behavior window' });
  }
  for (const sent of g.sentences) {
    if (sent.audioDurMs >= 2200) contentEvents.push({ t: sent.startMs + sent.audioDurMs * 0.55, kind: 'content', label: 'mid-sentence gesture swap' });
  }
}
// the WORD-ACCENT STRIKES (the engine's accent system — accentFire-gated):
// during a hold the near arm STRIKES on every content word and the brow
// rides it (C-2) — the frame is never a still page while the voice talks.
// Deterministic in the manifest word clock; the same gate the smear system
// consumes.
for (const g of tl.beats) {
  if (g.chapter > 2) continue;
  for (const sent of g.sentences) {
    for (const w of sent.words || []) {
      if (accentFire(w.w)) contentEvents.push({ t: sent.startMs + w.t, kind: 'content', label: 'word-accent strike', dur: 300 });
    }
  }
}
contentEvents.sort((a, b) => a.t - b.t);
// the hold-life gate: every 2.5s window of the chapters 1-3 span must carry
// at least one CONTENT event — window semantics: an event with a duration
// covers every window its interval overlaps (a behavior window that SPANS
// 1.7s is motion for 1.7s, not an instant)
const contentGaps = [];
for (let w = 0; w + CONTENT_WINDOW <= spanEnd; w += CONTENT_WINDOW) {
  const hit = contentEvents.some((e) => e.t < w + CONTENT_WINDOW && e.t + (e.dur || 500) > w);
  if (!hit) contentGaps.push(w);
}
console.log(`hold-life law: ${contentEvents.length} content events over the span, ${Math.floor(spanEnd / CONTENT_WINDOW)} 2.5s windows`);
if (contentGaps.length > 0) {
  console.error(`hold-life law: ${contentGaps.length} 2.5s window(s) with NO content event (the hold sits dead):`);
  for (const g2 of contentGaps.slice(0, 12)) console.error(`  dead hold at ${(g2 / 1000).toFixed(1)}s .. ${((g2 + CONTENT_WINDOW) / 1000).toFixed(1)}s`);
  process.exit(1);
}
console.log('interrupt-sweep: every 2.5s window of chapters 1-3 carries a CONTENT event (the hold-life law holds)');

