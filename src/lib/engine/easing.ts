/** Animation math: easing, interpolation, springs, seeded randomness, noise. */

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

export const invLerp = (a: number, b: number, v: number): number =>
  b === a ? 0 : clamp((v - a) / (b - a), 0, 1);

export const clamp01 = (v: number): number => clamp(v, 0, 1);

/**
 * Deterministic LCG stream (v6, audit P2-1): moved here from audio.ts so the
 * score module and the DSP bed share one canonical seeded generator.
 */
export function seededRandom(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 42;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Normalized progress of `t` inside [start, end]. */
export const rng01 = (t: number, start: number, end: number): number =>
  end <= start ? 1 : clamp01((t - start) / (end - start));

// ── Easing ───────────────────────────────────────────────────────────────────
export const easeLinear = (t: number): number => t;
export const easeInQuad = (t: number): number => t * t;
export const easeOutQuad = (t: number): number => t * (2 - t);
export const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
export const easeInCubic = (t: number): number => t * t * t;
export const easeOutCubic = (t: number): number => {
  const f = 1 - t;
  return 1 - f * f * f;
};
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutQuart = (t: number): number => {
  const f = 1 - t;
  return 1 - f * f * f * f;
};
export const easeInOutQuart = (t: number): number =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
// PROGRAM D-3 ROOT FIX: the shipped curve carried the WRONG SIGN on the
// c3 term (1 + c3·(1−t)³ + …), so it started at 5.4 and decayed — a
// settle-down curve wearing easeOutBack's name. Every call site's comment
// describes the TRUE Penner curve ("the stamp drops from 1.55", "0.90 →
// 1.0 with a 10% overshoot") — the sign bug made each of them behave
// differently from its own documentation (mostly hidden behind the
// alpha≈0 frames of the entrance, which is why the sweeps never caught
// it). Fixed to the standard: f(t) = 1 + c3·(t−1)³ + c1·(t−1)².
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const f = t - 1;
  return 1 + c3 * f * f * f + c1 * f * f;
};
/**
 * PROGRAM D-3 (100-JUDGE VISUAL AUDIT — FOLLOW-THROUGH AS THE DEFAULT
 * ENTRANCE): the corrected easeOutBack overshoots ~8.8% (c1 = 1.70158) —
 * too hot for cards that sit next to certified envelopes. `cardEnter` is
 * the CALIBRATED follow-through entrance the report prescribes: the same
 * back-out curve tuned to overshoot ~4% and settle, so a card lands with
 * mass instead of stopping dead on easeOutCubic. This is the DEFAULT
 * entrance ease for cards and props program-wide; easeOutCubic remains
 * for alphas and pure fades (an opacity must never overshoot).
 * c1 ≈ 1.0394 gives a measured 4.0% peak (the solved constant, peak at
 * t ≈ 0.63). Pure f(t), exact 0/1 endpoints.
 */
export const cardEnter = (t: number): number => {
  const c1 = 1.0394;
  const c3 = c1 + 1;
  const f = t - 1;
  return 1 + c3 * f * f * f + c1 * f * f;
};
export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};
export const easeOutExpo = (t: number): number =>
  t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

/** Smooth window that rises 0→1 over [a,b], holds, falls over [c,d]. */
export function window4(t: number, a: number, b: number, c: number, d: number): number {
  if (t < a || t > d) return 0;
  if (t >= b && t <= c) return 1;
  if (t < b) return easeInOutSine(clamp01((t - a) / Math.max(1, b - a)));
  return 1 - easeInOutSine(clamp01((t - c) / Math.max(1, d - c)));
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
export function springTo(
  from: number,
  to: number,
  tMs: number,
  stiffness = 170,
  damping = 21
): number {
  const w0 = Math.sqrt(stiffness); // rad/s
  const zeta = damping / (2 * w0);
  const t = tMs / 1000;
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * w0 * t);
    return (
      to +
      (from - to) *
        decay *
        (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
    );
  }
  const decay = Math.exp(-w0 * t);
  return to + (from - to) * (1 + w0 * t) * decay;
}

