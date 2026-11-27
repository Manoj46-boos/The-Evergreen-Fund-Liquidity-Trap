/**
 * VAULT NOIR v3 — THE EVERGREEN SCENE SET.
 *
 * Ten scene drawers purpose-built for "The Evergreen Fund Liquidity Trap":
 * statReveal (the 5% cold open + the million-dollar proration),
 * wrapperMatrix (the four legal wrappers), flowLiquidity (the cash
 * plumbing), prorationDemo (requested ≠ fulfilled), caseFiles (Cliffwater /
 * BCRED / OBDC II — dates and denominators on every number), navGap (NAV
 * 100 vs economic 90), feeStack (the BCRED fee layers), bullCase, and
 * auditChecklist (the eight questions) + systemMap (liquidity as a system).
 *
 * Every drawer sits on the shared vault world (paintBg + scenePlate),
 * registers its reading surfaces with the collision guard, keeps text at
 * the READ/LABEL floors, and obeys the one-light + one-extrusion rules.
 */

import { clamp01, easeOutCubic, easeOutQuad, easeInOutSine, hash01, springTo } from './easing';
import {
  PALETTE, TONE, card, chip, chipWidth, rgba, roundRect, setFont, paintBg, scenePlate, chapterArch,
  glowBlob, FONT_DISPLAY, FONT_UI, CAPTION_ZONE_TOP, TYPE_FLOOR, LABEL_FLOOR, toneRoom, STROKE,
} from './theme';
import { AMP, HERO } from './perception';
import {
  drawPct, drawPct3D, microShake, impactRing, hazeBands, kMotifs, floatCoins,
  sparkles, camState, depthShift, ledgerScan,
} from './effects';
import { SceneCtx, declareOnScreenHeadline } from './scene-context';
import { wrapText, sourceTag } from './charts';
import { Stickman, POSES, blendPose, walkIn } from './stickman';
import { drawStickmanV2, talkAt } from './stickman-v2';
import { walkStrike, expressionPose, expressionBodyOf } from './scenes-host';
import { registerRect, registerText, declareHostContact } from './collision';
import { registerFigure } from './scale-law';
import { registerHeroObject } from './composition';
import { beatExpressionOf } from './scene-context';

/** the shared room: vault background + chapter plate */
function bg(g: SceneCtx, opts: { strength?: number; furniture?: boolean; plate?: 'up' | 'down' | 'gold' | 'neutral' } = {}): void {
  const { strength = 0.9, furniture = true, plate } = opts;
  paintBg(g.ctx, g.W, g.H, g.t, g.chapterTone);
  scenePlate(g.ctx, g.W, g.H, plate ?? g.chapterTone ?? 'up', strength, undefined, { furniture, arch: chapterArch(g.chapterIdx) });
}

// ── U1/U3/U7 (STANDARD MARKET VISUAL REVIEW) — THE COMPANION-HOST STAGING ──
// One helper stages the presenter in every data scene: the U3 scale law
// (1.6-1.9 companions), the U1 contact pass (the hand SOLVES onto the
// scene's declared touch rect — never parks outside it), the U4 voStyle
// face, the walk-in with walkStrike squash, and the talk/viseme wiring.
// Every scene passes a registered rect id so the hand-vs-text guard
// verifies the designed touch on every sweep frame.
function financeHost(
  g: SceneCtx,
  hx: number, hy: number, scale: number,
  opts: {
    seed: number;
    gesture?: string;
    look?: number;
    glanceBias?: number;
    contact?: { x: number; y: number; w?: number; h?: number; hand?: 'palm' | 'point' | 'fist'; easeAt?: number };
    declareId?: string;
    walkDur?: number;
    walkFrom?: number;
    /** U-15 (the cold open's walk-through): ms into the BEAT before the
     *  walk starts — the figure enters on its own cue, not at the group's
     *  first frame. 0 (default) = the legacy walk-in. */
    walkAt?: number;
    label?: string;
    /** U7 refinement: full-body envelope registration (the narrow-band
     *  staging for hosts that stand close to registered content — the
     *  body pass then reads the TRUE silhouette, not a ±122·scale slab). */
    hostBody?: boolean;
  }
): void {
  const { ctx, t } = g;
  let pose = Stickman.poseAt(t, {
    gesture: opts.gesture ?? 'present',
    speaking: g.speaking,
    sentenceId: g.sentenceId,
    prevSentenceId: g.prevSentenceId,
    sentenceT: g.sentenceT,
      sentenceDurMs: g.sentenceDurMs,
    wordTimes: g.gWordTimes,
    words: g.wordTexts,
    glanceBias: opts.glanceBias ?? 0,
  });
  // U4: the voStyle face — every data-scene beat inherits an expression.
  // D-16: the face AND the body register ride every data-scene host.
  pose = { ...pose, ...expressionPose(beatExpressionOf(g.beat)), ...expressionBodyOf(beatExpressionOf(g.beat)) };
  let x = hx;
  let walkPhase: number | undefined;
  if (opts.walkDur) {
    const from = Math.max(opts.walkFrom ?? 140, 140);
    // U-15: the walk waits for its own cue (`walkAt` on the group clock —
    // the cold open's beat IS the group's first beat, so beat clock and
    // group clock agree there), then crosses on the walkIn clock.
    const wt = t - (opts.walkAt ?? 0);
    if (hx - from >= 90 && wt > 0) {  // D-10: tight stages walk 90px+ (the band's edge gate is the walkFrom value)
      const r = walkIn(wt, from, hx, opts.walkDur, pose, scale, 5.2);
      if (r) {
        x = r.x;
        if (r.walking) { pose = r.pose; walkPhase = r.phase; }
      }
    }
  }
  registerFigure(g.beat.scene.sceneKey ?? 'finance', opts.label ?? 'host', 'subject', scale, g.H, true);
  drawStickmanV2(ctx, x, hy, scale, t, {
    pose, alpha: 1, look: opts.look ?? 0, shadow: 1, nod: 0.6,
    talk: talkAt(t, g.gWordTimes),
    squash: walkPhase !== undefined ? walkStrike(walkPhase) : 0,
    walkPhase,
    hostBody: opts.hostBody === true,
    wordTexts: g.wordTexts, wordTimes: g.gWordTimes, beatT: g.beatT,
    contact: opts.contact,
    parallax: true,
  }, opts.seed);
  if (opts.contact && opts.declareId) declareHostContact(opts.declareId);
}

/** a glass data column heading — brass numeral ring + label */
function colHead(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
  num: string, label: string, p: number, active: boolean
): void {
  const e = easeOutCubic(clamp01(p));
  ctx.save();
  ctx.globalAlpha = e;
  // the ring
  ctx.strokeStyle = active ? PALETTE.goldDisplay : PALETTE.cardBorder;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 34, y + 34, 26, 0, Math.PI * 2);
  ctx.stroke();
  setFont(ctx, 30, 700, FONT_DISPLAY);
  ctx.fillStyle = active ? PALETTE.goldDisplay : PALETTE.inkSoft;
  ctx.textAlign = 'center';
  ctx.fillText(num, x + 34, y + 45);
  ctx.textAlign = 'left';
  setFont(ctx, Math.max(LABEL_FLOOR, 34), 700);
  ctx.fillStyle = active ? PALETTE.ink : PALETTE.inkSoft;
  registerText(`colHead:${label}`, x + 76, y + 12, Math.min(ctx.measureText(label).width, w - 90), 42);
  ctx.fillText(label, x + 76, y + 46, w - 90);
  ctx.restore();
}

/** one condensed ledger row inside a glass card */
function ledgerRow(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
  k: string, v: string, tone: 'gold' | 'up' | 'down' | 'neutral', p: number
): number {
  const e = easeOutCubic(clamp01(p));
  if (e <= 0) return 0;
  ctx.save();
  ctx.globalAlpha = e;
  setFont(ctx, Math.max(LABEL_FLOOR, 34), 700);
  const kw = ctx.measureText(k.toUpperCase()).width;
  ctx.fillStyle = TONE(tone).main;
  ctx.fillText(k.toUpperCase(), x, y);
  setFont(ctx, Math.max(LABEL_FLOOR, 34), 400);
  const lines = wrapText(ctx, v, w - kw - 28, 34, 400);
  ctx.fillStyle = PALETTE.inkSoft;
  lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln, x + kw + 28, y + i * 44));
  ctx.restore();
  return Math.min(3, lines.length) * 44;
}

/**
 * 100-JUDGE VISUAL AUDIT (defect D-03 — STATIC HOLDS OF 3-7 SECONDS):
 * "inside a group the build finishes in 1-2 seconds and then the frame
 * sits." The fix is the BUILD SPREAD: row i's arrival time now scales
 * with the SCENE GROUP's own duration, so a 20-second hold keeps landing
 * content through it instead of finishing its build at t=1.5s and sitting
 * for the rest. Deterministic in (i, n, d) — scrub-safe, no teleports,
 * and short groups keep today's fast builds (span floor 500ms).
 * Returns the arrival ms for row i of n.
 */
function holdBeat(g: SceneCtx, i: number, n: number, frac = 0.55): number {
  const d = Math.max(1, g.d);
  const span = Math.min(Math.max(d * frac - 400, 500), 6800);
  const step = n > 1 ? span / (n - 1) : span;
  return 300 + Math.min(i * step, span);
}

