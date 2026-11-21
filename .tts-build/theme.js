"use strict";
/**
 * Design system — "VAULT NOIR": a deep, premium, institutional look for
 * THE EVERGREEN FUND — LIQUIDITY TRAP. A cinematic midnight-navy canvas
 * (never pure black — always visibly blue), porcelain ink, champagne-brass
 * accents, ice-cyan data ink for "up", warm coral for "down", glass cards
 * with top-light edges. The palette deliberately breaks from the previous
 * film's light "Morning Ivory" look: different channel identity, same engine.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAPTION_ZONE_TOP = exports.M = exports.TONE = exports.FONT_UI_SEMI = exports.FONT_UI = exports.FONT_DISPLAY = exports.LABEL_FLOOR = exports.TYPE_FLOOR = exports.PALETTE = void 0;
exports.typeFloorWarn = typeFloorWarn;
exports.rgba = rgba;
exports.hexLerp = hexLerp;
exports.roundRect = roundRect;
exports.card = card;
exports.setFont = setFont;
exports.fitText = fitText;
exports.chip = chip;
exports.chipWidth = chipWidth;
exports.valuePlaneFor = valuePlaneFor;
exports.roomFill = roomFill;
exports.toneRoom = toneRoom;
exports.deskRule = deskRule;
exports.glowBlob = glowBlob;
exports.mixHex = mixHex;
exports.scenePlate = scenePlate;
exports.drawRoomRail = drawRoomRail;
exports.setRoomFamily = setRoomFamily;
exports.getRoomFamily = getRoomFamily;
exports.setWashChapter = setWashChapter;
exports.chapterFamily = chapterFamily;
exports.paintBg = paintBg;
exports.inkStroke = inkStroke;
exports.drawChapterRoom = drawChapterRoom;
// v9 (report P0-1): card()/chip()/fitText feed the collision guard when the
// harness enables it — every plated-through defect (D-01, D-02, the R7
// family) was content a guard like this would have caught at render time.
const collision_1 = require("./collision");
// PHASE 4 (Visual Audit — FEED THUMB-STOP): the per-family stage world
// (floor plane, architecture band, desk edge) paints inside paintBg so
// EVERY scene inherits the fundSplit-grade depth system.
const stage_1 = require("./stage");
exports.PALETTE = {
    // VAULT NOIR (this film): a midnight-navy canvas that always reads BLUE,
    // never black. bgTop/bgBottom are the vertical gradient stops of the vault
    // room; the glow pools (paintBg) lift one corner toward brass, one toward
    // ice. Target mean luminance 40-75 — a dark room the elite viewer reads
    // as "Bloomberg terminal meets brand film", with every text at AA.
    bgTop: '#0E1B36',
    bgBottom: '#13254B',
    bgSoft: '#1A2F5C',
    // porcelain ink — the light-on-dark flip of the old slate ink. Every
    // PALETTE.ink stroke/fill in the engine (axes, rules, bodies, furniture)
    // now reads as luminous porcelain on navy without touching call sites.
    ink: '#EAF2FF',
    inkSoft: '#B9C8E4',
    inkFaint: '#93A5C6',
    // the glass card: a navy plate one step lighter than the canvas with a
    // hairline steel border and a top-light gradient (see card()).
    card: '#16294F',
    cardBorder: '#3A558A',
    // the ONE shadow color: vault black-blue — deepens the night instead of
    // greying it. One light source (upper right) answers it everywhere.
    shadow: '#01040C',
    grid: '#2E4470', // chart grids / dashed hairlines (steel blue)
    track: '#22375F', // bar tracks / inactive segments
    sage: '#5E7B9E', // pie remainder, muted swatches
    goldNumeral: '#F2C75B', // chapter numeral — full display brass on navy
    gold: '#D9AE45',
    goldDeep: '#9A7420',
    /** Display brass — large fills, wedges, ≥60px numerals. On navy it reads
     *  as polished champagne; small TEXT gold stays goldInk (AA on navy). */
    goldDisplay: '#F0C75E',
    goldInk: '#E5C063',
    // the gold ROOM — a navy field tinted toward brass (the chapter-card
    // wash and the statement rooms live here; never a bright cream).
    goldWash: '#2A3A63',
    up: '#2FB3CC', // ice-cyan — the "flow / liquidity" accent
    upSoft: '#14405A',
    down: '#E06A50', // warm coral — the "trap / friction" accent
    downSoft: '#4C2834',
    // vivid data-ink ramp — strokes only, never text (survives the transcode)
    upVivid: '#41D8EF',
    downVivid: '#FF8A6A',
    inkDeep: '#FFFFFF',
    muted: '#5C6E8E',
    chipBg: '#12213F',
    white: '#F5F8FF',
};
/** Minimum type size (design px, 1920×1080 grid). Nothing the viewer
 *  must READ renders below this — the phone-gate panel (audit §8) measured
 *  the 28px floor at 4.7px after the 320px downsample: broadcast-
 *  legibility research puts readable body text at 40-60px on this grid.
 *  AUDIT-ROUND-2 (fix 1): 28 → 40 for anything the viewer must READ.
 *  Captions are exempt (pill-backed, already large — see textfx). Where
 *  text cannot fit at this floor the content must wrap or shorten —
 *  never shrink. */
exports.TYPE_FLOOR = 40;
/** AUDIT-ROUND-2 (fix 1): the LABEL floor — legends, axis tags, kickers,
 *  source tags and chip text. One step under the READ floor: labels are
 *  glanceable identifiers, not body copy, and 34px survives the 320px
 *  gate (≈5.7px) where 28px (4.7px) did not. */
