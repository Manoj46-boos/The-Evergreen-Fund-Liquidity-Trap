# 🎬 The Evergreen Fund — Liquidity Trap · Video Studio

Renders the complete documentary script — **"The Evergreen Fund Liquidity Trap: What 'Semi-Liquid' Really Means"** — as a premium, cinematic, dark-stage explainer video, frame by frame, and saves a YouTube-ready MP4.

- **~26–28 minutes** of finished video (≈38,000 frames at 1080p/24–30) — the full script, all 9 chapters
- **Human-like neural voiceover** (free Microsoft Edge voices — Andrew by default), with per-beat vocal direction (calm / urgent / reveal)
- **Original score composed by code** — a NEW D-minor, 76 BPM underscore (strings, felt piano, deep bass, glass bells) rendered through real sampled instruments, with automatic ducking under the voice. Fully royalty-free, fully monetizable.
- **Karaoke captions** synced word-by-word to the voice, on a dark-glass pill
- **"Vault Noir" design** — a midnight-navy canvas (never pure black), porcelain serif type, champagne-brass accents, ice-cyan data ink, glass cards with top-light edges. Deliberately a different visual identity from the channel's previous light "ivory" film.
- **The signature object**: a struck-brass 3-D **%** (replacing the old 3-D K), a **liquid-iris** chapter transition (replacing the K-wipe), a 9-chapter poster card, and a presenter in a tailored navy suit
- **Purpose-built data scenes**: the 5% cold-open `statReveal`, the four-wrapper comparison matrix, the liquidity-plumbing flow map, the proration demo, the 2026 case files (Cliffwater / BCRED / OBDC II with dates and denominators), the NAV 100-vs-90 gap, the BCRED fee stack, the eight-question audit checklist, and the liquidity-system map
- **Offline render QA harness** — `node tools/render-check.mjs` renders ~28 representative frames to `./harness-frames/` with the collision guard, scale-law, occupancy, value-mass and phone-feed gates
- Built for an **8 GB laptop**: frames render one at a time and stream directly to disk

---

## 1 · One-time setup

You only need **Node.js LTS** and **Chrome or Edge** (WebCodecs video encoding needs Chromium).

1. Install **Node.js** from <https://nodejs.org>.
2. Open **Command Prompt** in the project folder and run:
   ```
   npm install
   ```
3. Start the studio:
   ```
   npm run dev
   ```
4. Open **http://localhost:3000** in **Chrome or Edge**.

## 2 · Making the video (3 clicks)

| Step | What you click | What happens |
|---|---|---|
| 1 | **Prepare project** | Generates all **280 voice clips** (already pre-cached in `.render-assets/tts/` — re-runs are instant), measures them, builds the frame-accurate timeline, composes the score and mixes the audio |
| 2 | *(optional)* **▶ Play** in the preview | Watch the whole video before committing |
| 3 | **Render full MP4** | Renders frame by frame and streams the MP4 to disk (~30–90 min at 720p, longer at 1080p) |

Then upload the MP4 to YouTube. The **Upload kit** panel carries the title options, description, chapters (computed from your actual render), tags and pinned comment. The **Thumbnail** button builds the "5% ≠ YOUR EXIT" poster (six variants for Test & Compare).

### Voice

The default voice is **Andrew (deep, warm, premium)** at rate −4% — the full narration is pre-cached, so "Prepare project" is instant even offline. Changing voice or pace re-generates only the new lines (needs one online pass for the speech service).

## 3 · The offline QA harness (before every upload)

```
node tools/render-check.mjs                 # ~28 evidence frames + all gates
node tools/frame-dump.mjs --at 12000 --out f.png   # any single frame
node tools/frame-dump.mjs --thumb 0 --out thumb.png
node scripts/render-clip.mjs --from 0 --to 9 --mood sparse --out clip.mp4
node scripts/precache-tts.mjs               # refresh the voiceover cache
node scripts/render-bed.mjs                 # re-render the score beds (after score.ts edits)
```

The harness gates: collision guard, scale law, prop ledger, occupancy, value-mass (re-keyed for the dark register), phone-feed density, silhouette, face semantics, hand ink, motion, anchor rotation. The film ships when the worst frame passes.

## 4 · What's inside

```
src/app/page.tsx              ← the Studio UI (Next.js + shadcn/ui)
src/app/api/tts/…             ← free neural voiceover service (Edge TTS) + disk cache
src/lib/engine/script-data.ts ← the entire documentary script, structured into 126 beats
src/lib/engine/director.ts    ← draws any frame at any time (the "camera")
src/lib/engine/scenes-*.ts    ← 38 scene types (host, data, statement + the finance set)
src/lib/engine/scenes-finance.ts ← the Evergreen scenes (statReveal, wrapperMatrix, caseFiles…)
src/lib/engine/stickman-v2.ts ← the presenter: skeleton, gestures, walk cycle, expressions
src/lib/engine/effects.ts     ← the brass % glyph, liquid-iris transition, VFX, particles
src/lib/engine/theme.ts       ← the "Vault Noir" design system
src/lib/engine/charts.ts      ← animated line charts, pies, gauges, counters
src/lib/engine/score.ts       ← the score-as-data (D minor · 76 BPM · 6 moods)
src/lib/engine/audio.ts       ← DSP composer + sf2 mixer with voice ducking
src/lib/engine/encode.ts      ← WebCodecs H.264 + MP4 muxing, streamed to disk
src/lib/engine/timeline.ts    ← audio-driven, frame-accurate edit decision list
public/beds/                  ← the rendered score beds (24 loops, real instruments)
```

**Every visual and every sound is generated by code** — the figure, the brass %, the charts, the score, the captions. Zero copyrighted assets: the video is fully monetizable from day one.

## 5 · The film's structure (9 chapters)

1. **The number that changes the question** — $1,000,000 vs 5%-of-the-fund
2. **A structural shift, not a product fad** — Preqin launches, Fed net assets, the BBH survey
3. **Four wrappers. Four different promises.** — interval / tender-offer / non-traded BDC / ELTIF
4. **When everyone asks to leave** — the liquidity plumbing, proration, what "gate" means
5. **2026: three cases, not one headline** — Cliffwater, BCRED (Q1 upsized / Q2 prorated), OBDC II at 99.7% of par
6. **The price of the exit** — NAV as a valuation (100 vs 90), the fee stack
7. **The serious bull case** — implementation efficiency, the honest trade-offs
8. **The eight-question liquidity audit** — the screenshot moment
9. **The conclusion: liquidity is a system** — "a periodic redemption window is not the same as a guaranteed exit"

Sources are cited on screen for every number (SEC Investor.gov, Federal Reserve FEDS note, Preqin, BBH, Reuters, BCRED filings, Blue Owl, Hamilton Lane, ELTIF 2.0). Research cutoff: 20 November 2026.

---

*Educational analysis only — the disclaimer is in the video itself, exactly as the script specifies. Not financial advice.*
