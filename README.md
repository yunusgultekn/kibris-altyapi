# Kıbrıs Altyapı — Kurumsal Site

Sondaj ve altyapı firması için **48 sayfalık** statik site.
İçerik (metinler, görseller, hizmet ve bölge sayfaları) mevcut
`kibrisaltyapi.com.tr` sitesinden alınmış; ana sayfada marka kimliğinin yanında
**Three.js ile kod içinde üretilen 3B sondaj kulesi animasyonu** yer alır.

**Sayfa dökümü:** ana sayfa · hakkımızda · 17 hizmet · 18 bölge · 6 blog yazısı ·
hizmet/bölge/blog listeleri · galeri · iletişim.

## Çalıştırma

```bash
npm install
```

```bash
npm run dev
```

Yayına hazır dosyalar için:

```bash
npm run build
```

Çıktı `dist/` klasörüne düşer (48 HTML + görseller, ~37 MB); Netlify, Vercel,
cPanel gibi herhangi bir statik sunucuya olduğu gibi yüklenebilir.
Yerelde önizlemek için `npm run preview`.

## Sayfalar nasıl üretiliyor?

HTML dosyaları **elle yazılmaz, üretilir**. Zincir şöyle:

```
content/raw/*.json     WordPress REST API'den çekilmiş ham veri
        ↓  scripts/extract.py
content/site.json      temizlenmiş içerik (tek kaynak)
        ↓  scripts/build-pages.mjs + scripts/templates.mjs
/hizmetlerimiz/index.html, /kibris-sondaj/index.html, ...
```

`npm run dev` ve `npm run build` bu adımı otomatik çalıştırır; `content/site.json`
ya da şablonlar değişince dev sunucusu sayfaları yeniden üretip tarayıcıyı
yeniler.

**Metin değiştirmek için** üretilen HTML'i değil `content/site.json`'ı düzenleyin —
aksi halde ilk `npm run dev` çalıştığında değişikliğiniz silinir. Üretilen
klasörler bu yüzden `.gitignore`'da.

Görseller `scripts/optimize-images.py` ile WebP'ye çevrilip iki boyutta
saklanır: `public/img/full` (sayfa içi) ve `public/img/card` (liste kartları).
Orijinaller `public/img/_src` altında ve git'e girmez.

## 3B animasyon nasıl yapıldı?

Hazır `.glb` / `.fbx` model dosyası **kullanılmadı**. Tüm geometri
[src/rig.js](src/rig.js) içinde prosedürel olarak üretiliyor:

- **Kule (derrick):** 4 ana dikme + yatay kuşaklar + her yüzde X çaprazlar.
  Yüzlerce silindir profil `mergeGeometries` ile tek bir mesh'e birleştirilir,
  böylece çizim çağrısı sayısı düşük kalır.
- **Yer kesiti:** 6 jeolojik katman (üst toprak, kil, kum-çakıl, kireçtaşı,
  akifer, ana kaya) dilimli silindir olarak üst üste dizilir; 96°'lik bir dilim
  boş bırakılıp kesit duvarları eklenerek "karot kesiti" görünümü elde edilir.
- **Hareket:** Tij takımı ve döner tabla sürekli döner, hareketli blok ve tij
  yavaşça inip kalkar, halatların boyu buna göre güncellenir.
- **Efektler:** Kuyu ağzında toz bulutu ve matkap ucunda kırıntı parçacıkları
  (custom `Dust` sınıfı), genişleyen enerji halkaları, akifer parıltısı,
  titreşen sondaj ışığı.
- **Işıklandırma:** ACES filmik ton eşlemesi, gölge haritası ve `RoomEnvironment`
  tabanlı ortam yansımaları (metal parlaklığı için).

Fare hareketiyle sahne hafifçe döner, kamera paralaks yapar.

**Yerleşim:** Masaüstünde kule sağ yarıda tam boy durur, metin solda kalır.
Mobil ve tablette ise küçültülüp sağ üst köşeye alınır ve metinlerin arkasında
arka plan öğesi olarak görünür; ölçek/konum ekran en-boy oranına göre
`src/rig.js` içindeki `resize()` fonksiyonunda hesaplanır.

### Performans ve erişilebilirlik

- Three.js ayrı bir parça olarak (`dynamic import`) yüklenir; sayfa 3B beklemeden boyanır.
- Kule ekrandan çıkınca ve sekme arka plana alınınca render durur.
- Mobilde piksel oranı, gölge çözünürlüğü ve parçacık sayısı otomatik düşürülür.
- `prefers-reduced-motion` açıksa animasyonlar durur, sahne sabit görüntülenir.
- WebGL desteklenmiyorsa CSS ile çizilmiş yedek kule silueti gösterilir.

## Dosya düzeni

```
content/raw/       WordPress API ham çıktısı (yeniden çekmeye gerek kalmasın diye)
content/site.json  Tüm site içeriği — metin değişiklikleri buradan
scripts/extract.py       ham veriyi temizleyip site.json üretir
scripts/build-pages.mjs  site.json'dan 48 HTML sayfası üretir
scripts/templates.mjs    ortak HTML şablonları (layout, kart, liste, makale)
scripts/optimize-images.py  görselleri WebP'ye çevirir
src/main.js        menü, kaydırma animasyonları, sayaçlar, form
src/rig.js         Three.js sahnesi (3B sondaj kulesi)
src/style.css      tüm stiller
public/img/        optimize edilmiş görseller
```

## Yayına almadan önce

- **İletişim bilgileri** `content/site.json` içindeki `brand` bölümünde
  (telefonlar, adres, e-posta). Kaynak siteden alındı, doğruluğunu teyit edin.
- **Alan adı** `scripts/templates.mjs` içindeki `SITE_URL` sabiti — canonical
  etiketleri, `og:url` ve `sitemap.xml` bundan üretiliyor. Şu an
  `https://kibrisaltyapi.com.tr` yazıyor; kendi alan adınızla değiştirin.
- **Form** sunucu tarafı yok; doldurulan bilgiler hazır bir e-posta taslağına
  çevrilip kullanıcının mail uygulamasını açar (`mailto:`). Doğrudan size
  ulaşması için Formspree / Netlify Forms gibi bir servise bağlanmalı —
  [src/main.js](src/main.js) içindeki `teklifForm` submit bölümü.

### İçerik telifi

Metinler ve görseller `kibrisaltyapi.com.tr` sitesinden alındı. Bu sitenin
sahibi siz değilseniz veya kullanım izniniz yoksa, yayına almadan önce içeriği
kendi metin ve fotoğraflarınızla değiştirin.

### Marka renkleri

[src/style.css](src/style.css) en üstteki `:root` bloğunda tanımlı.
`--amber` ana vurgu rengi, `--bg` koyu zemin.
