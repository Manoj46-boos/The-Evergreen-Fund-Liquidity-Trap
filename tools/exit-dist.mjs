/* exit-dist — probes the exit-grammar rotation's real sampling over the
 * film's scene groups by REPLICATING director.ts computeGroups (the 12s
 * cap + sentence seams + opening exemption). Prints every group's index,
 * type, exitStyle and whether a host leads it. */
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

// ── replicate computeGroups ──
const SCENE_CAP_MS = 12000;
const groups = [];
{
  let i = 0;
  while (i < tl.beats.length) {
    const key = tl.beats[i].beat.scene.sceneKey;
    let end = i;
    while (end + 1 < tl.beats.length && tl.beats[end + 1].beat.scene.sceneKey === key) end++;
    const noCap = tl.beats.slice(i, end + 1).some((b) => (b.beat.scene || {}).opening === true);
    const seams = [];
    for (let b = i; b <= end; b++) {
      const beat = tl.beats[b];
      seams.push(beat.startMs);
      if (beat.endMs - beat.startMs > SCENE_CAP_MS) {
        for (const s of beat.sentences.slice(1)) seams.push(s.startMs);
      }
    }
    const runStart = seams[0];
    const runEnd = tl.beats[end].endMs;
    if (noCap) {
      groups.push({ startMs: runStart, endMs: runEnd, beatIdx: i, type: tl.beats[i].beat.scene.type, sceneKey: key, chapter: tl.beats[i].chapter });
      i = end + 1;
      continue;
    }
    let gFrom = runStart;
    while (gFrom < runEnd) {
      let best = seams[0];
      for (const s of seams) if (s > gFrom && s - gFrom <= SCENE_CAP_MS) best = Math.max(best, s);
      const gEnd = (best <= gFrom || best >= runEnd) ? runEnd : best;
      groups.push({ startMs: gFrom, endMs: gEnd, beatIdx: i, type: tl.beats[i].beat.scene.type, sceneKey: key, chapter: tl.beats[i].chapter });
      if (gEnd >= runEnd) break;
      gFrom = gEnd;
    }
    i = end + 1;
  }
}
const isFinal = groups.length - 1;
const dist = [0, 0, 0, 0];
let hostLed = 0, hostWalk = 0;
console.log('idx  chapter  type          sceneKey          dur    style');
groups.forEach((g, gi) => {
  const dur = g.endMs - g.startMs;
  const style = (((gi + g.chapter) % 4) + 4) % 4;
  const last = gi === isFinal;
  if (dur > 1400 && !last) dist[style]++;
  const hostLedFlag = g.type === 'host';
  if (hostLedFlag && dur > 1400 && !last) { hostLed++; if (style === 0 || style === 3) hostWalk++; }
  if (hostLedFlag || dur > 8000) console.log(
    String(gi).padStart(3), 'ch' + (g.chapter + 1), g.type.padEnd(13), g.sceneKey.padEnd(17),
    (dur / 1000).toFixed(1) + 's', 'style' + style, last ? '(final)' : '');
});
console.log('\nexit style distribution (exit-animating groups):', dist.join('/'));
console.log('host-led groups:', hostLed, ' walk-out under the FIX (styles 0+3):', hostWalk, '(' + Math.round(100 * hostWalk / Math.max(1, hostLed)) + '%)');

// also list the exact END times of host-led groups' exit windows for evidence
console.log('\nhost-led exit windows (last 500ms):');
groups.forEach((g, gi) => {
  const dur = g.endMs - g.startMs;
  if (g.type !== 'host' || dur <= 1400 || gi === isFinal) return;
  const style = (((gi + g.chapter) % 4) + 4) % 4;
  console.log(`  ${g.sceneKey} group#${gi} ch${g.chapter + 1} end=${(g.endMs / 1000).toFixed(1)}s style=${style}`);
});
