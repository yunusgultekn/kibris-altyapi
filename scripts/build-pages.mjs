/* ============================================================
   content/site.json -> statik HTML sayfaları
   vite.config.js hem dev hem build öncesi bunu çağırır.
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  layout, pageHead, grid, listPage, articlePage, esc, SITE_URL,
} from './templates.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Üretilen sayfaların yaşadığı klasörler (temizlenirken kullanılır)
export const GENERATED_DIRS = ['hakkimizda', 'hizmetlerimiz', 'bolge', 'blog', 'galeri', 'iletisim'];

const readSite = () => JSON.parse(readFileSync(join(ROOT, 'content', 'site.json'), 'utf8'));

/* ---------- ana sayfa ---------- */

function homePage(site) {
  const stat = (n, s, l) => `<li><b data-count="${n}" data-suffix="${s}">0</b><span>${l}</span></li>`;

  const body = `
<main id="top">
  <section class="hero">
    <div class="hero__stage">
      <canvas id="rig"></canvas>
      <div class="hero__nowebgl" id="noWebgl" hidden>
        <div class="rig2d"><i></i><i></i><i></i></div>
      </div>
    </div>
    <div class="hero__scrim" aria-hidden="true"></div>

    <div class="hero__content">
      <p class="eyebrow"><span class="dot"></span> KIBRIS GENELİNDE ALTYAPI VE SONDAJ HİZMETİ</p>
      <h1 class="hero__title"><span class="l1">KIBRIS</span><span class="l2">ALTYAPI</span></h1>
      <p class="hero__tagline">${esc(site.brand.tagline)}</p>
      <p class="hero__lead">${esc(site.brand.intro)}</p>

      <div class="hero__cta">
        <a href="/iletisim/" class="btn btn--primary">Ücretsiz Keşif &amp; Teklif</a>
        <a href="/hizmetlerimiz/" class="btn btn--ghost">Hizmetlerimiz</a>
      </div>

      <ul class="hero__stats">
        ${stat(site.services.length, '', 'Hizmet Kalemi')}
        ${stat(site.regions.length, '', 'Hizmet Bölgesi')}
        ${stat(7, '/24', 'Saha Desteği')}
      </ul>
    </div>

    <a href="#hizmetler" class="hero__scroll" aria-label="Aşağı kaydır"><span></span></a>
  </section>

  <section class="section" id="hakkinda">
    <div class="wrap grid2">
      <div>
        <p class="eyebrow"><span class="dot"></span> MODERN EKİPMAN — UZMAN EKİP</p>
        <h2>Garantili işlem,<br />yönetmeliklere uygun uygulama.</h2>
      </div>
      <div class="prose">
        <p>Altyapı sektörü; mühendislik disiplini, teknik uzmanlık ve yüksek saha
        koordinasyonu gerektiren, şehirlerin sürdürülebilir gelişimini doğrudan
        belirleyen stratejik bir hizmet alanıdır.</p>
        <p>Kıbrıs genelinde delik açma, karot, beton kesim, yıkım, kuyu açma, sondaj,
        su hattı ve kanalizasyon bağlantılarına kadar tüm işleri tek elden yürütüyoruz.</p>
        <a class="link-go" href="/hakkimizda/">Hakkımızda <i></i></a>
      </div>
    </div>
  </section>

  <section class="section section--alt" id="hizmetler">
    <div class="wrap">
      <header class="section__head">
        <p class="eyebrow"><span class="dot"></span> HİZMETLERİMİZ</p>
        <h2>Yer altından yüzeye,<br />uçtan uca altyapı.</h2>
        <p class="section__lead">Kıbrıs genelinde ${site.services.length} ayrı hizmet kaleminde,
        uzman ekip ve modern ekipmanla çalışıyoruz.</p>
      </header>
      ${grid(site.services, 'hizmet')}
      <div class="section__more"><a class="btn btn--ghost" href="/hizmetlerimiz/">Tümünü gör</a></div>
    </div>
  </section>

  <section class="section" id="galeri">
    <div class="wrap">
      <header class="section__head">
        <p class="eyebrow"><span class="dot"></span> GALERİ</p>
        <h2>Sahadan kareler</h2>
      </header>
      <div class="gallery gallery--home">
        ${site.gallery.slice(0, 8).map((g) => `<a class="gallery__item" href="${g.full}" target="_blank" rel="noopener">
          <img src="${g.card}" alt="${esc(g.alt)}" loading="lazy" /></a>`).join('')}
      </div>
      <div class="section__more"><a class="btn btn--ghost" href="/galeri/">Tüm galeri</a></div>
    </div>
  </section>

  <section class="section section--alt" id="bolge">
    <div class="wrap">
      <header class="section__head">
        <p class="eyebrow"><span class="dot"></span> HİZMET BÖLGELERİ</p>
        <h2>KKTC'nin her yerindeyiz.</h2>
        <p class="section__lead">Lefkoşa'dan Dipkarpaz'a, ${site.regions.length} bölgede
        aynı gün keşif ve hızlı müdahale.</p>
      </header>
      <div class="chips">
        ${site.regions.map((r) => `<a class="chip" href="${r.url}">${esc(r.title)}</a>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="blog">
    <div class="wrap">
      <header class="section__head">
        <p class="eyebrow"><span class="dot"></span> BLOG</p>
        <h2>Altyapıda gündem</h2>
      </header>
      ${grid(site.blog, 'blog')}
    </div>
  </section>
</main>`;

  return layout({
    site,
    title: 'Kıbrıs Altyapı — Sondaj, Kuyu, Beton Kesim ve Altyapı Hizmetleri',
    description: site.brand.intro.slice(0, 158),
    url: '/',
    current: '/',
    body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Kıbrıs Altyapı',
      description: site.brand.intro,
      url: SITE_URL,
      telephone: site.brand.phones.map((p) => p.tel),
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Harika Mahallesi, Azot Sokak No:8',
        addressLocality: 'Gazimağusa',
        addressCountry: 'CY',
      },
      areaServed: site.regions.map((r) => r.title.replace(' Altyapı', '')),
      makesOffer: site.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title },
      })),
    },
  });
}

/* ---------- hakkımızda ---------- */

function aboutPage(site) {
  const body = `
${pageHead({
    eyebrow: 'HAKKIMIZDA',
    title: 'Kıbrıs’ın Altyapısında Uzman Dokunuş',
    lead: site.brand.intro,
    crumbs: [{ title: 'Hakkımızda' }],
    image: site.gallery[0],
  })}
<section class="section section--top">
  <div class="wrap article">
    <div class="article__body">${site.pages.hakkimizda?.body || ''}</div>
    <aside class="article__side">
      <div class="side-card side-card--call">
        <h3>Bize ulaşın</h3>
        <p>Keşif ve fiyatlandırma ücretsizdir.</p>
        ${site.brand.phones.map((p) => `<a class="side-phone" href="tel:${p.tel}"><b>${esc(p.number)}</b><span>${esc(p.label)}</span></a>`).join('')}
        <a class="btn btn--primary btn--full" href="/iletisim/">Teklif İste</a>
      </div>
      <div class="side-card">
        <h3>Hizmetlerimiz</h3>
        <ul class="side-list">
          ${site.services.map((s) => `<li><a href="${s.url}">${esc(s.title)}</a></li>`).join('')}
        </ul>
      </div>
    </aside>
  </div>
</section>`;

  return layout({
    site, title: 'Hakkımızda | Kıbrıs Altyapı',
    description: site.brand.intro.slice(0, 158),
    url: '/hakkimizda/', current: '/hakkimizda/', body,
  });
}

/* ---------- galeri ---------- */

function galleryPage(site) {
  const body = `
${pageHead({
    eyebrow: 'GALERİ',
    title: 'Sahadan Kareler',
    lead: `Kıbrıs genelinde tamamladığımız işlerden ${site.gallery.length} kare.`,
    crumbs: [{ title: 'Galeri' }],
  })}
<section class="section section--top">
  <div class="wrap">
    <div class="gallery">
      ${site.gallery.map((g) => `<a class="gallery__item" href="${g.full}" target="_blank" rel="noopener">
        <img src="${g.card}" alt="${esc(g.alt)}" loading="lazy" /></a>`).join('')}
    </div>
  </div>
</section>`;

  return layout({
    site, title: 'Galeri | Kıbrıs Altyapı',
    description: 'Kıbrıs Altyapı saha çalışmaları, sondaj, kuyu açma ve altyapı işlerinden fotoğraflar.',
    url: '/galeri/', current: '/galeri/', body,
  });
}

/* ---------- iletişim ---------- */

function contactPage(site) {
  const body = `
${pageHead({
    eyebrow: 'İLETİŞİM',
    title: 'Bize Ulaşın',
    lead: 'Keşif ve ön fiyatlandırma ücretsizdir. Formu doldurun, aynı gün dönüş yapalım.',
    crumbs: [{ title: 'İletişim' }],
  })}
<section class="section section--top">
  <div class="wrap grid2 grid2--contact">
    <div>
      <ul class="contact">
        ${site.brand.phones.map((p) => `<li><span>${esc(p.label)}</span><a href="tel:${p.tel}">${esc(p.number)}</a></li>`).join('')}
        <li><span>Adres</span><a href="https://maps.google.com/?q=${encodeURIComponent(site.brand.address)}" target="_blank" rel="noopener">${esc(site.brand.address)}</a></li>
        <li><span>Çalışma Saatleri</span><a href="/iletisim/">Pzt – Cmt · 08:00 – 18:00</a></li>
        <li><span>WhatsApp</span><a href="https://wa.me/${site.brand.phones[0].tel.replace('+', '')}" target="_blank" rel="noopener">Mesaj gönder</a></li>
      </ul>
    </div>

    <form class="form" id="teklifForm" novalidate>
      <div class="form__row">
        <label>Ad Soyad<input type="text" name="ad" required placeholder="Adınız" /></label>
        <label>Telefon<input type="tel" name="tel" required placeholder="05xx xxx xx xx" /></label>
      </div>
      <label>Hizmet
        <select name="hizmet">
          ${site.services.map((s) => `<option>${esc(s.title)}</option>`).join('')}
        </select>
      </label>
      <label>Bölge
        <select name="bolge">
          ${site.regions.map((r) => `<option>${esc(r.title.replace(' Altyapı', ''))}</option>`).join('')}
        </select>
      </label>
      <label>Notlar<textarea name="mesaj" rows="4" placeholder="Talebinizi kısaca yazın."></textarea></label>
      <button type="submit" class="btn btn--primary btn--full">Teklif İste</button>
      <p class="form__hint" id="formHint">Formu göndermek yerine doğrudan arayabilirsiniz.</p>
    </form>
  </div>
</section>`;

  return layout({
    site, title: 'İletişim | Kıbrıs Altyapı',
    description: `Kıbrıs Altyapı iletişim: ${site.brand.phones.map((p) => p.number).join(' - ')} · ${site.brand.address}`,
    url: '/iletisim/', current: '/iletisim/', body,
  });
}

/* ---------- üretici ---------- */

export function buildPages({ clean = true } = {}) {
  const site = readSite();
  const written = [];

  const write = (rel, html) => {
    const abs = join(ROOT, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, html);
    written.push(abs);
  };

  if (clean) {
    for (const d of GENERATED_DIRS) rmSync(join(ROOT, d), { recursive: true, force: true });
    for (const p of [...site.services, ...site.regions, ...site.blog]) {
      rmSync(join(ROOT, p.slug), { recursive: true, force: true });
    }
  }

  write('index.html', homePage(site));
  write('hakkimizda/index.html', aboutPage(site));
  write('galeri/index.html', galleryPage(site));
  write('iletisim/index.html', contactPage(site));

  write('hizmetlerimiz/index.html', listPage(site, {
    title: 'Hizmetlerimiz', eyebrow: 'NE YAPIYORUZ', url: '/hizmetlerimiz/',
    lead: `Kıbrıs genelinde ${site.services.length} ayrı hizmet kaleminde uzman ekip ve modern ekipmanla çalışıyoruz.`,
    items: site.services, kind: 'hizmet',
  }));

  write('bolge/index.html', listPage(site, {
    title: 'Hizmet Bölgeleri', eyebrow: 'NEREDE ÇALIŞIYORUZ', url: '/bolge/',
    lead: `Lefkoşa'dan Dipkarpaz'a, KKTC genelinde ${site.regions.length} bölgede hizmet veriyoruz.`,
    items: site.regions, kind: 'bolge',
  }));

  write('blog/index.html', listPage(site, {
    title: 'Blog', eyebrow: 'GÜNDEM', url: '/blog/',
    lead: 'Kıbrıs’ta altyapı, sondaj ve teknik uygulamalar üzerine yazılar.',
    items: site.blog, kind: 'blog',
  }));

  const groups = [
    { items: site.services, kind: 'hizmet', listUrl: '/hizmetlerimiz/', listTitle: 'Hizmetlerimiz' },
    { items: site.regions, kind: 'bolge', listUrl: '/bolge/', listTitle: 'Hizmet Bölgeleri' },
    { items: site.blog, kind: 'blog', listUrl: '/blog/', listTitle: 'Blog' },
  ];

  for (const g of groups) {
    for (const item of g.items) {
      write(`${item.slug}/index.html`, articlePage(site, item, { ...g, siblings: g.items }));
    }
  }

  writeSitemap(site, write);
  writeRobots();
  writeGitignore(site);

  return written;
}

/* Üretilen sayfalar sürüm kontrolüne girmesin — liste otomatik güncellenir. */
const MARK_START = '# >>> build-pages.mjs (elle düzenlemeyin)';
const MARK_END = '# <<< build-pages.mjs';

function writeGitignore(site) {
  const paths = [
    '/index.html',
    ...GENERATED_DIRS.map((d) => `/${d}/`),
    ...[...site.services, ...site.regions, ...site.blog].map((i) => `/${i.slug}/`),
    '/public/sitemap.xml',
    '/public/robots.txt',
    '/public/img/_src/',
  ];

  const file = join(ROOT, '.gitignore');
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const before = current.split(MARK_START)[0].trimEnd();
  const after = current.includes(MARK_END)
    ? current.split(MARK_END)[1].trimStart() : '';

  const block = [MARK_START, ...paths, MARK_END].join('\n');
  writeFileSync(file, [before, '', block, after].join('\n').replace(/\n{3,}/g, '\n\n'));
}

function writeSitemap(site, write) {
  const urls = [
    '/', '/hakkimizda/', '/hizmetlerimiz/', '/bolge/', '/blog/', '/galeri/', '/iletisim/',
    ...[...site.services, ...site.regions, ...site.blog].map((i) => i.url),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc><priority>${u === '/' ? '1.0' : '0.7'}</priority></url>`).join('\n')}
</urlset>`;
  mkdirSync(join(ROOT, 'public'), { recursive: true });
  writeFileSync(join(ROOT, 'public', 'sitemap.xml'), xml);
}

function writeRobots() {
  writeFileSync(join(ROOT, 'public', 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
}

// Doğrudan çalıştırılırsa
if (process.argv[1] && process.argv[1].endsWith('build-pages.mjs')) {
  const files = buildPages();
  console.log(`${files.length} sayfa üretildi.`);
}
