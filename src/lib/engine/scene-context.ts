/** Shared scene drawing context. */
import { BeatSpec } from './script-data';
import { window4 } from './easing';
import { AMP } from './perception';

export interface SceneCtx {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  /** ms since the start of this beat */
  beatT: number;
  /** ms since the start of the scene group (beats sharing sceneKey) */
  t: number;
  /** PHASE-4 (report §11 Phase 4): ms since the start of the sceneKey run
   *  (every beat sharing this sceneKey, from its first beat). The 12s cap
   *  re-splits long runs into new groups whose gt resets by design (camera,
   *  exit, bokeh machinery) — entrance alphas keyed to the group clock
   *  replayed the host's fade mid-scene at every such seam. The scene clock
   *  never resets inside the run: a character arrives ONCE per scene. */
  sceneT: number;
  /** scene group duration ms */
  d: number;
  /** scene group progress 0..1 */
  p: number;
  /** current beat progress 0..1 */
  beatP: number;
  /** current beat's scene props */
  s: Record<string, any>;
  beat: BeatSpec;
  speaking: boolean;
  /** word onset times local to the beat (ms) */
  wordTimes: number[];
  /** 100-JUDGE AUDIT (Part 8.2): the word TEXTS aligned 1:1 with wordTimes
   *  (same filter, same order) — the viseme estimator consumes the pair to
   *  shape the mouth per the active word. Beat-local, like wordTimes. */
  wordTexts: string[];
  /** P1-6 (report §12.6): word onset times local to the SCENE GROUP (ms) —
   *  the same onsets as wordTimes, in the g.t clock that poseAt consumes. */
  gWordTimes: number[];
  /** P1-6: the film-wide sentence currently being spoken (or last started):
   *  its manifest line id, the previous sentence's id, and ms since it began.
   *  poseAt keys the talk cycle to SENTENCES, not the wall clock. */
  sentenceId?: string;
  prevSentenceId?: string;
  sentenceT?: number;
  /** P2 U14: the active sentence's total duration — the long-hold
   *  interrupt's key (sentences >= 3.2s in chapters 1-3 fire the take). */
  sentenceDurMs?: number;
  channelName: string;
  nextVideoTitle: string;
  /** v8: this chapter's ambient wash tone (the chapter color journey).
   *  Scenes pass this to paintBg() so a 20-minute film travels through
   *  color instead of one flat white. Optional for backward compat. */
  chapterTone?: 'up' | 'down' | 'gold' | 'neutral';
  /** 100-JUDGE PANEL / Phase 4 item 4.3 — the beat's chapter index (0-based).
   *  The value-plane rotation keys to it (theme.valuePlaneFor), so a scene's
   *  material alternates with the chapter rhythm without per-beat script
   *  changes. */
  chapterIdx: number;
  /** 100-JUDGE VISUAL AUDIT (defect D-07 — ONE FRAMING HELD FOR LONG RUNS):
   *  this beat's index WITHIN its sceneKey run (0 = the run's first beat).
   *  The long-run scenes (caseFiles, auditChecklist, wrapperMatrix) use it
   *  as the deterministic key of a framing rotation — the same scene
   *  re-blocks itself every few beats instead of holding one layout for
   *  9-15 consecutive beats. Computed by the director; scrub-safe. */
  runIdx: number;
  /** PROGRAM D-4 (SECONDARY MOTION ON THE WORLD): the beat's walk phase
   *  0..1 while a walk owns the staging (undefined when standing) — the
   *  bg() helpers pass it to paintBg so the desk set pieces flutter
   *  under the stride. Computed by the director from the beat's own
   *  walk props; scrub-safe. */
  walkPhase?: number;
}

export type SceneDrawer = (g: SceneCtx) => void;

