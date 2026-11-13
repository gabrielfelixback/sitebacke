#!/usr/bin/env bash
# Loops curtos em WebP animado: último degrau do fallback de vídeo (autoplay bloqueado e MP4 em <img> sem suporte).
# Só são baixados quando o fallback acontece. Meta: até ~700 KB cada; acima disso, refaz com 10 fps e qualidade 40.
# Uso: bash scripts/encode-loops.sh   (depois de scripts/encode-videos.sh)
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/video
LIMIT=716800 # 700 KB

loop() { # entrada, largura, saída
  ffmpeg -v error -y -i "$1" -t 3 -vf "fps=12,scale=$2:-2" -c:v libwebp -quality 45 -loop 0 -an "$3"
  if [ "$(stat -c %s "$3")" -gt "$LIMIT" ]; then
    ffmpeg -v error -y -i "$1" -t 3 -vf "fps=10,scale=$2:-2" -c:v libwebp -quality 40 -loop 0 -an "$3"
  fi
}

# celular: hero vertical / tela cheia e as frentes (360 px)
loop "$OUT/reel-mobile.mp4" 360 "$OUT/reel-mobile-loop.webp"
for v in frente-demanda drone-loop; do
  loop "$OUT/$v-mobile.mp4" 360 "$OUT/$v-loop.webp"
done
# desktop: hero / tela cheia (640 px)
loop "$OUT/reel-desktop.mp4" 640 "$OUT/reel-desktop-loop.webp"
ls -la "$OUT"/*-loop.webp