exports.LABEL_FLOOR = 34;
/** Dev-mode warning sink for floor violations (the studio can surface it). */
function typeFloorWarn(site, size) {
    if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
        // non-fatal: clamped text still renders AT the floor; this exists so a
        // too-long string surfaces in dev instead of silently shipping tiny.
        console.warn(`[theme] TYPE_FLOOR clamp at ${site}: text wanted <${size}px>`);
    }
}
// ── Typography (audit P1-1): bundled OFL faces, loaded by the studio page ───
// Fraunces (SIL OFL) replaces the Georgia lottery — an editorial display
// serif with real weights; Inter (SIL OFL) replaces the Windows-only Segoe
// UI stack. Both ship in /public/fonts and are @font-face'd in globals.css,
// so renders are pixel-identical on any machine, online or offline. The old
// families stay in the stack as last-resort fallbacks only.
exports.FONT_DISPLAY = '"Fraunces", Georgia, "Times New Roman", "Songti SC", serif';
// v5: system-ui / -apple-system removed — node-canvas REJECTS font stacks
// containing them and silently falls back to the wrong family in headless
// renders (the harness caught it). Browsers are unaffected: Inter resolves
// first in the stack either way.
exports.FONT_UI = '"Inter", "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
exports.FONT_UI_SEMI = '"Inter", "Segoe UI Variable Display", "Segoe UI Semibold", "Segoe UI", Roboto, sans-serif';
const TONE = (tone) => {
    switch (tone) {
        case 'up':
            // v10: vivid stroke color rides along — callers opt in for line/bar ink
            return { main: exports.PALETTE.up, soft: exports.PALETTE.upSoft, vivid: exports.PALETTE.upVivid };
        case 'down':
            return { main: exports.PALETTE.down, soft: exports.PALETTE.downSoft, vivid: exports.PALETTE.downVivid };
        case 'gold':
            // v8: display gold for fills + big numerals (was goldDeep — read
            // as brown on the pie; see goldDisplay note above)
            return { main: exports.PALETTE.goldDisplay, soft: exports.PALETTE.goldWash, vivid: exports.PALETTE.goldDisplay };
        case 'muted':
            // 100-JUDGE REPORT (fix D23 — THE BLACK BARS): the default branch
            // mapped every unknown tone to INK, so barsCompare's 'muted'
            // remainder rendered as near-black rods on the light field — heavy,
            // dirty, off the value ladder. 'muted' now owns the sage the pie's
            // remainder swatch already ships (one family, one tone).
            return { main: exports.PALETTE.sage, soft: rgba(exports.PALETTE.sage, 0.16) };
        default:
            return { main: exports.PALETTE.ink, soft: exports.PALETTE.bgSoft };
    }
};
exports.TONE = TONE;
// ── Layout metrics (1920×1080 design grid; scenes scale from W/H) ─────────────
exports.M = {
    marginX: 110,
    marginTop: 96,
    titleY: 150,
    sourceY: 1012,
    captionY: 952,
    chapterLabelY: 74,
};
/**
 * Everything below this Y on the 1080-design grid belongs to the caption pill
 * (top of a 2-row pill ≈ 808) + progress bar. Scene content must stay above
 * it — or, deliberately, below the pill (pill bottom ≈ 956) in the narrow
 * gap above the progress bar. (Panel P0-2: four verified scene-text vs
 * caption-pill collisions shipped because scenes had no such constant.)
 */
exports.CAPTION_ZONE_TOP = 800;
/** rgba() helper: pass a #rrggbb color and alpha. */
function rgba(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
}
function hexLerp(a, b, t) {
    const pa = a.replace('#', '');
    const pb = b.replace('#', '');
    const ch = (i) => Math.round(lerpH(parseInt(pa.slice(i, i + 2), 16), parseInt(pb.slice(i, i + 2), 16), t));
    return `#${ch(0).toString(16).padStart(2, '0')}${ch(2).toString(16).padStart(2, '0')}${ch(4)
        .toString(16)
        .padStart(2, '0')}`;
}
const lerpH = (a, b, t) => a + (b - a) * t;
// ── Canvas drawing helpers (pure functions over CanvasRenderingContext2D) ────
function roundRect(ctx, x, y, w, h, r) {
    // v5: node-canvas renders arcTo on sub-10px rects with visible artifacts
    // (promoted from the render harness). Tiny plates read as rounded at
    // render scale anyway — plain rects are pixel-clean everywhere.
    if (w < 10 || h < 10) {
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.closePath();
        return;
    }
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    // PANEL-9 R7 (broken boxes everywhere): the previous arcTo sequence passed
    // wrong control points — each corner call used the NEXT corner's vertex as
    // its tangent point, so every rounded plate in the film (caption pills,
    // chips, cards, chart bands, rack boxes, callouts) filled as a skewed
    // wedge with diagonal edges and pinched ends, and text spilled outside
    // (verified at pixel level: a 200×100 r20 plate failed 5/10 shape probes).
    // Correct arcTo usage: (x1,y1) is the CORNER vertex, (x2,y2) lies on the
    // edge that follows it. Classic four-corner sequence, spec-exact:
    ctx.arcTo(x + w, y, x + w, y + h, rr); // top-right corner
    ctx.arcTo(x + w, y + h, x, y + h, rr); // bottom-right corner
    ctx.arcTo(x, y + h, x, y, rr); // bottom-left corner
    ctx.arcTo(x, y, x + w, y, rr); // top-left corner
    ctx.closePath();
}
/** VAULT NOIR glass card — a navy glass plate with a one-light shadow (deep
 *  vault black, lower-left), a hairline steel border, and a top-light
 *  gradient that reads as studio glass against the night canvas. The
 *  `tint` opt still lets a card carry its content's tone in the shadow. */
function card(ctx, x, y, w, h, opts = {}) {
    const { r = 26, alpha = 1, border = true, glow, tint } = opts;
    (0, collision_1.registerRect)(`card@${Math.round(x)},${Math.round(y)}`, x, y, w, h);
    ctx.save();
    ctx.globalAlpha = alpha;
    // layered soft shadow — vault black-blue, one light (upper right)
    const sh = tint ?? exports.PALETTE.shadow;
    const a1 = tint ? 0.5 : 0.42;
    const a2 = tint ? 0.36 : 0.30;
    ctx.fillStyle = rgba(sh, a1);
    roundRect(ctx, x - 6, y + 14, w, h, r);
    ctx.fill();
    ctx.fillStyle = rgba(sh, a2);
    roundRect(ctx, x - 5, y + 8, w, h, r);
    ctx.fill();
    if (glow) {
        ctx.fillStyle = glow;
        roundRect(ctx, x - 3, y - 3, w + 6, h + 6, r + 3);
        ctx.fill();
    }
    // the glass body — a vertical navy gradient that lifts toward the top
    const body = ctx.createLinearGradient(0, y, 0, y + h);
    body.addColorStop(0, mixHex(exports.PALETTE.card, '#3B5B9E', 0.30));
    body.addColorStop(0.35, exports.PALETTE.card);
    body.addColorStop(1, mixHex(exports.PALETTE.card, exports.PALETTE.shadow, 0.34));
    ctx.fillStyle = body;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    if (border) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = exports.PALETTE.cardBorder;
        roundRect(ctx, x, y, w, h, r);
        ctx.stroke();
        // the top-light — a 2.5px porcelain hairline on the top edge only:
        // the glass signature. Fades out down the sides.
        const hl = ctx.createLinearGradient(0, y, 0, y + Math.min(56, h));
        hl.addColorStop(0, rgba('#CFE3FF', 0.55));
        hl.addColorStop(1, rgba('#CFE3FF', 0));
        ctx.strokeStyle = hl;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + r * 0.6, y + 1.5);
        ctx.lineTo(x + w - r * 0.6, y + 1.5);
        ctx.stroke();
    }
    ctx.restore();
}
function setFont(ctx, size, weight = 400, family = exports.FONT_UI) {
    ctx.font = `${weight} ${size}px ${family}`;
}
/** Text that auto-shrinks to fit maxW. Returns the final size used.
 *  v9 (report D-07): the old floor of 14px broke the TYPE_FLOOR promise —
 *  fitText itself was the biggest sub-floor offender. It now clamps at
 *  TYPE_FLOOR (28) and warns in dev; a caller that needs smaller must wrap
 *  or shorten the string, not shrink the type. */
