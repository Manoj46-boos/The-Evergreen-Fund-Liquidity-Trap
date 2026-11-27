/**
 * Thumbnail generator v4 — SIX COMPOSITIONS (report D-30 / D-31).
 *
 * D-30 (100-Judge Visual Quality Audit, Family F): "Six thumbnails, one
 * composition. THUMB_VARIANTS 0-5 change copy only — same coin, same dart,
 * same layout. A Test and Compare between them teaches the channel nothing
 * about composition, face size or object scale." The v3 generator rendered
 * all six variants through ONE body: the same disc, the same pulled slice,
 * the same host pose, the same punch/badge slots — only the words changed.
 *
 * D-31: "A generic hook image. Coin + dart + '5% is not YOUR EXIT' reads as
 * finance-explainer number 4,281. No face-close-up variant (the rig can
 * draw one), no before/after variant, no curiosity-gap variant."
 *
 * v4 rebuilds the set as SIX DISTINCT COMPOSITIONS — one per hook class a
 * channel actually tests:
 *   v0 THE PULL (control)          — the disc + the rope-pulled slice + host
 *   v1 THE FACE CLOSE-UP           — the rig draws one: the host's face fills
 *                                    half the frame (shock brows, wide eyes)
 *   v2 THE BEFORE/AFTER            — $1,000,000 asked vs $50,000 received,
 *                                    split plates + the wedge divider
 *   v3 THE CURIOSITY-GAP           — a giant brass question mark whose DOT
 *                                    is the 5% slice
 *   v4 THE QUEUE                   — five staged figures at a redemption
 *                                    window (small faces, big object)
 *   v5 THE TRAP                    — the giant dart pinning the slice
 *
 * Every variant changes composition, face size AND object scale — a Test &
 * Compare between them now measures FRAMING, not copy. The poster guard
 * (fitCheck, the 8% crop margin) applies to every composition; the U-04
 * costume law (the film's own drawHost wrapper) still draws every figure.
 */

import { PALETTE, FONT_UI, FONT_DISPLAY, rgba, roundRect, setFont } from './theme';
import { drawPct } from './effects';
import { POSES } from './stickman';
// U-04 — ONE COSTUME LAW: the poster renders through the SAME drawHost
// wrapper the film stages with — the packaging costume and the film
// costume are one garment by construction, not by discipline.
import { drawHost, drawStickmanV2 } from './stickman-v2';

/** Tapered stroke helper (thick-to-thin polygon with round caps). */
function taper(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, ex: number, ey: number,
  w0: number, w1: number, col: string
): void {
  const dx = ex - x, dy = ey - y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x + nx * w0 / 2, y + ny * w0 / 2);
  ctx.lineTo(ex + nx * w1 / 2, ey + ny * w1 / 2);
  ctx.lineTo(ex - nx * w1 / 2, ey - ny * w1 / 2);
  ctx.lineTo(x - nx * w0 / 2, y - ny * w0 / 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, w0 / 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex, ey, w1 / 2, 0, Math.PI * 2); ctx.fill();
}

export interface ThumbVariant {
  /** punchline lines (rendered top-to-bottom, left-aligned) */
  punch: string[];
  /** plated number badge */
  badge: { big: string; label: string };
}

// ── 100-JUDGE PANEL / PHASE 3 item 3.5 — THE THUMBNAIL GUARD ───────────────
// (kept from v3: every text shrinks until its MEASURED width fits its plate
// minus the 8% crop margin; the floor yields to the fit.)
const THUMB_CROP_MARGIN = 0.08;
/** Exported for the phase-3 evidence tools: the guard IS the invariant. */
export function fitCheck(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  startSize: number,
  minSize: number,
  plateW: number,
  family?: string
): number {
  const limit = plateW * (1 - THUMB_CROP_MARGIN);
  let size = startSize;
  setFont(ctx, size, 700, family);
  const widest = (): number => Math.max(...lines.map((l) => ctx.measureText(l).width));
  while (size > minSize && widest() > limit) {
    size -= 2;
    setFont(ctx, size, 700, family);
  }
  return size;
}

/** The six v4 variants — six COMPOSITIONS, one per hook class.
 *  The punch/badge copy keeps the set's proven wordings; the LAYOUT is what
 *  now varies (see drawThumbnail's composition switch). */
