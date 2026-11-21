/**
 * The score, as DATA — single source of truth for the three bed renderers:
 * the deterministic DSP fallback in audio.ts, the MIDI exporter
 * (midi-export.ts), and the offline soundfont bed render (sf2.ts +
 * scripts/render-bed.mjs).
 *
 * VAULT NOIR v3 — THE EVERGREEN FUND SCORE. A completely new composition
 * for the new film (the previous score was a bright C-major/92-BPM felt
 * piano; retention died when every video sounds the same). This one is:
 *   • D MINOR at 76 BPM — institutional gravity, half the tempo feel;
 *   • warm string pad + felt piano + DEEP fingered bass + a GLASS BELL
 *     voice (vibraphone) for the vault's cold shimmer;
 *   • progressions built on Dm9 / Bbmaj9 / Fmaj9 / Cadd9 / Gm7 — the
 *     "question → hold → answer" arc the script's argument follows;
 *   • a new show theme whose opening gesture D5→C5→Bb4→A4 is the brand
 *     chime's falling-fourth motif (the liquidity draining DOWN, then the
 *     answer rising back to D).
 *
 * Pure data + pure functions. No browser APIs, no audio buffers — runs
 * identically in the studio page, the render harness, and node scripts.
 */

import { seededRandom } from './easing';

export const SR_BGM = 24000;
export const BPM = 76;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
export const LOOP_BARS = 4;
export const LOOP_DUR = BAR * LOOP_BARS; // ≈ 12.63 s
export const LOOP_LEN = Math.round(LOOP_DUR * SR_BGM);

// ── Note vocabulary ──────────────────────────────────────────────────────────

const NOTE_VALUES: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
  'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
};