function fitText(ctx, text, x, y, maxW, size, weight = 400, family = exports.FONT_UI, fill = exports.PALETTE.ink) {
    let s = size;
    setFont(ctx, s, weight, family);
    while (ctx.measureText(text).width > maxW && s > exports.TYPE_FLOOR) {
        s -= 2;
        setFont(ctx, s, weight, family);
    }
    if (ctx.measureText(text).width > maxW && s <= exports.TYPE_FLOOR) {
        typeFloorWarn(`fitText("${text.slice(0, 24)}…")`, s);
    }
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
    (0, collision_1.registerRect)(`fitText:${text.slice(0, 18)}`, x, y - s, ctx.measureText(text).width, s * 1.2);
    return s;
}
/** Draws a small pill chip; returns total width. */
function chip(ctx, text, x, y, opts = {}) {
    const { size = 28, padX = 22, padY = 12, bg = exports.PALETTE.chipBg, fg = exports.PALETTE.inkSoft, border = exports.PALETTE.cardBorder, weight = 600, alpha = 1, iconDot, } = opts;
    ctx.save();
    ctx.globalAlpha = alpha;
    setFont(ctx, size, weight);
    const tw = ctx.measureText(text).width;
    const dotW = iconDot ? size * 0.9 + 10 : 0;
    const w = tw + padX * 2 + dotW;
    const h = size + padY * 2;
    (0, collision_1.registerRect)(`chip:${text.slice(0, 14)}`, x, y, w, h);
    // the chip shadow joins the one-light rule (−5, +7) — vault black
    ctx.fillStyle = rgba(exports.PALETTE.shadow, 0.4);
    roundRect(ctx, x - 5, y + 7, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = bg;
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = border;
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.stroke();
    if (iconDot) {
        ctx.fillStyle = iconDot;
        ctx.beginPath();
        ctx.arc(x + padX + size * 0.45, y + h / 2, size * 0.32, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = fg;
    ctx.fillText(text, x + padX + dotW, y + h / 2 + size * 0.36);
    ctx.restore();
    return w;
}
/** Measures a chip's width without drawing. */
function chipWidth(ctx, text, opts = {}) {
    const { size = 28, padX = 22, iconDot } = opts;
    setFont(ctx, size, 600);
    return ctx.measureText(text).width + padX * 2 + (iconDot ? size * 0.9 + 10 : 0);
}
/** The chapter-keyed plane rotation: card → room → desk → card … Consecutive
 *  chapters that carry values now sit on different materials (the audit's
 *  own alternation ask), and the read dies that "by frame 14 the eye stops
 *  registering new information". */
function valuePlaneFor(chapterIdx) {
    const rot = ['card', 'room', 'desk'];
    return rot[((chapterIdx % 3) + 3) % 3];
}
/** The ROOM plane's field color — the chapter-card tone ONE register down:
 *  a dark navy field mixed toward the room's accent so data rooms read as
 *  steel-blue, gold rooms as navy-brass. Ink numerals on it hold ≈7:1. */
function roomFill(tone) {
    const tn = (0, exports.TONE)(tone);
    return tone === 'gold'
        ? mixHex(exports.PALETTE.goldWash, exports.PALETTE.goldDeep, 0.34)
        : mixHex(tn.soft, tn.main, 0.30);
}
/** The ROOM plane slab — the chapter cards' material at value-block size:
 *  a full tone field DEEPENED to the room register (see roomFill),
 *  ARCHITECTURALLY SHARP (3px corner — the chapter card's fillRect
 *  genealogy; a floating card's 22-34px rounding is the other material's
 *  signature), flat (no layered shadow), with the gold rule at the caller's
 *  accent slot. Numerals on a room slab ride INK. Drawn in scene space. */
function toneRoom(ctx, x, y, w, h, tone, opts = {}) {
    const { ruleX = x + 34, ruleY = y + 26, ruleW = 64, ruleH = 8, grow = 1, alpha = 1, heroMaterial = false } = opts;
    (0, collision_1.registerRect)(`toneRoom@${Math.round(x)},${Math.round(y)}`, x, y, w, h);
    ctx.save();
    ctx.globalAlpha = alpha;
    // B16 (Visual Quality Audit — THE MONEY-SHOT RENDERS AS A BROKEN SLAB):
    // the room material's flat/sharp/shadow-less read is the chapter card's
    // own full-bleed language — at HERO-CARD scale the same fill read as a
    // featureless mustard placeholder ("a viewer screenshotting the frame
    // would post it as a rendering bug"). The hero material keeps the room
    // register but gains the film's card craft: the one-light shadow
    // (lower-left, like every card), a drawn ink hairline edge, and a
    // draftsmanlike 10px corner instead of the 3px artifact.
    if (heroMaterial) {
        ctx.fillStyle = rgba(exports.PALETTE.shadow, 0.55);
        roundRect(ctx, x - 6, y + 12, w, h, 10);
        ctx.fill();
    }
    ctx.fillStyle = roomFill(tone);
    roundRect(ctx, x, y, w, h, heroMaterial ? 10 : 3);
    ctx.fill();
    if (heroMaterial) {
        ctx.strokeStyle = rgba(exports.PALETTE.cardBorder, 0.8);
        ctx.lineWidth = 2.5;
        roundRect(ctx, x, y, w, h, 10);
        ctx.stroke();
    }
    // the brass rule rides goldDisplay on the deep field (goldInk washes on it)
    ctx.fillStyle = tone === 'gold' ? exports.PALETTE.goldDisplay : exports.PALETTE.gold;
    if (grow > 0)
        roundRect(ctx, ruleX, ruleY, Math.max(2, ruleW * grow), ruleH, ruleH / 2);
    ctx.fill();
    ctx.restore();
}
/** The DESK plane rule — one horizontal ink hairline the value sits on,
 *  ledger-style. `grow` drives the draw-on. Registered so the guard sees
 *  the line as content. */
function deskRule(ctx, x, y, w, grow = 1, alpha = 1) {
    if (grow <= 0)
        return;
    (0, collision_1.registerRect)(`deskRule@${Math.round(x)},${Math.round(y)}`, x, y, Math.max(2, w * grow), 4);
    // P0 follow-up: the desk rule IS the stage line — every host and axis
    // walker stands on/behind it by design (the film's staging grammar).
    // Declaring it here makes the figure-vs-deskline graze a declared
    // contact everywhere, instead of a per-scene exemption list.
    (0, collision_1.declareHostContact)(`deskRule@${Math.round(x)},${Math.round(y)}`);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.62);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w * grow, y);
    ctx.stroke();
    ctx.restore();
}
/** Soft radial glow blob. */
function glowBlob(ctx, x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(0.6, rgba(color, alpha * 0.35));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}
/** PHASE-2 (report §11 Phase 2): linear hex lerp — the chapter wash mixes
 *  the soft room tone toward its vivid accent. a/b are #RRGGBB, t 0..1. */
function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (sa, sb) => Math.round(sa + (sb - sa) * t);
    const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
    const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
    const bl = ch(pa & 255, pb & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}
/** v10 (panel COLOR-2) — the editorial SCENE PLATE: a full-width, barely-
 *  tinted rounded plate that data scenes sit on. The v8 frames floated white
 *  cards on raw white — measured 72–93% near-white per frame, which the
 *  panel read as "a spreadsheet on a lightbox". A soft tone wash (upSoft /
 *  goldWash at ~55% on white) behind the whole scene gives charts a ROOM to
 *  live in; white cards then pop forward instead of dissolving. Drawn right
 *  after paintBg, before the bokeh (motes float over the plate = depth).
 *  Never registered with the guard — it is background, not reading content.
 *
 *  PHASE-2 (report §11 Phase 2 — BRING BACK THE COLOR):
 *  1. The multiply plate strength is CUT from ~0.48 to 0.30 (0.95 × 0.32):
 *     the rooms lighten one step and stop drying into fog.
 *  2. The chapter wash now ROUTES THROUGH THE VIVID ACCENTS the palette
 *     already defines — each room tone mixes 17% toward its vivid accent
 *     (up #0B6E63 teal / down #C2542E coral / gold #C9A227) so the plate
 *     carries the chapter's hue at a perceptible chroma instead of grey-sage.
 *  3. The acceptance bar is MEASURED per frame by the panel's pixel_audit
 *     script: saturation ≥ 0.12 on every host and data frame while mean
 *     luminance stays inside 180-215. */
function scenePlate(ctx, W, H, tone = 'neutral', 
// VAULT NOIR: the plate STRENGTH is how far the room lifts off the canvas.
strength = 0.95, 
// the chapter family key from chapterFamily() — per-family owned
// architecture, exactly as the audit prescribed for the previous film.
family = null, 
// statement beats (bigText / stampCard / quoteCard) pass { furniture:
// false } for a clean stage — plate, wash, floor band and family rails
// stay; only the window/console props skip.
opts = {}) {
    // VAULT NOIR ROOMS: the plate composites SOURCE-OVER at low alpha — on a
    // dark canvas a multiply plate would crush the room to black. Each tone
    // mixes its own accent into a navy field: steel-blue ('up'), bruised
    // coral ('down'), navy-brass ('gold'), and a whisper for 'neutral'.
    const softBase = tone === 'up' ? exports.PALETTE.upSoft
        : tone === 'down' ? exports.PALETTE.downSoft
            : tone === 'gold' ? exports.PALETTE.goldWash
                : '#182C55';
    let soft = mixHex(softBase, tone === 'down' ? exports.PALETTE.down
        : tone === 'gold' ? exports.PALETTE.gold
            : exports.PALETTE.up, 0.16);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = rgba(soft, Math.min(0.55, strength * 0.34));
    ctx.fillRect(0, 0, W, H);
    // THE VIVID WASH — on the dark canvas the accent wash ADDS light: the
    // chapter's vivid accent glows at the top of the room and fades by the
    // floor line, so a chapter change reads as a lighting change, not a tint.
    const vividUp = exports.PALETTE.upVivid;
    const vividWash = tone === 'down' ? rgba(exports.PALETTE.downVivid, 0.10 * (strength / 0.95))
        : tone === 'gold' ? rgba(exports.PALETTE.goldDisplay, 0.075 * (strength / 0.95))
            : rgba(vividUp, 0.13 * (strength / 0.95));
    const washGrad = ctx.createLinearGradient(0, 0, 0, H);
    washGrad.addColorStop(0, vividWash);
    washGrad.addColorStop(0.62, rgba('#000000', 0));
    ctx.fillStyle = washGrad;
    ctx.fillRect(0, 0, W, H);
    // THE FLOOR BAND — the ground drops BELOW the canvas tone: a deep
    // vault-black ramp under the presenter's ground line (host ground ≈
    // 0.64·H). The room gains mass and the figures stand IN the night.
    {
        const bandTop = H * 0.655;
        const fg = ctx.createLinearGradient(0, bandTop, 0, H);
        fg.addColorStop(0, rgba(exports.PALETTE.shadow, 0));
        fg.addColorStop(0.45, rgba(exports.PALETTE.shadow, 0.34));
        fg.addColorStop(1, rgba(exports.PALETTE.shadow, 0.52));
        ctx.fillStyle = fg;
        ctx.fillRect(0, bandTop, W, H - bandTop);
    }
    // ── OWNED ENVIRONMENT LANGUAGE (dark register) ──────────────────────────
    // studio rooms ('up' / 'down'): the TERMINAL PANE top-right — a glowing
    //   glass window with a price rail (the room's light source, upper right,
    //   the same side every rim light falls) + a steel CONSOLE EDGE below;
    // data rooms ('gold'): the DATA SHELF top-left — brass bracket lines with
    //   glowing ledger spines + the FLOOR GRID (perspective hairlines);
    // neutral statement rooms: the window light only — typography keeps a
    //   clean stage.
    if (H > W) {
        // portrait rooms are architecture-free (same rule as the previous film)
    }
    else if (opts.furniture !== false) {
        {
            ctx.lineCap = 'round';
            if (tone === 'up' || tone === 'down') {
                // THE TERMINAL PANE — top-right: a glowing glass window with a live
                // price rail; the room's light source.
                const wx = W * 0.775, wy = H * 0.10, ww = W * 0.085, wh = H * 0.20;
                ctx.save();
                const wg = ctx.createLinearGradient(wx, wy, wx, wy + wh);
                wg.addColorStop(0, rgba(tone === 'down' ? exports.PALETTE.down : exports.PALETTE.up, 0.30));
                wg.addColorStop(1, rgba(tone === 'down' ? exports.PALETTE.down : exports.PALETTE.up, 0.10));
                ctx.fillStyle = wg;
                roundRect(ctx, wx, wy, ww, wh, 10);
                ctx.fill();
                ctx.strokeStyle = rgba('#9FC0E8', 0.42);
                ctx.lineWidth = 3;
                roundRect(ctx, wx, wy, ww, wh, 10);
                ctx.stroke();
                ctx.strokeStyle = rgba('#9FC0E8', 0.26);
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(wx + ww / 2, wy);
                ctx.lineTo(wx + ww / 2, wy + wh);
                ctx.moveTo(wx, wy + wh / 2);
                ctx.lineTo(wx + ww, wy + wh / 2);
                ctx.stroke();
                // the live tape under the pane — two glowing bars
                ctx.fillStyle = rgba(tone === 'down' ? exports.PALETTE.downVivid : exports.PALETTE.upVivid, 0.55);
                roundRect(ctx, wx + ww * 0.14, wy + wh * 0.24, ww * 0.5, 6, 3);
                ctx.fill();
                roundRect(ctx, wx + ww * 0.14, wy + wh * 0.40, ww * 0.68, 6, 3);
                ctx.fill();
                ctx.restore();
                // THE CONSOLE EDGE — a steel hairline + leg tick, bottom-right
                const dy2 = H * 0.905;
                ctx.save();
                ctx.fillStyle = rgba('#8FB4E4', 0.10);
                roundRect(ctx, W * 0.60, dy2 - 10, W * 0.37, 12, 6);
                ctx.fill();
                ctx.strokeStyle = rgba('#9FC0E8', 0.30);
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(W * 0.60, dy2);
                ctx.lineTo(W * 0.97, dy2);
                ctx.stroke();
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(W * 0.855, dy2);
                ctx.lineTo(W * 0.855, dy2 + H * 0.045);
                ctx.stroke();
                ctx.restore();
            }
            else if (tone === 'gold') {
                // THE DATA SHELF — top-left: brass lines with five glowing ledger
                // spines (the vault's record wall).
                const sy1 = H * 0.075, sy2 = H * 0.145, sx0 = W * 0.055, sx1 = W * 0.17;
                ctx.save();
                ctx.strokeStyle = rgba(exports.PALETTE.gold, 0.42);
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(sx0, sy1);
                ctx.lineTo(sx1, sy1);
                ctx.moveTo(sx0, sy2);
                ctx.lineTo(sx1, sy2);
                ctx.stroke();
                const heights = [34, 26, 30, 22, 28];
                const widths = [10, 8, 11, 8, 9];
                heights.forEach((bh, i) => {
                    const bx = sx0 + 14 + i * (sx1 - sx0 - 40) / 5;
                    ctx.fillStyle = rgba('#8FB4E4', 0.16);
                    ctx.fillRect(bx, sy1 - bh, widths[i], bh);
                    ctx.fillStyle = rgba(exports.PALETTE.goldDisplay, 0.5);
                    ctx.fillRect(bx + 1, sy1 - bh + 5, widths[i] - 2, 4);
                });
                // the shelf brackets
                ctx.strokeStyle = rgba(exports.PALETTE.gold, 0.40);
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(sx0 + 4, sy1);
                ctx.lineTo(sx0 + 4, sy1 + 8);
                ctx.moveTo(sx1 - 4, sy1);
                ctx.lineTo(sx1 - 4, sy1 + 8);
                ctx.stroke();
                ctx.restore();
                // THE LAMP GLOW — the shelf lamp's brass pool
                glowBlob(ctx, W * 0.105, H * 0.11, W * 0.09, exports.PALETTE.gold, 0.34);
                // THE FLOOR MATERIAL — sparse perspective hairlines over the floor band
                ctx.save();
                ctx.strokeStyle = rgba('#9FC0E8', 0.10);
                ctx.lineWidth = 3;
                for (let i = 0; i < 14; i++) {
                    const px2 = ((i * 173) % W);
                    const py2 = H * 0.70 + ((i * 97) % Math.round(H * 0.24));
                    ctx.beginPath();
                    ctx.moveTo(px2 - 26, py2);
                    ctx.lineTo(px2 + 26, py2);
                    ctx.stroke();
                }
                ctx.restore();
            }
            else {
                // neutral statement rooms — the window light only (clean stage)
                glowBlob(ctx, W * 0.885, H * 0.155, W * 0.11, exports.PALETTE.gold, 0.26);
            }
        }
    }
    setRoomFamily(family ?? null);
    ctx.restore();
}
/** B9 RE-SPEC (Visual Quality Audit §3.2 — FURNITURE COLLISIONS): the
 *  chapter room-rail used to draw INSIDE scenePlate — under the camera
 *  transform. A camera-riding rail can never hold a fixed relationship to
 *  the FIXED watermark: at the raised register (scale ~1.15 about the frame
 *  centre) the odds board's percent chips rode ~55px above their design row
 *  and CLIPPED off the top frame edge; at the lowered drift they slid down
 *  INTO the watermark band — the audit's "watermark collides with the
 *  stat-chip row" on the majority of mint-room frames. Room architecture is
 *  FIXED furniture: the rail now draws in screen space from the director
 *  (before captions/watermark) at the same design band — x >= 0.17W keeps
 *  it horizontally clear of the channel lockup, the fixed y makes the
 *  relationship to every fixed element permanent, and the band registers
 *  with the guard as fixed furniture.
 *  Called by the director AFTER the scene, BEFORE the captions/watermark. */
function drawRoomRail(ctx, W, H, family, channelName) {
    ctx.save();
    ctx.lineCap = 'round';
    // B9 RE-SPEC (the measured fix): the rail's left anchors were designed at
    // W*0.17 = 326 — but the shipped watermark's text run ('THE DATA DESK' at
    // the TYPE_FLOOR face from x=82) measures ≈392px wide and ends at x≈474:
    // the first chip sat 148px INSIDE the lockup's text. The rail now
    // MEASURES the watermark's own glyph run (same face, same caps) and
    // remaps its whole anchor span into [textEnd + 30, W - 56] with a
    // horizontal squeeze (≤9% at the shipped name — invisible on whisper-
    // alpha furniture). The relationship to the fixed watermark is now
    // permanent for ANY channel name.
    let startX = W * 0.17;
    if (channelName) {
        ctx.font = '600 ' + exports.TYPE_FLOOR + 'px Inter, sans-serif';
        startX = Math.min(W * 0.62, Math.max(startX, 82 + ctx.measureText(channelName.toUpperCase()).width + 30));
    }
    const span0 = W * 0.94 - W * 0.17;
    const span1 = W - 56 - startX;
    ctx.translate(startX - W * 0.17, 0);
    ctx.scale(span1 / span0, 1);
    const fy = 34; // the rail's FIXED centreline (screen space, 1080 grid)
    if (family === 'market') {
        // THE TICKER RAIL — the market room's own architecture: an ink tape
        // line with live price tags (up teal / down coral) and a LIVE dot.
        ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.36);
        ctx.lineWidth = 4;
        ctx.beginPath();
        // P0 defect sweep (watermark-vs-chip): the baseline rule started at
        // W*0.06 — running UNDER the channel lockup's glyphs (the chips were
        // moved clear earlier; the rule was not). It now starts AT the rail's
        // own first-chip column, so the lockup owns its corner untouched.
        ctx.moveTo(W * 0.17, fy + 16);
        ctx.lineTo(W * 0.94, fy + 16);
        ctx.stroke();
        // the rail starts past the channel lockup (x >= 0.17W — the
        // lockup owns 0.02-0.14W; the rail never plates it)
        const tags = [
            [0.17, '+18%', exports.PALETTE.up], [0.36, '+20%', exports.PALETTE.up],
            [0.56, '-7%', exports.PALETTE.down], [0.76, '+11%', exports.PALETTE.up],
        ];
        tags.forEach(([fx, label, col]) => {
            const tx = W * fx;
            ctx.fillStyle = rgba(col, 0.42);
            roundRect(ctx, tx, fy - 10, 86, 34, 8);
            ctx.fill();
            ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.34);
            ctx.lineWidth = 2.5;
            roundRect(ctx, tx, fy - 10, 86, 34, 8);
            ctx.stroke();
            ctx.fillStyle = rgba(exports.PALETTE.ink, 0.62);
            ctx.font = '700 20px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, tx + 43, fy + 14);
        });
        // the LIVE dot — the tape is alive
        ctx.fillStyle = rgba(exports.PALETTE.down, 0.55);
        ctx.beginPath();
        ctx.arc(W * 0.905, fy + 16, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (family === 'charts') {
        // THE PEGBOARD STRIP — the analyst's wall: a dotted peg row with two
        // hanging tools (ruler, pencil) silhouettes.
        ctx.fillStyle = rgba(exports.PALETTE.ink, 0.30);
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(W * 0.175 + i * (W * 0.022), fy + 8, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // the ruler (a wide slat with tick marks) + the pencil (a tapered
        // stick), hanging from the pegs
        ctx.fillStyle = rgba(exports.PALETTE.gold, 0.46);
        roundRect(ctx, W * 0.180, fy + 14, 150, 26, 5);
        ctx.fill();
        ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.38);
        ctx.lineWidth = 2.5;
        for (let i = 1; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(W * 0.180 + i * 24, fy + 14);
            ctx.lineTo(W * 0.180 + i * 24, fy + 22);
            ctx.stroke();
        }
        ctx.fillStyle = rgba(exports.PALETTE.ink, 0.36);
        ctx.beginPath();
        ctx.moveTo(W * 0.360, fy + 16);
        ctx.lineTo(W * 0.360 + 118, fy + 16);
        ctx.lineTo(W * 0.360 + 130, fy + 27);
        ctx.lineTo(W * 0.360 + 118, fy + 38);
        ctx.lineTo(W * 0.360, fy + 38);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(exports.PALETTE.gold, 0.52);
        ctx.beginPath();
        ctx.moveTo(W * 0.360 + 118, fy + 16);
        ctx.lineTo(W * 0.360 + 130, fy + 27);
        ctx.lineTo(W * 0.360 + 118, fy + 38);
        ctx.closePath();
        ctx.fill();
    }
    else if (family === 'survey') {
        // THE POLL RAIL — the survey room: four mini poll bars with tick
        // bases, the chapter's own data-shape as architecture.
        const polls = [
            [0.17, 34, exports.PALETTE.up], [0.28, 22, exports.PALETTE.up],
            [0.39, 30, exports.PALETTE.down], [0.50, 16, exports.PALETTE.ink],
        ];
        polls.forEach(([fx, bh, col]) => {
            const bx = W * fx;
            ctx.fillStyle = rgba(col, 0.44);
            roundRect(ctx, bx, fy + 30 - bh, 26, bh, 5);
            ctx.fill();
            ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.32);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(bx - 6, fy + 30);
            ctx.lineTo(bx + 32, fy + 30);
            ctx.stroke();
        });
    }
    else if (family === 'machines') {
        // THE PIPE RAIL — the machine room's architecture: a pressure pipe
        // with a valve wheel and a capped end.
        ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.36);
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(W * 0.175, fy + 16);
        ctx.lineTo(W * 0.90, fy + 16);
        ctx.stroke();
        // the pipe's highlight line (the cylinder read)
        ctx.strokeStyle = rgba('#FFFFFF', 0.30);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(W * 0.175, fy + 12);
        ctx.lineTo(W * 0.90, fy + 12);
        ctx.stroke();
        // the valve wheel — a spoked gold wheel on a stem
        const vx = W * 0.30;
        ctx.strokeStyle = rgba(exports.PALETTE.gold, 0.62);
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(vx, fy - 6, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 3.5;
        for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
            ctx.beginPath();
            ctx.moveTo(vx - Math.cos(a) * 14, fy - 6 - Math.sin(a) * 14);
            ctx.lineTo(vx + Math.cos(a) * 14, fy - 6 + Math.sin(a) * 14);
            ctx.stroke();
        }
        // the capped end
        ctx.fillStyle = rgba(exports.PALETTE.ink, 0.40);
        roundRect(ctx, W * 0.895, fy + 6, 14, 20, 4);
        ctx.fill();
    }
    else if (family === 'data') {
        // THE RACK RAIL — the data room: six mini rack cells with LED dots,
        // the datacenter's own motif echoed in the room's architecture.
        for (let i = 0; i < 6; i++) {
            const rx = W * 0.175 + i * (W * 0.046);
            ctx.fillStyle = rgba(exports.PALETTE.ink, 0.34);
            roundRect(ctx, rx, fy - 6, 40, 46, 5);
            ctx.fill();
            ctx.fillStyle = rgba(exports.PALETTE.up, 0.62);
            ctx.beginPath();
            ctx.arc(rx + 10, fy + 4, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = rgba(exports.PALETTE.gold, 0.62);
            ctx.beginPath();
            ctx.arc(rx + 22, fy + 12, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.30);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rx + 6, fy + 24);
            ctx.lineTo(rx + 34, fy + 24);
            ctx.moveTo(rx + 6, fy + 32);
            ctx.lineTo(rx + 34, fy + 32);
            ctx.stroke();
        }
    }
    else if (family === 'debt') {
        // THE COIN-STACK RAIL — the debt room: descending stacks of coin
        // blocks, the balance draining left to right.
        const stacks = [[0.17, 5], [0.26, 4], [0.35, 3], [0.44, 2], [0.53, 1]];
        stacks.forEach(([fx, n]) => {
            const bx = W * fx;
            for (let k = 0; k < n; k++) {
                ctx.fillStyle = rgba(exports.PALETTE.gold, 0.52);
                roundRect(ctx, bx, fy + 24 - k * 12, 44, 10, 4);
                ctx.fill();
                ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.34);
                ctx.lineWidth = 2;
                roundRect(ctx, bx, fy + 24 - k * 12, 44, 10, 4);
                ctx.stroke();
            }
        });
    }
    else if (family === 'odds') {
        // THE ODDS BOARD RAIL — the odds room: percent chips with direction
        // arrows, the bookmaker's board as architecture.
        const chips = [
            [0.17, '1 IN 4', exports.PALETTE.down], [0.34, '72 ODDS', exports.PALETTE.ink],
            [0.52, 'x1.8', exports.PALETTE.up], [0.68, '-3x', exports.PALETTE.down],
        ];
        chips.forEach(([fx, label, col]) => {
            const tx = W * fx;
            ctx.fillStyle = rgba(col, 0.40);
            roundRect(ctx, tx, fy - 10, 118, 36, 9);
            ctx.fill();
            ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.36);
            ctx.lineWidth = 2.5;
            roundRect(ctx, tx, fy - 10, 118, 36, 9);
            ctx.stroke();
            ctx.fillStyle = rgba(exports.PALETTE.ink, 0.62);
            ctx.font = '700 19px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, tx + 59, fy + 15);
        });
    }
    // P0 defect sweep: the rail's guard envelope ran y 10..80 — 26px of air
    // BELOW its own ink (the chips ~16..56 and the rule at 50). The intro
    // dive's host bands graze that air at y≈68 and the sweep flagged a
    // designed camera move as a defect. The envelope now hugs the ink:
    // y 12..58 — anything crossing the rail's DRAWN band still flags.
    // P0 rule R1: the envelope hugs the ACTUAL drawn ink (startX carries
    // the lockup-clearance floor) — the stale W*0.17 anchor overlapped the
    // watermark's envelope in air.
    (0, collision_1.registerFixed)('roomrail', Math.round(startX), 12, Math.max(120, Math.round(W * 0.94) - Math.round(startX)), 46);
    // families 'close' and 'end' keep the clean stage on purpose.
    ctx.restore();
}
/** The family the CURRENT frame's scenePlate drew with (null = clean
 *  stage). The director resets it before the scene and reads it after —
 *  the rail then draws ONCE, in fixed space, outside the camera. */