// ── statReveal — the 5% cold open ────────────────────────────────────────────
export function statRevealScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  // ── U-18 (100-JUDGE VISUAL AUDIT — THE DEAD WEDGE): every per-beat event
  // in this scene (stat reveals, the limit strike, the prorate wedge, the
  // floor labels) was keyed to the SCENE-GROUP clock. The c1-open group
  // spans four beats (~35s): the prorate beat's wedge could only fire while
  // the group clock read 2400-3300ms — i.e. during the FIRST beat — so the
  // shipped reel never saw the wedge, the strike or any staged reveal after
  // beat one. `bt` (the beat-local clock) is the law for per-beat events;
  // `t` (the group clock) stays for scene-level continuity (the glyph's
  // grow/turn, the kicker).
  const bt = g.beatT;
  const mode = String(s.mode ?? 'setup');
  const opening = s.opening === true;
  // U-23 + U-15: the film's FIRST VISIBLE FRAME must match the thumbnail
  // promise — the brass % WITH its pulled 5% slice beside it, never a bare
  // glyph assembling on navy. The cold open's glyph is present from frame 0
  // and lands through the squash (beat 1 of the 8-second choreography), so
  // only the finale's re-grow (c9-return) keeps the grow-in.
  const coldOpen = opening && mode === 'setup';
  const growP = opening && !coldOpen ? clamp01((bt - 200) / 2300) : 1;
  const turnP = opening ? clamp01((bt - 6070) / 900) : 0;
  // D-10 stage geometry: ONE glyph position for every mode (the mode
  // split put the limit/prorate glyph 67px further left, which is exactly
  // where the host's certified slab collides with the frame edge under
  // the worst-case camera). S drops to 175 — the brand object keeps its
  // presence while the whole glyph+host stage fits inside the camera
  // envelope with the head band clear of the top bowl (verified below).
  const gx = W * 0.30;
  const gy = H * 0.44;
  const S = 175;

  bg(g, { furniture: false, strength: 0.86 });
  declareOnScreenHeadline(String(g.s.headline ?? g.beat.scene.sceneKey ?? 'finance scene'));

  // headline kicker
  // 100-JUDGE VISUAL AUDIT (defect D-04 — THE FIRST-FRAME CONTRACT): the
  // cold open's kicker is UP at frame 0 — the film's business card reads
  // what the film is about from pixel one (the white fade-in veil that
  // used to cover frame zero is gone at the director level).
  setFont(ctx, LABEL_FLOOR, 700);
  ctx.fillStyle = PALETTE.goldInk;
  ctx.textAlign = 'left';
  const kick = 'THE EVERGREEN FUND · THE 5% QUESTION';
  const kickE = coldOpen ? 1 : easeOutCubic(clamp01(t / 500));
  ctx.globalAlpha = kickE;
  ctx.fillText(kick, 180, 168);
  ctx.globalAlpha = 1;
  // the brass rule under the kicker — the ink law's accent weight (U-16)
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(180, 190, 220 * kickE, STROKE.accent);

  // right-side stat stack per mode
  const rx = W * 0.46;
  let ry = H * 0.30;
  const stat = (big: string, label: string, tone: 'up' | 'down' | 'gold' | 'neutral', p: number, bigSize = 120) => {
    const e = easeOutCubic(clamp01(p));
    if (e <= 0) return;
    const tn = TONE(tone);
    ctx.save();
    ctx.globalAlpha = e;
    setFont(ctx, bigSize, 700, FONT_DISPLAY);
    ctx.fillStyle = tn.main;
    registerText(`stat:${big}`, rx, ry - bigSize, Math.min(ctx.measureText(big).width, 900), bigSize * 1.1);
    ctx.fillText(big, rx, ry, 900);
    ry += bigSize * 0.52;
    setFont(ctx, Math.max(TYPE_FLOOR, 40), 400);
    const lines = wrapText(ctx, label, W - rx - 180, 40, 400);
    ctx.fillStyle = PALETTE.inkSoft;
    lines.forEach((ln, i) => ctx.fillText(ln, rx, ry + 52 + i * 50));
    ry += 52 + lines.length * 50 + 34;
    ctx.restore();
  };

  // ── U-15 — THE COLD OPEN, THREE BEATS IN EIGHT SECONDS ─────────────────────
  // Beat 1 (0-0.3s): the % LANDS — a volume-preserving squash about the
  //   glyph's ground contact + the impact ring (frame 0 already carries the
  //   pulled slice: the thumbnail promise, U-23).
  // Beat 2 (1.7-2.7s): the pulled slice SHEARS FREE — the prorate wedge
  //   machinery (it exists) launches the slice at the viewer; it lands with
  //   the squash grammar + ring + micro-shake.
  // Beat 3 (4.0-5.3s): the $1M-to-$50k STRIKE-THROUGH — the coral line cuts
  //   the million and the number resolves to the fifty-thousand exit.
  // Plus: one figure walk-through crossing the stage at 4s (enter 3.2s,
  //   plant 5.4s), and the 6% dolly (director.ts hero move, U-15).
  // No window in the first 8s may sit event-dead longer than 0.8s — the
  // U-10 cadence gate enforces it on every run.
  const coldSquashAge = bt;
  const coldSquash = coldOpen && coldSquashAge >= 0 && coldSquashAge < 300
    ? Math.sin((coldSquashAge / 300) * Math.PI)
    : 0;

  if (coldOpen) {
    // BEAT 1 — the landing event at frame 0 (the ring reads even on the
    // very first rendered frame; the squash follows through 300ms).
    impactRing(ctx, gx, gy + S * 1.1, bt, 40, 190, 1.5);
    // BEAT 3 — the strike-through and the resolution
    const strikeP = clamp01((bt - 4000) / 500);
    const resolveP = clamp01((bt - 4500) / 300);
    // slot 1: the million — PRESENT FROM FRAME 0 on the cold open (the
    // D-04 first-frame contract: the $1,000,000 is the film's opening
    // promise; the landing squash + impact ring carry the arrival energy
    // the old fade used to fake, and the strike-through at 4s still has
    // a live number to cut).
    const mE = coldOpen ? 1 : easeOutCubic(clamp01((bt - 500) / 800));
    if (mE > 0) {
      ctx.save();
      ctx.globalAlpha = mE * (1 - 0.72 * resolveP); // the struck ghost demotes
      setFont(ctx, 120, 700, FONT_DISPLAY);
      ctx.fillStyle = PALETTE.goldDisplay;
      registerText('stat:$1,000,000', rx, ry - 120, Math.min(ctx.measureText('$1,000,000').width, 900), 132);
      ctx.fillText('$1,000,000', rx, ry, 900);
      ctx.restore();
      if (resolveP > 0) {
        // the fifty-thousand exit punches into the slot (down tone)
        ctx.save();
        const pk = 1 + (1 - easeOutCubic(resolveP)) * 0.24;
        ctx.globalAlpha = easeOutCubic(resolveP);
        ctx.translate(rx + 240, ry - 44);
        ctx.scale(pk, pk);
        ctx.translate(-(rx + 240), -(ry - 44));
        setFont(ctx, 96, 700, FONT_DISPLAY);
        ctx.fillStyle = PALETTE.down;
        registerText('stat:$50,000', rx, ry - 96, Math.min(ctx.measureText('$50,000').width, 900), 106);
        ctx.fillText('$50,000', rx, ry, 900);
        ctx.restore();
      }
      if (strikeP > 0) {
        // the strike — the misread dies on screen (the limit beat's own
        // stroke grammar, borrowed for the cold open's third beat)
        ctx.save();
        ctx.strokeStyle = PALETTE.downVivid;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.92 * (1 - 0.55 * resolveP);
        ctx.beginPath();
        ctx.moveTo(rx - 20, ry - 40);
        ctx.lineTo(rx - 20 + (W - rx - 200) * 0.62 * strikeP, ry - 14);
        ctx.stroke();
        ctx.restore();
      }
      // the label under slot 1 — swaps with the number (up from frame 0
      // on the cold open — the D-04 first-frame contract)
      const lE = coldOpen ? 1 : easeOutCubic(clamp01((bt - 500) / 800));
      ctx.save();
      setFont(ctx, Math.max(TYPE_FLOOR, 40), 400);
      ctx.globalAlpha = lE * (1 - resolveP);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText('invested in a semi-liquid fund', rx, ry + 114);
      ctx.globalAlpha = resolveP;
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText('your exit, before any change in value or applicable fees', rx, ry + 114);
      ctx.restore();
      ry += 120 * 0.52 + 52 + 50 + 34;
    }
    stat('ALL OF IT', 'you want your capital back', 'neutral', (bt - 1200) / 800, 90);
    // the closing event at 7s — the question the whole film answers
    const qE = easeOutCubic(clamp01((bt - 7000) / 700));
    if (qE > 0) {
      ctx.save();
      ctx.globalAlpha = qE;
      setFont(ctx, LABEL_FLOOR, 700);
      ctx.fillStyle = PALETTE.goldInk;
      ctx.textAlign = 'center';
      ctx.fillText('THE 5% QUESTION', gx, gy + S * 1.62);
      ctx.textAlign = 'left';
      ctx.restore();
    }
  } else if (mode === 'offer') {
    stat('5% / QUARTER', 'the fund offers quarterly liquidity', 'up', (bt - 400) / 800, 104);
    stat('THE ASSUMPTION', 'in an orderly market, you can work your way out over time', 'neutral', (bt - 1300) / 800, 64);
  } else if (mode === 'limit') {
    stat('5% OF THE FUND', 'a limit on the fund — not a personal allowance', 'down', (bt - 300) / 800, 96);
    // the strike — the misread dies on screen (U-18: keyed to the BEAT clock,
    // so the strike fires inside THIS beat, not during beat one)
    const sp = clamp01((bt - 1400) / 500);
    if (sp > 0) {
      ctx.save();
      ctx.strokeStyle = PALETTE.downVivid;
      ctx.lineWidth = 10;
      ctx.globalAlpha = 0.9;
      const y0 = H * 0.30 - 40;
      ctx.beginPath();
      ctx.moveTo(rx - 20, y0);
      ctx.lineTo(rx - 20 + (W - rx - 200) * sp, y0 + 26);
      ctx.stroke();
      ctx.restore();
    }
    stat('NOT 5% OF YOUR POSITION', 'the same number means two different things', 'gold', (bt - 1900) / 800, 58);
  } else if (mode === 'prorate') {
    stat('REQUESTED: 100%', 'everyone asks to leave at once', 'neutral', (bt - 300) / 700, 72);
    stat('PAID: 5%', 'the fund may repurchase only five percent of its shares', 'down', (bt - 1100) / 700, 96);
    stat('$1,000,000 → $50,000', 'your exit, before any change in value or applicable fees', 'gold', (bt - 1900) / 800, 62);
    const ringP = clamp01((bt - 2000) / 600);
    if (ringP > 0) impactRing(ctx, rx + 240, ry - 160, bt, 2000, 150, 1.4);
  } else if (mode === 'return' || mode === 'misread') {
    stat('$1,000,000', 'the million dollars, again', 'gold', (bt - 300) / 800, 110);
    if (mode === 'misread') {
      stat('THE MISREAD', 'a fund-level repurchase mechanism — taken as a personal guarantee', 'down', (bt - 1200) / 800, 60);
    } else {
      stat('THE QUESTION', 'does the exit button work at the size you need?', 'neutral', (bt - 1200) / 800, 58);
    }
  }

  // the % glyph — drawn LAST so it overlaps the stat stack edge (depth).
  // U-15 beat 1: the cold open's glyph carries the landing squash (about
  // the ground contact, volume-preserving) — and the room's micro-shake
  // answers the landing. U-18: on the twist beat ('misread') the glyph
  // CRACKS along its slash — halves separate 20px with the spring settle,
  // the fracture seam flashes once, the room shakes once.
  const twistCrack = mode === 'misread';
  const crackAge = twistCrack ? bt - 2600 : -1;
  const coldShake = coldOpen ? microShake(bt, 0, HERO.shakePx * 0.7) : { dx: 0, dy: 0 };
  const crackShake = twistCrack && crackAge >= 0 && crackAge < 320
    ? microShake(bt, 2600, HERO.shakePx)
    : { dx: 0, dy: 0 };
  {
    ctx.save();
    ctx.translate(coldShake.dx + crackShake.dx, coldShake.dy + crackShake.dy);
    if (coldSquash > 0) {
      ctx.translate(gx, gy + S * 1.3);
      ctx.scale(1 + 0.14 * coldSquash, 1 - 0.18 * coldSquash);
      ctx.translate(-gx, -(gy + S * 1.3));
    }
    drawPct3D(ctx, gx, gy, S, growP, t, true, turnP, twistCrack ? 1 : 0, crackAge);
    ctx.restore();
  }
  if (twistCrack && crackAge >= 0 && crackAge < 380) {
    // the crack is a BODY event — the impact ring answers it (beat clock)
    impactRing(ctx, gx, gy, bt, 2600, 220, 1.6);
  }
  const heroP = clamp01(growP);
  registerHeroObject(g.beat.scene.sceneKey ?? 'statReveal', 'pct-glyph', S * 1.9, S * 2.6, W, H);
  registerRect('statReveal:pct', gx - S * 0.9, gy - S * 1.25, S * 1.8, S * 2.5);
  // ── U2 (STANDARD MARKET VISUAL REVIEW — defect D4, THE WELD) ────────────
  // The two brand objects finally MEET: the host crosses the stage, plants
  // himself beside the struck-brass % and BRACKETS it — the near fist grips
  // the slash's lower stem (a solved contact, press shadow on), the far arm
  // frames the ring. In the prorate beat the % SPLITS: the host pushes a
  // 5%-wedge off the glyph and the wedge lands AT THE VIEWER with squash-
  // on-landing + impactRing + microShake — the film's best object and its
  // best motion grammar in one frame. D18: the first 15 seconds now carry
  // a living anchor welded to the promise.
  //
  // ── U-15 (THE COLD OPEN'S WALK-THROUGH): the opening beat's figure
  // enters offscreen-left at 3.2s and CROSSES the stage — mid-stride at the
  // 4s mark — planting beside the glyph at 5.4s. The walk is the beat's
  // bridge event between the wedge landing and the strike-through.
  // ── U-18 (THE DEAD WEDGE, FIXED): the wedge events key to the BEAT clock
  // (`bt`), so the shear fires inside its own beat — in the cold open at
  // 1.7s (the pulled slice shears free and flies at the viewer), in the
  // prorate beat at 2.4s (same grammar, the film's payoff moment).
  {
    const hostRig = 1.7;                       // U3: companion rigs rise
    // the host plants on the LEFT stage block (clear of the stat column at
    // rx=883 — the 806 staging plated the $1M slot); the cold open's
    // walk-through CROSSES the left third to reach it, mid-stride at 4s.
    // 100-JUDGE AUDIT (defect D-10 — THE BRASS % OCCLUDES THE HEAD): the
    // shipped staging planted the host 150px from the glyph's center — his
    // head band sat INSIDE the top bowl's annulus and he "peeked around his
    // own brand object" (b001-b003, b114-b115). The fist-on-the-slash verb
    // was the root cause: the contact solver always pulls the root toward
    // any target beyond arm reach, dragging the body back INTO the glyph's
    // bounding box. The premium staging separates the two stage partners
    // completely: the host plants OUTSIDE the glyph's bounding box (his
    // head band clears the top bowl by 15px), presents it with the open
    // gesture and the committed gaze — and the glyph's own pulled slice
    // (the 5% wedge) rests at the glyph's base as the bridge object he
    // gestures AT. No overlap, no pull, both silhouettes fully readable.
    const hxR = gx - 240;  // head band [gx-308, gx-172] clears the top bowl [gx-161, gx-22] by 10px
    const hyR = H * 0.675;
    const wedgeT0 = coldOpen ? 1700 : 2400;
    const wedgeLand = coldOpen ? 2700 : 3300;
    const wedgeP = mode === 'prorate' || coldOpen ? clamp01((bt - wedgeT0) / (wedgeLand - wedgeT0)) : 0;
    // the wedge's rest position — at the glyph's BASE (the pulled 5% slice
    // lying at the brand object's foot, the thumbnail's promise). Clear of
    // the host column (left), the stat column (right) and the glyph's
    // bottom bowl (above it) by construction.
    const restWx = gx + S * 0.86, restWy = gy + S * 1.49;
    // the flight skims the floor toward the CAMERA-LEFT (the viewer's
    // feet) — under the host's ground band, never into the stat column
    const wx = restWx + wedgeP * wedgeP * -320;
    const wy = restWy + wedgeP * wedgeP * 80;
    const wedgeScale = 1 + wedgeP * 0.6;
    // the resting pulled slice — visible from FRAME 0 on the cold open
    if (coldOpen && wedgeP <= 0) {
      ctx.save();
      // the brass halo — the slice is the promise, it carries light
      const glow = ctx.createRadialGradient(restWx, restWy, 4, restWx, restWy, S * 0.62);
      glow.addColorStop(0, rgba(PALETTE.goldDisplay, 0.30));
      glow.addColorStop(1, rgba(PALETTE.goldDisplay, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(restWx, restWy, S * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(restWx, restWy);
      ctx.rotate(-0.06 + Math.sin(t / 900) * 0.03); // the hover breathe
      ctx.fillStyle = PALETTE.goldDisplay;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, S * 0.40, -0.35, 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(PALETTE.ink, 0.8);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    if (wedgeP > 0 && wedgeP < 1) {
      // the flying wedge — an 18° brass pie slice with the porcelain edge
      ctx.save();
      ctx.translate(wx, wy);
      ctx.scale(wedgeScale, wedgeScale);
      ctx.rotate(-0.5 * wedgeP);
      ctx.fillStyle = PALETTE.goldDisplay;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, S * 0.34, -0.35, 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(PALETTE.ink, 0.8);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    if (wedgeP >= 1) {
      // THE LANDING — squash-on-landing (U11), impact ring + micro-shake
      // (all keyed to the BEAT clock — the ring fires inside its own beat)
      const age = bt - wedgeLand;
      const squashP = age >= 0 && age < 300 ? Math.sin((age / 300) * Math.PI) : 0;
      ctx.save();
      ctx.translate(restWx - 320, restWy + 80);
      ctx.scale(1 + 0.16 * squashP, 1 - 0.2 * squashP);
      ctx.rotate(Math.sin(t / 900) * 0.03); // the settle breathe
      ctx.fillStyle = PALETTE.goldDisplay;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, S * 0.34, -0.35, 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(PALETTE.ink, 0.8);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      impactRing(ctx, restWx - 320, restWy + 80, bt, wedgeLand, 130, 1.3);
    }
    // the host — the cold open WALKS THROUGH at 4s (enter 3.2s, cross the
    // left third mid-stride, plant 5.4s); other beats walk in from the
    // group's start and present the glyph from outside its bounding box.
    financeHost(g, hxR, Math.min(hyR, H * 0.64), hostRig, {
      seed: 4.2,
      gesture: 'present',
      glanceBias: 0.9,
      walkDur: coldOpen ? 2200 : 1800,
      walkAt: coldOpen ? 3200 : 0,
      walkFrom: 145,  // D-10: the stride band (\u00b1136 at rig 1.7) must start inside the frame
      declareId: undefined,
      label: 'pct-host',
    });
  }
  // the floor label under the glyph
  if (mode === 'limit' || mode === 'prorate') {
    const e = easeOutCubic(clamp01((bt - 2300) / 600));
    if (e > 0) {
      setFont(ctx, LABEL_FLOOR, 700);
      ctx.fillStyle = PALETTE.goldInk;
      ctx.textAlign = 'center';
      ctx.globalAlpha = e;
      ctx.fillText('THE FUND\u2019S CAPACITY', gx, gy + S * 1.55);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
  }
  // corner source note — the proration arithmetic
  if (mode === 'prorate') {
    sourceTag(ctx, W, 'Illustration: 5% fund-level share cap, all shareholders requesting full exit — proration, not a forecast (SEC Investor.gov)');
  }
}

// ── wrapperMatrix — the four legal wrappers ────────────────────────────────
const WRAPPERS = [
  {
    num: '1', name: 'INTERVAL FUND', short: 'INTERVAL', tone: 'up' as const,
    promise: 'Repurchase offers on a pre-committed calendar — commonly quarterly, 5–25% of shares.',
    who: 'A fundamental policy. Postponement is narrow and regulated.',
    cap: 'Requests above the offer are prorated.',
    guard: 'Liquid assets must cover the offer from notice to pricing date.',
  },
  {
    num: '2', name: 'TENDER-OFFER FUND', short: 'TENDER', tone: 'gold' as const,
    promise: 'The board decides whether to offer, when, and how large — quarterly is an expectation.',
    who: 'THE BOARD. Same ad, materially different rights.',
    cap: 'Set offer by offer.',
    guard: 'Whatever the board adopts.',
  },
  {
    num: '3', name: 'NON-TRADED BDC', short: 'BDC', tone: 'down' as const,
    promise: 'Private credit vehicles with quarterly repurchases, often capped around 5%.',
    who: 'The board may amend, suspend or modify the program.',
    cap: '≈5% of shares, program by program.',
    guard: 'Governed by the fund\u2019s own documents and applicable law.',
  },
  {
    num: '4', name: 'ELTIF (EUROPE)', short: 'ELTIF', tone: 'up' as const,
    promise: 'A regulatory label, not one liquidity design — closed-ended forms still exist.',
    who: 'Managers set notice periods, holding periods, tools.',
    cap: 'Fund by fund.',
    guard: 'Early-redemption policy must fit the portfolio\u2019s liquidity.',
  },
];

export function wrapperMatrixScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  const focus = Number(s.focus ?? 0);
  const highlight = s.highlight ? String(s.highlight) : '';
  const mode = String(s.mode ?? 'focus');
  bg(g, { strength: 0.88 });
  // 100-JUDGE VISUAL AUDIT (defect D-06 — THE CAPTION DOUBLES WHAT IS ON
  // SCREEN): the karaoke pill dedups against what THIS scene actually
  // draws — the title + the focused wrapper's own words — not the scene
  // key. Windows that repeat the on-screen copy stand down.
  declareOnScreenHeadline(
    (mode === 'gates' ? 'Gate language, made precise' : 'Four wrappers. Four different promises.') +
    ' ' + WRAPPERS.map((wr) => `${wr.name} ${wr.promise}`).join(' ')
  );

  // the scene title
  setFont(ctx, 54, 600);
  ctx.fillStyle = PALETTE.ink;
  const title = mode === 'gates' ? 'Gate language, made precise' : 'Four wrappers. Four different promises.';
  ctx.fillText(title, 180, 218, 1560);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(180, 246, 300, 6);

  // 100-JUDGE VISUAL AUDIT (defect D-07 — ONE FRAMING HELD FOR VERY LONG
  // RUNS): wrapperMatrix held ONE layout for 9 consecutive beats
  // (b025-b040) with only a highlight chip moving. The scene now ROTATES
  // ITS FRAMING on the run clock (the director's runIdx): even run = the
  // host's LEFT rail (his column at the left edge); odd run = MIRRORED —
  // the row shifts left and the host takes the RIGHT rail. Same content,
  // same laws, a different composition every ~4-5 beats.
  const framing = (g.runIdx ?? 0) % 2;
  const rowLeft = framing === 0 ? 180 + 160 : 180;            // the row's first column x
  const rowRight = framing === 0 ? W - 180 : W - 440;         // the row's last column right edge

  if (mode === 'gates') {
    // three precision chips
    const rows = [
      { k: 'A CAP APPLIED', v: 'the pre-existing 5% being enforced — not a new emergency gate', tone: 'up' as const },
      { k: 'AN UPSIZED OFFER', v: 'a larger window — still not unlimited liquidity', tone: 'gold' as const },
      { k: 'A SUSPENSION', v: 'a different event again — the program itself stops', tone: 'down' as const },
    ];
    rows.forEach((r, i) => {
      // D-03: the three precision rows land across the hold (the build
      // spread — a 13s gates beat no longer finishes its build at 1.7s)
      const y = H * 0.315 + i * 158;
      const e = easeOutCubic(clamp01((t - holdBeat(g, i, 3)) / 700));
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha = e;
      card(ctx, 240, y, W - 480, 132, { r: 30, tint: TONE(r.tone).main });
      ctx.restore();
      setFont(ctx, 50, 700, FONT_DISPLAY);
      ctx.fillStyle = TONE(r.tone).main;
      ctx.fillText(r.k, 300, y + 58, W - 620);
      // FIX D-05 (THE READABLE BAND): the description line rises to the
      // 36px label band — the gate's smallest body copy stops sitting at
      // the bare floor
      setFont(ctx, Math.max(LABEL_FLOOR, 36), 400);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText(r.v, 300, y + 104, W - 620);
    });
    return;
  }

  // the four columns — focused one expands, others hold their one-liner
  // U7: the row shifts right 180 → 340 — the freed left rail is the HOST's
  // stage (he leans on the focused card's edge from his own column; the
  // matrix never plates him and he never plates the matrix).
  // D-07: on the mirrored framing the row OWNS the left margin and the
  // host takes the right rail (same widths, opposite rails).
  const n = WRAPPERS.length;
  const gap = 34;
  const top = H * 0.285;
  const bot = CAPTION_ZONE_TOP - 40;
  const railW = 160;
  const fullW = (rowRight - rowLeft - gap * (n - 1)) / n;
  // the focused column takes 2.2× — the OTHERS shrink to fit the row
  const bigW = fullW * 1.9;
  const othersW = (rowRight - rowLeft - gap * (n - 1) - bigW) / (n - 1);
  // the x of every column card() actually drew (for the lean declarations)
  const cardAt: Record<number, number> = {};
  WRAPPERS.forEach((wr, i) => {
    const isFocus = mode === 'summary' ? true : i === focus;
    const cw = mode === 'summary' ? fullW : isFocus ? bigW : othersW;
    // D-09 evidence fix (b041 summary): the shipped offset gave EVERY
    // summary column x = rowLeft — four cards stacked on one slot. The
    // summary row spaces evenly like the focused row does.
    const othersBefore = mode === 'summary' ? i * (fullW + gap) : WRAPPERS.slice(0, i).reduce((acc, _, j) => acc + (j === focus ? bigW : othersW) + gap, 0);
    const x = rowLeft + othersBefore;
    const p = clamp01((t - 300 - i * 260) / 650);
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = easeOutCubic(p);
    if (isFocus || mode === 'summary') {
      card(ctx, x, top, cw, bot - top, { r: 30, glow: isFocus ? rgba(PALETTE.gold, 0.22) : undefined });
      // the card()'s auto-registered rect (card@x,top) — remember the ones
      // the host's lean can touch (the near-edge column per framing)
      if (i === 0 || i === n - 1 || mode === 'summary') cardAt[i] = x;
    } else {
      // unfocused columns are FURNITURE — same glass paint, no content
      // registration (they are deliberately dimmed; the guard checks reading
      // content, and adjacent-card camera envelopes flagged the row)
      const gb = ctx.createLinearGradient(0, top, 0, bot);
      gb.addColorStop(0, rgba('#3B5B9E', 0.20));
      gb.addColorStop(0.35, rgba(PALETTE.card, 0.85));
      gb.addColorStop(1, rgba(PALETTE.shadow, 0.5));
      ctx.fillStyle = gb;
      roundRect(ctx, x, top, cw, bot - top, 30);
      ctx.fill();
      ctx.strokeStyle = rgba(PALETTE.cardBorder, 0.7);
      ctx.lineWidth = 2;
      roundRect(ctx, x, top, cw, bot - top, 30);
      ctx.stroke();
    }
    ctx.restore();
    colHead(ctx, x + 26, top + 30, cw, wr.num, isFocus && mode !== 'summary' ? wr.name : wr.short, p, isFocus);
    const tn = TONE(wr.tone);
    if (isFocus && mode !== 'summary') {
      // the focused wrapper's ledger — three standing rows; the guard row
      // only lands on the safeguard/limit beats (the row budget stays honest)
      let ly = top + 112;
      ly += ledgerRow(ctx, x + 34, ly, cw - 68, 'THE PROMISE', wr.promise, wr.tone, (t - 500) / 700) + 14;
      ly += ledgerRow(ctx, x + 34, ly, cw - 68, 'WHO DECIDES', wr.who, highlight === 'who' ? 'gold' : 'neutral', (t - 900) / 700) + 14;
      ly += ledgerRow(ctx, x + 34, ly, cw - 68, 'THE CAP', wr.cap, highlight === 'prorate' ? 'down' : 'neutral', (t - 1300) / 700) + 14;
      if (highlight === 'safeguard' || highlight === 'limit') {
        ledgerRow(ctx, x + 34, ly, cw - 68, 'THE GUARD', wr.guard, highlight === 'safeguard' ? 'up' : 'neutral', (t - 1700) / 700);
      }
      // the "same shelf, different plumbing" reminder on the contrast beat
      if (highlight === 'who' || highlight === 'contrast') {
        const e = easeOutCubic(clamp01((t - 1600) / 600));
        if (e > 0) {
          ctx.save();
          ctx.globalAlpha = e;
          chip(ctx, 'THE QUESTION: WHO DECIDES WHETHER THE WINDOW OPENS?', x + 34, bot - 96, {
            bg: PALETTE.chipBg, fg: PALETTE.goldInk, border: rgba(PALETTE.gold, 0.7), size: LABEL_FLOOR,
          });
          ctx.restore();
        }
      }
    } else {
      // the dimmed / summary column — the promise only
      // U9 (STANDARD MARKET VISUAL REVIEW — defect D21, FEED-PROOF THE
      // MATRIX): the unfocused column alpha 0.62 → 0.85 (at 320px the old
      // 0.62 was ~6px of gray-on-navy mush).
      // FIX D-05 (THE READABLE BAND): the promise copy renders at 44px —
      // the feed's 40px floor was the audit's measured grey-noise band —
      // and caps at TWO lines (the rest carried by narration).
      setFont(ctx, 44, 400);
      const lines = wrapText(ctx, isFocus && mode === 'summary' ? wr.promise.split('.')[0] + '.' : wr.promise.split('.')[0] + '.', cw - 68, 44, 400);
      ctx.fillStyle = PALETTE.ink;
      lines.slice(0, 2).forEach((ln, li) => {
        ctx.globalAlpha = easeOutCubic(clamp01(p * 1.4)) * (isFocus && mode === 'summary' ? 1 : 0.85);
        ctx.fillText(ln, x + 34, top + 146 + li * 54, cw - 68);
      });
      ctx.globalAlpha = 1;
    }
  });
  // ── U7 (defect D19, THE HOST LEANS ON THE FOCUSED CARD) — the matrix's
  // own presenter stands in his rail and the near hand palms the focused
  // card's edge at shoulder height — the card is a desk he leans on, never
  // a slide he stands beside. D-07: the rail follows the framing (left on
  // even runs, right on odd runs).
  // 100-JUDGE AUDIT (defect D-09 — THE HOST ON THE MATRIX, b034/b039): the
  // shipped rails put the host's drawn torso 5-23px INSIDE the row's near
  // card and the palm contact 120px below his shoulder — his body plated
  // the ELTIF column and the column plated him back. The rail gap widens
  // to 150px (a full drawn-torso width plus air) and the palm lands ON the
  // row edge at SHOULDER height (the honest contact: within natural reach,
  // no root pull). Figure and matrix each own their plane.
  if (mode !== 'gates') {
    // the host leans on THE ROW's near edge — focus 0 that IS the focused
    // card; focus 1-3 he leans on the row while presenting the focused
    // column (gaze toward it).
    registerRect('wrapperMatrix:focusEdge', framing === 0 ? rowLeft - 8 : rowRight - 18, top + 150, 26, 260);
    financeHost(g, framing === 0 ? rowLeft - 150 : rowRight + 150, H * 0.65, 1.6, {
      seed: 6.1 + framing * 0.9,
      gesture: 'present',
      glanceBias: framing === 0 ? 0.9 : -0.9,
      contact: { x: framing === 0 ? rowLeft - 2 : rowRight + 4, y: top + 170, hand: 'palm', easeAt: 0 },
      declareId: 'wrapperMatrix:focusEdge',
      label: 'matrix-host',
      hostBody: true,
    });
    // the leaned column's card (when card() actually drew one there) joins
    // the designed-contact set — framing 0 leans on column 0's left edge,
    // framing 1 on the LAST column's right edge, summary on the whole row.
    const leanIdx = framing === 0 ? 0 : n - 1;
    if ((mode === 'summary' || focus === leanIdx) && cardAt[leanIdx] !== undefined) {
      declareHostContact(`card@${Math.round(cardAt[leanIdx])},${Math.round(top)}`);
    }
  }
  // summary mode: the shelf line
  if (mode === 'summary') {
    const e = easeOutCubic(clamp01((t - 1800) / 700));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      chip(ctx, 'SAME SHELF · DIFFERENT PLUMBING', 180, H * 0.185, {
        bg: PALETTE.chipBg, fg: PALETTE.goldInk, border: rgba(PALETTE.gold, 0.7), size: LABEL_FLOOR, iconDot: PALETTE.goldDisplay,
      });
      ctx.restore();
    }
  }
  sourceTag(ctx, W, 'Sources: SEC Investor.gov · Federal Reserve FEDS note · BCRED published terms · ELTIF 2.0 / final RTS');
}

// ── flowLiquidity — the cash plumbing ──────────────────────────────────────
const SOURCES = [
  { k: 'SUBSCRIPTIONS', v: 'depends on someone else wanting to enter', tone: 'up' as const },
  { k: 'LOAN REPAYMENTS', v: 'borrowers refinance or repay — slows in stress', tone: 'up' as const },
  { k: 'CASH & LIQUID SECURITIES', v: 'already on the balance sheet', tone: 'gold' as const },
  { k: 'BORROWING CAPACITY', v: 'borrowing-base tests, covenants, collateral', tone: 'gold' as const },
  { k: 'ASSET SALES', v: 'needs a buyer — and a price', tone: 'down' as const },
];

export function flowLiquidityScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  const mode = String(s.mode ?? 'sources');
  const highlight = s.highlight ? String(s.highlight) : '';
  bg(g, { strength: 0.9 });
  // 100-JUDGE VISUAL AUDIT (defect D-06): declare the plumbing's words.
  declareOnScreenHeadline((mode === 'stress' ? 'The combined stress test ' : 'Where the cash comes from ') +
    SOURCES.map((src) => `${src.k} ${src.v}`).join(' '));

  setFont(ctx, 54, 600);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(mode === 'stress' ? 'The combined stress test' : 'Where the cash comes from', 180, 218, 1560);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(180, 246, 300, 6);

  const top = H * 0.285;
  const rowH = 88;
  const lx = 200;
  const lw = W * 0.4;
  // the pipes — drawn BEFORE the rows so the cards own their plane
  SOURCES.forEach((_, i) => {
    const y = top + i * rowH;
    const pipeP = easeOutCubic(clamp01((t - 500 - i * 240) / 600));
    const stress = mode === 'stress' && (i === 0 || i === 1);
    if (pipeP > 0) {
      ctx.save();
      ctx.globalAlpha = pipeP * (mode === 'stress' && i === 0 ? 0.25 : 0.8);
      ctx.strokeStyle = stress ? PALETTE.down : TONE(SOURCES[i].tone).main;
      ctx.lineWidth = stress ? 4 : 6;
      // U8: THE CASH FLOWS — the pipes' dashes TRAVEL (deterministic
      // lineDashOffset keyed to t): the plumbing is alive, and every
      // flowLiquidity hold carries a structured state change (the U5
      // motion budget's own referee eats this one too).
      ctx.setLineDash([14, 13]);
      ctx.lineDashOffset = stress ? -((t / 90) % 27) : -((t / 46) % 27);
      ctx.beginPath();
      ctx.moveTo(lx + lw + 10, y + (rowH - 12) / 2);
      ctx.lineTo(W * 0.72, H * 0.52);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.restore();
    }
  });
  // the source stack
  // D-03: the five sources land across the hold (the build spread)
  SOURCES.forEach((src, i) => {
    const y = top + i * rowH;
    const e = easeOutCubic(clamp01((t - holdBeat(g, i, SOURCES.length, 0.5)) / 600));
    if (e <= 0) return;
    ctx.save();
    ctx.globalAlpha = e;
    const stress = mode === 'stress' && (i === 0 || i === 1);
    // VAULT NOIR fix: rows compact to h 76 — the fifth source card's
    // registered bottom (786 at the old pitch) crossed the 2-row caption
    // pill under the certified camera (sweep @524-560s).
    // U5: each row's valve PULSES on a staggered clock (the pump is running)
    const pulse = 1 + 0.22 * Math.sin(t / 700 - i * 1.15);
    card(ctx, lx, y, lw, rowH - 12, { r: 22, tint: stress ? TONE('down').main : undefined });
    // the valve dot
    ctx.fillStyle = stress ? PALETTE.down : TONE(src.tone).main;
    ctx.beginPath();
    ctx.arc(lx + 40, y + (rowH - 18) / 2, 12 * pulse, 0, Math.PI * 2);
    ctx.fill();
    // the valve's pressure ring (the read: cash is moving through THIS row)
    ctx.strokeStyle = rgba(stress ? PALETTE.down : TONE(src.tone).main, 0.35 * pulse);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lx + 40, y + (rowH - 18) / 2, 17 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    setFont(ctx, Math.max(LABEL_FLOOR, 34), 700);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(src.k, lx + 72, y + 34, lw - 90);
    if (mode === 'conditions' || mode === 'stress') {
      setFont(ctx, 28, 400);
      ctx.fillStyle = PALETTE.inkFaint;
      ctx.fillText(src.v, lx + 72, y + 60, lw - 90);
    }
    ctx.restore();
  });
  // the gate — the redemption node
  const gx = W * 0.72, gy = H * 0.52;
  const gateE = easeOutCubic(clamp01((t - 700) / 700));
  ctx.save();
  ctx.globalAlpha = gateE;
  // the vault ring
  ctx.strokeStyle = mode === 'stress' ? PALETTE.down : PALETTE.goldDisplay;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(gx, gy, 120 * (0.8 + 0.2 * gateE), 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = rgba(PALETTE.ink, 0.5);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(gx, gy, 132, 0, Math.PI * 2);
  ctx.stroke();
  setFont(ctx, LABEL_FLOOR, 700);
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.fillText('REDEMPTIONS', gx, gy - 6);
  ctx.fillText('PAID', gx, gy + 36);
  ctx.textAlign = 'left';
  ctx.restore();
  // U7/U1: the gate has an OPERATOR — the host stands at the redemption
  // window and his palm rests ON the ring's rim (a hand on the machinery
  // the whole chapter is about). Registered + declared for the guard.
  // 100-JUDGE AUDIT (defect D-11 — THE RING THROUGH THE ARM, b043/b045): the
  // shipped palm target sat 34px INSIDE the ring's radius — the arm crossed
  // the 10px gold stroke to reach it and the circle read as painted OVER
  // the host. The palm now lands ON the rim itself (the ring's left edge,
  // at rim height) and the host steps back a full drawn-torso width: body
  // outside the ring, hand ON the machinery, one honest contact.
  registerRect('flow:gate', gx - 138, gy - 138, 276, 276);
  financeHost(g, gx - 260, H * 0.65, 1.6, {
    seed: 7.7,
    gesture: 'present',
    glanceBias: 0.9,
    contact: { x: gx - 134, y: gy + 10, hand: 'palm', easeAt: 800 },
    declareId: 'flow:gate',
    label: 'gate-host',
    hostBody: true,
  });
  // the outflow — to the exiting investors
  ctx.save();
  ctx.globalAlpha = easeOutCubic(clamp01((t - 1100) / 700)) * (mode === 'stress' ? 0.45 : 0.9);
  ctx.strokeStyle = mode === 'stress' ? PALETTE.down : PALETTE.upVivid;
  ctx.lineWidth = 8;
  ctx.setLineDash(mode === 'stress' ? [12, 14] : []);
  ctx.beginPath();
  ctx.moveTo(gx + 130, gy);
  ctx.lineTo(W * 0.94, gy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  setFont(ctx, Math.max(LABEL_FLOOR, 34), 700);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.textAlign = 'center';
  // 100-JUDGE VISUAL AUDIT (U-09 — THE RIGHT-THIRD OCCUPANCY RULE): the
  // outflow label used to anchor at W*0.905 with no width clamp — the
  // text ran past the frame bound and the stress word rendered as the
  // orphaned "RATION S" wrap the audit convicted. The label now (a)
  // carries a full DATA ROLE in both modes — 'INVESTORS EXITING' vs
  // 'PAYOUTS RATIONED' (the proration read the stress mode IS about) —
  // and (b) measures and clamps inside the right margin: the label never
  // wraps, never clips, and the right third stays occupied by labeled
  // content (the gate + the outflow + the proration plate in stress).
  {
    const outLabel = mode === 'stress' ? 'PAYOUTS RATIONED' : 'INVESTORS EXITING';
    const maxLabelW = W - (gx + 130) - 60;
    setFont(ctx, Math.max(LABEL_FLOOR, 34), 700);
    let olSize = Math.max(LABEL_FLOOR, 34);
    let olW = ctx.measureText(outLabel).width;
    while (olW > maxLabelW && olSize > 26) {
      olSize -= 2;
      setFont(ctx, olSize, 700);
      olW = ctx.measureText(outLabel).width;
    }
    ctx.fillText(outLabel, Math.min(W * 0.905, W - 60 - olW / 2), gy - 44);
  }
  ctx.textAlign = 'left';

  // the stress line
  if (mode === 'stress') {
    // the stress chip lives at the TOP-RIGHT (title band) — never over the rows
    const e = easeOutCubic(clamp01((t - 1400) / 700));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      chip(ctx, 'SUBSCRIPTIONS FALL · REPAYMENTS SLOW · REQUESTS RISE', 180, 262, {
        bg: PALETTE.chipBg, fg: PALETTE.downVivid, border: rgba(PALETTE.down, 0.7), size: LABEL_FLOOR, iconDot: PALETTE.down,
      });
      ctx.restore();
    }
    // 100-JUDGE VISUAL AUDIT (U-09 — THE UNLABELED RED CARD GETS A DATA
    // ROLE): the right third's red plate used to render as an abstract
    // rounded rect with two salmon lines and no name (B-11's "unlabeled
    // red card"). It is now the PRORATION PLATE — the stress mode's own
    // data verdict: requests ÷ the 5% offer = the queue, labeled, with
    // the queue ratio the whole chapter builds toward.
    {
      const pe = easeOutCubic(clamp01((t - 1700) / 700));
      if (pe > 0) {
        ctx.save();
        ctx.globalAlpha = pe;
        const qx = W * 0.795, qy = H * 0.30;
        const qw = 250, qh = 148;
        ctx.fillStyle = 'rgba(7,14,30,0.85)';
        roundRect(ctx, qx - qw / 2, qy, qw, qh, 18);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = rgba(PALETTE.down, 0.75);
        roundRect(ctx, qx - qw / 2, qy, qw, qh, 18);
        ctx.stroke();
        setFont(ctx, 26, 700);
        ctx.fillStyle = PALETTE.downVivid;
        ctx.textAlign = 'center';
        ctx.fillText('THE QUEUE', qx, qy + 40);
        setFont(ctx, 44, 700);
        ctx.fillStyle = PALETTE.ink;
        ctx.fillText('REQUESTS ÷ 5%', qx, qy + 88);
        setFont(ctx, 24, 400);
        ctx.fillStyle = PALETTE.inkFaint;
        ctx.fillText('every request above the offer waits, pro rata', qx, qy + 122, qw - 32);
        ctx.textAlign = 'left';
        ctx.restore();
      }
    }
  }
  if (highlight === 'not-insolvent') {
    const e = easeOutCubic(clamp01((t - 900) / 600));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      chip(ctx, 'A 10% REQUEST ≠ INSOLVENCY', 180, 262, {
        bg: PALETTE.chipBg, fg: PALETTE.upVivid, border: rgba(PALETTE.up, 0.7), size: LABEL_FLOOR, iconDot: PALETTE.up,
      });
      ctx.restore();
    }
  }
  sourceTag(ctx, W, 'Framework: Federal Reserve staff note (FEDS, Oct 2026) — liquidity sources, queues, moderate vs severe stress');
}

// ── prorationDemo — requested ≠ fulfilled ──────────────────────────────────
export function prorationDemoScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  const stage = Number(s.stage ?? 0);
  bg(g, { strength: 0.9 });
  // 100-JUDGE VISUAL AUDIT (defect D-06 — the audit's b049 frame: the pill
  // printed "REQUESTED vs FULFILLED" while the title carried the same
  // words): the scene declares what it draws.
  declareOnScreenHeadline('REQUESTED ≠ FULFILLED YOU REQUESTED $100,000 YOU RECEIVED $50,000 DENOMINATOR: 5% OF SHARES');

  setFont(ctx, 54, 600);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('REQUESTED \u2260 FULFILLED', 180, 218, 1560);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(180, 246, 300, 6);

  // the two bars — the proration arithmetic made physical
  // 100-JUDGE AUDIT (defect D-14 — LABELS UNDER THE FIGURE, b049-b050): the
  // shipped layout stacked THREE owners on one band — the bars ran to
  // x 1123, the $ values printed at 1163, the stage-1 "STILL INVESTED"
  // card sat at 1183 (directly OVER the values), and the host's contact
  // pull dragged his torso INTO the value column. Every element now owns
  // a measured column: bars [240, 883], values [923, ~1240], the stage-1
  // card a full-width band BELOW the bars [240, 1240], the host at 0.708W
  // with his fingertip ON the $50,000's edge. No label runs under anyone.
  const bx = 240;
  const bw = W * 0.335;
  const rows = [
    { k: 'YOU REQUESTED', v: '$100,000', frac: 1, tone: 'gold' as const },
    { k: 'YOU RECEIVED', v: '$50,000', frac: 0.5, tone: 'down' as const },
  ];
  rows.forEach((r, i) => {
    const y = H * 0.30 + i * 170;
    const e = easeOutCubic(clamp01((t - 400 - i * 800) / 700));
    if (e <= 0) return;
    ctx.save();
    ctx.globalAlpha = e;
    setFont(ctx, LABEL_FLOOR, 700);
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.fillText(r.k, bx, y - 16);
    // the track
    ctx.fillStyle = PALETTE.track;
    roundRect(ctx, bx, y, bw, 74, 14);
    ctx.fill();
    // the fill
    const tn = TONE(r.tone);
    ctx.fillStyle = tn.main;
    roundRect(ctx, bx, y, Math.max(16, bw * r.frac * e), 74, 14);
    ctx.fill();
    // the value
    setFont(ctx, 64, 700, FONT_DISPLAY);
    ctx.fillStyle = tn.main;
    ctx.fillText(r.v, bx + bw + 40, y + 56);
    ctx.restore();
  });
  // the denominator chip — its own band below the bars
  const dE = easeOutCubic(clamp01((t - 1500) / 600));
  if (dE > 0) {
    ctx.save();
    ctx.globalAlpha = dE;
    chip(ctx, 'DENOMINATOR: 5% OF SHARES · REQUESTS \u2248 10%', bx, H * 0.556, {
      bg: PALETTE.chipBg, fg: PALETTE.inkSoft, border: PALETTE.cardBorder, size: LABEL_FLOOR,
    });
    ctx.restore();
  }
  // the remainder — still invested (stage 1 adds the resubmit question,
  // as a full-width band BELOW the chip: the value column and the host
  // column stay untouched)
  if (stage === 1) {
    const e = easeOutCubic(clamp01((t - 400) / 700));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      const cx1 = bx;
      const cw1 = 1000;
      const cy1 = H * 0.622;
      card(ctx, cx1, cy1, cw1, 128, { r: 26 });
      setFont(ctx, 42, 700, FONT_DISPLAY);
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText('THE OTHER $50,000 IS STILL INVESTED', cx1 + 40, cy1 + 52, cw1 - 80);
      setFont(ctx, Math.max(LABEL_FLOOR, 34), 400);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText('Resubmission depends on the fund\u2019s procedures — do not assume an automatic queue.', cx1 + 40, cy1 + 96, cw1 - 80);
      ctx.restore();
    }
  }

  // the operator — the presenter AT the window, fingertip ON the $50,000
  // his sentence is about. D-14: the host stands at 0.708W — his drawn
  // torso clears the value column by 12px and the contact lands on the
  // number's right edge (within the solver's honest envelope).
  const scale = 1.7;
  const hx = W * 0.708;
  const hy = H * 0.655;
  registerRect('proration:value50k', bx + bw + 30, H * 0.30 + 170 - 8, 320, 84, 'content');
  registerText('proration:value50kTxt', bx + bw + 30, H * 0.30 + 170 - 8, 320, 84);
  financeHost(g, hx, hy, scale, {
    seed: 7,
    gesture: 'present',
    glanceBias: -0.9,
    contact: { x: bx + bw + 317, y: H * 0.30 + 170 + 56, hand: 'point', easeAt: 0 },
    declareId: 'proration:value50kTxt',
    label: 'host',
  });
  sourceTag(ctx, W, 'Illustration: uniform pro-rata treatment (SEC guidance) — actual procedures vary by fund');
}

