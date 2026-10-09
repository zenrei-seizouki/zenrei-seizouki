#!/bin/bash
# usage: scripts/gen.sh <name> "<subject description>" [composition]   -> art-src/<name>.png (Codex image_generation)
# 全画像に共通STYLE(scripts/style.txt)を使い、cat/elder を画風の参照画像として添付して統一感を保つ
cd "$(dirname "$0")/.."
STYLE=$(cat scripts/style.txt)
COMP=${3:-square, single subject centered, plain off-white paper background with no scenery}
REFS=()
for r in cat elder; do
  if [ -f art-src/$r.png ] && [ "$1" != "$r" ]; then REFS+=(-i "art-src/$r.png"); fi
done
PROMPT="Use your image generation tool to generate exactly one image. Subject: $2. Composition: ${COMP}. Style: ${STYLE}. The attached reference images (if any) define the exact rendering style to match: heavy black brush outlines, coarse halftone, vermilion misregistered offset, caricature-like deadpan faces, NOT soft anime, NOT thin lines. After generating, copy the resulting image file into art-src/$1.png in the current working directory (create no other files) and reply only with the saved path."
printf '%s' "$PROMPT" | codex exec -s workspace-write "${REFS[@]}" - > art-src/$1.log 2>&1