let roomFamily = null;
function setRoomFamily(f) { roomFamily = f; }
function getRoomFamily() { return roomFamily; }
/** B15 (MINT MONOTONY): the chapter whose wash paintBg tints this frame.
 *  The director sets it beside chapterTone; scenes calling paintBg
 *  themselves inherit it. -1 = untinted (the pre-audit behaviour). */
let washChapter = -1;
function setWashChapter(i) { washChapter = i; }
/** PHASE 4: the chapter index -> its room-architecture family. The film's
 *  nine chapters map to eight families; close/end keep the clean stage
 *  (their frames are full-bleed compositions that own the wall already). */
function chapterFamily(chapterIdx) {
    return [
        'market', // c1 — the market split
        'charts', // c3 — the charts chapter
        'survey', // c4 — the survey chapter
        'machines', // c5 — pump / gauge / the machine room
        'data', // c6 — the datacenter / margins
        'debt', // c7 — the debt / paradox chapter
        'odds', // c8 — fund / odds
        null, // c9 — takeaways / the close: clean stage
        null, // c10 — the end screen: clean stage
    ][chapterIdx] ?? null;
}
/** Paints the standard scene background: pure white base + breathing wash.
 *  v8: the wash takes a chapter TONE (teal / coral / gold rotation) at a
 *  whisper 3% — a 20-minute film now travels through a color journey
 *  instead of one flat white, while never leaving the light register. */