/** 'C3' → MIDI 48 (C4 = 60). Unknown names fall back to 60. */
export function midiOf(note: string): number {
  const m = note.match(/^([A-G]#?)(-?\d)$/);
  if (!m) return 60;
  return NOTE_VALUES[m[1]] + (Number(m[2]) + 1) * 12;
}

export const CHORDS: Record<string, { root: string; notes: string[] }> = {
  // D minor tonic — the film's home key
  Dm9:    { root: 'D2',  notes: ['D3', 'A3', 'C4', 'E4'] },
  // the subdominant hold — the vault's mass
  Bbmaj9: { root: 'Bb1', notes: ['Bb2', 'F3', 'D4', 'A4'] },
  // the relative major — the bull case's daylight
  Fmaj9:  { root: 'F2',  notes: ['F3', 'C4', 'A3', 'G4'] },
  // the dominant suspension — the open question
  Cadd9:  { root: 'C2',  notes: ['C3', 'G3', 'E4', 'D4'] },
  // the minor dominant — unease under the surface
  Gm7:    { root: 'G2',  notes: ['G2', 'Bb3', 'D4', 'F4'] },
  // plain triads for the brighter moods
  F:      { root: 'F2',  notes: ['F2', 'C3', 'A3', 'E4'] },
  Dm:     { root: 'D2',  notes: ['D2', 'A2', 'F3', 'C4'] },
  Bb:     { root: 'Bb1', notes: ['Bb1', 'F2', 'D3', 'Bb3'] },
  C:      { root: 'C2',  notes: ['C2', 'G2', 'E3', 'D4'] },
};

export type Mood = 'sparse' | 'bright' | 'reflective' | 'curious' | 'lift' | 'resolve';

export const PROGRESSIONS: Record<Mood, string[]> = {
  sparse:     ['Dm9', 'Bbmaj9', 'Fmaj9', 'Cadd9'],
  bright:     ['Bb', 'F', 'C', 'Dm'],
  reflective: ['Bbmaj9', 'Gm7', 'Dm9', 'Cadd9'],
  curious:    ['Gm7', 'Bbmaj9', 'Cadd9', 'Cadd9'],
  lift:       ['Gm7', 'Bb', 'C', 'Dm'],
  resolve:    ['Bbmaj9', 'Cadd9', 'Dm9', 'Dm9'],
};

/** All distinct moods used by the chapter map (bed render covers these). */
export const MOODS: Mood[] = ['sparse', 'bright', 'reflective', 'curious', 'lift', 'resolve'];

// The 9-chapter mood journey, remapped for the Evergreen edit. Order:
// ch1 sparse (the number), ch2 bright (the boom), ch3 reflective (four
// wrappers), ch4 curious (the plumbing), ch5 lift (three cases), ch6
// reflective (valuation/fees), ch7 curious (the bull case), ch8 lift
// (the audit), ch9 resolve (the system).
export const CHAPTER_MOODS: Mood[] = [
  'sparse', 'bright', 'reflective', 'curious', 'lift', 'reflective', 'curious', 'lift', 'resolve',
];

export function levelFor(mood: Mood, vol: number): number {
  const base = 0.5 * vol;
  switch (mood) {
    case 'sparse': return base * 0.6;
    case 'reflective': return base * 0.85;
    case 'curious': return base * 0.9;
    case 'bright': return base;
    case 'lift': return base * 1.1;
    case 'resolve': return base * 0.95;
  }
}

// ── The score ────────────────────────────────────────────────────────────────

export type VoiceName = 'pad' | 'piano' | 'bass' | 'shaker' | 'kick' | 'bell';

/**
 * One played note. `vel`/`pan` carry absolute DSP velocities; the DSP
 * fallback renders them 1:1 and `midiVelocityFor()` maps them to musical
 * MIDI velocities for the soundfont/MIDI renderers.
 */
export interface ScoreNote {
  voice: VoiceName;
  midi: number;
  startSec: number;
  durSec: number;
  vel: number;
  pan: number;
}

/**
 * General MIDI mapping for the soundfont render: glass bell → Vibraphone,
 * felt-piano arpeggio → Acoustic Grand, warm pad → String Ensemble, deep
 * bass → Fingered Electric Bass, shaker/kick → the GM drum kit (bank 128).
 * The engine's own motif chimes and whooshes are NOT part of this map —
 * they stay hand-drawn DSP on top of the bed.
 */
export const GM_MAP: Record<VoiceName, { bank: number; program: number; drum: boolean }> = {
  pad:   { bank: 0,   program: 48, drum: false }, // String Ensemble 1
  piano: { bank: 0,   program: 0,  drum: false }, // Acoustic Grand
  bass:  { bank: 0,   program: 33, drum: false }, // Electric Bass (finger)
  bell:  { bank: 0,   program: 11, drum: false }, // Vibraphone — the glass voice
  shaker:{ bank: 128, program: 0,  drum: true  }, // GM kit · closed hi-hat (key 42)
  kick:  { bank: 128, program: 0,  drum: true  }, // GM kit · bass drum 1 (key 36)
};

/** Percussion keys for the drum voices (ignored for melodic voices). */
export const DRUM_KEYS: Record<'shaker' | 'kick', number> = {
  shaker: 42, // Closed Hi-Hat
  kick: 36,   // Bass Drum 1
};

/** DSP score velocity → musical MIDI velocity (1..127), per voice. */
export function midiVelocityFor(n: ScoreNote): number {
  let v: number;
  switch (n.voice) {
    case 'pad':    v = 30 + n.vel * 90;  break; // soft string bed
    case 'piano':  v = 40 + n.vel * 260; break; // expressive arpeggio
    case 'bell':   v = 30 + n.vel * 240; break; // the glass voice
    case 'bass':   v = 45 + n.vel * 180; break;
    case 'shaker': v = 25 + n.vel * 350; break;
    case 'kick':   v = 50 + n.vel * 200; break;
  }
  return Math.max(1, Math.min(127, Math.round(v)));
}

/**
 * One 4-bar loop of a mood as note events. Deterministic per (mood,
 * variant). The rng call order is preserved EXACTLY from the previous
 * film's generator (shaker-noise burn → per-step arp draws), so the
 * level-match harness compares like with like.
 */
export function moodScore(mood: Mood, variant: number): ScoreNote[] {
  const notes: ScoreNote[] = [];
  const rng = seededRandom(variant * 977 + mood.length * 131 + 17);
  const prog = PROGRESSIONS[mood];
  const eighth = BEAT * 0.5;

  // the DSP renderer draws its shaker noise from the same seeded stream
  // (2880 draws per 0.12 s hit); consume those draws here in the same
  // order so the arpeggio rolls below see the identical stream state.
  const NOISE_DRAWS_PER_HIT = Math.round(0.12 * SR_BGM);
  const burnShakerNoise = (hits: number) => {
    for (let h = 0; h < hits; h++) for (let i = 0; i < NOISE_DRAWS_PER_HIT; i++) rng();
  };

  for (let bar = 0; bar < LOOP_BARS; bar++) {
    const barT = bar * BAR;
    const chordName = prog[bar % 4];
    const chord = CHORDS[chordName];

    // pad — full bar, every chord tone (lv · 0.34)
    chord.notes.forEach((n) => {
      notes.push({ voice: 'pad', midi: midiOf(n), startSec: barT, durSec: BAR * 1.02, vel: 0.34, pan: 0 });
    });
    // bass — the root, then the fifth on beat 3 (the slow pulse; the old
    // score's static whole-bar root is what made it feel like a drone)
    notes.push({ voice: 'bass', midi: midiOf(chord.root), startSec: barT, durSec: BAR * 0.55, vel: 0.44, pan: 0 });
    notes.push({ voice: 'bass', midi: midiOf(chord.root) + 7, startSec: barT + BEAT * 2, durSec: BAR * 0.42, vel: 0.30, pan: 0 });

    // drum bed per mood (same hit placement + gains as the DSP score)
    if (mood === 'bright' || mood === 'lift') {
      notes.push({ voice: 'kick', midi: DRUM_KEYS.kick, startSec: barT, durSec: 0.3, vel: 0.4, pan: 0 });
      notes.push({ voice: 'kick', midi: DRUM_KEYS.kick, startSec: barT + BEAT * 2, durSec: 0.3, vel: 0.32, pan: 0 });
      for (let e = 0; e < 8; e++) {
        const accent = e % 2 === 0 ? 0.9 : 0.5;
        notes.push({ voice: 'shaker', midi: DRUM_KEYS.shaker, startSec: barT + e * eighth, durSec: 0.12, vel: 0.34 * accent, pan: 0 });
      }
      burnShakerNoise(8);
    } else if (mood === 'curious') {
      notes.push({ voice: 'shaker', midi: DRUM_KEYS.shaker, startSec: barT + BEAT * 2, durSec: 0.12, vel: 0.26, pan: 0 });
      burnShakerNoise(1);
    }

    // felt-piano arpeggio — the melody of the bed. At 76 BPM the eighths
    // breathe; densities drop one step from the old film so the vault
    // feels cavernous rather than busy.
    const arpNotes = [...chord.notes.slice(1), chord.notes[1]];
    const density = mood === 'sparse' ? 0.32 : mood === 'reflective' ? 0.5 : 0.72;
    for (let step = 0; step < 8; step++) {
      if (rng() < density) {
        const ni = (step + bar + variant) % arpNotes.length;
        let note = arpNotes[ni];
        if (rng() < 0.15) {
          note = note.replace(/(\d)$/, (d) => String(Number(d) + 1));
        }
        const swing = (rng() - 0.5) * 0.03;
        const vel = 0.42 + rng() * 0.26;
        const pan = (rng() - 0.5) * 1.2;
        const startSec = Math.max(0, barT + step * eighth + swing);
        notes.push({ voice: 'piano', midi: midiOf(note), startSec, durSec: 2.6, vel, pan });
      }
    }

    // THE GLASS BELL — the vault's signature voice. Two high accents per
    // bar (probabilistic, wide-panned, long decay): the cold shimmer the
    // previous film never had. Drawn from the same rng AFTER the arp loop
    // so the DSP fallback (which reads this score) stays deterministic.
    if (rng() < (mood === 'sparse' || mood === 'reflective' ? 0.75 : 0.45)) {
      const bn = chord.notes[2 + (variant % 2)];
      const bMidi = midiOf(bn) + 12;
      const bSwing = (rng() - 0.5) * 0.05;
      const bVel = 0.16 + rng() * 0.10;
      const bPan = (rng() - 0.5) * 1.6;
      notes.push({ voice: 'bell', midi: bMidi, startSec: Math.max(0, barT + BEAT * (1 + (variant % 3)) + bSwing), durSec: 3.2, vel: bVel, pan: bPan });
    }
    if (rng() < 0.35) {
      const bn2 = chord.notes[3];
      const b2 = midiOf(bn2) + 12;
      const b2Vel = 0.10 + rng() * 0.08;
      const b2Pan = (rng() - 0.5) * 1.6;
      notes.push({ voice: 'bell', midi: b2, startSec: Math.max(0, barT + BEAT * 2.5), durSec: 2.8, vel: b2Vel, pan: b2Pan });
    }
  }

  return notes;
}

/** Absolute DSP velocities for a mood loop at a given mix volume. */
export function scaledScore(mood: Mood, variant: number, vol: number): ScoreNote[] {
  const lv = levelFor(mood, vol);
  return moodScore(mood, variant).map((n) => ({ ...n, vel: n.vel * lv }));
}

// ── The SHOW THEME — 8 bars, stated three times ────────────────────────────
// The theme's opening gesture QUOTES the brand chime (D5→C5→Bb4 — the
// falling third-and-step the audience hears on every chapter card), then
// answers it with the rising F→G→A that resolves home to D. D-minor
// relative harmony, 76 BPM, fully deterministic — pure data, no rng.

export const THEME_BARS = 8;
export const THEME_DUR = BAR * THEME_BARS; // ≈ 25.3 s

/** The theme's own progression — minor question → major answer arc. */
const THEME_PROGRESSION = ['Dm9', 'Bbmaj9', 'Fmaj9', 'Cadd9', 'Dm9', 'Bbmaj9', 'Gm7', 'Cadd9'];

/** [midi, bar, beat, durBeats, vel, pan] — the melody, phrase by phrase. */
const THEME_MELODY: Array<[number, number, number, number, number, number]> = [
  // phrase 1 — the brand chime's fall: D5 C5 Bb4 (the drain)
  [74, 0, 0, 2, 0.46, -0.15],
  [72, 0, 2, 1.5, 0.42, 0.20],
  [70, 1, 0, 2.5, 0.44, 0.10],
  // phrase 1 answer — A4 settles onto the Bb hold
  [69, 1, 3, 1, 0.36, -0.20],
  // phrase 2 — the rise (the question opens): F4 G4 A4
  [65, 2, 0, 1, 0.40, -0.10],
  [67, 2, 1, 1, 0.38, 0.20],
  [69, 2, 2, 2, 0.42, 0.00],
  // lift: C5 D5
  [72, 3, 0, 1.5, 0.40, -0.20],
  [74, 3, 1.5, 2.5, 0.42, 0.10],
  // phrase 3 — the question returns higher: F5 E5? no — D5 C5 over Dm
  [74, 4, 0, 2, 0.46, -0.10],
  [72, 4, 2, 1, 0.40, 0.20],
  [70, 4, 3, 1, 0.38, -0.15],
  // settles: A4 G4 over Bb
  [69, 5, 0, 2, 0.44, 0.10],
  [67, 5, 2, 2, 0.38, -0.20],
  // phrase 4 — the walk home over Gm7: Bb4 A4 G4
  [70, 6, 0, 2, 0.42, 0.00],
  [69, 6, 2, 0.5, 0.36, 0.20],
  [67, 6, 2.5, 0.5, 0.38, 0.25],
  // resolution — D5 held over Cadd9 → the film's home
  [74, 7, 0, 4, 0.50, 0.00],
];

/**
 * The theme as note events, truncated to `bars` (2 = the signature quote,
 * 4 = the A-phrase statement, 8 = the full arc). Melody in the felt-piano
 * voice, soft pad chords, single-note bass, off-beat shaker in the back
 * half only — the theme is a foreground gesture over the bed, never a
 * second bed.
 */
export function themeScore(bars: number = THEME_BARS): ScoreNote[] {
  const notes: ScoreNote[] = [];
  const nBars = Math.max(1, Math.min(THEME_BARS, bars));
  for (let bar = 0; bar < nBars; bar++) {
    const barT = bar * BAR;
    const chord = CHORDS[THEME_PROGRESSION[bar]];
    chord.notes.forEach((n) => {
      notes.push({ voice: 'pad', midi: midiOf(n), startSec: barT, durSec: BAR * 1.02, vel: 0.10, pan: 0 });
    });
    notes.push({ voice: 'bass', midi: midiOf(chord.root), startSec: barT, durSec: BAR * 0.92, vel: 0.18, pan: 0 });
    if (bar >= 4) {
      notes.push({ voice: 'shaker', midi: DRUM_KEYS.shaker, startSec: barT + BEAT * 1.5, durSec: 0.12, vel: 0.18, pan: 0 });
      notes.push({ voice: 'shaker', midi: DRUM_KEYS.shaker, startSec: barT + BEAT * 3.5, durSec: 0.12, vel: 0.13, pan: 0 });
    }
    // one glass bell pickup per bar in the back half — the vault shimmer
    if (bar >= 2) {
      const bMidi = midiOf(chord.notes[3]) + 12;
      notes.push({ voice: 'bell', midi: bMidi, startSec: barT + BEAT * 3, durSec: 3.0, vel: 0.14, pan: 0.35 });
    }
  }
  for (const [midi, bar, beat, durBeats, vel, pan] of THEME_MELODY) {
    const startSec = bar * BAR + beat * BEAT;
    if (startSec >= nBars * BAR - 0.05) continue;
    notes.push({ voice: 'piano', midi, startSec, durSec: durBeats * BEAT, vel, pan });
  }
  return notes;
}

/** The coda — bar 8 alone (the held D5 over Cadd9): appended after a 4-bar
 *  statement so the end screen both quotes the theme AND resolves it. */
export function themeCoda(): ScoreNote[] {
  return themeScore(THEME_BARS).filter((n) => n.startSec >= 7 * BAR - 0.05)
    .map((n) => ({ ...n, startSec: n.startSec - 7 * BAR }));
}