/** Staggered index reveal helper: returns 0..1 for item i entering at time t. */
export function stagger(
  t: number,
  i: number,
  per = 90,
  dur = 520,
  start = 0,
  fn: (x: number) => number = easeOutCubic
): number {
  return fn(clamp01((t - (start + i * per)) / dur));
}

// ── Deterministic pseudo-random (same frame → same visuals when scrubbing) ────
export function hash01(n: number): number {
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
export function seamArrival(sceneKey: string, groupDur: number, demoteMs: number): number {
  if (!(groupDur >= 9500)) return demoteMs;
  let h = 0;
  for (let i = 0; i < sceneKey.length; i++) h += sceneKey.charCodeAt(i) * (i + 7);
  return (0.5 + 0.06 * hash01(h)) * groupDur;
}

export function hashRange(n: number, min: number, max: number): number {
  return min + hash01(n) * (max - min);
}

export function hashPick<T>(n: number, arr: T[]): T {
  return arr[Math.floor(hash01(n) * arr.length) % arr.length];
}

/** P1-6 (report §12.6): deterministic STRING hash → 0..1 (FNV-1a). Lets
 *  callers key pseudo-random choices to stable string ids — e.g. picking a
 *  talk gesture from the sentence's line id — the way hash01 keys by number.
 *  Same string → same pick, every render, every scrub. */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** Smooth value noise in 1D — organic drift without a noise library. */
export function noise1(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash01(i), hash01(i + 1), u) * 2 - 1;
}

/** Layered drift: sum of sines at incommensurate frequencies. */
export function drift(t: number, seed = 0): number {
  return (
    Math.sin(t * 0.9 + seed * 12.9) * 0.5 +
    Math.sin(t * 0.31 + seed * 7.1 + 1.7) * 0.3 +
    Math.sin(t * 1.7 + seed * 3.3 + 4.2) * 0.2
  );
}

// ── Number formatting ────────────────────────────────────────────────────────
export function fmtCountUp(
  target: number | string,
  p: number,
  opts: { decimals?: number; prefix?: string; suffix?: string } = {}
): string {
  if (typeof target === 'string') return target;
  const { decimals = 0, prefix = '', suffix = '' } = opts;
  const eased = easeOutCubic(clamp01(p));
  const v = target * eased;
  const formatted = v.toFixed(decimals);
  return `${prefix}${formatted}${suffix}`;
}

