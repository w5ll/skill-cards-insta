#!/usr/bin/env node
// Publica um carrossel no Instagram do Well pela API oficial (login empresarial do Instagram).
//
// Uso:
//   node scripts/publicar.mjs caminho/CARROSSEL.json              → só mostra o que seria publicado (teste)
//   node scripts/publicar.mjs caminho/CARROSSEL.json --confirmar  → publica de verdade
//   node scripts/publicar.mjs --verificar                         → confere se o token funciona
//   node scripts/publicar.mjs --renovar                           → gera um token novo (mais 60 dias)
//
// Precisa da variável de ambiente IG_ACCESS_TOKEN (nunca coloque o token no repositório).
//
// Como funciona:
//   1. Converte os PNGs do carrossel (NOME_01.png, NOME_02.png...) para JPG (a API só aceita JPG).
//   2. As imagens precisam estar num link público. Usamos o próprio GitHub (o repositório é público):
//      faça commit e push dos JPGs ANTES de publicar. O script confere se os links abrem.
//   3. Cria um item por slide, junta no carrossel com a legenda e publica.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, join, basename, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const API = 'https://graph.instagram.com/v23.0';
const TOKEN = process.env.IG_ACCESS_TOKEN;
const args = process.argv.slice(2);
const confirmar = args.includes('--confirmar');

function sair(msg) { console.error(msg); process.exit(1); }
if (!TOKEN) sair('Falta o token. Coloque IG_ACCESS_TOKEN nas variáveis do ambiente e abra uma sessão nova.');

async function api(caminho, params = {}, metodo = 'GET') {
  const url = new URL(API + caminho);
  const corpo = new URLSearchParams({ ...params, access_token: TOKEN });
  const r = metodo === 'GET'
    ? await fetch(url + '?' + corpo)
    : await fetch(url, { method: 'POST', body: corpo });
  const j = await r.json();
  if (j.error) sair(`Erro da API do Instagram: ${j.error.message} (código ${j.error.code})`);
  return j;
}

