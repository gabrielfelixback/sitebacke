#!/usr/bin/env bash
# Gera os vídeos da web a partir dos originais em assets-originais/video (fora de public/).
# Uso: bash scripts/encode-videos.sh
# CRF acima do sugerido (32 nos reels, 29/31 nas frentes): as tomadas de drone têm muito detalhe e,
# com 27/28, o reel do celular passava de 4 MB. A diferença visual é imperceptível.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets-originais/video
OUT=public/video
mkdir -p "$OUT"
# hero + tela cheia (um arquivo para as duas seções)
ffmpeg -v error -y -i "$SRC/reel-1080.mp4" -an -c:v libx264 -preset slow -crf "${DESKTOP_CRF:-32}" -profile:v high -level 4.1 \
  -pix_fmt yuv420p -vf "scale=-2:1080" -movflags +faststart "$OUT/reel-desktop.mp4"
ffmpeg -v error -y -i "$SRC/reel-vertical.mp4" -an -c:v libx264 -preset slow -crf "${MOBILE_CRF:-32}" -profile:v main -level 3.1 \
  -pix_fmt yuv420p -vf "scale=720:-2" -t "${MOBILE_T:-15}" -movflags +faststart "$OUT/reel-mobile.mp4"
# frentes
for v in frente-demanda drone-loop; do
  ffmpeg -v error -y -i "$SRC/$v.mp4" -an -c:v libx264 -preset slow -crf 29 -profile:v high -pix_fmt yuv420p \
    -vf "scale=-2:720" -movflags +faststart "$OUT/$v-desktop.mp4"
  ffmpeg -v error -y -i "$SRC/$v.mp4" -an -c:v libx264 -preset slow -crf 31 -profile:v main -level 3.1 -pix_fmt yuv420p \
    -vf "scale=-2:540" -movflags +faststart "$OUT/$v-mobile.mp4"
done
# capas webp (primeiro quadro útil de cada versão)
for f in reel-desktop reel-mobile frente-demanda-desktop frente-demanda-mobile drone-loop-desktop drone-loop-mobile; do
  ffmpeg -v error -y -ss 0.4 -i "$OUT/$f.mp4" -frames:v 1 -c:v libwebp -quality 72 "$OUT/$f-poster.webp"
done
ls -la "$OUT"
