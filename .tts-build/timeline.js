"use strict";
/**
 * Timeline builder — turns the script + audio manifest into a frame-accurate
 * edit decision list: beats, chapter cards, caption lines, VO intervals.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gapAfter = gapAfter;
exports.buildTimeline = buildTimeline;
exports.beatAt = beatAt;
exports.chapterAt = chapterAt;
exports.youtubeChapters = youtubeChapters;
const script_data_1 = require("./script-data");
const analytics_1 = require("./analytics");
const SENTENCE_GAP = 110;
const BEAT_LEAD_IN = 70;
// v2 (PATCH 8): 1250ms hid the host while the next VO had already started —
// words with no face. 900ms + the built-in 380ms fade keeps the pace up and
// the presenter visible sooner.
const CHAPTER_CARD_DUR = 900;
const END_SCREEN_HOLD = 6500;
/**
 * v3 (panel P0-6) — punctuation-aware pause after a sentence (ms).
 * SENTENCE_GAP was a constant 110ms; real narrators breathe. A full stop
 * gets a real breath, a clause half a beat, and dramatic landings (the
 * twist, the paradox line) get a held beat before the payoff. Deterministic.
 */
function gapAfter(sentence) {
    const s = sentence.replace(/[""''\u201d\u2019]+$/u, '').trim();
    let gap = 110; // base inter-sentence gap (v2 behaviour)
    if (/[.!?]/.test(s.slice(-2))) {
        gap += 260; // full stop: a real breath
    }
    else if (/[,;:\u2014\u2013]/.test(s.slice(-2))) {
        gap += 90; // clause: half a beat
    }
    // dramatic landings: the lines the script built for payoff
    if (/[.!?]$/.test(s) &&
        /\b(twist|stark|paradox|record|ever|know|behind|hanging|flip)\b/i.test(s)) {
        gap += 240;
    }
    return gap;
}
function buildTimeline(manifest, fps) {
    const beats = [];
    const chapterCards = [];
    const captionLines = [];
    const voIntervals = [];
    let now = 0;
    script_data_1.SCRIPT.forEach((chapter, ci) => {
        const startOfChapter = now;
        if (ci > 0) {
            chapterCards.push({
                startMs: now,
                endMs: now + CHAPTER_CARD_DUR,
                index: ci,
                title: chapter.title,
                chapter: ci,
            });
            now += CHAPTER_CARD_DUR;
        }
        chapter.beats.forEach((beat, bi) => {
            const sentences = [];
            // v3 (panel P0-6): the split chunks were computed then discarded — they
            // align with sentIdxs (both come from the same upstream split that
            // produced the TTS cache keys `${ci}-${bi}-${si}`) and now drive the
            // punctuation-aware gaps.
            const chunks = beat.vo
                .split(/\n/)
                .map((sx) => sx.trim())
                .filter(Boolean);
            // sentence segmentation happens upstream (client sends per-sentence ids);
            // here we discover them from the manifest by beat-prefixed ids.
            const prefix = `${ci}-${bi}-`;
            const sentIdxs = [];
            let k = 0;
            while (manifest.lines[`${prefix}${k}`]) {
                sentIdxs.push(k);
                k++;
            }
            let local = BEAT_LEAD_IN;
            let lastGap = SENTENCE_GAP;
            for (const si of sentIdxs) {
                const entry = manifest.lines[`${prefix}${si}`];
                sentences.push({
                    lineId: `${prefix}${si}`,
                    startMs: now + local,
                    audioDurMs: entry.durationMs,
                    words: entry.words,
                    text: '',
                });
                const gap = chunks[si] !== undefined ? gapAfter(chunks[si]) : SENTENCE_GAP;
                lastGap = gap;
                local += entry.durationMs + gap;
            }
            const speakDur = Math.max(0, local - BEAT_LEAD_IN - lastGap);
            const pause = beat.pauseAfter ?? 350;
            const isEndScreen = beat.scene.type === 'endScreen';
            const beatDur = BEAT_LEAD_IN + speakDur + pause + (isEndScreen ? END_SCREEN_HOLD : 0);
            beats.push({
                chapter: ci,
                chapterTitle: chapter.title,
                beatIndex: bi,
                beat,
                startMs: now,
                endMs: now + beatDur,
                sentences,
                speakStartMs: BEAT_LEAD_IN,
                speakEndMs: BEAT_LEAD_IN + speakDur,
                // v6 (audit P2-3): measured retention rides on the beat, so the
                // studio (and any render-time tooling) can see where viewers left
                retention: (0, analytics_1.beatRetention)(chapter.id, bi),
            });
            if (sentences.length) {
                voIntervals.push({ start: now + BEAT_LEAD_IN, end: now + BEAT_LEAD_IN + speakDur });
                for (const s of sentences) {
                    captionLines.push({
                        start: s.startMs,
                        end: s.startMs + s.audioDurMs,
                        words: s.words.map((w) => ({ t: s.startMs + w.t, d: w.d, w: w.w })),
                    });
                }
            }
            now += beatDur;
        });
    });
    // chapter ranges
    const chapters = script_data_1.SCRIPT.map((c, ci) => {
        const first = beats.find((b) => b.chapter === ci);
        const lastBeats = beats.filter((b) => b.chapter === ci);
        const last = lastBeats[lastBeats.length - 1];
        return { index: ci, title: c.title, startMs: first.startMs, endMs: last.endMs };
    });
    const durationMs = Math.ceil(now + 400); // breathing room
    // ── v2 (PATCH 8): export hard-cut + data-moment times for the mixer ──
    // hard cuts = the start of every scene GROUP (consecutive beats sharing a
    // sceneKey are one continuous scene — no cut inside them)
    const cutTimes = [];
    for (let i = 0; i < beats.length; i++) {
        const prevKey = i > 0 ? beats[i - 1].beat.scene.sceneKey : null;
        if (beats[i].beat.scene.sceneKey !== prevKey && beats[i].startMs > 0) {
            cutTimes.push(beats[i].startMs);
        }
    }
    // data moments = 1.4s after each counting scene starts (counters settle)
    const dataDingTimes = [];
    for (const b of beats) {
        if (['statCards', 'barsCompare', 'wrapperMatrix', 'caseFiles', 'feeStack', 'navGap', 'flowLiquidity', 'auditChecklist'].includes(b.beat.scene.type)) {
            dataDingTimes.push(b.startMs + 1400);
        }
    }
    // v8 (panel P0-5): dramatic-silence windows. A beat flagged `dropOut`
    // ducks the bed to ~4% for the 1.4s BEFORE its payoff sentence — the
    // underline-the-twist trick every great editor uses. The payoff itself
    // slams back in at full gap level.
    const silenceWindows = [];
    for (const b of beats) {
        if (b.beat.dropOut) {
            const silenceDur = Math.min(1400, Math.max(400, (b.speakEndMs - b.speakStartMs) * 0.35));
            const payoffStart = b.startMs + b.speakStartMs;
            silenceWindows.push({ start: Math.max(0, payoffStart - silenceDur), end: payoffStart });
        }
    }
    return {
        durationMs,
        fps,
        totalFrames: Math.ceil((durationMs / 1000) * fps),
        beats,
        chapterCards,
        chapters,
        captionLines,
        voIntervals,
        cutTimes,
        dataDingTimes,
        silenceWindows,
    };
}
/** Binary search for the beat covering time t (chapter cards overlay beats). */
function beatAt(tl, tMs) {
    const beats = tl.beats;
    let lo = 0;
    let hi = beats.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const b = beats[mid];
        if (tMs < b.startMs)
            hi = mid - 1;
        else if (tMs >= b.endMs)
            lo = mid + 1;
        else
            return b;
    }
    return beats.length ? beats[Math.min(beats.length - 1, Math.max(0, lo))] : null;
}
function chapterAt(tl, tMs) {
    let c = 0;
    for (const ch of tl.chapters) {
        if (tMs >= ch.startMs)
            c = ch.index;
    }
    return c;
}
/** Builds the YouTube chapter list from real rendered timings. */
function youtubeChapters(tl) {
    return tl.chapters
        .map((c) => {
        const s = Math.floor(c.startMs / 1000);
        const m = Math.floor(s / 60);
        const sec = String(s % 60).padStart(2, '0');
        return `${m}:${sec} ${c.title.replace(/[""]/g, '"')}`;
    })
        .join('\n');
}
