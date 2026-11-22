/**
 * U-24 (100-JUDGE VISUAL AUDIT — THE HONEST ONE-MILLION MATH): the SHORTS
 * DISCOVERY LADDER + UPLOAD KIT. The audit's math is explicit: visuals alone
 * will not carry the film to a million views; the niche ceiling is real and
 * the engine must run all three levers —
 *   (a) a scroll-stopping first frame (U-22 poster / U-23 first-frame
 *       contract — both implemented),
 *   (b) 45%+ average view duration on the 26-minute film (the Phase 2-4
 *       scene richness — implemented upstream),
 *   (c) a SHORTS DISCOVERY LADDER — shorts.ts already re-cuts the film's six
 *       native 35-45s moments; TWO SHIP PER WEEK as funnels to the long
 *       film, which is what this kit operationalizes: per-short titles,
 *       descriptions with the long-film funnel line, tags, pinned comments,
 *       and the week-by-week shipping schedule.
 *
 * Pure data + pure functions — deterministic, no network, free tools only.
 * tools/export-upload-kit.mjs walks pickShortMoments() + these tables and
 * writes the kit JSON/CSV the upload session follows.
 */

import { Timeline } from './timeline';
import { pickShortMoments, ShortSpec } from './shorts';
import { TITLE_OPTIONS } from './script-data';

/** The long-film funnel line every Short's description closes with. */
export const FILM_TITLE = 'The Evergreen Fund Liquidity Trap — What "Semi-Liquid" Really Means';
export const FILM_HOOK =
  'The full film: the five percent that is a limit on the fund, not your allowance — four wrappers, three 2026 case files, one audit.';

/** Base tags for every Short (the niche's high-CPM search surface). */
export const BASE_TAGS = [
  'evergreen fund',
  'semi-liquid funds',
  'interval fund',
  'liquidity trap',
  'non-traded REIT',
  'private credit',
  'net asset value',
  'redemption',
  'proration',
  'investing education',
  'BCRED',
  'fund liquidity',
];

/**
 * The funnel ladder: per-short upload metadata. Titles are NUMBER-FIRST
 * (the digit is the hook — the same discipline the short titles already
 * follow), every description names the film and its argument, the pinned
 * comment carries the queue question that drives the comment economy.
 */
export interface ShortKit {
  /** ladder slot (1..6) — the shipping order follows the film's argument */
  slot: number;
  /** the Short's headline (from shorts.ts pickShortMoments) */
  shortTitle: string;
  /** native 9:16 mode (shorts.ts) */
  native: string;
  /** seconds */
  durS: number;
  /** YouTube title — number-first, ≤ 70 chars */
  youtubeTitle: string;
  /** description — hook + film funnel */
  description: string;
  /** hashtags (3, per platform best practice) */
  hashtags: string[];
  /** pinned comment — the engagement prompt */
  pinnedComment: string;
  /** tags array (base + short-specific) */
  tags: string[];
}

const SHORT_KITS: Array<{ spec: string; youtubeTitle: string; hook: string; pin: string; extraTags: string[] }> = [
  {
    spec: 'statReveal',
    youtubeTitle: '$1,000,000 becomes $50,000. The 5% trap in 40 seconds.',
    hook: 'The 5% is a limit on the FUND — not your withdrawal allowance. Everyone asks, everyone prorates.',
    pin: 'Would you have read "5% quarterly liquidity" as YOUR 5%? Be honest — most investors do. The full film breaks the exact mechanism.',
    extraTags: ['proration explained', 'fund shares'],
  },
  {
    spec: 'prorationDemo',
    youtubeTitle: 'They asked for 10%. Half got paid. Here is the plumbing.',
    hook: 'REQUESTED ≠ FULFILLED. The other half is still invested — on terms the board re-sets every offer.',
    pin: 'The proration math is the part nobody reads until their own exit lands in it. Full film has the worked example.',
    extraTags: ['redemption policy', 'fund mechanics'],
  },
  {
    spec: 'caseFiles',
    youtubeTitle: 'BCRED met every request. Then it didn\u2019t. The 2026 case file.',
    hook: 'Q1: upsized to 7%, all fulfilled. Q2: 10% asked, 5% paid. Dates and denominators on every number.',
    pin: 'Same fund, two quarters, two outcomes. The full film walks all three 2026 case files with the filings.',
    extraTags: ['BCRED', 'case study', '2026'],
  },
  {
    spec: 'navGap',
    youtubeTitle: 'NAV says 100. The real value is 90. Who pays the gap?',
    hook: 'Exit before the mark and the stayers pay. NAV lag is not a rounding error — it transfers value.',
    pin: 'The NAV 100/90 gap is the film\u2019s most-shared section. Who bears it depends on WHEN you leave.',
    extraTags: ['NAV lag', 'mark to model'],
  },
  {
    spec: 'auditChecklist',
    youtubeTitle: 'The 8-question liquidity audit. Screenshot this.',
    hook: 'Obligation. Denominator. Cash. Stress. Eight questions before any semi-liquid allocation.',
    pin: 'Save this one — the eight questions (and the four wrappers they map to) are the film\u2019s core framework.',
    extraTags: ['due diligence', 'checklist'],
  },
  {
    spec: 'stampCard',
    youtubeTitle: 'A redemption window is not an exit. 5% ≠ YOUR EXIT.',
    hook: 'The window opens. The capacity may not be yours. Understand the queue before you buy the yield.',
    pin: '5% ≠ YOUR EXIT — the whole film in four words. The queue is the risk, not the calendar.',
    extraTags: ['5 percent rule', 'liquidity risk'],
  },
];

