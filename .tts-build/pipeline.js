"use strict";
/**
 * Render pipeline — the client-side orchestrator:
 * 1. synthesize voice lines (server, batched, cached)
 * 2. decode audio + measure exact durations
 * 3. build the frame-accurate timeline
 * 4. mix the score + voiceover
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VO_STYLE_DELTAS = void 0;
exports.allChunks = allChunks;
exports.generateVoiceover = generateVoiceover;
exports.decodeAudio = decodeAudio;
exports.prepareProject = prepareProject;
const pipeline_helpers_1 = require("./pipeline-helpers");
const timeline_1 = require("./timeline");
const audio_1 = require("./audio");
const scene_props_1 = require("./scene-props");
const TTS_BATCH = 8;
/** v8 (panel P0-4): per-beat vocal direction → TTS rate/pitch offsets.
 *  A 20-minute flat read is the #1 'sounds AI' tell; these small offsets
 *  give the narration an emotional contour that Edge TTS cannot infer on
 *  its own. Applied on top of the user's chosen base rate/pitch. */
exports.VO_STYLE_DELTAS = {
    neutral: { rate: 0, pitch: 0 },
    calm: { rate: -6, pitch: 0 }, // slower, measured — data chapters
    urgent: { rate: 6, pitch: 1 }, // the cold open, the paradox
    reveal: { rate: -10, pitch: -2 }, // slow, low, held — the twist, payoffs
    quote: { rate: -2, pitch: 3 }, // lighter — quoted characters
};
function audioCtxShared() {
    const w = globalThis;
    if (!w.__sharedAudioCtx) {
        w.__sharedAudioCtx = new (w.AudioContext || w.webkitAudioContext)();
    }
    return w.__sharedAudioCtx;
}
/** All sentence chunks across the whole script.
 *  v8: each chunk carries its beat's vocal direction (voStyle → rate/pitch
 *  offsets) and optional per-beat voice, so quoted economists get their own
 *  voices and emotional beats get an actual emotional read. */
function allChunks() {
    const out = [];
    pipeline_helpers_1.SCRIPT.forEach((chapter, ci) => {
        chapter.beats.forEach((beat, bi) => {
            const style = exports.VO_STYLE_DELTAS[beat.voStyle ?? 'neutral'] ?? exports.VO_STYLE_DELTAS.neutral;
            (0, pipeline_helpers_1.splitSentencesSafe)(beat.vo).forEach((text, si) => {
                out.push({
                    id: `${ci}-${bi}-${si}`,
                    text,
                    voice: beat.voice,
                    rateDelta: style.rate,
                    pitchDelta: style.pitch,
                });
            });
        });
    });
    return out;
}
async function generateVoiceover(voice, onProgress) {
    const chunks = allChunks();
    const results = new Map();
    let done = 0;
    for (let i = 0; i < chunks.length; i += TTS_BATCH) {
        const batch = chunks.slice(i, i + TTS_BATCH);
        const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lines: batch.map((l) => ({
                    id: l.id,
                    text: l.text,
                    // v8: per-line vocal direction rides the batch payload
                    voice: l.voice,
                    rateDelta: l.rateDelta ?? 0,
                    pitchDelta: l.pitchDelta ?? 0,
                })),
                voice: voice.voice,
                rate: voice.rate,
                pitch: voice.pitch,
            }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'TTS request failed' }));
            throw new Error(err.error || `voice generation failed (batch ${i / TTS_BATCH + 1})`);
        }
        const data = await res.json();
        for (const r of data.results) {
            results.set(r.id, { key: r.key, words: r.words });
        }
        done += batch.length;
        onProgress({
            phase: 'tts',
            detail: `generating premium voiceover · line ${Math.min(done, chunks.length)} of ${chunks.length}`,
            done,
            total: chunks.length,
        });
    }
    return { results };
}
async function decodeAudio(results, onProgress) {
    const ac = audioCtxShared();
    const manifest = { lines: {} };
    const voBuffers = new Map();
    const ids = [...results.keys()];
    let done = 0;
    for (const id of ids) {
        const r = results.get(id);
        const res = await fetch(`/api/tts/file/${r.key}`);
        if (!res.ok)
            throw new Error(`audio file missing for line ${id}`);
        const buf = await res.arrayBuffer();
        const audio = await ac.decodeAudioData(buf);
        manifest.lines[id] = {
            key: r.key,
            durationMs: audio.duration * 1000,
            words: r.words,
        };
        voBuffers.set(id, audio);
        done++;
        if (done % 10 === 0 || done === ids.length) {
            onProgress({
                phase: 'decode',
                detail: `measuring audio · ${done}/${ids.length}`,
                done,
                total: ids.length,
            });
        }
    }
    return { manifest, voBuffers };
}
async function prepareProject(voice, audioSettings, onProgress) {
    onProgress({ phase: 'tts', detail: 'starting voice generation', done: 0, total: 1 });
    const { results } = await generateVoiceover(voice, onProgress);
    const { manifest, voBuffers } = await decodeAudio(results, onProgress);
    onProgress({ phase: 'timeline', detail: 'building the edit', done: 0, total: 1 });
    // v3 (panel P1-6): dev-time guard — every unknown scene prop logs with its
    // beat id, so a misspelled or unimplemented key can never ship silently
    // again (three dead props shipped that way: invert, mini, hostCount).
    if (process.env.NODE_ENV !== 'production') {
        const issues = (0, scene_props_1.validateSceneProps)();
        if (issues.length) {
            console.warn('[scene-props] unknown keys (beat scene.key):');
            for (const it of issues) {
                console.warn(`  ch${it.beat} ${it.sceneType}: "${it.key}"${it.hint ? ' — ' + it.hint : ''}`);
            }
        }
    }
    const timeline = (0, timeline_1.buildTimeline)(manifest, audioSettings.fps);
    onProgress({
        phase: 'mix',
        detail: `composing the score + mixing ${voBuffers.size} voice clips`,
        done: 0,
        total: 100,
    });
    const mixBuffer = await (0, audio_1.renderMix)({
        timeline,
        voBuffers,
        bgmVolume: audioSettings.bgmVolume,
        voVolume: audioSettings.voVolume,
        onProgress: (frac, label) => onProgress({
            phase: 'mix',
            detail: label,
            done: Math.round(frac * 100),
            total: 100,
        }),
    });
    onProgress({
        phase: 'ready',
        detail: `ready · runtime ${(timeline.durationMs / 60000).toFixed(1)} minutes · ${timeline.totalFrames} frames`,
        done: 1,
        total: 1,
    });
    const settingsHash = JSON.stringify({ voice, audioSettings });
    return { manifest, voBuffers, timeline, mixBuffer, settingsHash };
}
