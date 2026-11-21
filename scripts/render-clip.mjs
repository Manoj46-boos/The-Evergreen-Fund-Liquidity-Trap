/**
 * Clip renderer — renders a seconds-range of the film to an MP4 with REAL
 * voiceover + the sf2 score bed, for the motion/premium judgment pass.
 *
 * Usage:
 *   node scripts/render-clip.mjs --from 0 --to 8 --out clip-open.mp4 \
 *        [--fps 24] [--w 1280] [--h 720] [--mood sparse] [--bgm 0.5] [--vo 1.0]
 *
 * Frames render through the SAME compiled engine (drawFrame) the studio
 * uses, at the requested resolution; audio = the chapter's sf2 bed loop
 * (public/beds/sf2-<mood>-v*.wav, rotated per loop) + every VO mp3 in the
 * window, placed at its measured absolute offset (ffmpeg adelay).
 */
import path from 'node:path';
import fs from 'node:fs';
import { execSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createCanvas, registerFont } from 'canvas';
const require = createRequire(import.meta.url);
// node shims for the engine's browser-canvas fallbacks (same as frame-dump)
globalThis.document = { createElement: () => createCanvas(192, 192) };
globalThis.OffscreenCanvas = class { constructor(w, h) { return createCanvas(w, h); } };

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(REPO, '.render-check-build');
const OUTDIR = path.join(REPO, '.clip-frames');

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};

// ── engine + manifest (real TTS timings) ──
const { SCRIPT } = require(path.join(BUILD, 'script-data.js'));
const { buildTimeline } = require(path.join(BUILD, 'timeline.js'));
const { drawFrame } = require(path.join(BUILD, 'director.js'));
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, '.render-assets', 'manifest.json'), 'utf8'));

const OPTS = {
  captions: 'karaoke',
  channelName: 'The Data Desk',
  nextVideoTitle: 'NAV Lag Explained: Who Pays When the Mark Is Wrong (With the Math)',
  watermark: true,
  progressBar: true,
};

const FPS = Number(arg('fps', 24));
// the engine's certified look is the 1920×1080 design grid — render there
// and downscale (lanczos) so every resolution gets the harness-verified
// composition (the camera pivots are design-space).
const W = 1920;
const H = 1080;
const outH = Number(arg('h', 720));
const fromS = Number(arg('from', 0));
const toS = Number(arg('to', 8));
const out = arg('out', `clip-${fromS}-${toS}.mp4`);
const mood = arg('mood', 'sparse');
const bgmVol = Number(arg('bgm', 0.45));
const voVol = Number(arg('vo', 1.0));

const tl = buildTimeline(manifest, FPS);
console.log(`clip ${fromS}s→${toS}s @ ${FPS}fps → ${outH}p · mood ${mood} · film ${(tl.durationMs / 60000).toFixed(1)} min`);

// ── frames ──
fs.rmSync(OUTDIR, { recursive: true, force: true });
fs.mkdirSync(OUTDIR, { recursive: true });
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
ctx.imageSmoothingQuality = 'high';

const fromMs = fromS * 1000;
const toMs = toS * 1000;
const t0 = Date.now();
let n = 0;
for (let t = fromMs; t < toMs; t += 1000 / FPS) {
  drawFrame(ctx, tl, t, OPTS);
  fs.writeFileSync(path.join(OUTDIR, `f-${String(n).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
  n++;
  if (n % 24 === 0) {
    const el = (Date.now() - t0) / 1000;
    console.log(`  frame ${n} (${((t - fromMs) / 1000).toFixed(1)}s of clip) · ${el.toFixed(0)}s elapsed · ${(n / el).toFixed(2)} fps`);
  }
}
console.log(`frames done: ${n} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

// ── audio: bed loop + VO lines in the window ──
const bedFile = path.join(REPO, 'public', 'beds', `sf2-${mood}-0.wav`);
const clipDur = (toMs - fromMs) / 1000;
const tmpA = path.join(OUTDIR, '_audio');
fs.mkdirSync(tmpA, { recursive: true });

// VO: every manifest line overlapping the window, delayed to its offset
const lines = Object.entries(manifest.lines);
// rebuild absolute sentence times by walking the script the same way
// buildTimeline does (sentences startMs were computed there; we recompute
// cheaply by asking the timeline we already built)
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
// bed: loop to cover clip, low-pass brightness, lower volume, fade in/out
filterParts.push(`[0:a]aloop=loop=-1:size=2e9,atrim=0:${clipDur.toFixed(3)},volume=${bgmVol.toFixed(2)},afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, clipDur - 0.8).toFixed(3)}:d=0.8[bed]`);
voInputs.forEach((v, i) => {
  inputArgs.push('-i', v.mp3);
  filterParts.push(`[${i + 1}:a]adelay=${Math.round(v.delayMs)}|${Math.round(v.delayMs)},volume=${voVol.toFixed(2)}[vo${i}]`);
});
const mixParts = voInputs.map((_, i) => `[vo${i}]`);
const filterComplex = `${filterParts.join(';')};${mixParts.length ? `[bed]${mixParts.map((m) => `${m}`).join('')}` : '[bed]'}amix=inputs=${voInputs.length + 1}:normalize=0:duration=first[mix]`;

const mixed = path.join(tmpA, 'mix.wav');
// no shell: the filter graph's [labels] are shell glob characters
execFileSync(
  'ffmpeg',
  ['-y', ...inputArgs, '-filter_complex', filterComplex, '-map', '[mix]',
   '-ar', '48000', '-ac', '2', mixed],
  { stdio: 'pipe', cwd: REPO }
);

// ── encode ──
const full = path.join(REPO, 'download', out);
fs.mkdirSync(path.dirname(full), { recursive: true });
const vf = outH === 1080 ? 'scale=1920:1080:flags=lanczos' : `scale=-2:${outH}:flags=lanczos`;
execFileSync(
  'ffmpeg',
  ['-y', '-framerate', String(FPS), '-i', path.join(OUTDIR, 'f-%05d.png'),
   '-i', mixed, '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
   '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', full],
  { stdio: 'pipe', cwd: REPO }
);
console.log(`clip written: ${full} (${(fs.statSync(full).size / 1e6).toFixed(1)} MB)`);
