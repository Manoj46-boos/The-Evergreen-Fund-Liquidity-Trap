"use strict";
/**
 * Scene props validator (panel P1-6, report §2.8 / Appendix A #6).
 *
 * WHY: scene props are typed `Record<string, any>`, so a misspelled or
 * unimplemented prop silently no-ops. Three shipped examples were found that
 * way by the panel: `invert: true` (c7-anxiety), `mini: true` (c4-cb) and
 * `hostCount: true` (c9-intro) — none were read by any scene drawer. All
 * three have now been RESOLVED in the script (the c7-anxiety beat carries an
 * explicit down-tone series; c4-cb and c9-intro drop the no-op keys) — and
 * this table + validator keeps the next one from shipping silently.
 *
 * Runs once at prepare-time in dev; zero cost in the encode.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROP_LEDGER = exports.PROP_OWNERSHIP = exports.SCENE_PROPS = void 0;
exports.validatePropOwnership = validatePropOwnership;
exports.validateSceneProps = validateSceneProps;
exports.logScenePropsIssues = logScenePropsIssues;
exports.resolveProp = resolveProp;
exports.resetPropLedger = resetPropLedger;
exports.notePropDraw = notePropDraw;
exports.resetPropDraws = resetPropDraws;
exports.propLedgerViolations = propLedgerViolations;
exports.propLedgerUsage = propLedgerUsage;
const script_data_1 = require("./script-data");
/**
 * Allowed props per scene type, beyond the universal { type, sceneKey }.
 * Keys the engine actually reads — extend as scenes grow.
 */
exports.SCENE_PROPS = {
    host: ['stage', 'gesture', 'expression', 'entrance', 'headline', 'sub',
        'kicker', 'ribbon', 'chip', 'lookRight', 'lookLeft', 'walkMs'], // walkMs: 100-JUDGE REPORT fix D25 — per-beat entrance crossing time
    channelIntro: [],
    splitNumbers: ['mode', 'cornerNote', 'stats'],
    divergeK: ['twistChip', 'opening'], // v4 (audit P0-6): opening mode hides the
    // arm labels + K-name so the cold open teases and the naming beat reveals
    chartTwin: ['charts', 'extraBadge', 'source'],
    chartJourney: ['title', 'source', 'yFormat', 'points', 'series', 'phase',
        'annotations', 'band', 'peakBand', 'extraStats', 'chips',
        'quote'],
    pieChart: ['title', 'source', 'slices', 'donut', 'centerBig'],
    dotGrid: ['total', 'highlight', 'caption'],
    magChips: ['chips', 'stats', 'source'],
    barsCompare: ['title', 'source', 'bars', 'flipCounter', 'rememberChip', 'yMax'],
    trioConverge: ['motto', 'sub'],
    kDef: ['definition', 'source'],
    credibilityChips: ['kicker', 'chips', 'year'],
    gasPump: ['source', 'cards', 'caption'],
    recessionGauge: ['source', 'debates', 'gaugeTo', 'coinChip', 'promptChip'],
    aiDatacenter: ['stats'],
    statCards: ['source', 'cards'],
    ownerWorker: ['left', 'right'],
    fundSplit: ['stats', 'callbackChip'],
    oddsSpread: ['source', 'markers', 'kicker', 'closer'],
    bigText: ['lines'],
    stampCard: ['stamp', 'sub', 'expression'],
    quoteCard: ['kicker', 'lines', 'icon', 'soft', 'hostGesture'],
    takeaways: ['focus', 'title', 'points'],
    commentPrompt: ['question', 'sub'],
    endScreen: [],
    recapSplit: ['motto'],
    paradoxResolve: [],
    // ── VAULT NOIR v3 — THE EVERGREEN SCENE SET ──
    statReveal: ['mode', 'opening', 'denominator'],
    wrapperMatrix: ['focus', 'highlight', 'mode'],
    flowLiquidity: ['mode', 'highlight'],
    prorationDemo: ['stage'],
    caseFiles: ['case', 'quarter', 'highlight'],
    navGap: ['stage', 'hypothetical'],
    feeStack: ['stage'],
    bullCase: ['side'],
    auditChecklist: ['q', 'mode'],
    systemMap: ['stage'],
};
/**
 * Keys that were once shipped dead and are intentionally NOT in the allowed
 * table. If someone re-adds one, the validator explains the resolution
 * instead of just saying "unknown key".
 */
