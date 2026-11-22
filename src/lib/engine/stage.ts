/**
 * stage.ts — PHASE 4 (Visual Audit report — FEED THUMB-STOP / premium feel
 * 4.5): "A scrolled viewer sees a mascot, a letter and a big empty field —
 * not a story. The strongest content frames (fundSplit) are the exception,
 * not the system."
 *
 * THE DIAGNOSIS: paintBg laid a flat wash and nothing else — the field a
 * presenter stands in was literally EMPTY. At the 320px feed the film's
 * default frame reduces to figure + letterform + void. fundSplit reads
 * because it owns a full-width structured mass (the 493-household wall);
 * aiDatacenter reads because of its rack field; splitNumbers because of
 * the household band. Those scenes were the exception.
 *
 * THE SYSTEM (this module — called from paintBg, so EVERY scene inherits
 * it): the film is THE DATA DESK, so the empty field becomes THE DESK —
 * a three-plane stage world that survives the 320px gate BY CONSTRUCTION
 * (every element is a large-area structure ≥ 60px at 1080 → ≥ 10px at the
 * feed; the inverse of the Phase 3 furniture whitelist, which deleted
 * sub-gate decoration — this layer only admits gate-surviving structure):
 *
 *   1. THE FLOOR PLANE — a soft horizon band + the desk surface's tone
 *      shift + perspective floor lines. The presenter STANDS ON a ground;
 *      the frame gains a horizon (the deepest depth cue a 2D stage has).
 *   2. THE ARCHITECTURE BAND — large vertical mullion silhouettes in the
 *      upper field: the studio wall behind every scene. Tuned per family:
 *      host 4 mullions, data 3 (quieter — the data owns the frame),
 *      statement 2 whispers (the type owns the frame).
 *   3. THE DESK EDGE — a soft foreground rail at the frame's foot: the
 *      camera looks OVER a desk edge, which grounds the composition.
 *
 * VALUE DISCIPLINE (the Phase 3 value-structure rule holds): every alpha
 * sits at 3-12% ink-on-field — the architecture NEVER forms a competing
 * dark mass or bright mass; it is structure, not content. Scrub-safe:
 * every position is a pure function of (W, H) and a family-seeded hash —
 * no per-frame randomness.
 */

import { rgba, PALETTE, roundRect } from './theme';
import { hash01 } from './easing';
import { frameContext, type FrameFamily } from './composition';

/** per-family stage tuning: [horizonY, mullionCount, mullionAlpha, floorAlpha]
 *  100-JUDGE VISUAL AUDIT (U-06 — MAKE THE ROOM VISIBLE): the mullion walls
 *  painted at 0.065-0.10 and the floor at 0.26-0.30 — invisible on a phone;
 *  the stage world existed in code and vanished at the 320px gate. The
 *  register lifts to the audit's band: mullions 0.18, floor 0.40 — the room
 *  reads as a ROOM at feed scale while staying structure (never content).
 *  And every family now owns ONE SET PIECE on the desk (section 4 below)
 *  so every stage has furniture a hand can touch. */
const STAGE_TABLE: Record<FrameFamily, {
  horizonY: number;      // fraction of H where the desk begins
  mullions: number;      // how many wall verticals
  mullionAlpha: number;  // the wall band's alpha ceiling
  floorAlpha: number;    // the floor's shadowing
  floorLines: number;    // perspective lines on the floor
}> = {
  host:      { horizonY: 0.70, mullions: 4, mullionAlpha: 0.18, floorAlpha: 0.40, floorLines: 4 },
  data:      { horizonY: 0.72, mullions: 3, mullionAlpha: 0.18, floorAlpha: 0.40, floorLines: 3 },
  statement: { horizonY: 0.74, mullions: 2, mullionAlpha: 0.18, floorAlpha: 0.40, floorLines: 3 },
};

/**
 * SCENE OVERRIDES — scenes that own their own ground system keep the
 * stage's atmosphere (wall bands, tone shift) but surrender the stage's
 * perspective floor lines: aiDatacenter draws its own perspective grid,
 * gasPump forks its two-roads diagram across the desk, splitNumbers
 * grounds the household band. Two floor systems on one desk is a
 * double-exposure — the scene's ground WINS, the stage yields.
 */
const STAGE_SCENE_OVERRIDES: Record<string, Partial<{ floorLines: number; floorAlpha: number; horizonY: number }>> = {
  aiDatacenter: { floorLines: 0, floorAlpha: 0.018 },
  gasPump: { floorLines: 0 },
  splitNumbers: { floorLines: 2, floorAlpha: 0.03 },
};

