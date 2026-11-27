/**
 * Pre-cache the film's ENTIRE voiceover with Edge neural TTS — the same
 * cache the studio's /api/tts route reads (.render-assets/tts/<key>.mp3 +
 * <key>.json), so a studio "Prepare project" is instant and the offline
 * render harness can build a REAL audio manifest (measured durations +
 * word timings) instead of synthetic estimates.
 *
 * Usage:
 *   node scripts/precache-tts.mjs [--voice en-US-AndrewMultilingualNeural]
 *                                 [--rate -4] [--pitch 0] [--rebuild-manifest]
 *
 * Cache-key format matches src/lib/server/tts-service.ts exactly:
 *   key = sha1(`${voice}|${rate}|${pitch}|${text}`).slice(0, 24)
 * where rate/pitch are the studio's BASE numbers plus the beat's voStyle
 * deltas (pipeline.VO_STYLE_DELTAS).
 */
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(REPO, '.tts-build');
const CACHE = path.join(REPO, '.render-assets', 'tts');

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};
const flag = (name) => process.argv.includes(`--${name}`);

// ── 1. compile the script + pipeline modules to CJS ──
if (!fs.existsSync(path.join(BUILD, 'script-data.js'))) {
  execSync(
    ['node_modules/.bin/tsc',
     path.join(REPO, 'src/lib/engine/script-data.ts'),
     path.join(REPO, 'src/lib/engine/pipeline.ts'),
     '--outDir', BUILD, '--module', 'commonjs', '--moduleResolution', 'node',
     '--target', 'es2022', '--skipLibCheck', '--esModuleInterop', '--resolveJsonModule'].join(' '),
    { stdio: 'inherit', cwd: REPO }
  );
}
const sd = require(path.join(BUILD, 'script-data.js'));
const ph = require(path.join(BUILD, 'pipeline-helpers.js'));
const { allChunks } = require(path.join(BUILD, 'pipeline.js'));

// D-33: the SHIPPING DEFAULT is the first-upload cut (--cut full opts back
// in). The cut swaps the module's SCRIPT before the chunks are derived —
// the TTS cache is TEXT-keyed, so the cut's lines hit the same cache.
const CUT = arg('cut', 'first-upload');
if (CUT === 'first-upload' && sd.FIRST_UPLOAD_CUT) {
  sd.SCRIPT = sd.FIRST_UPLOAD_CUT;
  ph.SCRIPT = sd.FIRST_UPLOAD_CUT;
}
const SCRIPT = sd.SCRIPT;

const VOICE = arg('voice', 'en-US-AndrewMultilingualNeural');
const RATE = Number(arg('rate', -4));
const PITCH = Number(arg('pitch', 0));

const lineKey = (voice, rate, pitch, text) =>
  createHash('sha1').update(`${voice}|${rate}|${pitch}|${text}`).digest('hex').slice(0, 24);

function unescapeXml(s) {
  return s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

async function synthesizeOne(chunk) {
  const key = lineKey(VOICE, RATE + (chunk.rateDelta ?? 0), PITCH + (chunk.pitchDelta ?? 0), chunk.text);
  const jsonPath = path.join(CACHE, `${key}.json`);
  const mp3Path = path.join(CACHE, `${key}.mp3`);
  if (fs.existsSync(jsonPath) && fs.existsSync(mp3Path) && !flag('force')) {
    return { key, cached: true };
  }
  const { EdgeTTS } = await import('@andresaya/edge-tts');
  const tts = new EdgeTTS({ timeout: 90000 });
  const r = await tts.generate(chunk.text, VOICE, {
    rate: RATE + (chunk.rateDelta ?? 0),
    pitch: PITCH + (chunk.pitchDelta ?? 0),
    volume: 0,
    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
    timeout: 90000,
  });
  const audio = Buffer.from(r.audio);
  if (audio.length < 512) throw new Error(`audio too small for "${chunk.text.slice(0, 40)}"`);
  const words = (r.wordBoundaries || []).map((wb) => ({
    t: Math.round(wb.offset / 10000),
    d: Math.round(wb.duration / 10000),
    w: unescapeXml(String(wb.text ?? '')),
  }));
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(mp3Path, audio);
  fs.writeFileSync(jsonPath, JSON.stringify({
    id: chunk.id, estDuration: r.duration ?? 0, words, text: chunk.text, voice: VOICE, rate: RATE,
  }));
  return { key, cached: false };
}

async function mp3DurationMs(p) {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${p}"`,
    { encoding: 'utf8' }
  ).trim();
  return Math.round(parseFloat(out) * 1000);
}

(async () => {
  const chunks = allChunks();
  console.log(`script: ${SCRIPT.length} chapters · ${chunks.length} sentences · voice ${VOICE} rate ${RATE}`);
  fs.mkdirSync(CACHE, { recursive: true });

  const CONC = 4;
  let cursor = 0;
  let fresh = 0;
  const results = new Map();
  async function worker() {
    while (cursor < chunks.length) {
      const idx = cursor++;
      const c = chunks[idx];
      try {
        const r = await synthesizeOne(c);
        if (!r.cached) fresh++;
        results.set(c.id, r.key);
        if (results.size % 10 === 0) console.log(`  ${results.size}/${chunks.length}`);
      } catch (e) {
        console.error(`FAIL ${c.id}: ${e.message}`);
        process.exitCode = 1;
        return;
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log(`tts done · ${fresh} fresh · ${chunks.length - fresh} cached`);

  const complete = results.size === chunks.length;
  if (!complete) { console.error('incomplete synthesis — manifest skipped; rerun to finish the cache'); }
  if (complete) {
    // build the offline manifest with MEASURED durations
    const manifest = { lines: {} };
    let done = 0;
    for (const c of chunks) {
      const key = results.get(c.id);
      const mp3 = path.join(CACHE, `${key}.mp3`);
      const meta = JSON.parse(fs.readFileSync(path.join(CACHE, `${key}.json`), 'utf-8'));
      manifest.lines[c.id] = {
        key,
        durationMs: await mp3DurationMs(mp3),
        words: meta.words,
      };
      done++;
      if (done % 20 === 0) console.log(`  measured ${done}/${chunks.length}`);
    }
    fs.mkdirSync(path.join(REPO, '.render-assets'), { recursive: true });
    const manifestName = CUT === 'first-upload' ? 'manifest-first.json' : 'manifest.json';
    fs.writeFileSync(path.join(REPO, '.render-assets', manifestName), JSON.stringify(manifest));
    // print the projected runtime
    const totalMs = Object.values(manifest.lines).reduce((a, l) => a + l.durationMs, 0);
    console.log(`manifest written (${manifestName}, cut ${CUT}) · raw VO runtime ≈ ${(totalMs / 60000).toFixed(1)} min (plus pauses)`);
  }
})();