const KNOWN_DEAD = {
    invert: 'resolved: the c7-anxiety falling-confidence line is drawn with an explicit down-tone series (see script-data); if you need a flipped y-axis, implement invertY in charts.ts lineChart() first',
    mini: 'resolved: removed from c4-cb — chartJourneyScene has no mini variant; implement one or drop the key',
    hostCount: 'resolved: removed from c9-intro — the counting host is always drawn on the takeaways intro (focus 0)',
    hostSide: 'resolved: divergeKScene always stages the host on the left; the v2 dead `void hostSide` line is gone',
};
exports.PROP_OWNERSHIP = [
    // ── held ────────────────────────────────────────────────────────────────
    { prop: 'coffee mug', owner: 'the prof character (divergeK lower arm)', verb: 'held', where: 'divergeK' },
    { prop: 'chart satchel', owner: 'every data-chapter host (strap + hip bag)', verb: 'held', where: 'film-wide' },
    { prop: 'thumb prop (takeaway 3)', owner: 'the takeaways host fist', verb: 'held', where: 'takeaways' },
    // ── contact verbs (palm / tap / fist / bracket) ─────────────────────────
    { prop: 'S&P chart card edge', owner: 'chartTwin host (near hand)', verb: 'palm', where: 'chartTwin' },
    { prop: 'pie wedge', owner: 'pieChart host (near hand)', verb: 'palm', where: 'pieChart' },
    { prop: 'definition card edge', owner: 'kDef host (near hand)', verb: 'palm', where: 'kDef' },
    { prop: 'credibility chip stack edge', owner: 'credibilityChips host (near hand)', verb: 'palm', where: 'credibilityChips' },
    { prop: 'hero stat card edge ($18.8T)', owner: 'statCards host (near hand)', verb: 'palm', where: 'statCards' },
    { prop: 'hero rack top face', owner: 'aiDatacenter host (near hand)', verb: 'palm', where: 'aiDatacenter' },
    { prop: '493 wall (fundSplit)', owner: 'fundSplit host (near hand)', verb: 'palm', where: 'fundSplit' },
    { prop: 'recession gauge bowl rim', owner: 'recessionGauge host (near hand)', verb: 'tap', where: 'recessionGauge' },
    { prop: 'gas pump left flank', owner: 'gasPump host (near hand)', verb: 'palm', where: 'gasPump' },
    { prop: 'Russell bar cap (row 2)', owner: 'barsCompare host (near fist)', verb: 'fist', where: 'barsCompare' },
    { prop: 'paradox K stem', owner: 'paradoxResolve host (near fist)', verb: 'fist', where: 'paradoxResolve' },
    { prop: 'cold-open K stem', owner: 'divergeK rest pass (leanOnK grip)', verb: 'fist', where: 'divergeK' },
    { prop: 'sentiment recap panel face', owner: 'recapSplit host (near hand)', verb: 'palm', where: 'recapSplit' },
    { prop: 'quote card right edge', owner: 'quoteCard host (near hand)', verb: 'palm', where: 'quoteCard' },
    { prop: 'takeaway card left edge', owner: 'takeaways host (near hand)', verb: 'palm', where: 'takeaways' },
    { prop: 'statement underline cap', owner: 'bigText count host (near hand)', verb: 'bracket', where: 'bigText' },
    { prop: 'WATCH NEXT teaser card edge', owner: 'endScreen host (near hand, mid plane)', verb: 'palm', where: 'endScreen' },
    // ── fired-by (emission flows) ───────────────────────────────────────────
    { prop: 'ownerWorker coin flow', owner: 'fired from the worker\u2019s plateau, landing on the owner\u2019s rise', verb: 'fired-by', where: 'ownerWorker' },
    { prop: 'gas pump shorts coins', owner: 'fired from the pump\u2019s $/GAL display', verb: 'fired-by', where: 'shorts/pump' },
    // ── pointed-at / annotated ──────────────────────────────────────────────
    { prop: 'worker paycheck arrow', owner: 'the worker\u2019s flat run (terminal mark, coral tag names it)', verb: 'pointed-at', where: 'ownerWorker' },
    { prop: 'comment bubbles', owner: 'the commentPrompt host\u2019s gesture cone (the field he invites)', verb: 'pointed-at', where: 'commentPrompt' },
    { prop: 'recession debates cards', owner: 'the gauge host\u2019s gesture cone + gaze', verb: 'pointed-at', where: 'recessionGauge' },
    // ── refusal (the sanctioned non-contact verb) ───────────────────────────
    { prop: 'dot-grid gold band (10 of 500)', owner: 'dotGrid host \u2014 crossed arms + committed gaze (1,300px from any reachable staging)', verb: 'refusal', where: 'dotGrid' },
    { prop: 'stamp plate (RECORD HIGHS)', owner: 'stampCard host \u2014 the assent nod; the plate is a top-band object no grounded host can reach', verb: 'refusal', where: 'stampCard' },
];
const VERBS = ['held', 'palm', 'tap', 'fist', 'bracket', 'fired-by', 'pointed-at', 'refusal'];
/** Validate the ownership registry itself (dev-time, prepare-time). */
function validatePropOwnership() {
    const problems = [];
    for (const o of exports.PROP_OWNERSHIP) {
        if (!VERBS.includes(o.verb))
            problems.push(`${o.prop}: unknown verb "${o.verb}"`);
        if (!o.owner || !o.where)
            problems.push(`${o.prop}: missing owner/where`);
    }
    return problems;
}
/** Validate every beat's scene props against the allowed-keys table. */
function validateSceneProps() {
    const issues = [];
    script_data_1.SCRIPT.forEach((chapter, ci) => {
        chapter.beats.forEach((beat, bi) => {
            const s = beat.scene;
            const allowed = exports.SCENE_PROPS[String(s.type)] ?? null;
            if (!allowed) {
                issues.push({ beat: `${ci}-${bi}`, sceneType: String(s.type), key: '(unknown scene type)' });
                return;
            }
            for (const k of Object.keys(s)) {
                if (k === 'type' || k === 'sceneKey')
                    continue;
                if (!allowed.includes(k)) {
                    issues.push({ beat: `${ci}-${bi}`, sceneType: String(s.type), key: k, hint: KNOWN_DEAD[k] });
                }
            }
        });
    });
    return issues;
}
/** Console report — used by pipeline at prepare-time (dev only). */
function logScenePropsIssues() {
    const issues = validateSceneProps();
    if (issues.length) {
        console.warn('[scene-props] unknown keys (beat scene.key):');
        for (const it of issues) {
            console.warn(`  ch${it.beat} ${it.sceneType}: "${it.key}"${it.hint ? ' — ' + it.hint : ''}`);
        }
    }
    return issues.length;
}
// ── PHASE 1 (100-Judge audit report §5 / Table 6, row 3): THE PROP LEDGER ──
//
// The panel's prop-discipline finding: "premium brand characters have
// wardrobes with RULES — the host carries work props in work chapters,
// carries nothing in statement chapters, and never holds the same prop
// twice in consecutive scenes." The shipped code let the chart-satchel
// ride into EVERY data scene including statement/presenting stagings
// (chartTwin, pieChart), where the commuter-briefcase read made the
// presenter look like he wandered in from a different film.
//
// The ledger is the single source of truth for which character prop may
// fire in which sceneKey. Scenes resolve props through resolveProp(); the
// harness (tools/render-check.mjs) fails the build on any violation, and
// the usage registry makes every decision inspectable per evidence frame.
/**
 * Allowed sceneKeys per character prop. A prop fired anywhere else is a
 * LEDGER VIOLATION and fails the harness gate.
 */