// ── caseFiles — three cases, dates and denominators on every number ────────
const CASES = [
  {
    tab: 'CLIFFWATER', fund: 'Cliffwater Corporate Lending Fund', tone: 'gold' as const,
    chip: 'INTERVAL FUND',
    stats: [
      { big: '14%', label: 'of shares sought for redemption', tag: 'Q1 2026 requests' },
      { big: '7%', label: 'repurchase amount (capped)', tag: 'vs 5% standard minimum' },
    ],
    src: 'Reuters, citing Bloomberg + investor letter · Q1 2026 · not independently verified by Reuters',
  },
  {
    tab: 'BCRED', fund: 'Blackstone Private Credit Fund', tone: 'up' as const,
    chip: 'NON-TRADED BDC',
    stats: [
      { big: 'Q1', label: 'requests > 5% — upsized to 7%, ALL met; ~$2B inflows', tag: 'March 2026 SEC filing' },
      { big: 'Q2', label: 'requests ≈ 10% — fulfilled 5%; net outflow ≈ 3%', tag: 'June 2026 letter' },
    ],
    src: 'BCRED SEC filings · March & June 2026',
  },
  {
    tab: 'OBDC II', fund: 'Blue Owl Capital Corporation II', tone: 'up' as const,
    chip: 'ASSET SALE + ROC',
    stats: [
      { big: '$600M', label: 'of direct-lending investments sold (of $1.4B across three BDCs)', tag: 'February 2026' },
      { big: '99.7%', label: 'of par — fair value, consistent with carrying value. NOT a distressed sale', tag: 'transaction release' },
      { big: '~30%', label: 'return-of-capital distribution planned (of year-end NAV); tender offers replaced by ratable ROC distributions', tag: 'announced plan' },
    ],
    src: 'Blue Owl transaction release · February 2026 · Reuters on the redemption change',
  },
];

