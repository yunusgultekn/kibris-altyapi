/* ============================================================
   Sayfa şablonları — content/site.json'dan HTML üretir.
   ============================================================ */

export const SITE_URL = 'https://kibrisaltyapi.com.tr';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- ortak parçalar ---------- */

const LOGO_SVG = `<svg class="brand__logo" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 4 L28 17 H12 Z" /><path d="M20 17 V27" />
      <path d="M13 27 H27 L20 36 Z" /><path d="M5 31 H10 M30 31 H35" />
    </svg>`;

const brand = (cls = '') => `<a class="brand ${cls}" href="/" aria-label="Kıbrıs Altyapı ana sayfa">
    ${LOGO_SVG}
    <span class="brand__text"><strong>KIBRIS</strong><em>ALTYAPI</em></span>
  </a>`;

function nav(site, current) {
  const on = (p) => (current === p ? ' aria-current="page"' : '');
  const menu = (items, limit) => items.slice(0, limit).map(
    (i) => `<li><a href="${i.url}">${esc(i.title)}</a></li>`).join('');

  return `<header class="nav" id="nav">
  ${brand()}
  <nav class="nav__links" id="navLinks">
    <a href="/"${on('/')}>Anasayfa</a>
    <a href="/hakkimizda/"${on('/hakkimizda/')}>Hakkımızda</a>

    <div class="nav__drop">
      <a href="/hizmetlerimiz/"${on('/hizmetlerimiz/')}>Hizmetlerimiz <i></i></a>
      <ul class="nav__menu nav__menu--cols">${menu(site.services, 17)}
        <li class="nav__menu-all"><a href="/hizmetlerimiz/">Tümünü gör →</a></li>
      </ul>
    </div>

    <div class="nav__drop">
      <a href="/bolge/"${on('/bolge/')}>Bölge <i></i></a>
      <ul class="nav__menu nav__menu--cols">${menu(site.regions, 18)}
        <li class="nav__menu-all"><a href="/bolge/">Tümünü gör →</a></li>
      </ul>
    </div>

    <a href="/blog/"${on('/blog/')}>Blog</a>
    <a href="/galeri/"${on('/galeri/')}>Galeri</a>
    <a href="/iletisim/"${on('/iletisim/')}>İletişim</a>
    <a href="/iletisim/" class="btn btn--sm btn--primary">Hemen Teklif Al</a>
  </nav>
  <button class="nav__toggle" id="navToggle" aria-label="Menüyü aç" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</header>`;
}

function footer(site) {
  const col = (title, items) => `<div class="foot__col">
      <h3>${title}</h3>
      <ul>${items.map((i) => `<li><a href="${i.url}">${esc(i.title)}</a></li>`).join('')}</ul>
    </div>`;

  return `<footer class="foot">
  <div class="wrap foot__grid">
    <div class="foot__col foot__col--brand">
      ${brand('brand--foot')}
      <p>${esc(site.brand.intro)}</p>
      <div class="foot__phones">
        ${site.brand.phones.map((p) => `<a href="tel:${p.tel}"><b>${esc(p.number)}</b><span>${esc(p.label)}</span></a>`).join('')}
      </div>
      <p class="foot__addr">${esc(site.brand.address)}</p>
    </div>
    ${col('Hizmetlerimiz', site.services)}
    ${col('Bölgeler', site.regions)}
    <div class="foot__col">
      <h3>Kurumsal</h3>
      <ul>
        <li><a href="/hakkimizda/">Hakkımızda</a></li>
        <li><a href="/hizmetlerimiz/">Hizmetlerimiz</a></li>
        <li><a href="/bolge/">Bölgeler</a></li>
        <li><a href="/blog/">Blog</a></li>
        <li><a href="/galeri/">Galeri</a></li>
        <li><a href="/iletisim/">İletişim</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap foot__bar">
    <p>© <span id="year">2026</span> Kıbrıs Altyapı. Tüm hakları saklıdır.</p>
    <p>Gazimağusa / KKTC · Kıbrıs genelinde hizmet</p>
  </div>
</footer>

<a class="wa" href="https://wa.me/${site.brand.phones[0].tel.replace('+', '')}"
   target="_blank" rel="noopener" aria-label="WhatsApp ile yazın">
  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.1 19.7L3 29l6.5-1.8A13 13 0 1 0 16 3Zm7.6 18.4c-.3.9-1.8 1.7-2.5 1.8-.6.1-1.4.1-2.3-.1-.5-.2-1.2-.4-2.1-.8-3.7-1.6-6.1-5.3-6.3-5.6-.2-.2-1.5-2-1.5-3.8s.9-2.7 1.3-3.1c.3-.4.7-.4 1-.4h.7c.2 0 .5-.1.8.6l1.1 2.7c.1.2.2.4 0 .7l-.4.6-.4.5c-.2.2-.4.4-.2.7.2.4 1 1.6 2 2.6 1.4 1.2 2.5 1.6 2.8 1.8.3.2.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.6 1.2c.3.2.5.2.6.4 0 .1 0 .8-.3 1.6Z"/></svg>
</a>`;
}