// ── PHASE-0 (panel report §7-D2): the caption-vs-headline dedup registry ────
// The scene drawer DECLARES the big on-screen headline text the moment it
// draws it (hostSceneV2); drawCaptions consults this registry and stands
// down for any karaoke window whose words already sit on screen in the
// serif. The director resets the registry per frame, so a headline only
// ever suppresses captions on ITS OWN frame — scrub-safe, deterministic.
const DEDUP_THRESHOLD = 0.6; // ≥60% of the window's words on screen = duplicate

let headlineWords: string[] = [];

const normWord = (w: string): string => w.toLowerCase().replace(/[^a-z0-9%]/g, '');

export function resetHeadlineDedup(): void {
  headlineWords = [];
}

export function declareOnScreenHeadline(text: string): void {
  const words = text.split(/\s+/).map(normWord).filter(Boolean);
  if (words.length) headlineWords = words;
}

export function captionDuplicatesHeadline(windowWords: string[]): boolean {
  if (!headlineWords.length || !windowWords.length) return false;
  const ws = windowWords.map(normWord).filter(Boolean);
  if (!ws.length) return false;
  const head = new Set(headlineWords);
  let hits = 0;
  for (const w of ws) if (head.has(w)) hits++;
  return hits / ws.length >= DEDUP_THRESHOLD;
}

// ── PANEL-12 / P2-6 (report §14.6): REACTION SHOTS ───────────────────────────
// The missing emotional grammar: three held-expression beats per film — on
// the twist (c8-fund), the paradox resolve (c7-paradox) and the final
// takeaway (c9-three). The camera pushes toward the host's head zone while
// faceScale renders at 1.4 and the talk envelope pauses. Keyed by sceneKey
// (NOT type — the takeaways chapters have four groups and only the payoff
// one gets the beat).
//
// `amp` is the camera push (calibrated per scene so the collision guard's
// exact-camera pass stays clean — see the tuning notes in director.ts).
// `px/py` is the push pivot: the host's chest zone, chosen so the head
// RISES into frame while the feet stay clear of the caption band.
export interface ReactionSpec {
  atFrac: number;
  durMs: number;
  amp: number;
  px: number;
  py: number;
}
export const REACTIONS: Record<string, ReactionSpec> = {
  // U3/D23 (STANDARD MARKET VISUAL REVIEW — REACTION CLOSE-UPS ON THE
  // FILM'S REAL BEATS): the registry re-keys to the film's actual twist,
  // paradox-resolve and final-takeaway sceneKeys — the shipped keys
  // (c7-paradox / c8-fund / c9-three) belonged to a previous film's
  // script and matched NOTHING in this timeline, so the reaction
  // machinery (camera push, DOF, veil, hero take) NEVER fired once.
  // The scene drawers run the hero close-up staging (rig 2.2-3.3,
  // faceScale 1.8) inside these windows; the director's push/veil/DOF
  // consume the SAME clocks below.
  //
  // ── U-17 (100-JUDGE VISUAL AUDIT — UN-RATION THE CLOSE-UP): the audit's
  // arithmetic — "currently used three times in 126 beats" — convicted the
  // ration. The reaction grammar is the CHEAPEST premium shot in the engine,
  // and it now covers the EIGHT highest-stakes beats: every chapter pivot
  // plus the twist. Windows stay at AMP.reactionWindowMs (1600 — the audit's
  // 1.6s cap); amplitudes keep the certified per-family calibration
  // (bigText 0.34, stampCard 0.30-0.32 — the wide-reading-column scenes run
  // gentler and let the face carry the emotion; the guard sweep referees).
  'c1-question': { atFrac: 0.3, durMs: AMP.reactionWindowMs, amp: AMP.reactionAmp.paradox, px: 1390, py: 560 },  // ch1 pivot — "the exit button works — at the size you need?"
  'c2-launchcount': { atFrac: 0.3, durMs: AMP.reactionWindowMs, amp: 0.30, px: 620, py: 560 },                  // ch2 pivot — "A LAUNCH COUNT — not assets"
  'c3-contract': { atFrac: 0.3, durMs: AMP.reactionWindowMs, amp: 0.30, px: 620, py: 560 },                     // ch3 pivot — "COMPARE THE CONTRACT"
  'c4-trade': { atFrac: 0.3, durMs: AMP.reactionWindowMs, amp: AMP.reactionAmp.paradox, px: 1390, py: 560 },    // THE TWIST — "Not a contradiction. It is the trade."
  'c5-both': { atFrac: 0.3, durMs: AMP.reactionWindowMs, amp: AMP.reactionAmp.fund, px: 1390, py: 560 },        // the paradox resolve — "Both — at different dates."
  'c6-transfer': { atFrac: 0.3, durMs: AMP.reactionWindowMs, amp: 0.30, px: 620, py: 560 },                     // ch6 pivot — "NAV MOVES VALUE"
  'c7-correct': { atFrac: 0.3, durMs: AMP.reactionWindowMs, amp: AMP.reactionAmp.paradox, px: 1390, py: 560 },  // ch7 pivot — "An efficient implementation tool"
  'c9-window': { atFrac: 0.32, durMs: AMP.reactionWindowMs, amp: AMP.reactionAmp.three, px: 620, py: 560 },     // the final takeaway — "5% ≠ YOUR EXIT"
};