export const THUMB_VARIANTS: ThumbVariant[] = [
  { punch: ['5% ≠', 'YOUR EXIT'], badge: { big: '5%', label: 'OF THE FUND' } },
  { punch: ['THE 5%', 'TRAP'], badge: { big: '5%', label: 'OF THE FUND' } },
  { punch: ['YOUR EXIT', 'IS 5%?'], badge: { big: '$1M →', label: '$50K EXIT' } },
  { punch: ['SEMI-LIQUID', 'LIE?'], badge: { big: '84%', label: 'WANT MORE' } },
  { punch: ['WHERE’S MY', 'MONEY?'], badge: { big: '10%', label: 'REQUESTED' } },
  { punch: ['THE QUEUE', 'IS THE RISK'], badge: { big: '5%', label: 'PAID OUT' } },
];

// ── shared canvas prep: the vault canvas + one brass glow pool ─────────────
function vaultCanvas(ctx: CanvasRenderingContext2D, W: number, H: number, poolX = 0.42, poolY = 0.52): void {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0B1730');
  bg.addColorStop(0.7, '#12244A');
  bg.addColorStop(1, '#0A1526');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const pool = ctx.createRadialGradient(W * poolX, H * poolY, 40, W * poolX, H * poolY, W * 0.55);
  pool.addColorStop(0, 'rgba(240, 199, 94, 0.22)');
  pool.addColorStop(1, 'rgba(240, 199, 94, 0)');
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, W, H);
  const hz = ctx.createLinearGradient(0, H * 0.78, 0, H);
  hz.addColorStop(0, 'rgba(159, 192, 232, 0)');
  hz.addColorStop(1, 'rgba(159, 192, 232, 0.12)');
  ctx.fillStyle = hz;
  ctx.fillRect(0, H * 0.78, W, H * 0.22);
}

/** the struck-brass fund disc (shared by the compositions that stage it). */
function brassDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number): void {
  const { goldDisplay: BRASS } = PALETTE;
  ctx.fillStyle = 'rgba(1, 4, 12, 0.55)';
  ctx.beginPath();
  ctx.arc(cx - 10, cy + 14, R, 0, Math.PI * 2);
  ctx.fill();
  const face = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.15);
  face.addColorStop(0, '#FFEDB8');
  face.addColorStop(0.55, BRASS);
  face.addColorStop(1, '#7A5A18');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(122, 90, 24, 0.6)';
  ctx.lineWidth = Math.max(3, R * 0.05);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.78, 0, Math.PI * 2);
  ctx.stroke();
}

/** the ice 5% slice (a 7.2%-wide wedge ≈ the 5% idea), at (cx,cy) rotation 0. */
function iceSlice(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, rot = -0.06): void {
  const { upVivid: ICE } = PALETTE;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = ICE;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, R, -0.35, 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(1, 4, 12, 0.5)';
  ctx.lineWidth = Math.max(4, R * 0.07);
  ctx.stroke();
  ctx.restore();
}

/** the punch block (shared; per-variant slot). */
function punchBlock(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  punch: string[], px0: number, py: number, maxW: number, startSize = 140
): void {
  const pSize = fitCheck(ctx, punch, startSize, 44, maxW, FONT_DISPLAY);
  const strokeW = Math.max(9, Math.round(pSize * 0.085));
  ctx.save();
  ctx.translate(px0, py);
  ctx.rotate(-0.012);
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = strokeW;
  ctx.strokeStyle = '#050B18';
  punch.forEach((line, i) => ctx.strokeText(line, 0, i * (pSize * 1.04)));
  ctx.fillStyle = '#FFFFFF';
  punch.forEach((line, i) => ctx.fillText(line, 0, i * (pSize * 1.04)));
  ctx.restore();
}

/** the plated number badge (shared). anchor 'right' pins bx to the frame's
 *  right margin; anchor 'left' uses bx as the left edge. */
