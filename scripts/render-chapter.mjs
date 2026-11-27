/**
 * U-20 (100-JUDGE VISUAL AUDIT — RENDER ECONOMY ON 8 GB): renders ONE chapter
 * chunk of the 1080p master — a [startMs,endMs) window — through the SAME
 * compiled engine (drawFrame) the studio uses, at the full 1920×1080 design
 * grid, and encodes it as an H.264 CRF 19 24 fps chunk with real VO + the
 * sf2 bed. Frames render one at a time and stream to disk; nothing large is
 * held in memory (the engine's own low-RAM design).
 *
 * Run UNDER the 4 GB heap cap from the master orchestrator (render-master.mjs
 * spawns this script with --max-old-space-size=4096), or by hand:
 *
 *   node --max-old-space-size=4096 scripts/render-chapter.mjs --chapter 1 \
 *        [--fps 24] [--crf 19] [--mood sparse] [--bgm 0.45] [--vo 1.0]
 *
 * Output: download/master/chunk-01.mp4 (one of nine; the master script
 * stitches them losslessly with ffmpeg concat -c copy).
 */
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createCanvas, registerFont } from 'canvas';
const require = createRequire(import.meta.url);

// node shims for the engine's browser-canvas fallbacks (same as frame-dump)
globalThis.document = { createElement: () => createCanvas(192, 192) };
globalThis.OffscreenCanvas = class { constructor(w, h) { return createCanvas(w, h); } };

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(REPO, '.render-check-build');
const OUTDIR = path.join(REPO, '.master-frames');
const MUXDIR = path.join(REPO, 'download', 'master');

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};

// ── heap guard: refuse to run uncapped (U-20's whole point on 8 GB) ──
const heapMB = Math.round(process.memoryUsage().heapTotal / 1e6);
const capped = Number(process.execArgv.find((a) => a.includes('max-old-space-size'))?.split('=')[1] ?? 0);
if (!capped && !process.env.MASTER_ALLOW_UNCAPPED) {
  console.error('refusing to run without the 4 GB heap cap — spawn with:\n  node --max-old-space-size=4096 scripts/render-chapter.mjs ...');
  process.exit(2);
}

// ── engine + manifest (real TTS timings) ──
const { SCRIPT } = require(path.join(BUILD, 'script-data.js'));
const { buildTimeline } = require(path.join(BUILD, 'timeline.js'));
const { drawFrame } = require(path.join(BUILD, 'director.js'));
const { chapterChunks } = require(path.join(BUILD, 'encode.js'));
// D-33: the SHIPPING DEFAULT is the first-upload cut (--cut full opts back in)
const CUT = arg('cut', 'first-upload');
const sdCut = require(path.join(BUILD, 'script-data.js'));
if (CUT === 'first-upload' && sdCut.FIRST_UPLOAD_CUT) sdCut.SCRIPT = sdCut.FIRST_UPLOAD_CUT;
const manifestFile = CUT === 'first-upload' && fs.existsSync(path.join(REPO, '.render-assets', 'manifest-first.json'))
  ? 'manifest-first.json'
  : 'manifest.json';
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, '.render-assets', manifestFile), 'utf8'));

const OPTS = {
  captions: 'karaoke',
  channelName: 'The Data Desk',
  nextVideoTitle: 'NAV Lag Explained: Who Pays When the Mark Is Wrong (With the Math)',
  watermark: true,
  progressBar: true,
};

const FPS = Number(arg('fps', 24));
const CRF = Number(arg('crf', 19));
const mood = arg('mood', 'sparse');
const bgmVol = Number(arg('bgm', 0.45));
const voVol = Number(arg('vo', 1.0));
const chapterNum = Number(arg('chapter', 1));
// optional time overrides (smoke tests / re-renders): the master orchestrator
// walks the chapter plan; a manual run can narrow the window
const overFrom = arg('from');
const overTo = arg('to');

const tl = buildTimeline(manifest, FPS);
const chunks = chapterChunks(tl);
const chunk = chunks.find((c) => c.index === chapterNum);
if (!chunk) {
  console.error(`no chapter ${chapterNum} (valid: ${chunks.map((c) => c.index).join(', ')})`);
  process.exit(2);
}

