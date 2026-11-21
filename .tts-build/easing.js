"use strict";
/** Animation math: easing, interpolation, springs, seeded randomness, noise. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.easeInOutSine = exports.easeOutExpo = exports.easeOutElastic = exports.easeOutBack = exports.easeInOutQuart = exports.easeOutQuart = exports.easeInOutCubic = exports.easeOutCubic = exports.easeInCubic = exports.easeInOutQuad = exports.easeOutQuad = exports.easeInQuad = exports.easeLinear = exports.rng01 = exports.clamp01 = exports.invLerp = exports.mix = exports.lerp = exports.clamp = void 0;
exports.seededRandom = seededRandom;
exports.window4 = window4;
exports.springTo = springTo;
exports.stagger = stagger;
exports.hash01 = hash01;
exports.seamArrival = seamArrival;
exports.hashRange = hashRange;
exports.hashPick = hashPick;
exports.hashStr = hashStr;
exports.noise1 = noise1;
exports.drift = drift;
exports.fmtCountUp = fmtCountUp;
exports.fmtTimestamp = fmtTimestamp;
exports.splitSentences = splitSentences;
exports.landPulse = landPulse;
const clamp = (v, min, max) => v < min ? min : v > max ? max : v;
exports.clamp = clamp;
const lerp = (a, b, t) => a + (b - a) * t;
exports.lerp = lerp;
const mix = (a, b, t) => a + (b - a) * t;
exports.mix = mix;
const invLerp = (a, b, v) => b === a ? 0 : (0, exports.clamp)((v - a) / (b - a), 0, 1);
exports.invLerp = invLerp;
const clamp01 = (v) => (0, exports.clamp)(v, 0, 1);
exports.clamp01 = clamp01;
/**
 * Deterministic LCG stream (v6, audit P2-1): moved here from audio.ts so the
 * score module and the DSP bed share one canonical seeded generator.
 */
function seededRandom(seed) {
    let s = (seed * 2654435761) >>> 0 || 42;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}
/** Normalized progress of `t` inside [start, end]. */
const rng01 = (t, start, end) => end <= start ? 1 : (0, exports.clamp01)((t - start) / (end - start));
exports.rng01 = rng01;
// ── Easing ───────────────────────────────────────────────────────────────────
const easeLinear = (t) => t;
exports.easeLinear = easeLinear;
const easeInQuad = (t) => t * t;
exports.easeInQuad = easeInQuad;
const easeOutQuad = (t) => t * (2 - t);
exports.easeOutQuad = easeOutQuad;
const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
exports.easeInOutQuad = easeInOutQuad;
const easeInCubic = (t) => t * t * t;
exports.easeInCubic = easeInCubic;
const easeOutCubic = (t) => {
    const f = 1 - t;
    return 1 - f * f * f;
};
exports.easeOutCubic = easeOutCubic;
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
exports.easeInOutCubic = easeInOutCubic;
const easeOutQuart = (t) => {
    const f = 1 - t;
    return 1 - f * f * f * f;
};
exports.easeOutQuart = easeOutQuart;
const easeInOutQuart = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
exports.easeInOutQuart = easeInOutQuart;
const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const f = 1 - t;
    return 1 + c3 * f * f * f + c1 * f * f;
};
exports.easeOutBack = easeOutBack;
const easeOutElastic = (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};
exports.easeOutElastic = easeOutElastic;
const easeOutExpo = (t) => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
exports.easeOutExpo = easeOutExpo;
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
exports.easeInOutSine = easeInOutSine;
/** Smooth window that rises 0→1 over [a,b], holds, falls over [c,d]. */
function window4(t, a, b, c, d) {
    if (t < a || t > d)
        return 0;
    if (t >= b && t <= c)
        return 1;
    if (t < b)
        return (0, exports.easeInOutSine)((0, exports.clamp01)((t - a) / Math.max(1, b - a)));
    return 1 - (0, exports.easeInOutSine)((0, exports.clamp01)((t - c) / Math.max(1, d - c)));
}
/**
 * PANEL-12 / P1-2 (report §13.2) — the closed-form analytic spring.
 *
 * Under-damped spring step from `from` to `to` over tMs, with zero state:
 * a pure function of its arguments, so scrub-determinism is preserved
 * EXACTLY (the constraint that rules the whole engine). One term buys the
 * three things pose transitions were missing — anticipation (the slow
 * wind-up start), overshoot past the target, and the settle — without an
 * iterative integrator that would break frame-accurate scrubbing.
 *
 * stiffness ~170 / damping ~21 is a "confident presenter" tune: a fast
 * settle (~600ms) with a small (~4%) overshoot. Raising damping kills the
 * overshoot; lowering stiffness reads as underwater.
 */
