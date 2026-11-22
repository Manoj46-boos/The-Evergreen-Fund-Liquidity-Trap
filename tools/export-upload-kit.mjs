/**
 * U-24 (100-JUDGE VISUAL AUDIT — THE ONE-MILLION MATH): exports the SHORTS
 * DISCOVERY LADDER upload kit — per-Short YouTube metadata (title,
 * description, tags, pinned comment) + the two-per-week shipping schedule —
 * from the SAME pickShortMoments() call the Shorts renderer uses.
 *
 *   node tools/export-upload-kit.mjs [--start 2026-11-24] [--out download/upload-kit.json]
 *
 * Output: JSON kit + a CSV the upload session follows. Free tools, no
 * network, deterministic.
 */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(REPO, '.render-check-build');

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};

if (!fs.existsSync(path.join(BUILD, 'upload-kit.js'))) {
  console.error('engine build missing — run the compile step first (any tools/* render does it)');
  process.exit(2);
}
const { SCRIPT } = require(path.join(BUILD, 'script-data.js'));
const { buildTimeline } = require(path.join(BUILD, 'timeline.js'));
const { buildShortsKit, shippingLadder, filmUploadKit } = require(path.join(BUILD, 'upload-kit.js'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, '.render-assets', 'manifest.json'), 'utf8'));
const tl = buildTimeline(manifest, 24);

const start = arg('start', '2026-11-24');
const out = arg('out', path.join(REPO, 'download', 'upload-kit.json'));

const kit = {
  film: filmUploadKit(),
  shorts: buildShortsKit(tl),
  ladder: shippingLadder(start, 3),
  discipline: [
    'two Shorts per week (Tuesday + Friday) — the audit\u2019s funnel cadence',
    'every description closes on the long film (the funnel line ships in the kit)',
    'the pinned comment lands within 10 minutes of upload (comment economy)',
    'after the six-Short set, rotate titles from film.titleOptions on a 6-week cooling gap',
    'levers: scroll-stopping first frame (U-22/U-23) + 45%+ AVD (Phase 2-4 scenes) + this ladder',
  ],
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(kit, null, 2));
console.log(`upload kit → ${out} (${kit.shorts.length} shorts · ${kit.ladder.length} ladder slots)`);

// the CSV the upload session follows
const csv = [
  ['week', 'date', 'weekday', 'short_slot', 'short_title', 'youtube_title', 'duration_s', 'funnel_to'].join(','),
  ...kit.ladder.map((r) => {
    const s = kit.shorts.find((x) => x.slot === r.shortSlot);
    return [r.week, r.slotISO, r.weekday, r.shortSlot, s.shortTitle, s.youtubeTitle, s.durS, r.funnelTo]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  }),
].join('\n');
const csvOut = out.replace(/\.json$/, '.csv');
fs.writeFileSync(csvOut, csv);
console.log(`ladder csv → ${csvOut}`);
