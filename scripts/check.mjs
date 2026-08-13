/* ============================================================
   dist/ denetimi — kırık iç link, eksik görsel, eksik stil,
   boş içerik ve yinelenen başlık kontrolü.
   Kullanım: node scripts/check.mjs
   ============================================================ */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('dist/ yok — önce `npm run build` çalıştırın.');
  process.exit(1);
}

/* dist içindeki tüm html dosyalarını topla */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));

// URL yolu -> dosya var mı? (/hizmetlerimiz/ -> dist/hizmetlerimiz/index.html)
const hasRoute = (url) => {
  const clean = url.split('#')[0].split('?')[0];
  if (clean === '/' || clean === '') return existsSync(join(DIST, 'index.html'));
  const p = join(DIST, clean);
  return existsSync(p) || existsSync(join(p, 'index.html')) || existsSync(`${p}.html`);
};

const problems = [];
const titles = new Map();
const add = (page, kind, detail) =>
  problems.push({ page: page.replace(DIST, '') || '/', kind, detail });

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const rel = file.replace(DIST, '');

  /* --- stil dosyası --- */
  if (!/<link rel="stylesheet"[^>]*href="[^"]*\.css"/.test(html)) {
    add(file, 'stil', 'sayfada derlenmiş CSS bağlantısı yok');
  }

  /* --- başlık --- */
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  if (!title) add(file, 'başlık', '<title> boş veya yok');
  else {
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(rel);
  }

  if (!/<meta name="description" content="[^"]{40,}"/.test(html)) {
    add(file, 'meta', 'description eksik ya da çok kısa');
  }

  /* --- gövde doluluk --- */
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
  const text = main.replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // Galeri gibi görsel ağırlıklı sayfalarda metin az olur; her görseli
  // 40 karakterlik içerik sayarak dengeliyoruz.
  const imgCount = (main.match(/<img/g) || []).length;
  if (text.length + imgCount * 40 < 300) {
    add(file, 'içerik', `gövde çok kısa (${text.length} karakter, ${imgCount} görsel)`);
  }

  /* --- iç linkler --- */
  const hrefs = [...html.matchAll(/href="(\/[^"#][^"]*)"/g)].map((m) => m[1]);
  for (const href of new Set(hrefs)) {
    if (href.startsWith('/assets/') || href.startsWith('/img/')) {
      if (!existsSync(join(DIST, href))) add(file, 'varlık', `bulunamadı: ${href}`);
      continue;
    }
    if (!hasRoute(href)) add(file, 'link', `hedef sayfa yok: ${href}`);
  }

  /* --- görseller --- */
  const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  for (const src of new Set(srcs)) {
    if (!src.startsWith('/')) continue;
    if (!existsSync(join(DIST, src))) add(file, 'görsel', `dosya yok: ${src}`);
  }

  /* --- alt metni olmayan görseller --- */
  const noAlt = [...html.matchAll(/<img(?![^>]*\balt=)[^>]*>/g)].length;
  if (noAlt) add(file, 'erişilebilirlik', `${noAlt} görselde alt metni yok`);
}

/* --- yinelenen başlıklar --- */
for (const [title, list] of titles) {
  if (list.length > 1) {
    problems.push({
      page: list.join(', '),
      kind: 'yinelenen başlık',
      detail: `"${title}" ${list.length} sayfada`,
    });
  }
}

/* --- rapor --- */
console.log(`${pages.length} sayfa denetlendi.\n`);

if (!problems.length) {
  console.log('Sorun bulunamadı.');
  process.exit(0);
}

const byKind = problems.reduce((acc, p) => {
  (acc[p.kind] ??= []).push(p);
  return acc;
}, {});

for (const [kind, list] of Object.entries(byKind)) {
  console.log(`\n### ${kind} — ${list.length} adet`);
  for (const p of list.slice(0, 12)) console.log(`  ${p.page}\n    ${p.detail}`);
  if (list.length > 12) console.log(`  ... ve ${list.length - 12} tane daha`);
}

console.log(`\nToplam ${problems.length} sorun.`);
process.exit(1);
