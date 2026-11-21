"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REACTIONS = void 0;
exports.resetHeadlineDedup = resetHeadlineDedup;
exports.declareOnScreenHeadline = declareOnScreenHeadline;
exports.captionDuplicatesHeadline = captionDuplicatesHeadline;
exports.reactionAt = reactionAt;
exports.reactionStart = reactionStart;
const easing_1 = require("./easing");
const perception_1 = require("./perception");
// ── PHASE-0 (panel report §7-D2): the caption-vs-headline dedup registry ────
// The scene drawer DECLARES the big on-screen headline text the moment it
// draws it (hostSceneV2); drawCaptions consults this registry and stands
// down for any karaoke window whose words already sit on screen in the
// serif. The director resets the registry per frame, so a headline only
// ever suppresses captions on ITS OWN frame — scrub-safe, deterministic.
const DEDUP_THRESHOLD = 0.6; // ≥60% of the window's words on screen = duplicate
let headlineWords = [];
const normWord = (w) => w.toLowerCase().replace(/[^a-z0-9%]/g, '');
function resetHeadlineDedup() {
    headlineWords = [];
}
function declareOnScreenHeadline(text) {
    const words = text.split(/\s+/).map(normWord).filter(Boolean);
    if (words.length)
        headlineWords = words;
}
function captionDuplicatesHeadline(windowWords) {
    if (!headlineWords.length || !windowWords.length)
        return false;
    const ws = windowWords.map(normWord).filter(Boolean);
    if (!ws.length)
        return false;
    const head = new Set(headlineWords);
    let hits = 0;
    for (const w of ws)
        if (head.has(w))
            hits++;
    return hits / ws.length >= DEDUP_THRESHOLD;
}
exports.REACTIONS = {
    // BLUEPRINT Phase 1+5 (report Table 7 + §11 Phase 5): the reaction
    // register rises from the 0.05-0.10 nudge ("a nudge, not a beat") to
    // the panel's numbers — paradox 0.22, fund (the twist) 0.28, three
    // 0.24 — and the windows tighten 2000 -> 1200ms ("a beat, not a
    // hold"). The scenes reframe their content during the window (content
    // recedes while the host comes forward), so the wide reading columns
    // no longer fight the push — see the scene drawers' reaction staging.
    'c7-paradox': { atFrac: 0.3, durMs: perception_1.AMP.reactionWindowMs, amp: perception_1.AMP.reactionAmp.paradox, px: 350, py: 550 },
    // P0-3 (audit Table 2): the twist reaction pivots ON the re-staged host
    // (x=1650, head breaking the 493 wall) — px 1700 keeps his whole envelope
    // inside the frame through the full 0.55 push (right edge 1842 → 1909).
    // CONTACT VERB edition: the host re-staged to x=1395 (hand braced ON the
    // 493 wall at 1350) — the pivot follows him (px 1420) so the twist
    // close-up frames host-braced-against-the-wall, hand planted.
    'c8-fund': { atFrac: 0.42, durMs: perception_1.AMP.reactionWindowMs, amp: perception_1.AMP.reactionAmp.fund, px: 1420, py: 560 },
    'c9-three': { atFrac: 0.4, durMs: perception_1.AMP.reactionWindowMs, amp: perception_1.AMP.reactionAmp.three, px: 500, py: 560 },
};
/**
 * The reaction envelope 0..1 for this frame — a pure function of
 * (sceneKey, group time, group duration), so the camera push in
 * director.cameraV2 and the face/talk changes in the scene drawer key off
 * the SAME clock and can never drift apart. 320ms ease in / hold / 320ms
 * ease out; the window clamps to stay inside the group.
 */
function reactionAt(sceneKey, gt, d) {
    const spec = exports.REACTIONS[sceneKey];
    if (!spec)
        return 0;
    const dur = Math.min(spec.durMs, Math.max(900, d * 0.3));
    let start = Math.max(1400, d * spec.atFrac);
    start = Math.min(start, Math.max(800, d - dur - 250));
    return (0, easing_1.window4)(gt, start, start + 320, start + dur - 320, start + dur);
}
/**
 * 100-JUDGE PANEL / Phase 1 item 3 — TAKE GRAMMAR (report §6 Phase 1):
 * the reaction window's absolute start time on the SAME clock
 * reactionAt() consumes — so the take() helper (the 2-frame hold +
 * 20% overshoot + blink + double-bounce) can fire at the window's own
 * start and the two envelopes can never drift apart. Returns -1 when
 * the scene has no reaction window (the caller skips the take).
 */
function reactionStart(sceneKey, gt, d) {
    const spec = exports.REACTIONS[sceneKey];
    if (!spec)
        return -1;
    const dur = Math.min(spec.durMs, Math.max(900, d * 0.3));
    let start = Math.max(1400, d * spec.atFrac);
    start = Math.min(start, Math.max(800, d - dur - 250));
    // the take fires only while the window is actually live at this gt
    return gt >= start && gt <= start + dur ? start : -1;
}
