#!/usr/bin/env bash
# render-evidence.sh — the BEFORE/AFTER proof pass for the U-01..U-14 upgrades.
# Usage: render-evidence.sh BEFORE|AFTER [outdir]
#   BEFORE  renders from the pristine engine build (do NOT pass --rebuild)
#   AFTER   forces a fresh compile first (--rebuild)
set -u
PHASE="${1:-BEFORE}"
OUT="${2:-/home/z/my-project/download/before-after}"
cd "$(dirname "$0")/.." || exit 1
mkdir -p "$OUT"
REB=""
[ "$PHASE" = "AFTER" ] && REB="--rebuild"
FD() { # frame-dump wrapper
  local name="$1"; shift
  echo "── $name"
  node tools/frame-dump.mjs "$@" --out "$OUT/${PHASE}_${name}.png" --feed $REB || echo "!! FAILED: $name"
}
# ── U-01 silhouette / U-03 face register / U-04 costume law ──
FD U01-U04_host --scene host --nth 0 --frac 0.55
FD U01-U04_thumb --thumb 0
# ── U-02 pushed-object contact + U-05 rig floor (statement) ──
FD U02-U05_bigtext --scene bigText --nth 0 --frac 0.62
# ── U-05 quote/stamp rigs ──
FD U05_quote --scene quoteCard --nth 0 --frac 0.55
FD U05_stamp --scene stampCard --nth 0 --frac 0.5
# ── U-06 the room visible (statement + host rooms) ──
FD U06_room --scene bigText --nth 0 --frac 0.5
# ── U-07 the strong drawers rotated into the script ──
FD U07_a_interval --at 278569
FD U07_b_tender --at 329831
FD U07_c_bdc --at 368577
FD U07_d_friction --at 941182
FD U07_e_machinery --at 923544
FD U07_f_answer --at 1129300
FD U07_g_capital --at 1145150
# ── U-08 the bottom band (data scene with citation + captions) ──
FD U08_bottomband --at 522220
# ── U-09 flow stress right third ──
FD U09_flowstress --at 543000
# ── U-11 accent amplitude (mid-strike frame) / U-12 seam event ──
FD U11_accent --at 70881
FD U12_seam --at 81306
# ── U-13 walk personality (entrance walk mid-phase) ──
FD U13_walk --at 1097515
# ── U-14 transitions (chapter-entry iris @ gt 250; an exit window) ──
FD U14_entry --at 869725
FD U14_exit --at 261320
echo "done: $PHASE → $OUT"
