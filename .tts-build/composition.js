"use strict";
/**
 * composition.ts — PHASE 3 (Visual Audit report — Composition & value).
 *
 * The report's verdict: frames read as "a figure in a field". Three laws
 * fix that, all enforced offline by the harness (tools/render-check.mjs):
 *
 *  1. PER-FAMILY COMPOSITION TEMPLATES + A SUBJECT-OCCUPANCY FLOOR —
 *     every frame belongs to a family (host / data / statement); the
 *     family declares what carries the value structure and how much of
 *     the frame the subject must OWN:
 *       host beats      — the figure's bounding box fills ≥ 10% of the
 *                         frame AREA (height tiers alone let a 2.4-rig
 *                         presenter occupy under 9% — a bystander).
 *       data beats      — the HERO OBJECT (chart panel, card, pump,
 *                         gauge) fills ≥ 18% of the frame area.
 *     Figures and hero objects register their true drawn bbox as a side
 *     effect of drawing (the scale-law pattern: reset per frame by the
 *     director, asserted per frame by the harness). Scrub-safe.
 *
 *  2. ONE DARK MASS + ONE BRIGHT MASS PER FRAME — the family template
 *     names the two masses; the harness measures the rendered frame's
 *     dark share (the ink mass) and bright share (the gold mass) and
 *     asserts both bands. Texture systems (grain, bokeh) may never form
 *     a competing mass — that is the furniture whitelist's job.
 *
 *  3. THE FURNITURE WHITELIST — a background element that cannot survive
 *     the 320px gate (÷6 of the 1080p master) is deleted, not faded:
 *     sub-gate decoration reads as transcode noise. Enforced in effects
 *     (the bokeh far band, sub-gate motes) and audited by the harness's
 *     feed320 sweep.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAMILY_TEMPLATE = exports.AREA_FLOORS = void 0;
exports.familyOf = familyOf;
exports.setFrameContext = setFrameContext;
exports.frameContext = frameContext;
exports.resetOccupancy = resetOccupancy;
exports.areaRegistry = areaRegistry;
exports.figureAreaPct = figureAreaPct;
exports.scaleForFigureArea = scaleForFigureArea;
exports.registerFigureArea = registerFigureArea;
exports.registerHeroObject = registerHeroObject;
exports.occupancyViolations = occupancyViolations;
exports.valueMassViolations = valueMassViolations;
/** The occupancy floors (report Phase 3 — Composition & value). */
exports.AREA_FLOORS = {
    /** figure bbox ≥ this % of frame area on host beats */
    hostFigurePct: 10,
    /** hero object bbox ≥ this % of frame area on data/statement beats */
    dataHeroPct: 18,
};
/**
 * The scene-type → family mapping. Host-family types ALWAYS draw the
 * presenter (the grain register's figure-frame list is the same list —
 * one source of truth for "this frame is about a person").
 */
const HOST_FAMILY_TYPES = new Set([
    'host', 'divergeK', 'channelIntro', 'recapSplit', 'paradoxResolve',
    'ownerWorker', 'endScreen', 'commentPrompt', 'takeaways', 'chartJourney',
    'gasPump', 'recessionGauge', 'aiDatacenter',
]);
const STATEMENT_FAMILY_TYPES = new Set(['bigText', 'stampCard', 'quoteCard']);
function familyOf(sceneType) {
    if (HOST_FAMILY_TYPES.has(sceneType))
        return 'host';
    if (STATEMENT_FAMILY_TYPES.has(sceneType))
        return 'statement';
    return 'data';
}
/**
 * The per-family composition template: what carries the frame's value
 * structure (the ONE dark mass + the ONE bright mass) and which
 * occupancy floor applies. Declarative on purpose — the harness measures
 * the render against these declarations.
 */
exports.FAMILY_TEMPLATE = {
    host: {
        darkMass: 'figure ink (the INK register — the presenter is the dark mass)',
        brightMass: 'one gold hero accent (scarf / K / gold prop) — never gold confetti',
        figureFloorPct: exports.AREA_FLOORS.hostFigurePct,
        heroFloorPct: 0,
    },
    data: {
        darkMass: 'chart ink + the hero numeral',
        brightMass: 'the hero data surface (cream panel, gold highlight)',
        figureFloorPct: 0,
        heroFloorPct: exports.AREA_FLOORS.dataHeroPct,
    },
    statement: {
        darkMass: 'the display headline (inkDeep serif)',
        brightMass: 'the gold kicker line',
        figureFloorPct: 0,
        heroFloorPct: exports.AREA_FLOORS.dataHeroPct,
    },
};
let FRAME_CTX = {
    W: 1920, H: 1080, sceneKey: '?', sceneType: '?', family: 'data', t: 0,
};
function setFrameContext(ctx) {
    FRAME_CTX = ctx;
}
function frameContext() {
    return FRAME_CTX;
}
const AREA_REG = [];
function resetOccupancy() {
    AREA_REG.length = 0;
}
function areaRegistry() {
    return AREA_REG.slice();
}
function figureAreaPct(wPx, hPx, frameW, frameH) {
    if (frameW <= 0 || frameH <= 0 || wPx <= 0 || hPx <= 0)
        return 0;
    return (wPx * hPx) / (frameW * frameH) * 100;
}
/**
 * The rig that makes a figure of `unitW × unitH` rig-units own `pct`% of a
 * W×H frame's area. Closed form: area scales with rig², so
 * rig = sqrt(pct·W·H / (unitW·unitH)).
 */