function springTo(from, to, tMs, stiffness = 170, damping = 21) {
    const w0 = Math.sqrt(stiffness); // rad/s
    const zeta = damping / (2 * w0);
    const t = tMs / 1000;
    if (zeta < 1) {
        const wd = w0 * Math.sqrt(1 - zeta * zeta);
        const decay = Math.exp(-zeta * w0 * t);
        return (to +
            (from - to) *
                decay *
                (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t)));
    }
    const decay = Math.exp(-w0 * t);
    return to + (from - to) * (1 + w0 * t) * decay;
}
/** Staggered index reveal helper: returns 0..1 for item i entering at time t. */
function stagger(t, i, per = 90, dur = 520, start = 0, fn = exports.easeOutCubic) {
    return fn((0, exports.clamp01)((t - (start + i * per)) / dur));
}
// ── Deterministic pseudo-random (same frame → same visuals when scrubbing) ────
function hash01(n) {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    x -= Math.floor(x);
    return x;
}
/**
 * P7 (100-judge audit §12 — THE 50% SEAM SECOND ARRIVAL): the group-local ms
 * at which a scene's DEMOTED element reveals. Long holds (≥9.5s groups — the
 * long-stage register the camera's own reframe uses) earn one extra content
 * arrival at ~half the hold (±3% jitter keyed to the scene, scrub-stable);
 * shorter groups keep their original timing unchanged. `demoteMs` is the
 * element's legacy fixed arrival — the fallback that keeps every short group
 * exactly as certified. Reveal, never a new layout: the element uses its
 * existing entrance machinery, just later.
 */
function seamArrival(sceneKey, groupDur, demoteMs) {
    if (!(groupDur >= 9500))
        return demoteMs;
    let h = 0;
    for (let i = 0; i < sceneKey.length; i++)
        h += sceneKey.charCodeAt(i) * (i + 7);
    return (0.5 + 0.06 * hash01(h)) * groupDur;
}
function hashRange(n, min, max) {
    return min + hash01(n) * (max - min);
}
function hashPick(n, arr) {
    return arr[Math.floor(hash01(n) * arr.length) % arr.length];
}
/** P1-6 (report §12.6): deterministic STRING hash → 0..1 (FNV-1a). Lets
 *  callers key pseudo-random choices to stable string ids — e.g. picking a
 *  talk gesture from the sentence's line id — the way hash01 keys by number.
 *  Same string → same pick, every render, every scrub. */
function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
}
/** Smooth value noise in 1D — organic drift without a noise library. */
function noise1(x) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return (0, exports.lerp)(hash01(i), hash01(i + 1), u) * 2 - 1;
}
/** Layered drift: sum of sines at incommensurate frequencies. */
function drift(t, seed = 0) {
    return (Math.sin(t * 0.9 + seed * 12.9) * 0.5 +
        Math.sin(t * 0.31 + seed * 7.1 + 1.7) * 0.3 +
        Math.sin(t * 1.7 + seed * 3.3 + 4.2) * 0.2);
}
// ── Number formatting ────────────────────────────────────────────────────────
function fmtCountUp(target, p, opts = {}) {
    if (typeof target === 'string')
        return target;
    const { decimals = 0, prefix = '', suffix = '' } = opts;
    const eased = (0, exports.easeOutCubic)((0, exports.clamp01)(p));
    const v = target * eased;
    const formatted = v.toFixed(decimals);
    return `${prefix}${formatted}${suffix}`;
}
/** Formats seconds as m:ss or h:mm:ss (for chapter timestamps). */
function fmtTimestamp(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    const ss = String(sec).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
/** Split a beat's VO into sentence-level chunks for TTS. */
const ABBREV = [
    'U.S.', 'Mr.', 'Ms.', 'Dr.', 'St.', 'vs.', 'e.g.', 'i.e.', 'a.m.', 'p.m.',
    'No.', 'Co.', 'Inc.', 'Ltd.', 'J.P.',
];
function splitSentences(text) {
    let guarded = text;
    for (let i = 0; i < ABBREV.length; i++) {
        guarded = guarded.split(ABBREV[i]).join(`⟦A${i}⟧`);
    }
    const parts = guarded
        .split(/(?<=[.!?])\s+(?=[“"A-Z0-9])/)
        .map((s) => s.trim())
        .filter(Boolean);
    const restored = parts.map((p) => {
        let r = p;
        for (let i = 0; i < ABBREV.length; i++) {
            r = r.split(`⟦A${i}⟧`).join(ABBREV[i]);
        }
        return r;
    });
    // merge tiny fragments (like “Right.”) with neighbors < 4 words
    const out = [];
    for (const s of restored) {
        if (out.length > 0 && s.split(/\s+/).length < 3 && out[out.length - 1].length < 90) {
            out[out.length - 1] += ' ' + s;
        }
        else {
            out.push(s);
        }
    }
    return out.length ? out : [text];
}
/**
 * P2 U9 (Visual Quality Audit §4.3 — SQUASH WHERE THE AUDIENCE LOOKS):
 * the 2-frame land settle shared by every scene-event squash — cards,
 * the K brace, prop arrivals. Pure f(dt): instant full compress on the
 * impact frame (dt=0), release over ~160ms with the spring-back the
 * eye reads as weight. The v2's squash transform consumes the value;
 * callers pass scene-ms so it is scrub-safe.
 */
function landPulse(dt, riseMs = 66, decayMs = 160) {
    if (dt < 0 || dt > riseMs + decayMs)
        return 0;
    if (dt <= riseMs)
        return 1 - (0, exports.easeOutCubic)(dt / riseMs) * 0.25; // the held impact
    return (1 - (0, exports.easeInOutSine)((dt - riseMs) / decayMs)) * 0.75;
}
