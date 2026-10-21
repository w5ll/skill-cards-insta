#!/usr/bin/env node
// Gera os PNGs de um carrossel a partir do arquivo de especificação (.json).
// Uso: node scripts/renderizar.mjs caminho/CARROSSEL.json [outro.json ...]
// Os PNGs saem ao lado do .json: NOME_01.png, NOME_02.png...

import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, resolve, join, extname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const RAIZ_SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = join(RAIZ_SKILL, 'templates', 'carrossel.html');

function carregarPlaywright() {
  const tentativas = [
    () => createRequire(import.meta.url)('playwright'),
    () => createRequire(join(process.cwd(), 'x.js'))('playwright'),
  ];
  try { const g = execSync('npm root -g').toString().trim(); tentativas.push(() => createRequire(join(g, 'x.js'))('playwright')); } catch {}
  for (const t of tentativas) { try { return t(); } catch {} }
  console.error('Playwright não encontrado. Rode: npm install (na raiz do repositório).');
  process.exit(1);
}

// Converte imagem local em data URI, para funcionar dentro do HTML.
function imagem(caminho, base) {
  if (!caminho || /^(https?:|data:)/.test(caminho)) return caminho || null;
  const abs = resolve(base, caminho);
  if (!existsSync(abs)) return null;
  const tipo = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[extname(abs).toLowerCase()] || 'image/png';
  return `data:${tipo};base64,${readFileSync(abs).toString('base64')}`;
}

// Cena com foto: o caminho pode ser relativo ao .json ou à pasta da skill (ex.: assets/fotos/...).
function comFoto(c, base) {
  if (!c || !c.foto) return c;
  return { ...c, foto: imagem(c.foto, base) || imagem(c.foto, RAIZ_SKILL) };
}

function linkFontes(marca) {
  const fam = [...new Set([marca.fontes.titulo.familia, marca.fontes.texto.familia])];
  const q = fam.map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`).join('&');
  return `<link href="https://fonts.googleapis.com/css2?${q}&display=block" rel="stylesheet">`;
}

const arquivos = process.argv.slice(2);
if (!arquivos.length) { console.log('Uso: node scripts/renderizar.mjs caminho/CARROSSEL.json [...]'); process.exit(1); }

const { chromium } = carregarPlaywright();
const browser = await chromium.launch();
const html = readFileSync(TEMPLATE, 'utf8');

for (const arq of arquivos) {
  const abs = resolve(arq);
  const spec = JSON.parse(readFileSync(abs, 'utf8'));
  const marca = JSON.parse(readFileSync(join(RAIZ_SKILL, 'marca.json'), 'utf8'));
  Object.assign(marca, spec.marca_sobrescrever || {});
  const foto = spec.foto ? imagem(spec.foto, dirname(abs)) : imagem(marca.foto, RAIZ_SKILL);
  if (!foto) console.warn('  aviso: sem foto do Well (assets/foto-well.jpg). Capa e final saem só com o anel.');
  marca.foto = foto;

  const slides = spec.slides || [];
  const total = String(slides.length).padStart(2, '0');
  for (const [i, sl] of slides.entries()) {
    const num = String(i + 1).padStart(2, '0');
    const saida = abs.replace(/\.json$/i, `_${num}.png`);
    const padraoTitulo = sl.layout === 'capa' ? marca.tamanhos.titulo_capa : marca.tamanhos.titulo;
    const dados = {
      layout: sl.layout, textos: sl.textos, elemento: sl.elemento, foto: sl.foto, cena: comFoto(sl.cena, dirname(abs)),
      tamTitulo: sl.tam_titulo || padraoTitulo, tamApoio: sl.tam_apoio, tamElemento: sl.tam_elemento,
      pagina: `${num}/${total}`, marca,
    };
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    const pagina = html.replace('<!--FONTES-->', linkFontes(marca))
      .replace('<script>', `<script>window.__DADOS__ = ${JSON.stringify(dados)};</script><script>`);
    const tmp = join(dirname(abs), `.${basename(saida, '.png')}.render.html`);
    writeFileSync(tmp, pagina);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' }).catch(() => {});
    await page.evaluate(async f => {
      const p = [`800 40px '${f.t}'`, `500 40px '${f.x}'`, `700 40px '${f.x}'`].map(q => document.fonts.load(q));
      await Promise.race([Promise.all(p), new Promise(r => setTimeout(r, 8000))]);
    }, { t: marca.fontes.titulo.familia, x: marca.fontes.texto.familia });
    if (!await page.evaluate(f => document.fonts.check(`800 40px '${f}'`), marca.fontes.titulo.familia))
      console.warn(`  aviso: fonte "${marca.fontes.titulo.familia}" não carregou, usando fonte reserva`);
    await page.evaluate(() => window.__ajustar());
    await page.locator('#slide').screenshot({ path: saida });
    const tam = await page.evaluate(() => window.__tamFinal);
    await page.close();
    unlinkSync(tmp);
    console.log(`ok  ${saida}  (${sl.layout}, título ${tam}px)`);
  }
}
await browser.close();
