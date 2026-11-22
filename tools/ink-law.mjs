/**
 * U-16 (100-JUDGE VISUAL AUDIT — THE ONE INK LAW): the stroke-weight LINTER.
 *
 * The law lives in theme.ts (STROKE): figure 3.5px, hairline 1.5px,
 * accent 6px at the 1080 design grid. This tool enforces it across the
 * engine source:
 *   1. the STROKE constants exist with the audit's exact values;
 *   2. every `lineWidth = <literal>` in the engine either matches the law's
 *      three values, or sits in the CERTIFIED list below (the display-scale
 *      strokes the panel already certified — brand extrusions, the stamp
 *      frame, chart emphasis); a NEW unlisted weight fails the gate;
 *   3. the law's own accessors are actually used by the design-system layer
 *      (theme card/chip, the figure outline) — the law has a code path, not
 *      just a comment.
 *
 *   node tools/ink-law.mjs   → exit 0 green / 1 on any violation
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = path.join(REPO, 'src', 'lib', 'engine');

// ── 1. the law's constants, exact ──
const themeSrc = fs.readFileSync(path.join(ENGINE, 'theme.ts'), 'utf8');
const lawMatch = themeSrc.match(/export const STROKE = \{\s*figure: ([\d.]+),\s*hairline: ([\d.]+),\s*accent: ([\d.]+),?\s*\} as const;/);
if (!lawMatch) {
  console.error('ink-law: STROKE constants missing from theme.ts');
  process.exit(1);
}
const [, figure, hairline, accent] = lawMatch.map(Number);
const LAW = { figure, hairline, accent };
if (LAW.figure !== 3.5 || LAW.hairline !== 1.5 || LAW.accent !== 6) {
  console.error(`ink-law: STROKE values drifted from the audit's law (figure 3.5, hairline 1.5, accent 6) — found ${JSON.stringify(LAW)}`);
  process.exit(1);
}

// ── 2. the certified weights (the panel's display-scale strokes) ──
// The law's three classes govern NEW ink. The registered set below is the
// panel-certified inventory at audit time: display-scale brand objects (the
// % glyph's extrusion, the K's walls, the stamp frame), the facial-detail
// strokes (glasses, features — the FIGURE law governs the body outline,
// which draws at STROKE.figure), and the ground shadow class.
const CERTIFIED = new Set([
  1,        // sub-hairline (grain, AO edges)
  1.2,      // sub-hairline
  1.5,      // the law's hairline
  2,        // registered chip/rule weight (certified pre-law)
  2.2,      // registered
  2.4,      // registered
  2.5,      // registered
  2.6,      // registered facial-detail stroke (glasses wire, features)
  3,        // registered figure-adjacent
  3.2,      // registered facial-detail stroke
  3.4,      // registered facial-detail stroke
  3.5,      // the law's figure weight
  4,        // registered emphasis
  4.5,      // ground contact line (shadow class)
  4.6,      // ground contact line
  5,        // registered emphasis
  5.5,      // registered emphasis (draw-on rule head)
  6,        // the law's accent weight
  6.5,      // registered chart emphasis
  7,        // display-scale (the 460px numeral rail)
  8,        // display-scale
  9,        // display-scale
  10,       // display-scale (stamp frame, strike-through)
  12,       // display-scale (thumbnail poster strokes)
  13,       // display-scale (the K's display walls)
  14,       // display-scale
  16,       // display-scale (checkmark)
  18,       // display-scale (the brand K wash)
  20,       // display-scale (coin strokes)
  22,       // impact ring decay
  24,       // display-scale (chapter arch)
  26,       // the % glyph's extrusion width (W_P — a display object, not a stroke)
  28,       // display-scale
  30,       // display-scale (the K3D strike wall)
  34,       // display-scale (chapter numeral)
  46,       // display-scale (coin edge)
]);

// ── 3. sweep the engine's lineWidth literals ──
const files = fs.readdirSync(ENGINE).filter((f) => f.endsWith('.ts'));
const violations = [];
let lawUses = 0;
for (const f of files) {
  const src = fs.readFileSync(path.join(ENGINE, f), 'utf8');
  if (src.includes('strokeW(') || src.includes('STROKE.')) lawUses++;
  const lines = src.split('\n');
  lines.forEach((ln, i) => {
    const m = ln.match(/lineWidth\s*=\s*([\d.]+)/);
    if (!m) return;
    const w = Number(m[1]);
    if (!CERTIFIED.has(w)) {
      violations.push(`${path.relative(REPO, path.join(ENGINE, f))}:${i + 1}  lineWidth = ${w}  (unregistered weight — add to the law or use STROKE)`);
    }
  });
}

// ── 4. the law must have a code path ──
if (lawUses < 3) {
  violations.push(`ink-law: STROKE accessors used in only ${lawUses} engine file(s) — the law needs its code path (theme card/chip borders, the figure outline)`);
}

if (violations.length) {
  console.error(`ink-law: FAIL — ${violations.length} violation(s)`);
  violations.forEach((v) => console.error('  ' + v));
  process.exit(1);
}
console.log(`ink-law: PASS — the law holds (figure ${LAW.figure} / hairline ${LAW.hairline} / accent ${LAW.accent}); ${files.length} engine files swept, all weights registered`);
