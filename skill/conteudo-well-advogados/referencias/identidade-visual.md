# Identidade visual do carrossel

## 8. Identidade visual do carrossel

Base: identidade escura da Arven com acento azul-ardósia.

| Uso | Cor |
| --- | --- |
| Fundo principal | #16161f |
| Fundo mais profundo (gradiente, vinheta) | #0a0a12 |
| Cartões e blocos | #1a1a24 |
| Superfície secundária, linhas | #333446 |
| Elementos 3D, bordas de destaque | #7f8caa |
| Palavra destacada no título (tom mais claro do azul da Arven, pra ler bem no fundo escuro) | #a8b4d4 |
| Texto principal | #eaefef |
| Texto de apoio | #b4bccd |
| Rótulos, numeração, rodapé | #8f97ab |

- Tipografia (Google Fonts): títulos em Sora 800 (90 a 96 px na capa, 80 px nos demais), apoio em Manrope 500 (34 a 36 px). Título grande, pouco texto.
- Estrutura fixa de cada slide: topo com @lunardiwell e numeração (01/07); elemento 3D ou bloco visual no meio; título e apoio embaixo; rodapé com "Well | Marketing jurídico" e seta. Muito respiro.
- Modelos de referência: os canvas "Carrossel: apresentação" (https://claude.ai/artifact/BVA1zphNs92oMnEM8w8Thu) e "Carrossel: lead barato" (https://claude.ai/artifact/UQ98j7EQDBiwecddRuqyvE). Para um carrossel novo, siga o mesmo padrão visual e troque só textos e elementos.
- Elementos 3D: formas geométricas em vidro fosco ou metal escovado no tom #7f8caa (esfera, anel, cubo arredondado, cristal, ícones em 3D como balão de mensagem, funil, relógio, gráfico). Luz suave vinda de cima. Um elemento por slide, sem poluir.
- Foto do Well (a mesma do WhatsApp profissional, que os clientes reconhecem): usar dentro de um círculo com o anel 3D em volta, na capa ou no slide final.
- Destaque uma ou duas palavras por slide na cor de destaque, nunca a frase inteira.
- Sem gradiente azul-roxo, sem ícone de emoji, sem foto de banco de imagem de martelo e balança.

Quando o Well pedir o carrossel pronto (visual), monte os slides nesse padrão.

## Onde mexer

- Cores, fontes, tamanhos, @ e nome do rodapé: `marca.json`.
- Layout dos slides e desenho dos elementos 3D: `templates/carrossel.html`.
- Foto do Well: `assets/foto-well.jpg` (quadrada, rosto centralizado). Sem a foto, a capa e o final mostram só o anel 3D.