function paintBg(ctx, W, H, t = 0, chapterTone = 'neutral') {
    // VAULT NOIR CANVAS — a vertical navy gradient (never pure black: the
    // floor lifts toward a visible steel blue). Bled 96px past the canvas to
    // absorb the camera envelope, exactly as the previous film's base did.
    const base = ctx.createLinearGradient(0, -96, 0, H + 96);
    base.addColorStop(0, exports.PALETTE.bgTop);
    base.addColorStop(0.72, mixHex(exports.PALETTE.bgTop, exports.PALETTE.bgBottom, 0.85));
    base.addColorStop(1, exports.PALETTE.bgBottom);
    ctx.fillStyle = base;
    ctx.fillRect(-96, -96, W + 192, H + 192);
    const pulse = 0.5 + 0.5 * Math.sin(t / 6000);
    let wash = chapterTone === 'up' ? exports.PALETTE.up
        : chapterTone === 'down' ? exports.PALETTE.down
            : chapterTone === 'gold' ? exports.PALETTE.gold
                : exports.PALETTE.up;
    // THE CHAPTER LIGHT JOURNEY — each chapter breathes its own accent into
    // the vault: teal flows (market/data), coral friction (cases/trap),
    // brass resolution (conclusion/end). The pools ride the same 6s clock;
    // on the dark canvas a 0.16-0.24 glow reads like real set lighting.
    const strength = chapterTone === 'neutral'
        ? 0.13
        : chapterTone === 'gold'
            ? 0.17
            : chapterTone === 'down'
                ? 0.15
                : 0.18;
    glowBlob(ctx, W * 0.82, H * 0.16 + driftY(t), W * 0.5, wash, strength + 0.014 * pulse);
    glowBlob(ctx, W * 0.1, H * 0.9, W * 0.42, wash, strength * 0.62 + 0.012 * (1 - pulse));
    // THE KEY LIGHT — one warm brass gradient from the upper-left; the same
    // one-light rule every shadow in the film answers.
    {
        const key = ctx.createLinearGradient(0, 0, W * 0.55, H * 0.8);
        key.addColorStop(0, rgba(exports.PALETTE.gold, 0.075));
        key.addColorStop(1, rgba(exports.PALETTE.gold, 0));
        ctx.fillStyle = key;
        ctx.fillRect(-96, -96, W + 192, H + 192);
    }
    // THE ATMOSPHERE — a cold ice bloom low-center (the vault's glass floor
    // reflecting the room), beneath the vignette + grain.
    glowBlob(ctx, W * 0.5, H * 0.72, W * 0.34, exports.PALETTE.up, 0.05 + 0.008 * pulse);
    // the stage world — the vault floor plane + architecture band
    (0, stage_1.drawStageWorld)(ctx, W, H, t);
}
const driftY = (t) => Math.sin(t / 5200) * 26;
/** Rounded line helper for strokes. */
function inkStroke(ctx, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}
/** P2 U12 (Visual Quality Audit §4.4 — ONE DESIGNED ROOM PER CHAPTER
 *  FAMILY): the fundSplit 493-wall is the film's own proof of room grade —
 *  a full-width structured mass, perspective, value planes. Every chapter
 *  family's rooms come up to that bar with three committed pieces drawn in
 *  SCREEN space (same call site as drawRoomRail, fixed to the frame):
 *    1. THE WALL OBJECT — the family's owned framed plaque on the right
 *       flank (structured dark mass + ivory detail, background-grade).
 *    2. THE HORIZON PROP — a low console with one family silhouette on
 *       the left floor edge.
 *    3. THE DESK SURFACE — a perspective trapezoid plane with a real
 *       material gradient and a front-edge line, full width.
 *  Pure f(W, H); background plane; never registered with the guard (the
 *  figures and cards plate OVER it by design). */