function badgeBlock(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  badge: { big: string; label: string }, bx: number, by: number,
  anchor: 'left' | 'right' = 'left'
): void {
  const { gold: BRASS } = PALETTE;
  const bigSize = fitCheck(ctx, [badge.big], 108, 72, 560, FONT_UI);
  setFont(ctx, bigSize, 700, FONT_UI);
  const bigW = ctx.measureText(badge.big).width;
  const subSize = fitCheck(ctx, [badge.label], 40, 28, 560, FONT_UI);
  setFont(ctx, subSize, 600, FONT_UI);
  const subW = ctx.measureText(badge.label).width;
  const plateW = Math.max(bigW, subW) + 104;
  const plateH = 205;
  if (anchor === 'right') bx = W - plateW - bx;
  ctx.save();
  ctx.fillStyle = 'rgba(1, 4, 12, 0.55)';
  roundRect(ctx, bx - 7, by + 11, plateW, plateH, 34);
  ctx.fill();
  ctx.fillStyle = 'rgba(7, 14, 30, 0.88)';
  roundRect(ctx, bx, by, plateW, plateH, 34);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = BRASS;
  roundRect(ctx, bx, by, plateW, plateH, 34);
  ctx.stroke();
  setFont(ctx, bigSize, 700, FONT_UI);
  ctx.fillStyle = BRASS;
  ctx.textAlign = 'left';
  ctx.fillText(badge.big, bx + 48, by + 118);
  setFont(ctx, subSize, 600, FONT_UI);
  ctx.fillStyle = '#C9D8F2';
  ctx.fillText(badge.label, bx + 48, by + 178);
  ctx.restore();
}

/**
 * VAULT NOIR v4 — THE EVERGREEN POSTER SET. Six compositions (D-30/D-31):
 * the Test & Compare race now measures composition, face size and object
 * scale — not copy. Scan order kept where a character appears:
 * CHARACTER → QUESTION → NUMBER.
 */