export function drawStageWorld(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number
): void {
  const family = frameContext().family;
  const sceneType = frameContext().sceneType;
  const ov = STAGE_SCENE_OVERRIDES[sceneType] ?? {};
  const base = STAGE_TABLE[family];
  const st = {
    horizonY: ov.horizonY ?? base.horizonY,
    mullions: base.mullions,
    mullionAlpha: base.mullionAlpha,
    floorAlpha: ov.floorAlpha ?? base.floorAlpha,
    floorLines: ov.floorLines ?? base.floorLines,
  };
  const horizonY = H * st.horizonY;
  const ink = PALETTE.inkDeep;   // porcelain light — the architecture GLOWS
  const deep = PALETTE.shadow;   // vault black-blue — the floor RECEDES

  // ── 1. THE FLOOR PLANE ────────────────────────────────────────────────
  // the floor drops into shadow below the horizon — the presenter STANDS
  // IN the night; the frame gains a horizon (the deepest depth cue a 2D
  // stage has)
  let g = ctx.createLinearGradient(0, horizonY - H * 0.02, 0, H);
  g.addColorStop(0, rgba(deep, 0));
  g.addColorStop(0.28, rgba(deep, st.floorAlpha * 0.55));
  g.addColorStop(1, rgba(deep, st.floorAlpha));
  ctx.fillStyle = g;
  ctx.fillRect(0, horizonY - H * 0.02, W, H - horizonY + H * 0.02);
  // the horizon band — a GLOWING glass-floor crest: the vault's signature
  // light line. A cool ice core with a whisper of brass above it.
  g = ctx.createLinearGradient(0, horizonY - H * 0.016, 0, horizonY + H * 0.004);
  g.addColorStop(0, rgba(PALETTE.gold, 0));
  g.addColorStop(0.45, rgba(PALETTE.gold, 0.10));
  g.addColorStop(1, rgba(PALETTE.gold, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, horizonY - H * 0.016, W, H * 0.02);
  g = ctx.createLinearGradient(0, horizonY - H * 0.006, 0, horizonY + H * 0.008);
  g.addColorStop(0, rgba(ink, 0));
  g.addColorStop(0.6, rgba(ink, 0.16));
  g.addColorStop(1, rgba(ink, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, horizonY - H * 0.006, W, H * 0.014);
  // perspective floor lines — GLOWING hairlines converging to the vanishing
  // point under the frame centre (the glass-floor grid)
  const vpx = W * 0.5;
  const vpy = horizonY;
  ctx.strokeStyle = rgba(ink, 0.075);
  ctx.lineWidth = Math.max(3, W * 0.0022);
  for (let i = 0; i < st.floorLines; i++) {
    const spread = 0.28 + hash01(i * 7.3 + 11) * 0.9;    // deterministic x at the frame foot
    const footX = W * (0.06 + spread * 0.88);
    ctx.beginPath();
    ctx.moveTo(vpx + (footX - vpx) * 0.18, vpy + H * 0.008);
    ctx.lineTo(footX, H);
    ctx.stroke();
  }

  // ── 2. THE ARCHITECTURE BAND ──────────────────────────────────────
  // the vault wall behind every scene: large vertical GLASS mullion bands
  // in the upper field, lit from above — widths 90-160px (≥15px at the
  // feed), deterministic placement, alpha below the mass threshold.
  const bandTop = H * 0.10;
  const bandBottom = horizonY - H * 0.03;
  for (let i = 0; i < st.mullions; i++) {
    const u = hash01(i * 13.7 + 3);
    const wBand = W * (0.05 + hash01(i * 5.1 + 29) * 0.035);
    const x = W * (0.10 + u * 0.80) - wBand / 2;
    // a gentle vertical gradient: the band fades in from its top and out
    // at its foot — it reads as light falling between mullions
    const a = st.mullionAlpha * (0.75 + hash01(i * 3.3) * 0.5);
    const breathe = Math.sin(t / 7000 + i * 2.1) * 0.012;   // slow, cinematic
    g = ctx.createLinearGradient(0, bandTop, 0, bandBottom);
    g.addColorStop(0, rgba(ink, 0));
    g.addColorStop(0.35, rgba(ink, Math.max(0, a + breathe)));
    g.addColorStop(0.85, rgba(ink, a * 0.5));
    g.addColorStop(1, rgba(ink, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, bandTop, wBand, bandBottom - bandTop);
    // the mullion's brass edge — one hairline on the lit side of each band
    ctx.fillStyle = rgba(PALETTE.gold, 0.10);
    ctx.fillRect(x + wBand - 2, bandTop + (bandBottom - bandTop) * 0.2, 2, (bandBottom - bandTop) * 0.55);
  }

  // ── 3. THE DESK EDGE ──────────────────────────────────────────
  // the frame's foot: a deep foreground rail the camera looks over
  g = ctx.createLinearGradient(0, H - H * 0.075, 0, H);
  g.addColorStop(0, rgba(deep, 0));
  g.addColorStop(1, rgba(deep, 0.42));
  ctx.fillStyle = g;
  ctx.fillRect(0, H - H * 0.075, W, H * 0.075);

  // ── 4. THE FAMILY SET PIECES (U-06 — THE SET IS FURNITURE, NOT VOID) ──
  // every family owns ONE desk set piece on the stage's left foot — the
  // audit's "furniture a hand can touch":
  //   host      → the DESK STACK (two ledger sheets + the brass pen cup)
  //   data      → CHARTS-ON-DESK (a chart card with a drawn rising line
  //               and two mini bars — the data's own terrain prop)
  //   statement → the slim LEDGER FOLIO (the statement's receipt book)
  // Deterministic in (W, H, family); large-area structures that survive
  // the 320px gate BY CONSTRUCTION (every element ≥ 60px at 1080p);
  // unregistered like the rest of the stage's own furniture. The props
  // carry sanctioned owners in scene-props.ts PROP_OWNERSHIP.
  {
    const px = W * 0.085;
    const py = Math.min(H - H * 0.10, horizonY + H * 0.055); // on the floor, under the horizon
    ctx.save();
    ctx.globalAlpha = 0.5;
    if (family === 'data') {
      // CHARTS-ON-DESK: the chart card, its rising line, two mini bars
      ctx.fillStyle = rgba(PALETTE.card, 0.9);
      roundRect(ctx, px - 70, py - 26, 150, 104, 12);
      ctx.fill();
      ctx.strokeStyle = rgba(PALETTE.gold, 0.55);
      ctx.lineWidth = 2.5;
      roundRect(ctx, px - 70, py - 26, 150, 104, 12);
      ctx.stroke();
      ctx.strokeStyle = rgba(PALETTE.up, 0.85);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px - 46, py + 52);
      ctx.lineTo(px - 14, py + 30);
      ctx.lineTo(px + 8, py + 40);
      ctx.lineTo(px + 52, py + 2);
      ctx.stroke();
      ctx.fillStyle = rgba(PALETTE.gold, 0.75);
      ctx.fillRect(px + 16, py + 54, 12, 22);
      ctx.fillRect(px + 36, py + 44, 12, 32);
    } else if (family === 'host') {
      // THE DESK STACK: two ledger sheets + the brass pen cup
      ctx.fillStyle = rgba(PALETTE.card, 0.9);
      roundRect(ctx, px - 66, py + 8, 132, 26, 8);
      ctx.fill();
      ctx.fillStyle = rgba(PALETTE.card, 1);
      roundRect(ctx, px - 58, py - 8, 116, 22, 7);
      ctx.fill();
      ctx.strokeStyle = rgba(PALETTE.gold, 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 44, py - 1);
      ctx.lineTo(px + 30, py - 1);
      ctx.stroke();
      ctx.fillStyle = rgba(PALETTE.goldDeep, 0.85);
      roundRect(ctx, px + 64, py - 14, 34, 48, 9);
      ctx.fill();
      ctx.strokeStyle = rgba(PALETTE.ink, 0.6);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px + 74, py - 12);
      ctx.lineTo(px + 74, py - 34);
      ctx.moveTo(px + 86, py - 12);
      ctx.lineTo(px + 90, py - 30);
      ctx.stroke();
    } else {
      // THE LEDGER FOLIO: the statement's slim receipt book
      ctx.fillStyle = rgba(PALETTE.card, 0.9);
      roundRect(ctx, px - 54, py - 4, 108, 42, 9);
      ctx.fill();
      ctx.strokeStyle = rgba(PALETTE.gold, 0.5);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(px - 36, py + 10);
      ctx.lineTo(px + 34, py + 10);
      ctx.moveTo(px - 36, py + 22);
      ctx.lineTo(px + 18, py + 22);
      ctx.stroke();
    }
    ctx.restore();
  }
}