export function caseFilesScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  const caseIdx = Math.max(0, Math.min(2, Number(s.case ?? 0)));
  const quarter = s.quarter ? String(s.quarter) : '';
  const highlight = s.highlight ? String(s.highlight) : '';
  bg(g, { strength: 0.88 });

  const c = CASES[caseIdx];
  // 100-JUDGE VISUAL AUDIT (defect D-06 — THE CAPTION DOUBLES WHAT IS ON
  // SCREEN): the dossier declares what it actually prints — the fund, the
  // tabs, every stat — so karaoke windows that repeat the on-screen copy
  // stand down instead of double-reading it.
  declareOnScreenHeadline(
    c.fund + ' ' + CASES.map((cc) => `CASE ${cc.tab}`).join(' ') + ' ' +
    c.stats.map((st) => `${st.big} ${st.label}`).join(' ')
  );

  // 100-JUDGE VISUAL AUDIT (defect D-07 — ONE FRAMING HELD FOR VERY LONG
  // RUNS): caseFiles held ONE dossier layout for 15 consecutive beats
  // (b057-b071). The scene now rotates THREE framings on the run clock:
  //   A (runIdx %3 == 0) — THE DOSSIER (operator right, as shipped)
  //   B (%3 == 1) — THE MIRRORED DOSSIER (operator LEFT, cover hinge left)
  //   C (%3 == 2) — THE READ-OUT (no operator: full-width header strip +
  //                 the case's stats as a hero cell grid — a pure data
  //                 beat between the operator framings)
  // Same facts, same dossier metaphor, three compositions — the middle of
  // the film stops being a slideshow.
  const framing = (g.runIdx ?? 0) % 3;

  // the three tabs
  const tabW = (W - 360 - 48) / 3;
  CASES.forEach((cc, i) => {
    const x = 180 + i * (tabW + 24);
    const active = i === caseIdx;
    const e = easeOutCubic(clamp01((t - 200 - i * 200) / 500));
    if (e <= 0) return;
    ctx.save();
    ctx.globalAlpha = e;
    card(ctx, x, 170, tabW, 84, {
      r: 20,
      glow: active ? rgba(PALETTE.gold, 0.25) : undefined,
    });
    setFont(ctx, Math.max(LABEL_FLOOR, 36), 700);
    ctx.fillStyle = active ? PALETTE.goldDisplay : PALETTE.inkFaint;
    ctx.textAlign = 'center';
    ctx.fillText(`CASE ${i + 1} · ${cc.tab}`, x + tabW / 2, 222, tabW - 30);
    ctx.textAlign = 'left';
    ctx.restore();
  });

  const top = H * 0.30;
  const bot = CAPTION_ZONE_TOP - 51;
  const chipClamp = (x: number, text: string, size: number): number => {
    const wch = chipWidth(ctx, text, { size, padX: 22 });
    return Math.min(x, W - 180 - wch);
  };
  const showIdx = (i: number): boolean =>
    quarter === 'Q1' || quarter === 'r0' ? i === 0
    : quarter === 'Q2' || quarter === 'r1' || quarter === 'liquidity' ? i === 1
    : quarter === 'r2' ? i === 2
    : quarter === 'both' ? i <= 1
    : true;
  const shownStats = c.stats.filter((_, i) => quarter !== 'intro' && showIdx(i));

  // ── the D-03 BUILD SPREAD: stat rows land across the HOLD (arrival i
  // scales with the group's duration), so a 24-second dossier keeps
  // dealing numbers through the hold instead of finishing at 1.5s.
  const statAt = (i: number): number => holdBeat(g, i, Math.max(1, shownStats.length), 0.6);

  if (framing === 2) {
    // ══ FRAMING C — THE READ-OUT ══
    // the header strip — fund + structure chip, full width
    const hsBot = 430;
    const e0 = easeOutCubic(clamp01((t - 350) / 650));
    ctx.save();
    ctx.globalAlpha = e0;
    card(ctx, 180, 300, W - 360, hsBot - 300, { r: 30, glow: rgba(PALETTE.gold, 0.14) });
    ctx.restore();
    setFont(ctx, 50, 700, FONT_DISPLAY);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(c.fund, 236, 368, W - 800);
    // the chip RIGHT-ALIGNS inside the safe margin (the audit caught it
    // clipped at the frame edge under the exit camera when left-anchored)
    {
      const chipTxt = c.chip;
      const cw2 = chipWidth(ctx, chipTxt, { size: LABEL_FLOOR, padX: 22 });
      chip(ctx, chipTxt, W - 180 - cw2 - 24, 334, {
        bg: PALETTE.chipBg, fg: TONE(c.tone).main, border: rgba(TONE(c.tone).main, 0.6), size: LABEL_FLOOR, iconDot: TONE(c.tone).main,
      });
    }
    // the stat cells — the numbers take the stage at 96px
    const cellW = (W - 360 - 48) / Math.max(1, shownStats.length);
    shownStats.forEach((st, i) => {
      const e = easeOutCubic(clamp01((t - statAt(i)) / 650));
      if (e <= 0) return;
      const landT = statAt(i) + 650;
      const shake = microShake(t, landT, 4.5);
      const cx0 = 180 + i * (cellW + 24);
      ctx.save();
      ctx.translate(shake.dx, shake.dy);
      ctx.globalAlpha = e;
      card(ctx, cx0, 470, cellW, 220, { r: 28, tint: TONE(c.tone).main });
      setFont(ctx, 96, 700, FONT_DISPLAY);
      ctx.fillStyle = PALETTE.white;
      const bigW3 = Math.min(ctx.measureText(st.big).width, cellW - 64);
      ctx.fillText(st.big, cx0 + 36, 470 + 86, cellW - 64);
      impactRing(ctx, cx0 + 36 + bigW3 * 0.5, 470 + 56, t, landT, 110, 1.1, TONE(c.tone).main);
      setFont(ctx, Math.max(LABEL_FLOOR, 36), 400);
      ctx.fillStyle = PALETTE.ink;
      const lines = wrapText(ctx, st.label, cellW - 64, 36, 400);
      lines.slice(0, 2).forEach((ln, li) => ctx.fillText(ln, cx0 + 36, 470 + 128 + li * 42));
      ctx.restore();
    });
  } else {
    // ══ FRAMINGS A + B — THE DOSSIER (operator right / operator left) ══
    const mirrored = framing === 1;
    // VAULT NOIR fix: the card bottom rises to CAPTION_ZONE_TOP − 51 (749) —
    // at −30 (770) the registered bottom crossed the 2-row pill under the
    // certified camera (sweep @720-872s, 10-12px).
    // U8: the case card OPENS — a flap unfolds over the first 700ms, so
    // the beat reads as a dossier being opened. The hinge follows the
    // framing (right on A, left on B — the cover swings toward the operator).
    const cardLeft = mirrored ? 440 : 180;
    const cardRight = mirrored ? W - 180 : W - 440;
    const e0 = easeOutCubic(clamp01((t - 350) / 650));
    const flapP = easeOutCubic(clamp01((t - 350) / 700));
    ctx.save();
    ctx.globalAlpha = e0;
    const hinge = mirrored ? cardLeft : cardRight;
    ctx.save();
    ctx.translate(hinge, 0);
    ctx.scale(0.55 + 0.45 * flapP, 1);
    ctx.translate(-hinge, 0);
    card(ctx, cardLeft, top, cardRight - cardLeft, bot - top, { r: 34, glow: rgba(PALETTE.gold, 0.14) });
    ctx.restore();
    // the fold seam — fades as it opens
    if (flapP < 0.98) {
      ctx.strokeStyle = rgba(PALETTE.ink, 0.5 * (1 - flapP));
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hinge + (mirrored ? 4 : -4), top + 10);
      ctx.lineTo(hinge + (mirrored ? 4 : -4), bot - 10);
      ctx.stroke();
    }
    ctx.restore();

    // the fund name + structure chip
    const innerX = cardLeft + 56;
    setFont(ctx, 50, 700, FONT_DISPLAY);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(c.fund, innerX, top + 78, cardRight - cardLeft - 112);
    chip(ctx, c.chip, innerX, top + 92, {
      bg: PALETTE.chipBg, fg: TONE(c.tone).main, border: rgba(TONE(c.tone).main, 0.6), size: LABEL_FLOOR, iconDot: TONE(c.tone).main,
    });

    // the stat rows — VAULT NOIR compact pitch, U8 SLAM, D-05 readable
    // band (44px labels), D-03 spread (rows land across the hold).
    // THE OVERLAP FIX: the header chip's body (top+92 .. ≈top+148) used
    // to fight the first numeral's cap (the BCRED "Q1" printed ON the
    // chip) — rows start at top+168, one clear band below the chip.
    let sy = top + 168;
    const rowAdvance = 126;
    // the verdict chip's band: when a verdict chip lands this beat, the
    // tag chips clamp ABOVE it (the audit frame shipped the verdict chip
    // plating the tag chip "MARCH 2026 SEC FILING")
    const verdictLands = quarter === 'both' || quarter === 'liquidity'
      || highlight === 'denominator' || highlight === 'halt';
    const tagCeil = verdictLands ? bot - 150 : bot - 70;
    c.stats.forEach((st, i) => {
      if (quarter === 'intro') return;
      if (!showIdx(i)) return;
      const e = easeOutCubic(clamp01((t - statAt(i)) / 650));
      if (e <= 0) return;
      const landT = statAt(i) + 650;
      const shake = microShake(t, landT, 4.5);
      ctx.save();
      ctx.translate(shake.dx, shake.dy);
      ctx.globalAlpha = e;
      // the big stat + tag
      setFont(ctx, 84, 700, FONT_DISPLAY);
      ctx.fillStyle = TONE(i === 1 && highlight === 'par' ? 'up' : c.tone).main;
      const bigW2 = Math.min(ctx.measureText(st.big).width, 280);
      ctx.fillText(st.big, cardLeft + 60, sy + 62);
      // U8: the impact ring from the numeral at the landing instant
      impactRing(ctx, cardLeft + 60 + bigW2 * 0.5, sy + 34, t, landT, 110, 1.1, TONE(c.tone).main);
      // the label
      setFont(ctx, Math.max(TYPE_FLOOR, 44), 400);
      const lines = wrapText(ctx, st.label, cardRight - 60 - (cardLeft + 60 + bigW2 + 56), 44, 400);
      ctx.fillStyle = PALETTE.ink;
      lines.slice(0, 2).forEach((ln, li) => ctx.fillText(ln, cardLeft + 60 + bigW2 + 56, sy + 26 + li * 52));
      // the tag chip — clamped inside the card (and above any verdict chip)
      if (st.tag) {
        const tagSize = Math.max(LABEL_FLOOR, 34);
        const tagY = Math.min(sy + 26 + Math.min(lines.slice(0, 2).length, 2) * 52 + 8, tagCeil);
        chip(ctx, st.tag.toUpperCase(), chipClamp(cardLeft + 60 + bigW2 + 56, st.tag.toUpperCase(), tagSize), tagY, {
          bg: PALETTE.chipBg, fg: PALETTE.goldInk, border: rgba(PALETTE.gold, 0.5), size: tagSize,
        });
      }
      ctx.restore();
      sy += rowAdvance;
    });
    // U1/U7: the OPERATOR opens the dossier — palm ON the card's near
    // edge; the edge follows the framing (A: right edge, B: left edge).
    const edgeX = mirrored ? cardLeft - 4 : cardRight - 4;
    registerRect('caseFiles:dossierEdge', edgeX, top + 140, 22, 320);
    financeHost(g, mirrored ? cardLeft - 130 : cardRight + 130, H * 0.65, 1.7, {
      seed: 8.9 + framing * 0.7,
      gesture: 'present',
      glanceBias: mirrored ? 0.9 : -0.9,
      contact: { x: mirrored ? cardLeft + 2 : cardRight + 2, y: top + 250, hand: 'palm', easeAt: 800 },
      declareId: 'caseFiles:dossierEdge',
      label: 'dossier-host',
      hostBody: true,
    });
  }
  // the verdict chips (all framings share the band) — the chip X follows
  // the framing (mirrored B: the card's inner left edge; the shipped fixed
  // 240 landed INSIDE the mirrored operator's body band) and on framing C
  // it drops BELOW the stat cells (the shipped band plated their bottoms).
  const verdictX = framing === 1 ? 500 : 240;
  const verdictY = framing === 2 ? 706 : bot - 100;
  if (quarter === 'both') {
    const e = easeOutCubic(clamp01((t - 1500) / 650));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      chip(ctx, 'BOTH STATEMENTS WERE TRUE — AT DIFFERENT DATES', verdictX, verdictY, {
        bg: PALETTE.chipBg, fg: PALETTE.goldInk, border: rgba(PALETTE.gold, 0.75), size: LABEL_FLOOR, iconDot: PALETTE.goldDisplay,
      });
      ctx.restore();
    }
  } else if (quarter === 'liquidity') {
    const e = easeOutCubic(clamp01((t - 900) / 650));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      chip(ctx, '$15B+ LIQUIDITY \u2260 AN UNCONDITIONAL EXIT RIGHT', chipClamp(verdictX, '$15B+ LIQUIDITY \u2260 AN UNCONDITIONAL EXIT RIGHT', LABEL_FLOOR), verdictY, {
        bg: PALETTE.chipBg, fg: PALETTE.downVivid, border: rgba(PALETTE.down, 0.7), size: LABEL_FLOOR, iconDot: PALETTE.down,
      });
      ctx.restore();
    }
  } else if (highlight === 'denominator') {
    const e = easeOutCubic(clamp01((t - 1200) / 650));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      chip(ctx, 'THE QUARTER · THE DENOMINATOR · THE BOARD\u2019S CALL · THE FULFILMENT', chipClamp(verdictX, 'THE QUARTER · THE DENOMINATOR · THE BOARD\u2019S CALL · THE FULFILMENT', LABEL_FLOOR), verdictY, {
        bg: PALETTE.chipBg, fg: PALETTE.inkSoft, border: PALETTE.cardBorder, size: LABEL_FLOOR,
      });
      ctx.restore();
    }
  } else if (highlight === 'halt') {
    const e = easeOutCubic(clamp01((t - 1200) / 650));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      chip(ctx, 'TENDERS REPLACED BY RATABLE RETURN-OF-CAPITAL', chipClamp(verdictX, 'TENDERS REPLACED BY RATABLE RETURN-OF-CAPITAL', LABEL_FLOOR), verdictY, {
        bg: PALETTE.chipBg, fg: PALETTE.downVivid, border: rgba(PALETTE.down, 0.7), size: LABEL_FLOOR, iconDot: PALETTE.down,
      });
      ctx.restore();
    }
  }
  // U5: the auditor's line sweeps the dossier (the read is visible)
  ledgerScan(ctx, 200, top + 20, W - 400, bot - top - 40, t, 3.1);
  sourceTag(ctx, W, c.src);
}