export function drawThumbnail(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  variant: 0 | 1 | 2 | 3 | 4 | 5 = 0
): void {
  const { goldDisplay: BRASS, gold: GOLD, goldDeep: BRASSD, ink: INK, upVivid: ICE, down: CORAL, downVivid: CORALV } = PALETTE;
  const v = THUMB_VARIANTS[Math.min(variant, THUMB_VARIANTS.length - 1) as 0 | 1 | 2 | 3 | 4 | 5];

  // ── v0 — THE PULL (the v3 control, kept) ────────────────────────────────
  if (variant === 0) {
    vaultCanvas(ctx, W, H);
    const cx = W * 0.40, cy = H * 0.55, R = H * 0.30;
    brassDisc(ctx, cx, cy, R);
    // the 5% slice — pulled OUT along the pull vector (capacity + proration)
    const pull = 0.16;
    const a0 = -Math.PI * 0.14, a1 = Math.PI * 0.06;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((a0 + a1) / 2);
    ctx.rotate(-(a0 + a1) / 2);
    const sx = Math.cos((a0 + a1) / 2) * R * pull * 2.2;
    const sy = Math.sin((a0 + a1) / 2) * R * pull * 2.2;
    ctx.translate(sx, sy);
    ctx.fillStyle = ICE;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R * 1.02, a0, a1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(1, 4, 12, 0.5)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
    const sliceGlowX = cx + Math.cos((a0 + a1) / 2) * R * (1 + pull * 2.2);
    const sliceGlowY = cy + Math.sin((a0 + a1) / 2) * R * (1 + pull * 2.2);
    const sg = ctx.createRadialGradient(sliceGlowX, sliceGlowY, 4, sliceGlowX, sliceGlowY, R * 0.7);
    sg.addColorStop(0, 'rgba(65, 216, 239, 0.4)');
    sg.addColorStop(1, 'rgba(65, 216, 239, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sliceGlowX, sliceGlowY, R * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(1, 4, 12, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy + R * 1.16, R * 0.9, R * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    // CHARACTER: the host, braced, pulling the slice with a rope
    {
      const SC = 2.5;
      const fx = W * 0.14;
      const fy = H * 1.24;
      const handX = fx + 118 * SC;
      const handY = fy - 171 * SC;
      ctx.strokeStyle = 'rgba(234, 242, 255, 0.8)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.quadraticCurveTo(W * 0.30, H * 0.62, sliceGlowX, sliceGlowY + 8);
      ctx.stroke();
      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(SC, SC);
      drawHost(ctx, 0, 0, 1, 3600, {
        pose: POSES.pointR,
        faceScale: 1.0,
        look: 0.5, parallax: false,
      }, 7);
      ctx.restore();
    }
    punchBlock(ctx, W, H, v.punch, Math.round(W * 0.555), H * 0.30, W - 45 - Math.round(W * 0.555));
    badgeBlock(ctx, W, H, v.badge, 36, H - 205 - 42, 'right');
  }
  // ── v1 — THE FACE CLOSE-UP (D-31: "the rig can draw one") ───────────────
  else if (variant === 1) {
    vaultCanvas(ctx, W, H, 0.24, 0.4);
    // the small disc behind the face — the object scale DROPS so the face
    // scale contrast is the variant's test axis
    brassDisc(ctx, W * 0.74, H * 0.30, H * 0.14);
    iceSlice(ctx, W * 0.80, H * 0.30, H * 0.055, -0.5);
    // THE FACE: the host's head fills the left half — head radius ≈ 24% H
    {
      const SC = (H * 0.24) / 24;
      const fx = W * 0.30;
      const fy = H * 0.42 + 225 * SC; // pelvis far below the frame — head centered
      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(SC, SC);
      // shock face, arms tucked (the recoil brows/eyes read at close-up;
      // the flung arms would cross the punch block)
      drawHost(ctx, 0, 0, 1, 3600, {
        pose: { ...POSES.shock, lAU: -12, lAL: -10, rAU: 10, rAL: 12 },
        faceScale: 1.0,
        look: 0.55, parallax: false,
      }, 7);
      ctx.restore();
    }
    punchBlock(ctx, W, H, v.punch, Math.round(W * 0.545), H * 0.56, W - 45 - Math.round(W * 0.545));
    badgeBlock(ctx, W, H, v.badge, 36, H - 205 - 42);
  }
  // ── v2 — THE BEFORE/AFTER (D-31) ────────────────────────────────────────
  else if (variant === 2) {
    vaultCanvas(ctx, W, H, 0.5, 0.5);
    // LEFT plate — ASKED (gold)
    const pw = W * 0.36, ph = H * 0.44, py = H * 0.30;
    const plates: Array<{ x: number; big: string; label: string; col: string; sub: string }> = [
      { x: W * 0.075, big: '$1,000,000', label: 'YOU ASK TO LEAVE', col: BRASS, sub: 'the full position' },
      { x: W * 0.565, big: '$50,000', label: 'YOU RECEIVE', col: '#FFFFFF', sub: 'the 5% proration' },
    ];
    plates.forEach((p, i) => {
      ctx.save();
      ctx.fillStyle = i === 0 ? 'rgba(7, 14, 30, 0.88)' : 'rgba(26, 10, 16, 0.88)';
      roundRect(ctx, p.x, py, pw, ph, 30);
      ctx.fill();
      ctx.lineWidth = i === 0 ? 7 : 7;
      ctx.strokeStyle = i === 0 ? BRASS : CORAL;
      roundRect(ctx, p.x, py, pw, ph, 30);
      ctx.stroke();
      setFont(ctx, H * 0.105, 700, FONT_DISPLAY);
      ctx.fillStyle = p.col;
      ctx.textAlign = 'center';
      const bigSize = fitCheck(ctx, [p.big], H * 0.105, 40, pw - 60, FONT_DISPLAY);
      setFont(ctx, bigSize, 700, FONT_DISPLAY);
      ctx.fillText(p.big, p.x + pw / 2, py + ph * 0.46);
      setFont(ctx, Math.max(26, H * 0.040), 700, FONT_UI);
      ctx.fillStyle = i === 0 ? '#C9D8F2' : CORALV;
      ctx.fillText(p.label, p.x + pw / 2, py + ph * 0.68);
      setFont(ctx, Math.max(22, H * 0.030), 600, FONT_UI);
      ctx.fillStyle = 'rgba(201, 216, 242, 0.75)';
      ctx.fillText(p.sub, p.x + pw / 2, py + ph * 0.80);
      ctx.textAlign = 'left';
      ctx.restore();
    });
    // the divider — the wedge + the arrow (the 5% between the two states)
    iceSlice(ctx, W * 0.5, H * 0.52, H * 0.085, -0.9);
    ctx.strokeStyle = CORALV;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(W * 0.455, H * 0.76);
    ctx.lineTo(W * 0.545, H * 0.76);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W * 0.545 - 26, H * 0.76 - 20);
    ctx.lineTo(W * 0.545, H * 0.76);
    ctx.lineTo(W * 0.545 - 26, H * 0.76 + 20);
    ctx.stroke();
    punchBlock(ctx, W, H, v.punch, Math.round(W * 0.075), H * 0.115, W * 0.85, 120);
    // the badge sits INSIDE the right plate's corner (no free bottom-right
    // in a split composition) — bottom-left slot
    badgeBlock(ctx, W, H, v.badge, 36, H - 205 - 42);
    void pw; void ph;
  }
  // ── v3 — THE CURIOSITY-GAP: the question mark whose dot is the slice ────
  else if (variant === 3) {
    vaultCanvas(ctx, W, H, 0.34, 0.4);
    // the giant hand-drawn '?' — hook arc + tail, brass, then the ice
    // slice placed AS the dot (the curiosity gap: the number IS the answer)
    const qx = W * 0.315, qTop = H * 0.16, qR = W * 0.115;
    ctx.save();
    const gq = ctx.createLinearGradient(qx - qR, qTop, qx + qR, qTop + qR * 2.4);
    gq.addColorStop(0, '#FFEDB8');
    gq.addColorStop(0.55, BRASS);
    gq.addColorStop(1, '#7A5A18');
    ctx.strokeStyle = gq;
    ctx.lineWidth = W * 0.052;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // the hook: a ~170° arc — open at the lower left (a ring never reads)
    ctx.arc(qx, qTop + qR * 0.9, qR, Math.PI * -0.28, Math.PI * 0.92);
    ctx.stroke();
    // the tail: from the arc's lower-left end, curving down to the dot
    ctx.beginPath();
    ctx.moveTo(qx + qR * 0.72, qTop + qR * 1.42);
    ctx.quadraticCurveTo(qx + qR * 0.28, qTop + qR * 1.7, qx - qR * 0.02, qTop + qR * 1.9);
    ctx.lineTo(qx - qR * 0.02, qTop + qR * 2.18);
    ctx.stroke();
    ctx.restore();
    // the dot — the 5% slice, glowing, exactly where the dot belongs
    const dotX = qx - qR * 0.02, dotY = qTop + qR * 2.52;
    const dg = ctx.createRadialGradient(dotX, dotY, 4, dotX, dotY, qR * 0.9);
    dg.addColorStop(0, 'rgba(65, 216, 239, 0.45)');
    dg.addColorStop(1, 'rgba(65, 216, 239, 0)');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(dotX, dotY, qR * 0.9, 0, Math.PI * 2);
    ctx.fill();
    iceSlice(ctx, dotX, dotY, qR * 0.34, -0.2);
    // the disc watches from the right (small — the glyph owns the scale)
    brassDisc(ctx, W * 0.78, H * 0.36, H * 0.17);
    punchBlock(ctx, W, H, v.punch, Math.round(W * 0.545), H * 0.615, W - 45 - Math.round(W * 0.545));
    badgeBlock(ctx, W, H, v.badge, 36, H - 205 - 42, 'right');
  }
  // ── v4 — THE QUEUE: five staged figures at the redemption window ────────
  else if (variant === 4) {
    vaultCanvas(ctx, W, H, 0.62, 0.34);
    // THE WINDOW — the object scale is BIG (the face scale small: the
    // contrast this variant tests)
    const wx = W * 0.575, wy = H * 0.14, ww = W * 0.36, wh = H * 0.42;
    ctx.save();
    ctx.fillStyle = 'rgba(7, 14, 30, 0.9)';
    roundRect(ctx, wx, wy, ww, wh, 24);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = BRASS;
    roundRect(ctx, wx, wy, ww, wh, 24);
    ctx.stroke();
    // the pay slot
    ctx.fillStyle = '#050B18';
    roundRect(ctx, wx + ww * 0.2, wy + wh * 0.34, ww * 0.6, wh * 0.13, 12);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = GOLD;
    roundRect(ctx, wx + ww * 0.2, wy + wh * 0.34, ww * 0.6, wh * 0.13, 12);
    ctx.stroke();
    setFont(ctx, Math.max(28, H * 0.052), 700, FONT_UI);
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center';
    ctx.fillText('5% / QUARTER', wx + ww / 2, wy + wh * 0.26);
    setFont(ctx, Math.max(20, H * 0.033), 600, FONT_UI);
    ctx.fillStyle = '#C9D8F2';
    ctx.fillText('THE WINDOW', wx + ww / 2, wy + wh * 0.62);
    ctx.textAlign = 'left';
    ctx.restore();
    // THE QUEUE — five film-cast figures, small faces, varied poses
    {
      const SC = H * 0.00135; // rig ≈ 0.97 at 720 — the small-face register
      const poses = [POSES.pointR, POSES.shrug, POSES.idle, POSES.count1, POSES.aha];
      const gx = W * 0.615, gy = H * 0.88;
      const step = W * 0.063;
      poses.forEach((p, i) => {
        const fx = gx + i * step;
        const fy = gy - (i === 0 ? H * 0.04 : 0); // the first figure AT the window
        ctx.save();
        ctx.translate(fx, fy);
        ctx.scale(SC, SC);
        drawStickmanV2(ctx, 0, 0, 1, 3600 + i * 130, {
          pose: p, alpha: 1, look: i === 0 ? 0.5 : 0.15, parallax: false,
        }, 60 + i);
        ctx.restore();
      });
      // the queue rail — a hairline the figures stand along
      ctx.strokeStyle = 'rgba(201, 162, 39, 0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(gx - step * 0.4, gy + 6);
      ctx.lineTo(gx + step * 4.6, gy + 6);
      ctx.stroke();
    }
    punchBlock(ctx, W, H, v.punch, Math.round(W * 0.045), H * 0.30, W * 0.5);
    badgeBlock(ctx, W, H, v.badge, 36, H - 205 - 42);
  }
  // ── v5 — THE TRAP: the giant dart pinning the slice ─────────────────────
  else {
    vaultCanvas(ctx, W, H, 0.44, 0.5);
    const cx = W * 0.42, cy = H * 0.54, R = H * 0.26;
    brassDisc(ctx, cx, cy, R);
    // the slice — OUT of the disc, at the dart's tip
    const sx = W * 0.545, sy = H * 0.50;
    // THE DART — giant, brass, diagonal from the top-right corner into the
    // slice (the object scale this variant tests: the dart is a THIRD of
    // the frame)
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-0.62);
    // shaft
    const shaft = ctx.createLinearGradient(0, 0, W * 0.62, 0);
    shaft.addColorStop(0, '#7A5A18');
    shaft.addColorStop(0.5, BRASS);
    shaft.addColorStop(1, '#FFEDB8');
    ctx.fillStyle = shaft;
    roundRect(ctx, 0, -H * 0.019, W * 0.62, H * 0.038, H * 0.019);
    ctx.fill();
    // the flight (fletching) — three porcelain vanes
    ctx.fillStyle = '#EAF2FF';
    for (const vy of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.moveTo(W * 0.50, vy * H * 0.012);
      ctx.lineTo(W * 0.60, vy * H * 0.055 - H * 0.01);
      ctx.lineTo(W * 0.635, vy * H * 0.055);
      ctx.lineTo(W * 0.52, vy * H * 0.012 + H * 0.014);
      ctx.closePath();
      ctx.fill();
    }
    // the tip — dark steel into the slice
    ctx.fillStyle = '#1A2438';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-H * 0.055, -H * 0.020);
    ctx.lineTo(-H * 0.055, H * 0.020);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // the pinned slice (under the dart tip) — the slice is the payload the
    // dart pinned: it reads at the feed, not a sliver
    iceSlice(ctx, sx, sy, R * 0.46, -0.5);
    // impact star at the pin point
    ctx.strokeStyle = 'rgba(234, 242, 255, 0.85)';
    ctx.lineWidth = 6;
    for (let a = 0; a < 6; a++) {
      const ang = a * Math.PI / 3 + 0.3;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(ang) * R * 0.36, sy + Math.sin(ang) * R * 0.36);
      ctx.lineTo(sx + Math.cos(ang) * R * 0.5, sy + Math.sin(ang) * R * 0.5);
      ctx.stroke();
    }
    punchBlock(ctx, W, H, v.punch, Math.round(W * 0.045), H * 0.19, W * 0.34, 120);
    badgeBlock(ctx, W, H, v.badge, 36, H - 205 - 42, 'right');
  }

  // ── THE BRAND TAG — the brass %, top-left ──
  // (v2 keeps the top band for the punch; v5's punch owns the same band —
  // the tag drops on those compositions)
  if (variant !== 2 && variant !== 5) {
    ctx.save();
    drawPct(ctx, 116, 132, 46, 12, BRASS, 1);
    ctx.restore();
  }
  void INK; void BRASSD;
}

/**
 * A/B/C/D/E/F thumbnail generator for YouTube's Test & Compare.
 */
export function drawThumbnailVariant(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  variant: 0 | 1 | 2 | 3 | 4 | 5 = 0
): void {
  drawThumbnail(ctx, W, H, variant);
}
