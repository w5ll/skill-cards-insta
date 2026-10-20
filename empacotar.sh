#!/usr/bin/env bash
# Gera dist/conteudo-well-advogados.skill (zip da pasta da skill) para subir no Claude.ai.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
rm -f dist/conteudo-well-advogados.skill
cd skill
zip -rq ../dist/conteudo-well-advogados.skill conteudo-well-advogados -x '*/.gitkeep' '*.render.html' '*/node_modules/*'
cd ..
echo "ok  dist/conteudo-well-advogados.skill ($(du -h dist/conteudo-well-advogados.skill | cut -f1))"
