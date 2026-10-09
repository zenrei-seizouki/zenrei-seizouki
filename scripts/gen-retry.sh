#!/bin/bash
# 使用量上限が解除されるまで待ちながら gen-all.sh を繰り返す（最大 ATTEMPTS 回）
cd "$(dirname "$0")/.."
ATTEMPTS=${1:-6}
for i in $(seq 1 $ATTEMPTS); do
  scripts/gen-all.sh 2 && exit 0
  echo "attempt $i incomplete; sleeping 25min"
  sleep 1500
done
exit 3