// ---------- Verificar / renovar token ----------
if (args.includes('--verificar')) {
  const eu = await api('/me', { fields: 'user_id,username,account_type' });
  console.log(`ok  token funcionando para @${eu.username} (id ${eu.user_id}, conta ${eu.account_type})`);
  process.exit(0);
}
if (args.includes('--renovar')) {
  const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${TOKEN}`).then(r => r.json());
  if (r.error) sair(`Não renovou: ${r.error.message}`);
  console.log(`Token novo (vale ${Math.round(r.expires_in / 86400)} dias). Troque o IG_ACCESS_TOKEN nas configurações do ambiente:\n${r.access_token}`);
  process.exit(0);
}

// ---------- Carrossel ----------
const arq = args.find(a => a.endsWith('.json'));
if (!arq) sair('Uso: node scripts/publicar.mjs caminho/CARROSSEL.json [--confirmar]');
const abs = resolve(arq);
const spec = JSON.parse(readFileSync(abs, 'utf8'));
const pasta = dirname(abs), nome = basename(abs, '.json');

const pngs = readdirSync(pasta).filter(f => new RegExp(`^${nome}_\\d{2}\\.png$`).test(f)).sort();
if (!pngs.length) sair(`Nenhum PNG encontrado. Rode antes: node scripts/renderizar.mjs ${arq}`);
if (pngs.length < 2 || pngs.length > 10) sair(`O carrossel precisa ter de 2 a 10 slides (tem ${pngs.length}).`);

// Legenda: campo "legenda" do .json ou arquivo NOME.legenda.txt ao lado.
const arqLegenda = join(pasta, `${nome}.legenda.txt`);
const legenda = spec.legenda || (existsSync(arqLegenda) ? readFileSync(arqLegenda, 'utf8').trim() : '');
if (!legenda) sair(`Falta a legenda: coloque "legenda" no .json ou crie ${basename(arqLegenda)}.`);
if (legenda.length > 2200) sair(`Legenda com ${legenda.length} caracteres. O limite do Instagram é 2.200.`);

// 1. PNG → JPG (usando o Chromium do Playwright, que já é dependência do renderizador)
const jpgs = pngs.map(f => f.replace(/\.png$/, '.jpg'));
const faltando = jpgs.filter(f => !existsSync(join(pasta, f)));
if (faltando.length) {
  let pw;
  for (const t of [() => createRequire(import.meta.url)('playwright'), () => createRequire(join(execSync('npm root -g').toString().trim(), 'x.js'))('playwright')]) { try { pw = t(); break; } catch {} }
  if (!pw) sair('Playwright não encontrado. Rode: npm install');
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const f of faltando) {
    const png = readFileSync(join(pasta, f.replace(/\.jpg$/, '.png'))).toString('base64');
    await page.setContent(`<body style="margin:0"><img id="i" src="data:image/png;base64,${png}" style="display:block;width:1080px;height:1350px"></body>`);
    await page.locator('#i').screenshot({ path: join(pasta, f), type: 'jpeg', quality: 95 });
    console.log(`jpg ${f}`);
  }
  await browser.close();
}

// 2. Links públicos no GitHub (pelo commit atual, para não pegar versão velha em cache)
const raiz = execSync('git rev-parse --show-toplevel', { cwd: pasta }).toString().trim();
const remoto = execSync('git remote get-url origin', { cwd: pasta }).toString().trim();
const repo = remoto.match(/github\.com[/:]([^/]+\/[^/.]+)/)?.[1];
if (!repo) sair(`Não consegui identificar o repositório no GitHub (${remoto}).`);
const pendentes = execSync(`git status --porcelain -- ${jpgs.map(f => JSON.stringify(join(pasta, f))).join(' ')}`, { cwd: raiz }).toString().trim();
if (pendentes) sair(`Os JPGs ainda não estão no GitHub. Faça commit e push antes:\n${pendentes}`);
const commit = execSync('git rev-parse HEAD', { cwd: raiz }).toString().trim();
const urls = jpgs.map(f => `https://raw.githubusercontent.com/${repo}/${commit}/${relative(raiz, join(pasta, f)).split('\\').join('/')}`);
for (const u of urls) {
  const r = await fetch(u, { method: 'HEAD' });
  if (!r.ok) sair(`Link não abriu (${r.status}): ${u}\nConfira se fez push e se o repositório está público.`);
}

// 3. Publicar
const eu = await api('/me', { fields: 'user_id,username' });
console.log(`\nConta: @${eu.username}\nSlides: ${urls.length}\nLegenda:\n---\n${legenda}\n---`);
if (!confirmar) { console.log('\nTeste ok. Nada foi publicado. Para publicar de verdade, rode de novo com --confirmar.'); process.exit(0); }

const esperar = ms => new Promise(r => setTimeout(r, ms));
async function pronto(id) {
  for (let i = 0; i < 30; i++) {
    const { status_code } = await api(`/${id}`, { fields: 'status_code' });
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') sair(`O Instagram recusou o item ${id} (${status_code}).`);
    await esperar(3000);
  }
  sair(`O item ${id} demorou demais para ficar pronto.`);
}

const filhos = [];
for (const [i, u] of urls.entries()) {
  const { id } = await api(`/${eu.user_id}/media`, { image_url: u, is_carousel_item: 'true' }, 'POST');
  await pronto(id);
  filhos.push(id);
  console.log(`slide ${i + 1}/${urls.length} enviado`);
}
const { id: carrossel } = await api(`/${eu.user_id}/media`, { media_type: 'CAROUSEL', children: filhos.join(','), caption: legenda }, 'POST');
await pronto(carrossel);
const { id: post } = await api(`/${eu.user_id}/media_publish`, { creation_id: carrossel }, 'POST');
const { permalink } = await api(`/${post}`, { fields: 'permalink' });
console.log(`\nPublicado: ${permalink}`);