/**
 * The full kit for the film's six native Shorts, in shipping order.
 * Pure function of the timeline — the same pickShortMoments() call the
 * Shorts renderer uses, so the kit can never drift from what renders.
 */
export function buildShortsKit(tl: Timeline): ShortKit[] {
  const moments: ShortSpec[] = pickShortMoments(tl);
  const kits: ShortKit[] = [];
  for (const k of SHORT_KITS) {
    const m = moments.find((s) => {
      const b = tl.beats.find((bb) => s.startMs >= bb.startMs && s.startMs < bb.endMs);
      return b && b.beat.scene.type === k.spec;
    }) ?? moments[kits.length];
    if (!m) continue;
    kits.push({
      slot: kits.length + 1,
      shortTitle: m.title,
      native: String(m.native ?? 'crop'),
      durS: Math.round(m.durMs / 1000),
      youtubeTitle: k.youtubeTitle,
      description: `${k.hook}\n\n${FILM_HOOK}\nFull film: ${FILM_TITLE} — 26 minutes, evidence-led, every number dated and sourced.\n\n${m.hooks?.map((h) => `• ${h}`).join('\n') ?? ''}`,
      hashtags: ['#semiliquid', '#evergreenfund', '#liquidity'],
      pinnedComment: k.pin,
      tags: [...BASE_TAGS, ...k.extraTags],
    });
  }
  return kits;
}

/**
 * THE TWO-PER-WEEK LADDER: the audit's shipping cadence, as a deterministic
 * schedule from a start date (ISO 'YYYY-MM-DD'). Tuesday + Friday slots —
 * the B2B-explainer high-CPM windows. Weeks run 1..3 for the six-Short set,
 * then the ladder LOOPS (the kit notes the re-run discipline: same six
 * moments, rotated titles from TITLE_OPTIONS after a 6-week cooling gap).
 */
export interface LadderRow {
  week: number;
  slotISO: string;   // 'YYYY-MM-DD'
  weekday: string;
  shortSlot: number; // the ShortKit slot this row ships
  funnelTo: string;  // what the Short funnels to (always the film)
}

export function shippingLadder(startDateISO: string, weeks = 3): LadderRow[] {
  const start = new Date(`${startDateISO}T00:00:00Z`);
  const rows: LadderRow[] = [];
  // the six moments ship oldest-argument-first: the cold open leads
  const order = [1, 2, 3, 4, 5, 6];
  let k = 0;
  for (let w = 0; w < weeks; w++) {
    for (const day of [2, 5]) { // Tuesday, Friday
      if (k >= order.length) break;
      const d = new Date(start.getTime());
      d.setUTCDate(d.getUTCDate() + w * 7 + (day - start.getUTCDay()));
      rows.push({
        week: w + 1,
        slotISO: d.toISOString().slice(0, 10),
        weekday: day === 2 ? 'Tuesday' : 'Friday',
        shortSlot: order[k],
        funnelTo: FILM_TITLE,
      });
      k++;
    }
  }
  return rows;
}

/** The film's own upload metadata (the long-form side of the funnel). */
export function filmUploadKit() {
  return {
    titleOptions: TITLE_OPTIONS,
    recommendedTitle: TITLE_OPTIONS[1],
    descriptionHook: FILM_HOOK,
    chapters: 'the film\u2019s nine chapter cards are the YouTube chapters',
    tags: BASE_TAGS,
  };
}
