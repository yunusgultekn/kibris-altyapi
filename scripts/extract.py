#!/usr/bin/env python3
"""
kibrisaltyapi.com.tr WordPress REST çıktısını temiz içerik JSON'una dönüştürür.

content/raw/*.json  ->  content/site.json

Elementor sarmalayıcı div'leri atılır; sadece anlamlı metin etiketleri
(p, h2-h4, ul/ol/li, b/strong, i/em, br) korunur.
"""

import json
import glob
import re
import html
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'content' / 'raw'
OUT = ROOT / 'content' / 'site.json'

KEEP = {'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'br'}
SKIP_CONTENT = {'script', 'style', 'noscript', 'svg'}

CATEGORIES = {1: 'hizmet', 28: 'bolge', 27: 'blog'}


BLOCK = {'p', 'h2', 'h3', 'h4', 'li'}


class Cleaner(HTMLParser):
    """Elementor HTML'inden sade içerik HTML'i üretir."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.skip_depth = 0
        self.open_blocks = []

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_CONTENT:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return
        if tag in KEEP:
            if tag in BLOCK:
                self.open_blocks.append(tag)
            self.out.append(f'<{tag}>')

    def handle_endtag(self, tag):
        if tag in SKIP_CONTENT:
            self.skip_depth = max(0, self.skip_depth - 1)
            return
        if self.skip_depth:
            return
        if tag in KEEP and tag != 'br':
            if tag in BLOCK and tag in self.open_blocks:
                self.open_blocks.remove(tag)
            self.out.append(f'</{tag}>')

    def handle_data(self, data):
        if self.skip_depth:
            return
        if data.strip():
            text = html.escape(data, quote=False)
            # Blok etiketi dışında kalan başıboş metni paragrafa sar
            if self.open_blocks:
                self.out.append(text)
            else:
                self.out.append(f'<p>{text}</p>')
        elif self.out and not self.out[-1].endswith(' '):
            self.out.append(' ')

    def result(self):
        s = ''.join(self.out)
        s = re.sub(r'\s+', ' ', s)
        # boş kalan etiketleri temizle
        for _ in range(4):
            s = re.sub(r'<(p|h2|h3|h4|ul|ol|li|b|strong|i|em)>\s*</\1>', '', s)
        s = re.sub(r'>\s+<', '><', s)
        return s.strip()


BOLD_ONLY = re.compile(r'<p>\s*<(b|strong)>(.*?)</\1>\s*</p>', re.S)


def promote_headings(s):
    """Kaynak sitede başlıklar <p><b>…</b></p> olarak yazılmış; h2'ye çevir."""
    def repl(m):
        text = m.group(2).strip()
        if not text or len(text) > 120 or '<' in text:
            return m.group(0)
        return f'<h2>{text}</h2>'
    return BOLD_ONLY.sub(repl, s)


def clean_html(raw):
    c = Cleaner()
    c.feed(raw or '')
    c.close()
    return promote_headings(c.result())


def plain_text(raw, limit=None):
    txt = re.sub(r'<[^>]+>', ' ', raw or '')
    txt = html.unescape(txt)
    txt = re.sub(r'\s+', ' ', txt).strip()
    if limit and len(txt) > limit:
        cut = txt[:limit].rsplit(' ', 1)[0]
        txt = cut + '…'
    return txt


def load_all(pattern):
    items = []
    for f in sorted(RAW.glob(pattern)):
        data = json.loads(f.read_text())
        if isinstance(data, list):
            items += data
    return items


def main():
    media = {m['id']: m for m in json.loads((RAW / 'media.json').read_text())}

    def webp(src):
        """Orijinal dosya adını optimize edilmiş webp adına çevirir."""
        stem = src.rsplit('/', 1)[-1].rsplit('.', 1)[0]
        return {'full': f'/img/full/{stem}.webp', 'card': f'/img/card/{stem}.webp'}

    def image_for(mid, alt=''):
        m = media.get(mid)
        if not m:
            return None
        src = m.get('source_url', '')
        d = m.get('media_details') or {}
        return {
            **webp(src),
            'alt': plain_text(m.get('alt_text') or '') or alt,
            'w': d.get('width'),
            'h': d.get('height'),
        }

    posts = load_all('posts_*.json')
    pages = load_all('pages_*.json')

    buckets = {'hizmet': [], 'bolge': [], 'blog': []}
    for p in posts:
        kind = CATEGORIES.get((p.get('categories') or [0])[0])
        if not kind:
            continue
        title = plain_text(p['title']['rendered'])
        buckets[kind].append({
            'slug': p['slug'],
            'url': f"/{p['slug']}/",
            'title': title,
            'date': p['date'][:10],
            'image': image_for(p.get('featured_media'), title),
            'summary': plain_text(p.get('excerpt', {}).get('rendered', '')
                                  or p['content']['rendered'], 185),
            'body': clean_html(p['content']['rendered']),
        })

    for k in buckets:
        buckets[k].sort(key=lambda x: x['title'])

    # hizmetlerimiz / bolge / blog / galeri sayfalarının gövdesi Elementor'un
    # arşiv döngüsü — aynı yazıların tekrarı. İçerik olarak kullanılmaz.
    ARCHIVE_PAGES = {'hizmetlerimiz', 'bolge', 'blog', 'galeri', 'iletisim'}

    site_pages = {}
    for pg in pages:
        slug = pg['slug']
        if slug in ARCHIVE_PAGES:
            continue
        title = plain_text(pg['title']['rendered'])
        body = clean_html(pg['content']['rendered'])
        # Baştaki, sayfa adını tekrarlayan başıboş paragrafı at
        body = re.sub(r'^<p>\s*' + re.escape(title) + r'\s*</p>', '', body,
                      flags=re.I)
        site_pages[slug] = {'title': title, 'body': body}

    gallery = []
    for m in media.values():
        src = m.get('source_url', '')
        if not src.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        if 'logo' in src.lower():
            continue
        d = m.get('media_details') or {}
        gallery.append({
            **webp(src),
            'alt': plain_text(m.get('alt_text') or '') or 'Kıbrıs Altyapı saha çalışması',
            'w': d.get('width'),
            'h': d.get('height'),
        })
    gallery.sort(key=lambda g: g['full'])

    # Bölge ve blog yazılarının öne çıkan görseli yok; galeriden sırayla atanır
    pool = [g for g in gallery if (g.get('w') or 0) >= 700]
    if pool:
        i = 0
        for item in buckets['bolge'] + buckets['blog']:
            if not item['image']:
                g = pool[i % len(pool)]
                item['image'] = {**g, 'alt': item['title']}
                i += 1

    logo = next((m for m in media.values()
                 if 'cropped-Kibris-Alt-Yapi-Logosu.' in m.get('source_url', '')), None)

    out = {
        'source': 'https://kibrisaltyapi.com.tr',
        'brand': {
            'name': 'Kıbrıs Altyapı',
            'tagline': 'Kıbrıs’ın Altyapısında Uzman Dokunuş.',
            'intro': 'Kıbrıs genelinde altyapı, kuyu, beton kesim, yıkım ve teknik '
                     'uygulamalarda uzman ekip ve modern ekipmanla güvenli, hızlı ve '
                     'yönetmeliklere uygun profesyonel çözümler sunuyoruz.',
            'phones': [
                {'label': 'Mehmet Bey', 'number': '0533 843 93 33', 'tel': '+905338439333'},
                {'label': 'Meksel Bey', 'number': '0548 863 11 36', 'tel': '+905488631136'},
            ],
            'address': 'Harika Mahallesi, Azot Sokak No:8, Gazimağusa / Kıbrıs',
            'logo': webp(logo['source_url'])['full'] if logo else None,
            'logoPng': (webp(logo['source_url'])['full'].replace('.webp', '.png')
                        if logo else None),
        },
        'services': buckets['hizmet'],
        'regions': buckets['bolge'],
        'blog': buckets['blog'],
        'pages': site_pages,
        'gallery': gallery,
    }

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))

    print(f'hizmet : {len(out["services"])}')
    print(f'bölge  : {len(out["regions"])}')
    print(f'blog   : {len(out["blog"])}')
    print(f'sayfa  : {len(out["pages"])}  ({", ".join(out["pages"])})')
    print(f'galeri : {len(out["gallery"])} görsel')
    print(f'-> {OUT.relative_to(ROOT)}  ({OUT.stat().st_size // 1024} KB)')

    empty = [s['slug'] for s in buckets['hizmet'] + buckets['bolge'] + buckets['blog']
             if len(plain_text(s['body'])) < 200]
    if empty:
        print(f'UYARI: içeriği kısa/boş olanlar -> {empty}')


if __name__ == '__main__':
    main()