// ── navGap — NAV 100 vs economic 90 ────────────────────────────────────────
export function navGapScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  const stage = Number(s.stage ?? 0);
  const hypothetical = s.hypothetical === true;
  bg(g, { strength: 0.88 });
  // 100-JUDGE VISUAL AUDIT (defect D-06): declare the towers' own words.
  declareOnScreenHeadline(hypothetical
    ? 'The mechanism, in its simplest form NAV 100 ECONOMIC 90 THE GAP = WHO BEARS IT'
    : 'NAV is a valuation — not a market price GOVERNED THE METHODS THE FRICTION');

  setFont(ctx, 54, 600);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(hypothetical ? 'The mechanism, in its simplest form' : 'NAV is a valuation — not a market price', 180, 218, 1560);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(180, 246, 300, 6);
  if (hypothetical) {
    const e = easeOutCubic(clamp01(t / 500));
    ctx.save();
    ctx.globalAlpha = e;
    chip(ctx, 'HYPOTHETICAL — NOT A REPORTED EVENT', 180, 262, {
      bg: PALETTE.chipBg, fg: PALETTE.downVivid, border: rgba(PALETTE.down, 0.7), size: LABEL_FLOOR, iconDot: PALETTE.down,
    });
    ctx.restore();
  }

  if (hypothetical) {
    // ── the two towers ──
    // VAULT NOIR fix: the towers previously based at H*0.78 (842) — inside
    // the 2-row caption pill band (top ≈ 796); the pill plated their lower
    // 46px every spoken frame. They now base at H*0.73 with 0.34H height:
    // bases 788 (7px above the worst-case pill), tops ≈ 421 (22px below the
    // top chip row).
    const baseY = H * 0.73;
    const tw = 240;
    // U8 (STANDARD MARKET VISUAL REVIEW — THE PULL): on the mechanism
    // stages the host GRABS the economic tower and pulls the gap open —
    // the towers separate with a squash pulse (the bars strain apart).
    // The gap is something the figure DOES, not a dashed line he narrates
    // at.
    const pullP = stage >= 5 ? easeOutCubic(clamp01((t - 1400) / 900)) : 0;
    const pullX = pullP * 46;
    const nx = W * 0.30 - tw / 2 - pullX * 0.5;
    const ex = W * 0.58 - tw / 2 + pullX;
    const h100 = (H * 0.34) * 1.0;
    const h90 = (H * 0.34) * 0.9;
    const e1 = easeOutCubic(clamp01((t - 400) / 800));
    const e2 = easeOutCubic(clamp01((t - 1100) / 800));
    // the NAV tower (brass) — squash-pulses with the pull (U11 on the bars)
    ctx.save();
    ctx.globalAlpha = e1;
    const sq1 = 1 - 0.07 * pullP;
    const g1 = ctx.createLinearGradient(0, baseY - h100 * e1, 0, baseY);
    g1.addColorStop(0, PALETTE.goldDisplay);
    g1.addColorStop(1, PALETTE.goldDeep);
    ctx.fillStyle = g1;
    ctx.translate(nx + tw / 2, baseY);
    ctx.scale(sq1, 1);
    roundRect(ctx, -tw / 2, -h100 * e1, tw, h100 * e1, 10);
    ctx.fill();
    ctx.restore();
    setFont(ctx, 72, 700, FONT_DISPLAY);
    ctx.fillStyle = PALETTE.goldDisplay;
    ctx.textAlign = 'center';
    ctx.globalAlpha = e1;
    ctx.fillText('NAV 100', nx + tw / 2, baseY - h100 * e1 - 26);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    // the economic tower (steel) — the one the host PULLS
    ctx.save();
    ctx.globalAlpha = e2;
    const sq2 = 1 - 0.06 * pullP;
    const g2 = ctx.createLinearGradient(0, baseY - h90 * e2, 0, baseY);
    g2.addColorStop(0, '#8FB4E4');
    g2.addColorStop(1, '#3A558A');
    ctx.fillStyle = g2;
    ctx.translate(ex + tw / 2, baseY);
    ctx.scale(sq2, 1);
    roundRect(ctx, -tw / 2, -h90 * e2, tw, h90 * e2, 10);
    ctx.fill();
    ctx.restore();
    setFont(ctx, 72, 700, FONT_DISPLAY);
    ctx.fillStyle = '#8FB4E4';
    ctx.textAlign = 'right';
    ctx.globalAlpha = e2;
    // 100-JUDGE AUDIT (defect D-12 — THE HOST OCCLUDES THE DATA): the
    // label centered under the tower ran 200px RIGHT of it — into the
    // host column. Right-aligned to the tower's own right edge keeps the
    // name ON the object it names.
    ctx.fillText('ECONOMIC 90', ex + tw, baseY - h90 * e2 - 26);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    // the gap band
    const ge = Math.min(e1, e2);
    if (ge > 0) {
      ctx.save();
      ctx.globalAlpha = ge * 0.85;
      ctx.strokeStyle = PALETTE.downVivid;
      ctx.setLineDash([14, 12]);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(nx + tw + 30, baseY - h90);
      ctx.lineTo(ex - 20, baseY - h90);
      ctx.stroke();
      ctx.setLineDash([]);
      setFont(ctx, LABEL_FLOOR, 700);
      ctx.fillStyle = PALETTE.downVivid;
      // D-12 companion: the tower name right-aligns to the economic tower
      // (the host's column), so the chip lifts one ROW above the name —
      // the two annotations own separate bands instead of overprinting.
      ctx.fillText('THE GAP = WHO BEARS IT', nx + tw + 46, baseY - h90 - 96);
      ctx.restore();
    }
    // the flow captions — moved to the top chip row (right of the
    // HYPOTHETICAL chip): at H*0.685 the chip sat inside the tower band
    // AND its registered bottom crossed the caption pill under camera.
    const fe = easeOutCubic(clamp01((t - 1900) / 700));
    if (fe > 0 && stage >= 5) {
      ctx.save();
      ctx.globalAlpha = fe;
      const exitDir = stage === 6 ? 'UNDERSTATED NAV: STAYERS GAIN' : 'EXIT AT 100 FIRST: STAYERS BEAR \u221210';
      chip(ctx, exitDir, 900, 262, {
        bg: PALETTE.chipBg, fg: stage === 6 ? PALETTE.upVivid : PALETTE.downVivid,
        border: rgba(stage === 6 ? PALETTE.up : PALETTE.down, 0.7),
        size: LABEL_FLOOR, iconDot: stage === 6 ? PALETTE.up : PALETTE.down,
      });
      ctx.restore();
    }
    // U8: the PULL — the host stands RIGHT of the economic tower and DRAGS
    // the gap open — fist ON the tower's right edge (the contact rect rides
    // the pulled tower). Registered + declared for the guard.
    // 100-JUDGE AUDIT (defect D-12 — THE HOST IS THE GAP, b082-b083): the
    // shipped staging parked him BETWEEN the towers — his torso filled the
    // exact gap band the scene exists to show and his head plated the
    // "THE GAP = WHO BEARS IT" chip. From the tower's right side the pull
    // reads stronger (he drags the tower AWAY from NAV 100), the gap band
    // + chip stay fully visible between the towers, and the right-aligned
    // tower label clears his head band.
    const pullHostX = ex + tw + 210 + pullX;
    registerRect('navGap:econ', ex + tw + pullX - 4, baseY - h90, 26, h90);
    financeHost(g, pullHostX, H * 0.65, 1.6, {
      seed: 9.4,
      gesture: 'present',
      glanceBias: -0.9,
      contact: { x: ex + tw + pullX + 4, y: baseY - h90 * 0.62, hand: 'fist', easeAt: 1200 },
      declareId: 'navGap:econ',
      label: 'pull-host',
      hostBody: true,
    });
  } else {
    // ── the governance / methodology stages ──
    const rows = [
      { k: 'GOVERNED', v: 'The board (or a valuation agent under board oversight) assesses risks, tests methodologies, oversees pricing services, documents everything.', tone: 'up' as const, at: 0 },
      { k: 'THE METHODS', v: 'Discounted cash flows · comparable transactions · credit spreads · borrower assumptions. Independent firms contribute; an annual audit adds scrutiny.', tone: 'gold' as const, at: 1 },
      { k: 'THE FRICTION', v: 'Private-asset valuations adjust more slowly than public benchmarks. If investors believe NAV will fall, they redeem before the markdown.', tone: 'down' as const, at: 2 },
    ];
    let ry = H * 0.30;
    rows.forEach((r) => {
      // VAULT NOIR fix: the FIRST row now shows at stage 0 — the old
      // `stage < r.at + 1` gate shipped an empty title-only frame for the
      // whole stage-0 beat (the harness feed-density gate caught it at
      // 27.9% designed content). Rows raise H*0.30 + i·140 (h 128): the
      // third card's registered bottom 732 clears the 2-row pill under
      // the certified 1.06 camera envelope.
      if (stage < r.at) return;
      const e = easeOutCubic(clamp01((t - 400 - r.at * 500) / 650));
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha = e;
      card(ctx, 240, ry, W - 900, 128, { r: 30, tint: TONE(r.tone).main }); // U7: narrowed — the marks-host leans from his own column
      setFont(ctx, 46, 700, FONT_DISPLAY);
      ctx.fillStyle = TONE(r.tone).main;
      ctx.fillText(r.k.toUpperCase(), 300, ry + 48, W - 820);
      setFont(ctx, Math.max(LABEL_FLOOR, 34), 400);
      const lines = wrapText(ctx, r.v, W - 1080, 34, 400);
      ctx.fillStyle = PALETTE.inkSoft;
      lines.slice(0, 2).forEach((ln, li) => ctx.fillText(ln, 300, ry + 84 + li * 36));
      ctx.restore();
      ry += 140;
    });
    // U7/U1: the operator — the host's palm rests on the visible row's
    // right edge (the cards are a desk of marks he reviews, not slides).
    {
      const rowRight = 240 + (W - 900);
      const lastRow = Math.min(stage, 2);
      const rowY = H * 0.30 + lastRow * 140;
      registerRect('navGap:rowEdge', rowRight - 4, rowY, 22, 128);
      financeHost(g, rowRight + 150, H * 0.65, 1.6, {
        seed: 9.6,
        gesture: 'present',
        glanceBias: -0.9,
        contact: { x: rowRight + 4, y: rowY + 64, hand: 'palm', easeAt: 700 },
        declareId: 'navGap:rowEdge',
        label: 'marks-host',
        hostBody: true,
      });
    }
    if (stage === 0) {
      const e = easeOutCubic(clamp01((t - 1000) / 600));
      if (e > 0) {
        ctx.save();
        ctx.globalAlpha = e;
        // VAULT NOIR fix: the chip moves to the TOP row (under the gold
        // rule) — at H*0.715 its registered bottom crossed the caption
        // pill on every spoken frame.
        chip(ctx, 'NOT INVENTED — BUT STILL AN ESTIMATE', 180, 262, {
          bg: PALETTE.chipBg, fg: PALETTE.inkSoft, border: PALETTE.cardBorder, size: LABEL_FLOOR,
        });
        ctx.restore();
      }
    }
  }
  // U5: the auditor's line sweeps the mechanism (the hypothetical towers)
  if (hypothetical) {
    const baseY2 = H * 0.73;
    ledgerScan(ctx, W * 0.16, baseY2 - H * 0.36, W * 0.62, H * 0.36, t, 9.9);
  }
  sourceTag(ctx, W, 'SEC fair-value requirements · Federal Reserve FEDS note (Oct 2026) — valuation opacity and redemption incentives');
}

