/**
 * U-20 (100-JUDGE VISUAL AUDIT — RENDER ECONOMY ON 8 GB): the 1080p MASTER
 * orchestrator. Walks the nine chapter chunks (one pass per chapter), spawns
 * each chunk render as its own Node process with the heap capped at 4 GB
 * (--max-old-space-size=4096 — the 8 GB Dell renders one chunk at a time,
 * nothing else lives in RAM), then stitches the chunks LOSSLESSLY with
 * ffmpeg concat (stream copy — no re-encode, no generation loss at the
 * seams). 24 fps H.264 CRF 19 (the audit's 18-20 band).
 *
 *   node scripts/render-master.mjs [--from 1] [--to 9] [--fps 24] [--crf 19]
 *
 * Per-chunk render on the Dell: 3-6 h; the full film renders overnight in
 * three sessions — resume any time with --from <next chunk>.
 */
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(REPO, '.render-check-build');
const MUXDIR = path.join(REPO, 'download', 'master');

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};

const FPS = Number(arg('fps', 24));
const CRF = Number(arg('crf', 19));
const fromChunk = Number(arg('from', 1));
const toChunk = Number(arg('to', 9));

// ensure the engine build exists (same compile the harness uses)
if (!fs.existsSync(path.join(BUILD, 'director.js'))) {
  console.log('compiling the engine build...');
  const files = [
    'theme', 'easing', 'effects', 'stickman', 'stickman-v2', 'charts', 'textfx',
    'collision', 'scene-context', 'scene-props', 'scenes-host', 'scenes-data', 'scenes-text',
    'scale-law', 'composition', 'stage', 'perception', 'pivots', 'script-data', 'timeline',
    'director', 'thumbnail', 'shorts', 'encode',
  ].map((f) => path.join(REPO, 'src', 'lib', 'engine', f + '.ts'));
  execFileSync(
    'node_modules/.bin/tsc',
    [...files, '--outDir', BUILD, '--module', 'commonjs', '--moduleResolution', 'node',
     '--target', 'es2022', '--skipLibCheck', '--esModuleInterop', '--resolveJsonModule'],
    { stdio: 'inherit', cwd: REPO }
  );
}

const { buildTimeline } = require(path.join(BUILD, 'timeline.js'));
const { chapterChunks } = require(path.join(BUILD, 'encode.js'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, '.render-assets', 'manifest.json'), 'utf8'));
const tl = buildTimeline(manifest, FPS);
const chunks = chapterChunks(tl);

console.log(`master plan: ${chunks.length} chapter chunks · film ${(tl.durationMs / 60000).toFixed(1)} min · ${FPS} fps · CRF ${CRF}`);
chunks.forEach((c) =>
  console.log(`  chunk ${String(c.index).padStart(2, '0')} ${c.chapterId}  ${(c.startMs / 1000).toFixed(1)}s → ${(c.endMs / 1000).toFixed(1)}s  (${((c.endMs - c.startMs) / 1000).toFixed(1)}s)`)
);

fs.mkdirSync(MUXDIR, { recursive: true });
const t0 = Date.now();
for (const c of chunks) {
  if (c.index < fromChunk || c.index > toChunk) continue;
  const outFile = path.join(MUXDIR, `chunk-${String(c.index).padStart(2, '0')}-${c.chapterId}.mp4`);
  if (fs.existsSync(outFile) && !arg('force')) {
    console.log(`chunk ${c.index} exists — skip (use --force to re-render)`);
    continue;
  }
  console.log(`\n── rendering chunk ${c.index}/${chunks.length} (${c.chapterId}) under the 4 GB heap cap ──`);
  const r = spawnSync(
    process.execPath,
    ['--max-old-space-size=4096',
     path.join(REPO, 'scripts', 'render-chapter.mjs'),
     '--chapter', String(c.index), '--fps', String(FPS), '--crf', String(CRF)],
    { stdio: 'inherit', cwd: REPO, env: process.env }
  );
  if (r.status !== 0) {
    console.error(`chunk ${c.index} FAILED (exit ${r.status}) — fix and re-run with --from ${c.index}`);
    process.exit(1);
  }
}
console.log(`\nchunks done in ${((Date.now() - t0) / 1000 / 60).toFixed(1)} min`);

// ── lossless stitch: ffmpeg concat demuxer, stream copy (NO re-encode) ──
const listFile = path.join(MUXDIR, 'concat-list.txt');
const parts = chunks
  .filter((c) => c.index >= fromChunk && c.index <= toChunk)
  .map((c) => path.join(MUXDIR, `chunk-${String(c.index).padStart(2, '0')}-${c.chapterId}.mp4`));
for (const p of parts) {
  if (!fs.existsSync(p)) {
    console.error(`missing chunk ${p} — render it first (npm run master:chunk -- --from ${path.basename(p).slice(6, 8)})`);
    process.exit(1);
  }
}
fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'));
const master = path.join(MUXDIR, 'the-evergreen-fund-liquidity-trap-1080p.mp4');
execFileSync(
  'ffmpeg',
  ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', master],
  { stdio: 'pipe', cwd: REPO }
);
console.log(`MASTER written: ${master} (${(fs.statSync(master).size / 1e6).toFixed(1)} MB) — lossless concat of ${parts.length} chapter chunks`);