exports.PROP_LEDGER = {
    // the data-chapter signature (slim chart-satchel): the journeyman
    // presenter ON the road through data chapters — journey charts, the
    // pump/gauge/datacenter field trips, the portfolio splits. NOT the
    // statement/presenting stagings (chartTwin, pieChart) and not the
    // closing talk-to-camera scenes.
    satchel: [
        'chartJourney', 'gasPump', 'recessionGauge', 'aiDatacenter',
        'fundSplit', 'barsCompare', 'oddsSpread', 'dotGrid', 'magChips',
        'statCards',
    ],
    // commuter capital — WORK chapters only (the audit's frame-05 defect:
    // "a commuter prop in a boardroom moment")
    briefcase: ['ownerWorker', 'aiDatacenter', 'gasPump', 'endScreen'],
    // the worker's domed lunchbox — the owner/worker pair and its cameos
    lunchbox: ['ownerWorker', 'gasPump'],
    // the prof's coffee — channel-intro and talk-to-camera stagings
    coffee: ['channelIntro', 'host', 'commentPrompt', 'divergeK'],
    // P2 (Verdict report — CARRIED-PROP VERBS): the host holds a stat card's
    // edge (the statCards perch) and balances a coin stack on his palm (the
    // dotGrid counting beat) — silhouette events, ledger-governed.
    holdCard: ['statCards'],
    coinStack: ['dotGrid'],
};
const PROP_USAGE = [];
/**
 * Resolve a character prop for a sceneKey through the ledger. Returns the
 * value the scene must use (false when the ledger denies the prop here)
 * and records the decision in the usage registry for the harness gate.
 */
function resolveProp(sceneKey, prop, requested) {
    const allowed = exports.PROP_LEDGER[prop]?.includes(sceneKey) ?? false;
    PROP_USAGE.push({ sceneKey, prop, requested, allowed: allowed ? true : requested ? false : true });
    return requested && allowed;
}
/** The director/guard reset — clear per render pass. */
function resetPropLedger() {
    PROP_USAGE.length = 0;
}
// ── draw-level registry: the RENDERER reports what actually fires ──────────
// A denied request is the ledger DOING ITS JOB (silent enforcement, logged).
// The violation class is a prop that FIRES where no allowed resolution
// exists in the frame — i.e. a call site that bypassed resolveProp and fed
// the renderer a raw truthy prop. stickman-v2 calls notePropDraw() at every
// prop draw; the harness asserts drawn-vs-resolved.
const PROP_DRAWS = new Set();
/** stickman-v2 calls this when a prop actually renders this frame. */
function notePropDraw(prop) {
    PROP_DRAWS.add(prop);
}
/** Director/harness reset — per frame, like the rest of the guard state. */
function resetPropDraws() {
    PROP_DRAWS.clear();
}
/** Violations: a prop FIRED with no allowed ledger resolution this frame. */
function propLedgerViolations() {
    const out = [];
    for (const prop of Array.from(PROP_DRAWS).sort()) {
        const ok = PROP_USAGE.some((u) => u.prop === prop && u.allowed);
        if (!ok) {
            out.push({ sceneKey: '(unresolved draw — bypassed resolveProp)', prop, requested: true, allowed: false });
        }
    }
    return out;
}
/** Inspectable usage log for evidence output. */
function propLedgerUsage() {
    return PROP_USAGE.slice();
}
