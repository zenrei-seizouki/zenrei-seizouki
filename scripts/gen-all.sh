#!/bin/bash
# art-list.tsv の全画像を Codex で生成（既にある物はスキップ）。同時 PAR 本まで。
# 使用量上限(usage limit)に当たったら、その時点で止めて exit 3（時間を置いて再実行すれば続きから）。
# usage: scripts/gen-all.sh [PAR=3]
cd "$(dirname "$0")/.."
PAR=${1:-3}
running=0
while IFS=$'\t' read -r name subject comp; do
  [ -z "$name" ] && continue
  [ -f "art-src/$name.png" ] && continue
  if grep -qs "usage limit" "art-src/$name.log" 2>/dev/null && [ -n "$STOP_ON_LIMIT" ]; then continue; fi
  if [ "$running" -ge "$PAR" ]; then wait -n; running=$((running - 1)); fi
  echo "start $name"
  if [ -n "$comp" ]; then scripts/gen.sh "$name" "$subject" "$comp" </dev/null & else scripts/gen.sh "$name" "$subject" </dev/null & fi
  running=$((running + 1))
  sleep 2
done < scripts/art-list.tsv
wait
missing=0
while IFS=$'\t' read -r name _; do [ -n "$name" ] && [ ! -f "art-src/$name.png" ] && missing=$((missing + 1)); done < scripts/art-list.tsv
echo "done. missing=$missing"
[ "$missing" -gt 0 ] && exit 3
exit 0