/* ---------- kart bileşenleri ---------- */

export function card(item, kind = 'hizmet') {
  const img = item.image;
  return `<article class="tile">
    <a class="tile__link" href="${item.url}">
      <div class="tile__media">
        ${img ? `<img src="${img.card}" alt="${esc(img.alt || item.title)}" loading="lazy" width="760" height="500" />` : ''}
      </div>
      <div class="tile__body">
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.summary)}</p>
        <span class="tile__go">${kind === 'blog' ? 'Yazıyı oku' : 'İncele'} <i></i></span>
      </div>
    </a>
  </article>`;
}

export function grid(items, kind) {
  return `<div class="tiles">${items.map((i) => card(i, kind)).join('')}</div>`;
}

/* ---------- iletişim şeridi ---------- */

function ctaBand(site) {
  return `<section class="cta">
  <div class="wrap cta__in">
    <div>
      <p class="eyebrow"><span class="dot"></span> ÜCRETSİZ KEŞİF</p>
      <h2>Projenizi konuşalım.</h2>
      <p class="cta__lead">Keşif ve ön fiyatlandırma ücretsizdir. Arayın, aynı gün dönüş yapalım.</p>
    </div>
    <div class="cta__actions">
      ${site.brand.phones.map((p) => `<a class="cta__phone" href="tel:${p.tel}"><b>${esc(p.number)}</b><span>${esc(p.label)}</span></a>`).join('')}
      <a class="btn btn--primary btn--full" href="/iletisim/">Teklif Formu</a>
    </div>
  </div>
</section>`;
}

/* ---------- sayfa iskeleti ---------- */