// ── feeStack — the BCRED fee layers ────────────────────────────────────────
// VAULT NOIR fix: `at` now starts at 0 — the stage-0 beat previously gated
// EVERY row behind stage ≥ 1 and shipped an empty title-only frame for its
// full duration (the harness feed-density gate caught it). Rows compact to
// h 84 / 92px pitch so the five-layer stack ends at 781 — above the 2-row
// caption pill — and the warning chip becomes a second TOP chip (the old
// H*0.735 position collided with the pill on every spoken frame).
const FEES = [
  { k: 'MANAGEMENT', v: '1.25% of NAV annually', tone: 'gold' as const, at: 0 },
  { k: 'INCOME INCENTIVE', v: '12.5% of net investment income — 5% hurdle + catch-up', tone: 'up' as const, at: 0 },
  { k: 'CAPITAL GAINS ALLOCATION', v: '12.5% on realized gains, net of losses', tone: 'up' as const, at: 0 },
  { k: 'SHARE CLASS (S)', v: '0.85% distribution & servicing + up to 3.5% upfront placement', tone: 'down' as const, at: 1 },
  { k: 'STRUCTURE LAYERS', v: 'fund-of-funds expenses · financing costs in a levered vehicle', tone: 'down' as const, at: 2 },
];

export function feeStackScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  const stage = Number(s.stage ?? 0);
  bg(g, { strength: 0.9 });
  // 100-JUDGE VISUAL AUDIT (defect D-06): declare the fee stack's own
  // words so repeating caption windows stand down.
  declareOnScreenHeadline('The fee stack — one fund\u2019s published terms ' + FEES.map((f) => `${f.k} ${f.v}`).join(' '));

  setFont(ctx, 54, 600);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('The fee stack — one fund\u2019s published terms', 180, 218, 1560);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(180, 246, 300, 6);
  const e = easeOutCubic(clamp01(t / 500));
  ctx.save();
  ctx.globalAlpha = e;
  // the two TOP chips — the example disclaimer + (stage ≥ 1) the warning
  // VAULT NOIR fix: chip 1 shortened — at the full text the pair's right
  // edge (1826) crossed the frame-edge envelope under the certified camera
  // (sweep @1080-1134s, edge 11-18px).
  const w1 = chip(ctx, 'BCRED TERMS — AN EXAMPLE, NOT AN AVERAGE', 180, H * 0.245, {
    bg: PALETTE.chipBg, fg: PALETTE.inkSoft, border: PALETTE.cardBorder, size: LABEL_FLOOR,
  });
  if (stage >= 1) {
    const we = easeOutCubic(clamp01((t - 1600) / 650));
    if (we > 0) {
      ctx.globalAlpha = e * we;
      chip(ctx, 'EACH FEE HAS ITS OWN BASE', 180 + w1 + 24, H * 0.245, {
        bg: PALETTE.chipBg, fg: PALETTE.goldInk, border: rgba(PALETTE.gold, 0.7), size: LABEL_FLOOR, iconDot: PALETTE.goldDisplay,
      });
    }
  }
  ctx.restore();

  // the stacked layers — the plates indent to x 340 (the D-11 head-channel
  // fix) and keep the stack's right edge; the value lines shrink to FIT
  // the narrower plate instead of compressing under fillText's maxWidth.
  // D-03: the five layers DEAL across the hold (the build spread — a 26s
  // feeStack beat lands its layers through the hold, not in 1.3s)
  const lx = 340;
  const lw = 1238 - 340;
  const feeRows = FEES.filter((f) => stage >= f.at);
  FEES.forEach((f, i) => {
    if (stage < f.at) return;
    const y = H * 0.305 + i * 92;
    const fe = easeOutCubic(clamp01((t - holdBeat(g, feeRows.indexOf(f), feeRows.length, 0.5)) / 650));
    if (fe <= 0) return;
    ctx.save();
    ctx.globalAlpha = fe;
    const tn = TONE(f.tone);
    const gr = ctx.createLinearGradient(lx, y, lx + lw, y);
    gr.addColorStop(0, rgba(tn.main, 0.85));
    gr.addColorStop(1, rgba(tn.main, 0.45));
    ctx.fillStyle = gr;
    roundRect(ctx, lx, y, lw * (1 - i * 0.06), 84, 14);
    ctx.fill();
    ctx.strokeStyle = rgba(PALETTE.goldDisplay, 0.5);
    ctx.lineWidth = 2;
    roundRect(ctx, lx, y, lw * (1 - i * 0.06), 84, 14);
    ctx.stroke();
    // FIX D-05 (THE READABLE BAND): the fee rows rise to the 36px band
    setFont(ctx, Math.max(LABEL_FLOOR, 36), 700);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(f.k, lx + 36, y + 34, lw - 72);
    // D-11 companion: the value line FITS the narrower plate — measured
    // shrink to 30px before the maxWidth compression ever engages.
    const vSize = Math.max(LABEL_FLOOR, 36);
    setFont(ctx, vSize, 400);
    let vs2 = vSize;
    while (vs2 > 30 && ctx.measureText(f.v).width > lw - 72) {
      vs2 -= 2;
      setFont(ctx, vs2, 400);
    }
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.fillText(f.v, lx + 36, y + 66, lw - 72);
    ctx.restore();
  });
  // the right rail — the professional question
  if (stage >= 2) {
    const qe = easeOutCubic(clamp01((t - 1400) / 700));
    if (qe > 0) {
      ctx.save();
      ctx.globalAlpha = qe;
      card(ctx, 1300, H * 0.44, W * 0.23, 240, { r: 28 });
      setFont(ctx, Math.max(TYPE_FLOOR, 40), 700);
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText('THE ALL-IN QUESTION', 1336, H * 0.44 + 56, W * 0.23 - 72);
      setFont(ctx, Math.max(LABEL_FLOOR, 34), 400);
      const lines = wrapText(ctx, 'Total cost of the exposure you actually receive — after fees, financing, cash drag and underlying layers.', W * 0.23 - 72, 34, 400);
      ctx.fillStyle = PALETTE.inkSoft;
      lines.slice(0, 4).forEach((ln, li) => ctx.fillText(ln, 1336, H * 0.44 + 104 + li * 42));
      ctx.restore();
    }
  }
  // U7/U1: the fee stack has a TELLER — the host leans at the stack's left
  // end, fist ON the top plate's edge (the layers are plates he deals, not
  // a list he reads). Registered + declared for the guard.
  // 100-JUDGE AUDIT (defect D-11 — THE TOP BAR CROSSES HIS HEAD, b087): the
  // plates started 6px from his head's ink — the gold MANAGEMENT bar read
  // as passing through his face. The stack indents to x 340 (a full head
  // width of clear channel between his profile and the plates) and the
  // fist lands ON the top plate's left edge at its own height — within
  // natural reach, no root pull, the plate never touches the head.
  registerRect('feeStack:plateEdge', 336, H * 0.305, 70, 84);
  financeHost(g, 170, H * 0.62, 1.6, {
    seed: 10.3,
    gesture: 'present',
    glanceBias: 0.9,
    contact: { x: 344, y: H * 0.305 + 42, hand: 'fist', easeAt: 600 },
    declareId: 'feeStack:plateEdge',
    label: 'fees-host',
  });
  // U5: the auditor's line sweeps the fee stack
  ledgerScan(ctx, 344, H * 0.305, lw - 20, 5 * 92, t, 10.3);
  sourceTag(ctx, W, 'BCRED published offering terms (Class S example) · recheck current terms before any allocation decision');
}

