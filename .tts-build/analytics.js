"use strict";
/**
 * The analytics loop (audit P2-3) — per-beat retention + thumbnail
 * experiments, logged back into the project from YouTube Studio.
 *
 * "Turns every upload into a measured experiment." The workflow:
 *
 *   1. ship the render (the studio's upload kit)
 *   2. a few days later, export from YouTube Studio:
 *        · Audience retention table  (Analytics → Engagement)
 *        · Thumbnail Test & Compare  (Content → ⋮ → Test & Compare)
 *   3. run:  node scripts/ingest-analytics.mjs retention.csv thumbs.csv
 *   4. the ingest script writes analytics-data.json; from then on the
 *      studio shows every beat's measured retention, flags the cliffs,
 *      and tracks the thumbnail race — and the next script edit starts
 *      from evidence, not vibes.
 *
 * Pure data + pure functions; runs in the studio page, the render harness,
 * and node scripts identically. The committed analytics-data.json is a
 * scaffold (empty measurements) so fresh clones render identically.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analytics = analytics;
exports.beatKey = beatKey;
exports.beatRetention = beatRetention;
exports.retentionCliffs = retentionCliffs;
exports.hasThumbnailResults = hasThumbnailResults;
exports.thumbnailLeader = thumbnailLeader;
const analytics_data_json_1 = __importDefault(require("./analytics-data.json"));
const data = analytics_data_json_1.default;
/** The loaded analytics (the committed file, or whatever the ingest wrote). */
function analytics() {
    return data;
}
/** Stable beat key — the same key the ingest script computes. */
function beatKey(chapterId, beatIndex) {
    return `${chapterId}-${beatIndex}`;
}
/** Retention record for a beat (undefined when nothing measured yet). */
function beatRetention(chapterId, beatIndex) {
    return data.beats[beatKey(chapterId, beatIndex)];
}
/** The beats with measured retention, worst drop-per-minute first. */
function retentionCliffs(limit = 5) {
    return Object.entries(data.beats)
        .filter(([, r]) => typeof r.dropPerMin === 'number')
        .map(([key, r]) => ({ key, r }))
        .sort((a, b) => (a.r.dropPerMin ?? 0) - (b.r.dropPerMin ?? 0))
        .slice(0, limit);
}
/** True when any thumbnail experiment has results recorded. */
function hasThumbnailResults() {
    return data.thumbnails.some((t) => typeof t.ctr === 'number' && t.ctr > 0);
}
/** The current thumbnail leader, if the race has data. */
function thumbnailLeader() {
    if (!hasThumbnailResults())
        return null;
    return [...data.thumbnails].sort((a, b) => (b.ctr ?? 0) - (a.ctr ?? 0))[0];
}
