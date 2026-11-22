/**
 * evidence-times.cjs — print the absolute ms timestamps the before/after
 * evidence frames are rendered at. Deterministic: same build, same manifest
 * estimator as frame-dump.mjs. Run from the repo root:
 *   node tools/evidence-times.cjs
 */
const path = require('path');
const { createRequire } = require('module');
const REPO = path.resolve(__dirname, '..');
const BUILD = path.join(REPO, '.render-check-build');
const req = createRequire(__filename);
const { SCRIPT } = req(path.join(BUILD, 'script-data.js'));
const { splitSentences } = req(path.join(BUILD, 'easing.js'));
const { buildTimeline } = req(path.join(BUILD, 'timeline.js'));

function estWords(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const out = [];
  let t = 0;
  for (const w of words) {
    const d = Math.min(650, 180 + w.length * 38);
    out.push({ t: Math.round(t), d: Math.round(d), w });
    t += d + 45;
  }
  return { words: out, durMs: Math.round(t) };
}
const manifest = { lines: {} };
SCRIPT.forEach((chapter, ci) => {
  chapter.beats.forEach((beat, bi) => {
    splitSentences(beat.vo).forEach((text, si) => {
      const { words, durMs } = estWords(text);
      manifest.lines[`${ci}-${bi}-${si}`] = { key: `s-${ci}-${bi}-${si}`, durationMs: durMs, words };
    });
  });
});
const tl = buildTimeline(manifest, 30);

// groups = the scene-group clock frame-dump consumes
const groups = [];
tl.beats.forEach((b, i) => {
  const key = b.beat.scene.sceneKey;
  const last = groups[groups.length - 1];
  if (last && last.key === key) { last.endMs = b.endMs; last.beatIdxs.push(i); }
  else groups.push({ key, startMs: b.startMs, endMs: b.endMs, beatIdxs: [i], type: b.beat.scene.type, chapter: b.chapter });
});

const want = process.argv.slice(2);
for (const g of groups) {
  if (want.length && !want.includes(g.key)) continue;
  const d = g.endMs - g.startMs;
  console.log(`${g.key}\t${g.type}\tch${g.chapter}\tstart=${g.startMs}\tdur=${d}\tseam55=${Math.round(g.startMs + d * 0.55)}\tentrance+800=${g.startMs + 800}`);
}
console.log(`# total ${(tl.durationMs / 60000).toFixed(1)} min, ${groups.length} groups`);