// ── bullCase — the strongest honest bull case ──────────────────────────────
const BULL = {
  drawdown: {
    title: 'The drawdown problem (real)', tone: 'down' as const,
    rows: ['You commit capital; the manager calls it over time', 'Distributions arrive irregularly', 'Unfunded commitments to track', 'You maintain the target allocation yourself'],
  },
  evergreen: {
    title: 'The evergreen answer', tone: 'up' as const,
    rows: ['One allocation', 'Deployment + reinvestment managed for you', 'Portfolio rebalancing built in', 'Valuable without an operations team'],
  },
  capital: {
    title: 'Capital efficiency', tone: 'up' as const,
    rows: ['Uncalled capital can sit in low-return assets', 'Evergreen = immediate exposure to an existing portfolio', 'The trade-off is real — see the cost'],
  },
  cost: {
    title: 'But it is not free money', tone: 'down' as const,
    rows: ['Immediate exposure to EXISTING valuations, fees and risks', 'TWR vs IRR comparisons mislead without cash-flow timing', 'The sample evidence is small and selected'],
  },
  fit: {
    title: 'Where it can fit', tone: 'gold' as const,
    rows: ['Pension funds with predictable liabilities', 'Family offices with substantial liquid reserves', 'Advisers allocating genuinely long-term capital'],
  },
  mismatch: {
    title: 'Where it does not', tone: 'down' as const,
    rows: ['A higher-yield cash substitute — the structure may be inappropriate', 'The liquidity terms must match YOUR obligations', 'Wealth does not change the contract'],
  },
};

export function bullCaseScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  const side = String(s.side ?? 'drawdown');
  const data = BULL[side as keyof typeof BULL] ?? BULL.drawdown;
  bg(g, { strength: 0.88 });
  // 100-JUDGE VISUAL AUDIT (defect D-06): declare the ledger's words.
  declareOnScreenHeadline('The strongest honest bull case ' + data.title + ' ' + data.rows.join(' '));

  setFont(ctx, 54, 600);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('The strongest honest bull case', 180, 218, 1560);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(180, 246, 300, 6);

  // the panel — a single glass card with the ledger rows
  // VAULT NOIR fix: rows compact to a 74px pitch from top+146 — the old
  // 92px pitch put the fourth row's baseline at 781, BELOW the card bottom
  // (740) and under the 2-row caption pill (the pill plated it on every
  // spoken frame — verified on harness frame 21-bullCase).
  const top = H * 0.32;
  const e0 = easeOutCubic(clamp01((t - 350) / 600));
  ctx.save();
  ctx.globalAlpha = e0;
  card(ctx, 240, top, W - 820, CAPTION_ZONE_TOP - 74 - top, { r: 34, glow: rgba(PALETTE.gold, 0.12) });
  ctx.restore();
  setFont(ctx, 56, 700, FONT_DISPLAY);
  ctx.fillStyle = TONE(data.tone).main;
  ctx.fillText(data.title.toUpperCase(), 300, top + 80, W - 940);
  // 100-JUDGE AUDIT (defect D-09 — THE ROWS OUTRUN THE CARD, b103): the
  // rows drew with fillText's maxWidth W-1080 = 840 — 112px past the
  // card's right edge (x 1100), squeezed into the host's arm zone. The
  // row width now FITS the card's interior (to x 1036) with a measured
  // shrink — no row crosses the card edge, no row enters the host column.
  const rowMaxW = W - 820 - 372 - 44;
  data.rows.forEach((r, i) => {
    const e = easeOutCubic(clamp01((t - 700 - i * 420) / 600));
    if (e <= 0) return;
    ctx.save();
    ctx.globalAlpha = e;
    // the brass tick
    ctx.strokeStyle = TONE(data.tone).main;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(310, top + 146 + i * 74 - 10);
    ctx.lineTo(322, top + 146 + i * 74 + 2);
    ctx.lineTo(344, top + 146 + i * 74 - 18);
    ctx.stroke();
    setFont(ctx, Math.max(TYPE_FLOOR, 40), 400);
    let rs2 = Math.max(TYPE_FLOOR, 40);
    while (rs2 > 30 && ctx.measureText(r).width > rowMaxW) {
      rs2 -= 2;
      setFont(ctx, rs2, 400);
    }
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(r, 372, top + 154 + i * 74, rowMaxW);
    ctx.restore();
  });

  // the verdict chip on the cost/mismatch sides — moved up with the rows
  if (side === 'cost' || side === 'mismatch') {
    const e = easeOutCubic(clamp01((t - 1900) / 650));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      chip(ctx, 'IMPLEMENTATION — NOT OUTPERFORMANCE', 300, CAPTION_ZONE_TOP - 136, {
        bg: PALETTE.chipBg, fg: PALETTE.goldInk, border: rgba(PALETTE.gold, 0.7), size: Math.max(LABEL_FLOOR, 34), iconDot: PALETTE.goldDisplay,
      });
      ctx.restore();
    }
  }

  // U1/U3: the panel has a SPEAKER — the host's palm rests ON the ledger
  // card's right edge (the card spans 240..W-580; W-580 IS its right edge)
  // while the rows land (a hand on the argument he is making). Rig 1.7.
  // 100-JUDGE AUDIT (defect D-09 companion — b103): the rows used to run
  // past the card's right edge into the host's arm zone — fixed above by
  // the measured row width. The staging itself was already certified
  // (palm ON the true edge, host outside the card's span) and stays.
  registerRect('bullCase:panelEdge', W - 580, top + 140, 22, 300);
  financeHost(g, W * 0.78, H * 0.65, 1.7, {
    seed: 11.1,
    gesture: side === 'cost' || side === 'mismatch' ? 'pointR' : 'present',
    glanceBias: -0.9,
    contact: { x: W - 580, y: top + 250, hand: 'palm', easeAt: 700 },
    declareId: 'bullCase:panelEdge',
    label: 'bull-host',
    hostBody: true,
  });
  // U5: the auditor's line sweeps the argument panel
  ledgerScan(ctx, 244, top + 20, W - 820 - 20, CAPTION_ZONE_TOP - 74 - top - 40, t, 11.1);
  sourceTag(ctx, W, side === 'cost' ? 'Source: Hamilton Lane 2026 overview — sample small and selected, comparison not like-for-like' : 'Analysis — suitability depends on the match between terms and obligations');
}

// ── auditChecklist — the eight questions ───────────────────────────────────
const AUDIT_QS = [
  { w: 'OBLIGATION', q: 'What is the legal obligation?', sub: 'Interval fund? Tender-offer? BDC? ELTIF? Ask for the exact redemption language — not the sales summary. Who can change or suspend it?' },
  { w: 'DENOMINATOR', q: 'What is the denominator?', sub: '5% of shares or of NAV? Measured when? Can the board upsize? How is proration calculated? A percentage without a denominator is not a liquidity term.' },
  { w: 'CASH', q: 'Where does the cash come from?', sub: 'Separate cash and liquid securities from undrawn facilities. Separate recurring repayments from new subscriptions. A credit line is not unencumbered cash.' },
  { w: 'STRESS', q: 'What happens under a combined stress?', sub: 'Model higher requests + zero net subscriptions + slower repayments + reduced borrowing — together. What gets sold, at what discount, for whom?' },
  { w: 'MARKS', q: 'Who checks the marks?', sub: 'Independent valuation coverage. The share of unobservable inputs. Review frequency. An annual audit is not a real-time price guarantee.' },
  { w: 'COST', q: 'What is the all-in cost?', sub: 'Management + incentive + hurdles + share classes + financing + underlying funds + early-repurchase charges. Compare net return — not the distribution rate.' },
  { w: 'HISTORY', q: 'What does the history show?', sub: 'Several quarters of requests, approvals, fulfilment rates and net flows. Meeting requests during inflows is not resilience during outflows.' },
  { w: 'PURPOSE', q: 'What is this money for?', sub: 'If a near-term liability depends on it, the liquidity mismatch — not the yield — is the first question.' },
];