const fromMs = overFrom ? Number(overFrom) * 1000 : chunk.startMs;
const toMs = overTo ? Number(overTo) * 1000 : chunk.endMs;
console.log(`chunk ${String(chunk.index).padStart(2, '0')} (${chunk.chapterId}) ${fromMs}→${toMs}ms @ ${FPS}fps · film ${(tl.durationMs / 60000).toFixed(1)} min · heap ${heapMB}MB`);

// ── frames ──
fs.rmSync(OUTDIR, { recursive: true, force: true });
fs.mkdirSync(OUTDIR, { recursive: true });
const W = 1920, H = 1080; // the certified design grid — render there, encode full
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
ctx.imageSmoothingQuality = 'high';

const t0 = Date.now();
let n = 0;
for (let t = fromMs; t < toMs; t += 1000 / FPS) {
  drawFrame(ctx, tl, t, OPTS);
  fs.writeFileSync(path.join(OUTDIR, `f-${String(n).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
  n++;
  if (n % 240 === 0) {
    const el = (Date.now() - t0) / 1000;
    console.log(`  frame ${n} (${((t - fromMs) / 1000).toFixed(1)}s of chunk) · ${el.toFixed(0)}s elapsed · ${(n / el).toFixed(2)} fps`);
  }
}
console.log(`frames done: ${n} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

// ── audio: bed loop + VO lines in the window (same grammar as render-clip) ──
const bedFile = path.join(REPO, 'public', 'beds', `sf2-${mood}-0.wav`);
const clipDur = (toMs - fromMs) / 1000;
const tmpA = path.join(OUTDIR, '_audio');
fs.mkdirSync(tmpA, { recursive: true });

const voInputs = [];
for (const b of tl.beats) {
  for (const s of b.sentences) {
    const endMs = s.startMs + s.audioDurMs;
    if (endMs >= fromMs && s.startMs <= toMs) {
      const key = s.lineId;
      const mp3 = path.join(REPO, '.render-assets', 'tts', `${manifest.lines[key]?.key ?? ''}.mp3`);
      if (fs.existsSync(mp3)) {
        voInputs.push({ mp3, delayMs: Math.max(0, s.startMs - fromMs) });
      }
    }
  }
}
console.log(`audio: bed ${path.basename(bedFile)} · ${voInputs.length} VO lines in window`);

const filterParts = [];
const inputArgs = ['-i', bedFile];
filterParts.push(`[0:a]aloop=loop=-1:size=2e9,atrim=0:${clipDur.toFixed(3)},volume=${bgmVol.toFixed(2)},afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, clipDur - 0.8).toFixed(3)}:d=0.8[bed]`);
voInputs.forEach((v, i) => {
  inputArgs.push('-i', v.mp3);
  filterParts.push(`[${i + 1}:a]adelay=${Math.round(v.delayMs)}|${Math.round(v.delayMs)},volume=${voVol.toFixed(2)}[vo${i}]`);
});
const mixParts = voInputs.map((_, i) => `[vo${i}]`);
const filterComplex = `${filterParts.join(';')};${mixParts.length ? `[bed]${mixParts.map((m) => `${m}`).join('')}` : '[bed]'}amix=inputs=${voInputs.length + 1}:normalize=0:duration=first[mix]`;

const mixed = path.join(tmpA, 'mix.wav');
execFileSync(
  'ffmpeg',
  ['-y', ...inputArgs, '-filter_complex', filterComplex, '-map', '[mix]',
   '-ar', '48000', '-ac', '2', mixed],
  { stdio: 'pipe', cwd: REPO }
);

// ── encode the chunk: H.264 CRF 18-20 (the audit's band), 24 fps, yuv420p ──
fs.mkdirSync(MUXDIR, { recursive: true });
const out = path.join(MUXDIR, `chunk-${String(chunk.index).padStart(2, '0')}-${chunk.chapterId}.mp4`);
execFileSync(
  'ffmpeg',
  ['-y', '-framerate', String(FPS), '-i', path.join(OUTDIR, 'f-%05d.png'),
   '-i', mixed, '-vf', 'scale=1920:1080:flags=lanczos',
   '-c:v', 'libx264', '-preset', 'medium', '-crf', String(CRF),
   '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', out],
  { stdio: 'pipe', cwd: REPO }
);
console.log(`chunk written: ${out} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
