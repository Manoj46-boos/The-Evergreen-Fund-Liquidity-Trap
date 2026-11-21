# The Evergreen Fund — Video Studio · Setup Guide

## One-time setup (any 8 GB laptop)

1. Install Node.js LTS → https://nodejs.org
2. In this folder: `npm install`
3. Start: `npm run dev` → open http://localhost:3000 in Chrome/Edge

## Make the video (3 clicks)

1. **Prepare project** — the full 280-line voiceover is PRE-CACHED (`.render-assets/tts/`), so this is instant: it measures the audio, builds the frame-accurate timeline, composes the D-minor score and mixes everything.
2. *(optional)* **Play** the preview.
3. **Render full MP4** — 1080p recommended (~40,000 frames; let it run). 720p is the lite mode.

## Before every upload

- `node tools/render-check.mjs` — the evidence frames + all QA gates
- `node tools/frame-dump.mjs --thumb 0 --out public/thumbnail.png` — the "5% ≠ YOUR EXIT" poster (variants 0-5 for Test & Compare)
- `node tools/novelty-audit.mjs` — no dead windows (swipe-risk scan)
- The **Upload kit** panel: title options, description + auto chapters, tags, pinned comment

## Regenerating assets (only when you edit them)

- `node scripts/render-bed.mjs` — re-render the score beds after editing `score.ts` (downloads GeneralUser GS once)
- `node scripts/precache-tts.mjs` — refresh the voiceover cache after editing `script-data.ts`
- `node scripts/render-clip.mjs --from 0 --to 9 --mood sparse --out clip.mp4` — offline test clip with real VO + score

*Not financial advice — the disclaimer is in the video itself.*