function scaleForFigureArea(unitW, unitH, pct, frameW, frameH) {
    if (unitW <= 0 || unitH <= 0)
        return 1;
    return Math.sqrt((pct / 100) * frameW * frameH / (unitW * unitH));
}
/** Figures register their true drawn bbox (drawStickmanV2 measures itself). */
function registerFigureArea(sceneKey, label, x, y, wPx, hPx, frameW, frameH, group) {
    AREA_REG.push({
        sceneKey, label, kind: 'figure', family: FRAME_CTX.family,
        x: Math.round(x), y: Math.round(y),
        wPx: Math.round(wPx), hPx: Math.round(hPx),
        pctArea: Math.round(figureAreaPct(wPx, hPx, frameW, frameH) * 10) / 10,
        group,
    });
}
/** Data scenes register their hero object's drawn rect. */
function registerHeroObject(sceneKey, label, wPx, hPx, frameW, frameH) {
    AREA_REG.push({
        sceneKey, label, kind: 'hero', family: FRAME_CTX.family,
        x: 0, y: 0,
        wPx: Math.round(wPx), hPx: Math.round(hPx),
        pctArea: Math.round(figureAreaPct(wPx, hPx, frameW, frameH) * 10) / 10,
    });
}
/** Assert the frame's registry against the family floors. */
function occupancyViolations() {
    const out = [];
    // merge group-tagged figures into ONE union bbox per group (a two-shot
    // or an occlusion-split figure owns the frame as its group)
    const merged = [];
    const groups = new Map();
    for (const a of AREA_REG) {
        if (a.kind === 'figure' && a.group) {
            const g = groups.get(a.group) ?? [];
            g.push(a);
            groups.set(a.group, g);
        }
        else {
            merged.push(a);
        }
    }
    for (const [tag, g] of groups) {
        const x0 = Math.min(...g.map((e) => e.x));
        const y0 = Math.min(...g.map((e) => e.y));
        const x1 = Math.max(...g.map((e) => e.x + e.wPx));
        const y1 = Math.max(...g.map((e) => e.y + e.hPx));
        merged.push({
            ...g[0],
            label: `${tag}(${g.length}d)`,
            x: x0, y: y0, wPx: x1 - x0, hPx: y1 - y0,
            pctArea: Math.round(figureAreaPct(x1 - x0, y1 - y0, FRAME_CTX.W, FRAME_CTX.H) * 10) / 10,
        });
    }
    for (const a of merged) {
        const floor = a.kind === 'figure'
            ? exports.FAMILY_TEMPLATE[a.family].figureFloorPct
            : exports.FAMILY_TEMPLATE[a.family].heroFloorPct;
        if (floor > 0 && a.pctArea < floor) {
            out.push({
                sceneKey: a.sceneKey,
                label: `${a.kind}:${a.label}`,
                reason: a.kind === 'figure'
                    ? `figure owns ${a.pctArea}% of frame area (${a.wPx}×${a.hPx}px, floor ${floor}%) — raise the staging rig or tighten the framing (composition template: ${exports.FAMILY_TEMPLATE[a.family].darkMass})`
                    : `hero object owns ${a.pctArea}% of frame area (${a.wPx}×${a.hPx}px, floor ${floor}%) — scale the hero to the data-beat template`,
            });
        }
    }
    return out;
}
/**
 * The value bands, CALIBRATED against the shipped film's certified frames
 * (the Phase 3 harness measured every evidence frame before these bands
 * were set — the darkest certified frame reads 2.8% dark, the lightest
 * 0.9%; the ink register's target band was 4-5% of the FIGURE's own
 * footprint, not of the whole frame). The floor is the washed-frame
 * guard: a frame with less ink than the lightest certified composition
 * has no value anchor. The upper bound guards the opposite regression —
 * a frame drowned in ink has more than ONE dark mass.
 */
const VALUE_BANDS = {
    host: { dark: [0.9, 12], bright: [0.55] },
    data: { dark: [0.5, 20], bright: [0.3] },
    statement: { dark: [0.7, 20], bright: [0.3] },
};
function valueMassViolations(sample, family) {
    const band = VALUE_BANDS[family];
    const out = [];
    if (sample.darkPct < band.dark[0]) {
        out.push(`NO dark mass (${sample.darkPct.toFixed(1)}% < ${band.dark[0]}%) — the frame has no value anchor (${exports.FAMILY_TEMPLATE[family].darkMass})`);
    }
    if (sample.darkPct > band.dark[1]) {
        out.push(`dark mass floods the frame (${sample.darkPct.toFixed(1)}% > ${band.dark[1]}%) — more than ONE dark mass, or the ink register is overweight`);
    }
    if (sample.brightPct < band.bright[0]) {
        out.push(`NO bright mass (${sample.brightPct.toFixed(2)}% < ${band.bright[0]}%) — the frame has no value accent (${exports.FAMILY_TEMPLATE[family].brightMass})`);
    }
    return out;
}
