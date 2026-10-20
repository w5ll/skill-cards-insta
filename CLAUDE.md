# Projeto: conteúdo do Well para advogados

Repositório da skill `skill/conteudo-well-advogados/`, que gera roteiros de vídeo, carrosséis e legendas para o Instagram do Well (@lunardiwell). Leia `skill/conteudo-well-advogados/SKILL.md` e os arquivos de `referencias/` antes de qualquer trabalho.

- Sempre em português, com acentuação, sem travessão, sem termo em inglês sem tradução. O Well não lê inglês.
- Pedido de conteúdo: siga o SKILL.md. Copy primeiro, aprovação do Well, depois a arte.
- Carrossel pronto: salve o `.json` e os PNGs em `saida/<AAAA-MM-DD>_<tema-curto>/` e renderize com `node skill/conteudo-well-advogados/scripts/renderizar.mjs <arquivo.json>`. Confira os PNGs antes de entregar.
- "Processa o material-bruto": leia os arquivos novos de `material-bruto/`, destile o que importa e atualize `referencias/` (voz, pautas, ganchos) e `biblioteca/publicados/`. Nunca leve nome de cliente, número real ou método interno da Arven para dentro da skill.
- Publicar: siga a seção 4 do SKILL.md (`scripts/publicar.mjs`). Nunca publique sem o Well dizer "pode postar". Rode o teste sem `--confirmar` primeiro. Token em `IG_ACCESS_TOKEN`.
- Depois de mudar a skill, rode `./empacotar.sh` para gerar o `.skill` atualizado.