/**
 * The reaction envelope 0..1 for this frame — a pure function of
 * (sceneKey, group time, group duration), so the camera push in
 * director.cameraV2 and the face/talk changes in the scene drawer key off
 * the SAME clock and can never drift apart. 320ms ease in / hold / 320ms
 * ease out; the window clamps to stay inside the group.
 */
export function reactionAt(sceneKey: string, gt: number, d: number): number {
  const spec = REACTIONS[sceneKey];
  if (!spec) return 0;
  const dur = Math.min(spec.durMs, Math.max(900, d * 0.3));
  let start = Math.max(1400, d * spec.atFrac);
  start = Math.min(start, Math.max(800, d - dur - 250));
  return window4(gt, start, start + 320, start + dur - 320, start + dur);
}

/**
 * 100-JUDGE PANEL / Phase 1 item 3 — TAKE GRAMMAR (report §6 Phase 1):
 * the reaction window's absolute start time on the SAME clock
 * reactionAt() consumes — so the take() helper (the 2-frame hold +
 * 20% overshoot + blink + double-bounce) can fire at the window's own
 * start and the two envelopes can never drift apart. Returns -1 when
 * the scene has no reaction window (the caller skips the take).
 */
export function reactionStart(sceneKey: string, gt: number, d: number): number {
  const spec = REACTIONS[sceneKey];
  if (!spec) return -1;
  const dur = Math.min(spec.durMs, Math.max(900, d * 0.3));
  let start = Math.max(1400, d * spec.atFrac);
  start = Math.min(start, Math.max(800, d - dur - 250));
  // the take fires only while the window is actually live at this gt
  return gt >= start && gt <= start + dur ? start : -1;
}

// ── U4 (STANDARD MARKET VISUAL REVIEW — defect D7, ONE FACE PER VOCAL
// MODE): the expression rig exists but the script overrode it exactly 4
// times in 116 beats, so the film shipped ONE worried face for 27
// minutes. Every beat now INHERITS an expression from its voStyle;
// an explicit `expression:` prop still wins. One map, whole film.
export const VO_STYLE_EXPRESSION: Record<string, string> = {
  calm: 'calm',          // flat brows — the composed read
  neutral: 'neutral',    // the quiet default
  urgent: 'urgent',      // raised brows + wide eyes
  reveal: 'reveal',      // sclera + dilated pupils (the aha register)
  quote: 'quote',        // the warm set
};

export function beatExpressionOf(beat: import('./script-data').BeatSpec): string {
  const explicit = beat.scene?.expression as string | undefined;
  return explicit ?? VO_STYLE_EXPRESSION[beat.voStyle ?? 'neutral'] ?? 'neutral';
}