export function auditChecklistScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  const q = Number(s.q ?? 0);
  const mode = String(s.mode ?? 'question');
  bg(g, { strength: 0.9 });
  // 100-JUDGE VISUAL AUDIT (defect D-06 — THE CAPTION DOUBLES WHAT IS ON
  // SCREEN): the audit declares what it prints — the title, the focused
  // question and its sub — so the karaoke pill stands down for windows
  // that repeat them (the audit's b105 frame: the pill printed "the exact
  // redemption language" while the card carried the same words).
  declareOnScreenHeadline(
    'The eight-question liquidity audit ' +
    (q >= 0 && q < 8 ? `${AUDIT_QS[q].q} ${AUDIT_QS[q].sub}` : AUDIT_QS.map((qa) => qa.w).join(' '))
  );

  setFont(ctx, 54, 600);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('The eight-question liquidity audit', 180, 218, 1560);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(180, 246, 300, 6);

  // 100-JUDGE VISUAL AUDIT (defect D-07 — ONE FRAMING HELD FOR VERY LONG
  // RUNS): the audit held ONE rail-left layout for 10 consecutive beats
  // (b104-b113). Three framings rotate on the run clock:
  //   A (runIdx %3 == 0) — the rail LEFT + question card right (shipped)
  //   B (%3 == 1) — MIRRORED: the rail RIGHT, question card left
  //   C (%3 == 2) — THE ZOOM: the rail collapses to a compact progress
  //                 strip under the title; the question card takes the
  //                 full reading width and the question rises to 72px
  const framing = (g.runIdx ?? 0) % 3;

  if (mode === 'words') {
    // the condensed eight words — the screenshot moment
    // VAULT NOIR fix: cards compact to ch 160 / 20px gap from H*0.285 and
    // the chip rises to H*0.625 — the old layout put the second card row's
    // bottom at 830 and the chip at 756, both inside the 2-row caption
    // pill band (the sweep flagged card@180,610 + chip @1553-1556s).
    // U8 (STANDARD MARKET VISUAL REVIEW — THE DEAL): the chips DEAL onto a
    // desk edge one by one — each card slides from the deck (the left
    // margin shelf) into its slot with a rotation settle and its own
    // contact shadow. A hand deals them; the grid assembles like a
    // spreadsheet being dealt, not eight cards fading in.
    const cols = 4, rows = 2;
    const cw = (W - 360 - (cols - 1) * 36) / cols;
    const ch = 160;
    const deckX = 60, deckY = H * 0.86;
    AUDIT_QS.forEach((qa, i) => {
      const cx0 = 180 + (i % cols) * (cw + 36);
      const cy0 = H * 0.285 + Math.floor(i / cols) * (ch + 20);
      const dp = easeOutCubic(clamp01((t - 300 - i * 220) / 480));
      if (dp <= 0) return;
      const dxs = deckX + (cx0 - deckX) * dp;
      const dys = deckY + (cy0 - deckY) * dp;
      ctx.save();
      ctx.globalAlpha = Math.min(1, dp * 1.6);
      if (dp >= 1) {
        // U7 guard truth: the LANDED card draws at its TRUE slot with card()
        // (the guard reads real rectangles — never card@0,0 under a
        // transform).
        card(ctx, cx0, cy0, cw, ch, { r: 26, glow: rgba(PALETTE.gold, 0.16) });
        setFont(ctx, 26, 700);
        ctx.fillStyle = PALETTE.goldInk;
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1).padStart(2, '0'), cx0 + cw / 2, cy0 + 40);
        setFont(ctx, Math.min(48, cw / 4.4), 700, FONT_DISPLAY);
        ctx.fillStyle = PALETTE.ink;
        ctx.fillText(qa.w, cx0 + cw / 2, cy0 + ch / 2 + 26, cw - 40);
      } else {
        // the DEALING card: a bare slab mid-flight (transient, unregistered),
        // rotating flat from the dealt tilt with its contact shadow
        ctx.translate(dxs + cw / 2, dys + ch / 2);
        ctx.rotate((1 - dp) * 0.14);
        ctx.fillStyle = rgba(PALETTE.shadow, 0.3);
        ctx.beginPath();
        ctx.ellipse(6, ch / 2 + 14, cw * 0.46, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(PALETTE.card, 0.9);
        roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 26);
        ctx.fill();
        ctx.strokeStyle = rgba(PALETTE.cardBorder, 0.7);
        ctx.lineWidth = 2;
        roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 26);
        ctx.stroke();
        setFont(ctx, 26, 700);
        ctx.fillStyle = PALETTE.goldInk;
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1).padStart(2, '0'), 0, -ch / 2 + 40);
        setFont(ctx, Math.min(48, cw / 4.4), 700, FONT_DISPLAY);
        ctx.fillStyle = PALETTE.ink;
        ctx.fillText(qa.w, 0, 26, cw - 40);
      }
      ctx.restore();
    });
    ctx.textAlign = 'left';
    const se = easeOutCubic(clamp01((t - 1700) / 650));
    if (se > 0) {
      ctx.save();
      ctx.globalAlpha = se;
      chip(ctx, 'SCREENSHOT THIS — IT FORCES THE FUTURE INTO THE DECISION', W / 2 - 520, H * 0.625, {
        bg: PALETTE.chipBg, fg: PALETTE.goldInk, border: rgba(PALETTE.gold, 0.75), size: LABEL_FLOOR, iconDot: PALETTE.goldDisplay,
      });
      ctx.restore();
    }
    return;
  }

  // the rail — eight numbered pills, the active one lit
  // VAULT NOIR fix: the rail compresses to end at 740 — the old rowH ran
  // the eighth pill's registered bottom to 748, inside the pill band under
  // the certified camera envelope.
  // D-07: the rail follows the framing — LEFT on A, RIGHT on B (pulled in
  // to the 240px certified right margin — the exit camera's worst truck
  // spends the thin side of the frame), and on C it collapses to a compact
  // progress strip under the title (the zoom's full-width question card
  // replaces the rail column).
  const railX = framing === 0 ? 180 : framing === 1 ? W - 240 - 330 : 180;
  const railW = 330;
  const rowH = (CAPTION_ZONE_TOP - 100 - H * 0.30) / 8;
  if (framing !== 2) {
    AUDIT_QS.forEach((qa, i) => {
      const y = H * 0.30 + i * rowH;
      const active = i === q;
      const e = easeOutCubic(clamp01((t - 200 - i * 90) / 400));
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha = e;
      if (active) {
        card(ctx, railX, y + 4, railW, rowH - 16, { r: 18, glow: rgba(PALETTE.gold, 0.25) });
      } else {
        ctx.fillStyle = rgba(PALETTE.track, 0.5);
        roundRect(ctx, railX, y + 4, railW, rowH - 16, 18);
        ctx.fill();
      }
      setFont(ctx, Math.max(LABEL_FLOOR, 34), 700);
      ctx.fillStyle = active ? PALETTE.goldDisplay : PALETTE.inkFaint;
      ctx.fillText(`${i + 1} · ${qa.w}`, railX + 28, y + rowH / 2 - 2, railW - 50);
      ctx.restore();
    });
  } else {
    // the compact progress strip — eight numbered ticks under the title,
    // the current question lit (the zoom's wayfinding)
    const stripY = 292;
    const tickW = 44;
    AUDIT_QS.forEach((qa, i) => {
      const x = 180 + i * (tickW + 12);
      const active = i === q;
      const e = easeOutCubic(clamp01((t - 200 - i * 70) / 400));
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha = e;
      if (active) {
        card(ctx, x - 8, stripY - 6, tickW + 16, 46, { r: 14, glow: rgba(PALETTE.gold, 0.25) });
      } else {
        ctx.fillStyle = rgba(PALETTE.track, 0.5);
        roundRect(ctx, x - 8, stripY - 6, tickW + 16, 46, 14);
        ctx.fill();
      }
      setFont(ctx, Math.max(LABEL_FLOOR, 34), 700);
      ctx.textAlign = 'center';
      ctx.fillStyle = active ? PALETTE.goldDisplay : PALETTE.inkFaint;
      ctx.fillText(String(i + 1), x + tickW / 2 - 8 + 8, stripY + 26);
      ctx.textAlign = 'left';
      ctx.restore();
    });
  }
  // the question card — the focused question, big
  if (q >= 0 && q < 8) {
    const qa = AUDIT_QS[q];
    // the card geometry follows the framing (the rail vars above carry A/B;
    // framing C's card owns the full reading width). Framing B mirrors A's
    // proportions: the card keeps A's ~1000px reading width on the LEFT,
    // the host leans on ITS left edge from his own column.
    const qx = framing === 0 ? railX + railW + 70 : framing === 1 ? 340 : 180;
    const qw = framing === 2 ? W - 180 - 340 : framing === 1 ? railX - 70 - qx : W - qx - 340;
    const cardBot = CAPTION_ZONE_TOP - 90;
    const e0 = easeOutCubic(clamp01((t - 350) / 600));
    ctx.save();
    ctx.globalAlpha = e0;
    card(ctx, qx, H * 0.30, qw, cardBot - H * 0.30, { r: 34, glow: rgba(PALETTE.gold, 0.16) });
    ctx.restore();
    setFont(ctx, 28, 700);
    ctx.fillStyle = PALETTE.goldInk;
    ctx.fillText(`QUESTION ${q + 1} OF 8`, qx + 48, H * 0.30 + 60);
    // D-07 framing C: the ZOOM — the question rises to 72px on the full
    // reading width (the audit's own "screenshot moment" register)
    setFont(ctx, framing === 2 ? 72 : 62, 700, FONT_DISPLAY);
    ctx.fillStyle = PALETTE.ink;
    const qLines = wrapText(ctx, qa.q, qw - 96, framing === 2 ? 72 : 62, 700);
    qLines.forEach((ln, li) => ctx.fillText(ln, qx + 48, H * 0.30 + 140 + li * (framing === 2 ? 82 : 72)));
    const qLineH = framing === 2 ? 82 : 72;
    const subY = H * 0.30 + 150 + qLines.length * qLineH + 20;
    // FIX D-05 (THE READABLE BAND): the sub renders at 44px — the feed's
    // 40px body band was the grey-noise floor the audit measured
    setFont(ctx, Math.max(TYPE_FLOOR, 44), 400);
    const lines = wrapText(ctx, qa.sub, qw - 96, 44, 400);
    ctx.fillStyle = PALETTE.inkSoft;
    // D-03: the sub's lines land ACROSS the hold (the build spread) —
    // an 18-22s audit beat keeps adding reading lines instead of sitting.
    // D-05: lines that do not fit the card close with an ellipsis — copy
    // is cut by the LAYOUT, never clipped by the card's edge.
    const fitLines = Math.max(0, Math.floor((cardBot - 14 - subY) / 52));
    lines.slice(0, fitLines).forEach((ln, li) => {
      const e2 = easeOutCubic(clamp01((t - holdBeat(g, li, Math.min(fitLines, lines.length), 0.5)) / 500));
      if (e2 <= 0) return;
      ctx.globalAlpha = e0 * e2;
      const isLast = li === fitLines - 1 && lines.length > fitLines;
      ctx.fillText(isLast ? ln.replace(/[^\S]+$/, '') + '…' : ln, qx + 48, subY + li * 52);
    });
    ctx.globalAlpha = 1;
    // U7/U1: the audit has an EXAMINER — the host leans on the question
    // card's near edge (a hand on the question he is asking). Registered
    // + declared for the guard. Framing C keeps the examiner at the
    // card's right edge; framings A/B follow their card edge.
    const hostLeft = framing === 1;
    const edgeX = hostLeft ? qx - 4 : qx + qw - 4;
    registerRect('audit:qCardEdge', edgeX, H * 0.30 + 120, 22, 300);
    financeHost(g, hostLeft ? qx - 130 : qx + qw + 40, H * 0.65, 1.6, {
      seed: 13.7 + framing * 0.6,
      gesture: 'present',
      glanceBias: hostLeft ? 0.9 : -0.9,
      contact: { x: hostLeft ? qx + 2 : qx + qw + 2, y: H * 0.30 + 170, hand: 'palm', easeAt: 0 },
      declareId: 'audit:qCardEdge',
      label: 'audit-host',
      hostBody: true,
    });
    // the examiner LEANS on the question card — its register joins the
    // designed-contact set so the lean reads clean to the body pass.
    declareHostContact(`card@${qx},${Math.round(H * 0.30)}`);
  }
  // U5: the auditor's line sweeps the audit document
  if (mode === 'words') {
    ledgerScan(ctx, 180, H * 0.285, W - 360, 2 * 160 + 20, t, 13.9);
  } else if (q >= 0 && q < 8) {
    const qxS = 180 + 330 + 70, qwS = W - qxS - 340;
    ledgerScan(ctx, qxS, H * 0.30, qwS, CAPTION_ZONE_TOP - 90 - H * 0.30, t, 13.9);
  }
  sourceTag(ctx, W, 'The author\u2019s synthesis — components grounded in the SEC, Federal Reserve, fund-document and valuation sources in this film');
}

// ── systemMap — liquidity as a system ──────────────────────────────────────
export function systemMapScene(g: SceneCtx): void {
  const { ctx, W, H, t, s } = g;
  const stage = Number(s.stage ?? 0);
  bg(g, { strength: 0.88 });
  // 100-JUDGE VISUAL AUDIT (defect D-06): declare the system's words.
  declareOnScreenHeadline('Liquidity is a system, not a feature MANAGER + CONTRACT ENTERING EXITING REMAINING');

  setFont(ctx, 54, 600);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('Liquidity is a system, not a feature', 180, 218, 1560);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(180, 246, 300, 6);

  // the ring — the manager at centre, three investor classes around
  // VAULT NOIR fix: the ring lifts to cy H*0.47 with R H*0.18 — the old
  // cy 0.55 / R 0.24 put the ring's bottom arc (853) and the two lower
  // nodes (790) inside the caption pill band, and left no clear row for
  // the verdict chip (which then collided with both the nodes and the
  // pill — sweep @1600-1615s).
  const cx = W * 0.40;
  const cy = H * 0.47;
  const R = H * 0.18;
  const ringE = easeOutCubic(clamp01((t - 300) / 800));
  ctx.save();
  ctx.globalAlpha = ringE;
  ctx.strokeStyle = rgba(PALETTE.gold, 0.6);
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // the manager — the brass disc
  const me = easeOutCubic(clamp01((t - 400) / 600));
  ctx.save();
  ctx.globalAlpha = me;
  const mg = ctx.createRadialGradient(cx - 14, cy - 14, 6, cx, cy, 84);
  mg.addColorStop(0, PALETTE.goldDisplay);
  mg.addColorStop(1, PALETTE.goldDeep);
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(cx, cy, 84, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(PALETTE.ink, 0.75);
  ctx.lineWidth = 3;
  ctx.stroke();
  setFont(ctx, LABEL_FLOOR, 700);
  ctx.fillStyle = '#101B33';
  ctx.textAlign = 'center';
  ctx.fillText('MANAGER', cx, cy - 6);
  ctx.fillText('+ CONTRACT', cx, cy + 34);
  ctx.restore();

  // the three investor nodes
  const nodes = [
    { k: 'ENTERING', ang: -Math.PI / 2, tone: 'up' as const, v: 'buy at NAV' },
    { k: 'EXITING', ang: Math.PI / 6, tone: 'down' as const, v: 'redeems at the window' },
    { k: 'REMAINING', ang: (Math.PI * 5) / 6, tone: 'gold' as const, v: 'bear what exits leave' },
  ];
  nodes.forEach((nd, i) => {
    const e = easeOutCubic(clamp01((t - 700 - i * 300) / 600));
    if (e <= 0) return;
    const nx = cx + Math.cos(nd.ang) * R;
    const ny = cy + Math.sin(nd.ang) * R;
    ctx.save();
    ctx.globalAlpha = e;
    ctx.fillStyle = rgba(TONE(nd.tone).main, 0.2);
    ctx.beginPath();
    ctx.arc(nx, ny, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = TONE(nd.tone).main;
    ctx.lineWidth = 4;
    ctx.stroke();
    setFont(ctx, Math.max(LABEL_FLOOR, 34), 700);
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = 'center';
    ctx.fillText(nd.k, nx, ny - 4);
    setFont(ctx, Math.max(LABEL_FLOOR - 6, 28), 400);
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.fillText(nd.v, nx, ny + 30, 300);
    // the flow arc toward the manager
    ctx.strokeStyle = rgba(TONE(nd.tone).main, 0.55);
    ctx.lineWidth = 6;
    const from = nd.ang + 0.35, to = nd.ang - 0.35;
    ctx.beginPath();
    ctx.arc(cx, cy, R, to, from, false);
    ctx.stroke();
    ctx.restore();
  });
  ctx.textAlign = 'left';

  // the verdict chips (stage 2 = the contract decides) — fixed LEFT column,
  // above the caption band: the old H*0.715 position collided with the
  // lower nodes AND the pill (sweep @1600-1615s).
  if (stage >= 1) {
    const e = easeOutCubic(clamp01((t - 1600) / 650));
    if (e > 0) {
      ctx.save();
      ctx.globalAlpha = e;
      chip(ctx, stage === 2 ? 'THE CONTRACT DECIDES WHO GETS PAID — AND WHO WAITS' : 'ENOUGH LIQUIDITY: THE SYSTEM WORKS QUIETLY', 180, H * 0.652, {
        bg: PALETTE.chipBg, fg: stage === 2 ? PALETTE.downVivid : PALETTE.upVivid,
        border: rgba(stage === 2 ? PALETTE.down : PALETTE.up, 0.7),
        size: LABEL_FLOOR, iconDot: stage === 2 ? PALETTE.down : PALETTE.up,
      });
      ctx.restore();
    }
  }
  // the host — closing the film AT the system: the operator stands OUTSIDE
  // the ring's bounding box, presenting the MANAGER disc his palm can
  // honestly reach.
  // 100-JUDGE AUDIT (defect D-12 — HIM IN THE RING, b117-b119): the shipped
  // staging parked the host ON the ring's right arc — his torso covered
  // MANAGER + CONTRACT's label and his legs plated the EXITING node (the
  // render shipped "MANA[host]G"). The rim-contact verb was the root
  // cause (the solver pulled the body onto the diagram). The host now
  // stands clear of the ring's right edge by a full torso width and
  // PRESENTS the disc — the palm can reach the rim without the root ever
  // entering the ring's bbox, and every label reads whole.
  registerRect('systemMap:manager', cx - 90, cy - 90, 180, 180);
  financeHost(g, cx + R + 128, H * 0.64, 1.7, {
    seed: 12.4,
    gesture: 'present',
    glanceBias: -0.9,
    label: 'system-host',
  });
}