export function layout({ site, title, description, url, image, body, current, jsonLd, bodyClass = '' }) {
  const canonical = SITE_URL + url;
  const ogImage = SITE_URL + (image || site.brand.logo);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<meta name="theme-color" content="#070b10" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Kıbrıs Altyapı" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:locale" content="tr_TR" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%23f0a72c'/><path d='M16 4l5 9h-10zM16 13v10M11 23h10l-5 5z' stroke='%23070b10' stroke-width='2.2' fill='none' stroke-linejoin='round'/></svg>" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/src/style.css" />
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body class="${bodyClass}">
${nav(site, current)}
<main id="top">
${body}
${ctaBand(site)}
</main>
${footer(site)}
<script type="module" src="/src/main.js"></script>
</body>
</html>`;
}

/* ---------- sayfa başlığı (iç sayfalar) ---------- */

export function pageHead({ eyebrow, title, lead, crumbs = [], image }) {
  const crumb = crumbs.length
    ? `<nav class="crumbs" aria-label="Site haritası">
        <a href="/">Anasayfa</a>${crumbs.map((c) =>
      c.url ? `<span>/</span><a href="${c.url}">${esc(c.title)}</a>`
        : `<span>/</span><b>${esc(c.title)}</b>`).join('')}
      </nav>` : '';

  return `<section class="phead${image ? ' phead--img' : ''}">
  ${image ? `<div class="phead__bg"><img src="${image.full}" alt="${esc(image.alt || title)}" width="1400" height="900" /></div>` : ''}
  <div class="wrap phead__in">
    ${crumb}
    ${eyebrow ? `<p class="eyebrow"><span class="dot"></span> ${esc(eyebrow)}</p>` : ''}
    <h1>${esc(title)}</h1>
    ${lead ? `<p class="phead__lead">${esc(lead)}</p>` : ''}
  </div>
</section>`;
}

/* ---------- yazı sayfası (hizmet / bölge / blog) ---------- */

export function articlePage(site, item, { kind, siblings, listUrl, listTitle }) {
  const related = siblings.filter((s) => s.slug !== item.slug).slice(0, 6);

  const body = `
${pageHead({
    eyebrow: listTitle.toUpperCase(),
    title: item.title,
    lead: item.summary,
    crumbs: [{ title: listTitle, url: listUrl }, { title: item.title }],
    image: item.image,
  })}

<div class="wrap article">
  <article class="article__body">
    ${item.body}
  </article>

  <aside class="article__side">
    <div class="side-card side-card--call">
      <h3>Hemen bilgi alın</h3>
      <p>Keşif ve fiyatlandırma ücretsizdir.</p>
      ${site.brand.phones.map((p) => `<a class="side-phone" href="tel:${p.tel}"><b>${esc(p.number)}</b><span>${esc(p.label)}</span></a>`).join('')}
      <a class="btn btn--primary btn--full" href="/iletisim/">Teklif İste</a>
    </div>

    <div class="side-card">
      <h3>${listTitle}</h3>
      <ul class="side-list">
        ${siblings.map((s) => `<li><a href="${s.url}"${s.slug === item.slug ? ' class="is-active"' : ''}>${esc(s.title)}</a></li>`).join('')}
      </ul>
    </div>
  </aside>
</div>

${related.length ? `<section class="section">
  <div class="wrap">
    <header class="section__head">
      <p class="eyebrow"><span class="dot"></span> İLGİLİ İÇERİKLER</p>
      <h2>Bunlar da ilginizi çekebilir</h2>
    </header>
    ${grid(related, kind)}
  </div>
</section>` : ''}`;

  return layout({
    site,
    title: `${item.title} | Kıbrıs Altyapı`,
    description: item.summary.slice(0, 158),
    url: item.url,
    image: item.image?.full,
    current: item.url,
    body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': kind === 'blog' ? 'BlogPosting' : 'Service',
      name: item.title,
      headline: item.title,
      description: item.summary,
      url: SITE_URL + item.url,
      image: item.image ? SITE_URL + item.image.full : undefined,
      datePublished: item.date,
      provider: {
        '@type': 'LocalBusiness',
        name: 'Kıbrıs Altyapı',
        telephone: site.brand.phones[0].tel,
        address: site.brand.address,
      },
    },
  });
}

/* ---------- liste sayfası ---------- */

export function listPage(site, { title, eyebrow, lead, items, kind, url, intro }) {
  const body = `
${pageHead({ eyebrow, title, lead, crumbs: [{ title }] })}
<section class="section section--top">
  <div class="wrap">
    ${intro ? `<div class="prose prose--intro">${intro}</div>` : ''}
    ${grid(items, kind)}
  </div>
</section>`;

  return layout({
    site, title: `${title} | Kıbrıs Altyapı`,
    description: lead, url, current: url, body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: title,
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem', position: i + 1,
        name: it.title, url: SITE_URL + it.url,
      })),
    },
  });
}

export { esc };