/** Formats seconds as m:ss or h:mm:ss (for chapter timestamps). */
export function fmtTimestamp(totalSec: number): string {
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

export function splitSentences(text: string): string[] {
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
  const out: string[] = [];
  for (const s of restored) {
    if (out.length > 0 && s.split(/\s+/).length < 3 && out[out.length - 1].length < 90) {
      out[out.length - 1] += ' ' + s;
    } else {
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
export function landPulse(dt: number, riseMs = 66, decayMs = 160): number {
  if (dt < 0 || dt > riseMs + decayMs) return 0;
  if (dt <= riseMs) return 1 - easeOutCubic(dt / riseMs) * 0.25; // the held impact
  return (1 - easeInOutSine((dt - riseMs) / decayMs)) * 0.75;
}

/**
 * 100-JUDGE VISUAL AUDIT (defect D-21 — SQUASH AND STRETCH ONLY EXIST ON
 * FOOTFALLS): the film's real impacts — stamp slams, the % landing, bar
 * arrivals, dossier flaps — scaled with ZERO volume deformation, the
 * "single clearest cheap-work tell at hero moments". `impactSquash` is the
 * shared volume envelope every such impact now consumes: a volume-
 * preserving deform (the object flattens INTO its impact line, then
 * recovers through a stretch counter-bounce), keyed to dt = t − landT.
 *   0..130ms   the squash — sin(π·dt/130), full amp at 65ms
 *   130..360ms the recovery — a 0.32-amp stretch counter-bounce (the
 *              volume swings the other way, exactly like the walk's
 *              strike/push pair)
 * Zero at both ends and outside the window → pose/render continuity is
 * exact; pure f(dt), scrub-safe. Callers scale it: scaleX = 1 + k·sq,
 * scaleY = 1 − 1.3k·sq (volume preserved ≈ 1 + k − 1.3k < 1 by design —
 * the impact reads as mass arriving, not a balloon).
 */
export function impactSquash(dt: number): number {
  if (dt < 0 || dt > 360) return 0;
  if (dt <= 130) return Math.sin((dt / 130) * Math.PI);
  return -0.32 * Math.sin(((dt - 130) / 230) * Math.PI);
}

/**
 * PROGRAM D-1 (100-JUDGE VISUAL AUDIT — A slamStrike() GRAMMAR FOR ALL
 * IMPACTS): "Generalize walkStrike into slamStrike(t0, mass): 6% vertical
 * squash + 3% horizontal stretch over ~220ms with a 2-frame negative
 * overshoot. Volume deformation on impact is the single clearest
 * 'expensive animation' signal available in 2D."
 *
 * `slamStrike(dt, mass)` returns the impact factor k the caller applies as
 *   scaleX = 1 + 0.03 · k    scaleY = 1 − 0.06 · k
 * (volume-preserving: 1.03 × 0.94 ≈ 0.97 of rest at full k — mass arriving,
 * not a balloon). `mass` (0.5 light paper … 1.0 the house slam … 1.2 the
 * hero verdict) scales the amplitude, never the timing.
 *   dt 0..110ms    the strike — sin ease to full k (the hand/prop lands)
 *   dt 110..220ms  the settle — k decays to 0 (the ~220ms window)
 *   dt 220..330ms  the 2-frame negative overshoot — the volume swings past
 *                  rest the other way (−30%), then releases. Zero outside.
 * Pure f(dt), scrub-safe, exact zeros at every boundary — pose/render
 * continuity exact. The program's five named sites (stampCard, the %
 * landing, navGap bars, caseFiles dossier flap, wrapperMatrix card
 * arrivals) route through THIS grammar so every impact shares one law.
 */
export function slamStrike(dt: number, mass = 1): number {
  if (dt < 0 || dt > 330) return 0;
  if (dt <= 110) return mass * Math.sin((dt / 110) * Math.PI * 0.5);
  if (dt <= 220) return mass * Math.cos(((dt - 110) / 110) * Math.PI * 0.5);
  return -0.30 * mass * Math.sin(((dt - 220) / 110) * Math.PI);
}

/**
 * 100-JUDGE VISUAL AUDIT (defect D-23 — NO FOLLOW-THROUGH ON PROPS):
 * "cards land on easeOutCubic and stop dead". `landSettle` is the
 * follow-through half the objects were missing: a decaying 2-arc wobble
 * the caller applies as a ±dy settle (and optionally a ±0.3° rock) AFTER
 * the landing envelope completes. dt = t − landT:
 *   the object overshoots its rest by +amp·e^(−dt/260)·sin(2π·dt/260)
 *   — one visible up-bounce (~130ms after landing), one smaller
 *   counter-bounce (~260ms), settled to sub-0.1px by ~700ms.
 * Zero outside the window; pure f(t); the easeOutCubic arrival stays
 * untouched — the settle rides on top so continuity is exact.
 */
export function landSettle(dt: number): number {
  if (dt < 0 || dt > 700) return 0;
  return Math.exp(-dt / 260) * Math.sin((dt / 260) * 2 * Math.PI);
}

/**
 * 100-JUDGE VISUAL AUDIT (defect D-22 — ANTICIPATION SCOPED TO ONE SCENE
 * TYPE): the 700ms recoil ran on bigText only; stat numerals, bars and
 * chips entered with no wind-up anywhere else. `windUp` is the shared
 * pre-arrival counter-move: given the RAW entrance progress p (0..1,
 * before the ease), it returns the anticipation factor — the element
 * pulls AWAY from its landing (offset/scale/width terms multiply this)
 * for the first 22% of the window, then hands off to the arrival ease.
 *   p ∈ [0, 0.22) → sin(π·p/0.22)  (peak pull-back at p≈0.11)
 *   p ≥ 0.22      → 0 (the release — the arrival ease owns the rest)
 * Pure f(p), scrub-safe, zero at both ends.
 */
export function windUp(p: number): number {
  if (p <= 0 || p >= 0.22) return 0;
  return Math.sin((p / 0.22) * Math.PI);
}