function drawChapterRoom(ctx, W, H, family) {
    const deep = rgba(exports.PALETTE.ink, 0.16);
    const deep2 = rgba(exports.PALETTE.ink, 0.10);
    const ivory = rgba('#F7EFD8', 0.34);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // ── 3. the desk surface (drawn first: everything else sits on it) ──
    {
        const hy = H * 0.640; // the horizon (the wall-floor seam)
        const fy = H * 0.785; // the front edge
        const g = ctx.createLinearGradient(0, hy, 0, fy);
        g.addColorStop(0, rgba(exports.PALETTE.ink, 0.075));
        g.addColorStop(1, rgba(exports.PALETTE.ink, 0.13));
        ctx.fillStyle = g;
        ctx.beginPath();
        // the perspective trapezoid — the surface recedes toward the seam
        ctx.moveTo(W * 0.03, fy);
        ctx.lineTo(W * 0.115, hy);
        ctx.lineTo(W * 0.885, hy);
        ctx.lineTo(W * 0.97, fy);
        ctx.closePath();
        ctx.fill();
        // the material: three planed seams converging to the vanishing band
        ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.085);
        ctx.lineWidth = 2;
        for (const u of [0.28, 0.58, 0.84]) {
            const y0 = hy + (fy - hy) * u;
            const half = W * (0.425 - 0.085 * u);
            ctx.beginPath();
            ctx.moveTo(W * 0.5 - half, y0);
            ctx.lineTo(W * 0.5 + half, y0);
            ctx.stroke();
        }
        // the front edge — the one hard line a desk gets
        ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.22);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(W * 0.03, fy);
        ctx.lineTo(W * 0.97, fy);
        ctx.stroke();
    }
    // ── 1. the wall object — the family's framed plaque, right flank ──
    {
        const wx = W * 0.815, wy = H * 0.315, ww = W * 0.125, wh = H * 0.27;
        ctx.fillStyle = deep;
        ctx.beginPath();
        ctx.roundRect(wx, wy, ww, wh, 10);
        ctx.fill();
        ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.26);
        ctx.lineWidth = 3;
        ctx.stroke();
        const cx = wx + ww / 2, cy = wy + wh / 2;
        ctx.strokeStyle = ivory;
        ctx.fillStyle = ivory;
        ctx.lineWidth = 3;
        if (family === 'market') {
            // the ticker plaque — 4 price rows with live dots
            for (let i = 0; i < 4; i++) {
                const ry = wy + wh * (0.22 + i * 0.19);
                ctx.beginPath();
                ctx.moveTo(wx + ww * 0.12, ry);
                ctx.lineTo(wx + ww * 0.78, ry);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(wx + ww * 0.86, ry, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        else if (family === 'charts') {
            // the plotted curve plaque — axes + one drawn line
            ctx.beginPath();
            ctx.moveTo(wx + ww * 0.14, wy + wh * 0.18);
            ctx.lineTo(wx + ww * 0.14, cy + wh * 0.32);
            ctx.lineTo(wx + ww * 0.86, cy + wh * 0.32);
            ctx.stroke();
            ctx.beginPath();
            const pts = [[0.2, 0.72], [0.38, 0.55], [0.55, 0.62], [0.72, 0.34], [0.86, 0.24]];
            pts.forEach(([u, v], i) => {
                const px = wx + ww * u, py = wy + wh * v;
                if (i === 0)
                    ctx.moveTo(px, py);
                else
                    ctx.lineTo(px, py);
            });
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        else if (family === 'survey') {
            // the pinboard — three tilted cards on rails
            for (let i = 0; i < 3; i++) {
                const cxx = wx + ww * (0.26 + i * 0.24);
                const tilt = (i - 1) * 0.12;
                ctx.save();
                ctx.translate(cxx, cy);
                ctx.rotate(tilt);
                ctx.fillStyle = ivory;
                ctx.beginPath();
                ctx.roundRect(-ww * 0.10, -wh * 0.22, ww * 0.20, wh * 0.44, 4);
                ctx.fill();
                ctx.fillStyle = rgba(exports.PALETTE.ink, 0.30);
                ctx.beginPath();
                ctx.arc(0, -wh * 0.22, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.fillStyle = ivory;
            }
        }
        else if (family === 'machines') {
            // the gauge dial — ring, ticks, needle
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(cx, cy + wh * 0.06, wh * 0.26, Math.PI * 0.85, Math.PI * 2.15);
            ctx.stroke();
            for (let i = 0; i < 5; i++) {
                const a = Math.PI * (0.95 + i * 0.275);
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * wh * 0.22, cy + wh * 0.06 + Math.sin(a) * wh * 0.22);
                ctx.lineTo(cx + Math.cos(a) * wh * 0.26, cy + wh * 0.06 + Math.sin(a) * wh * 0.26);
                ctx.stroke();
            }
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx, cy + wh * 0.06);
            ctx.lineTo(cx + Math.cos(Math.PI * 1.7) * wh * 0.2, cy + wh * 0.06 + Math.sin(Math.PI * 1.7) * wh * 0.2);
            ctx.stroke();
        }
        else if (family === 'data') {
            // the rack column — 3 units + LED dots
            for (let i = 0; i < 3; i++) {
                const uy = wy + wh * (0.14 + i * 0.28);
                ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.30);
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.roundRect(wx + ww * 0.12, uy, ww * 0.76, wh * 0.20, 4);
                ctx.stroke();
                ctx.fillStyle = ivory;
                for (let k = 0; k < 3; k++) {
                    ctx.beginPath();
                    ctx.arc(wx + ww * (0.2 + k * 0.09), uy + wh * 0.10, 3.2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = ivory;
            }
        }
        else if (family === 'debt') {
            // the ledger plaque — descending columns
            const cols = [0.72, 0.56, 0.42, 0.30];
            cols.forEach((v, i) => {
                const bx = wx + ww * (0.16 + i * 0.19);
                const bh = wh * 0.5 * v;
                ctx.beginPath();
                ctx.roundRect(bx, wy + wh * 0.78 - bh, ww * 0.12, bh, 3);
                ctx.fill();
            });
        }
        else if (family === 'odds') {
            // the odds board — two columns + chips
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(wx + ww * 0.3, wy + wh * 0.16);
            ctx.lineTo(wx + ww * 0.3, wy + wh * 0.82);
            ctx.moveTo(wx + ww * 0.7, wy + wh * 0.16);
            ctx.lineTo(wx + ww * 0.7, wy + wh * 0.82);
            ctx.stroke();
            for (let i = 0; i < 3; i++) {
                const ry = wy + wh * (0.26 + i * 0.2);
                ctx.beginPath();
                ctx.roundRect(wx + ww * 0.34, ry - 7, ww * 0.3, 14, 7);
                ctx.fill();
            }
        }
    }
    // ── 2. the horizon prop — the console + one silhouette, left floor ──
    {
        const py = H * 0.655, px0 = W * 0.055, pw = W * 0.075;
        ctx.strokeStyle = rgba(exports.PALETTE.ink, 0.22);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(px0, py);
        ctx.lineTo(px0 + pw, py);
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px0 + pw * 0.14, py);
        ctx.lineTo(px0 + pw * 0.14, py + H * 0.045);
        ctx.moveTo(px0 + pw * 0.86, py);
        ctx.lineTo(px0 + pw * 0.86, py + H * 0.045);
        ctx.stroke();
        ctx.fillStyle = rgba(exports.PALETTE.ink, 0.20);
        // the family silhouette ON the console
        if (family === 'machines') {
            // the pump — a body + a spout
            ctx.beginPath();
            ctx.roundRect(px0 + pw * 0.28, py - H * 0.052, pw * 0.30, H * 0.052, 4);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(px0 + pw * 0.56, py - H * 0.070, pw * 0.16, H * 0.022, 3);
            ctx.fill();
        }
        else if (family === 'data') {
            // the server cart — two units
            ctx.beginPath();
            ctx.roundRect(px0 + pw * 0.26, py - H * 0.050, pw * 0.34, H * 0.024, 3);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(px0 + pw * 0.26, py - H * 0.024, pw * 0.34, H * 0.024, 3);
            ctx.fill();
        }
        else {
            // the shared console object — a low instrument box with a dial
            ctx.beginPath();
            ctx.roundRect(px0 + pw * 0.24, py - H * 0.044, pw * 0.36, H * 0.044, 4);
            ctx.fill();
            ctx.strokeStyle = ivory;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(px0 + pw * 0.42, py - H * 0.022, H * 0.013, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.restore();
}
