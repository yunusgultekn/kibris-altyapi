#!/usr/bin/env python3
"""
Kaynak siteden indirilen ham görselleri web için hazırlar.

  public/img/_src/   ham dosyalar (git'te tutulmaz)
  public/img/full/   büyük görünüm  — en geniş kenar 1400px
  public/img/card/   kart/küçük     — en geniş kenar  760px

Çıktı WebP; logolar şeffaflığı koruyup PNG olarak da kopyalanır.
Kullanım:  python3 scripts/optimize-images.py
"""

from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public' / 'img' / '_src'
FULL = ROOT / 'public' / 'img' / 'full'
CARD = ROOT / 'public' / 'img' / 'card'

SIZES = [(FULL, 1400, 78), (CARD, 760, 74)]
EXTS = {'.jpg', '.jpeg', '.png', '.webp'}


def human(n):
    return f'{n / 1048576:.1f} MB' if n > 1048576 else f'{n / 1024:.0f} KB'


def main():
    for d, _, _ in SIZES:
        d.mkdir(parents=True, exist_ok=True)

    files = sorted(f for f in SRC.iterdir() if f.suffix.lower() in EXTS)
    src_bytes = sum(f.stat().st_size for f in files)
    out_bytes = 0
    n = 0

    for f in files:
        im = Image.open(f)
        im = ImageOps.exif_transpose(im)          # telefon fotoğraflarının yönü
        is_logo = 'logo' in f.name.lower()
        has_alpha = im.mode in ('RGBA', 'LA', 'P') and 'transparency' in im.info

        if not (is_logo or has_alpha):
            im = im.convert('RGB')

        for out_dir, box, quality in SIZES:
            copy = im.copy()
            copy.thumbnail((box, box), Image.LANCZOS)
            dst = out_dir / (f.stem + '.webp')
            copy.save(dst, 'WEBP', quality=quality, method=6)
            out_bytes += dst.stat().st_size

        # Logo ayrıca PNG olarak (favicon / e-posta imzası gibi yerler için)
        if is_logo:
            logo = im.copy()
            logo.thumbnail((760, 760), Image.LANCZOS)
            dst = FULL / (f.stem + '.png')
            logo.save(dst, 'PNG', optimize=True)
            out_bytes += dst.stat().st_size

        n += 1

    print(f'{n} görsel işlendi -> full/ + card/')
    print(f'ham çıktı : {human(src_bytes)}')
    print(f'web çıktı : {human(out_bytes)}  ({100 - out_bytes * 100 // src_bytes}% küçülme)')


if __name__ == '__main__':
    main()
