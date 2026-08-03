# Kıbrıs Altyapı — Tanıtım Sitesi

Sondaj ve altyapı firması için tek sayfalık (one-page) tanıtım sitesi.
Ana sayfada marka kimliğinin yanında **Three.js ile kod içinde üretilen 3B sondaj kulesi animasyonu** yer alır.

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

Çıktı `dist/` klasörüne düşer; Netlify, Vercel, cPanel gibi herhangi bir statik
sunucuya olduğu gibi yüklenebilir. Yerelde önizlemek için `npm run preview`.

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
index.html        Sayfa iskeleti ve tüm metinler
src/main.js       Menü, kaydırma animasyonları, sayaçlar, form
src/rig.js        Three.js sahnesi (3B sondaj kulesi)
src/style.css     Tüm stiller
```

## Yayına almadan önce değiştirilmesi gerekenler

Aşağıdaki bilgiler **örnek/placeholder** olarak girildi, kendi bilgilerinizle
değiştirin:

| Ne | Nerede |
| --- | --- |
| Telefon `+90 533 000 00 00` | [index.html](index.html) — İletişim bölümü |
| E-posta `info@kibrisaltyapi.com` | [index.html](index.html) ve [src/main.js](src/main.js) (form) |
| Adres `Sanayi Bölgesi, Lefkoşa` | [index.html](index.html) |
| İstatistikler (22+ yıl, 850+ kuyu, 300 m) | [index.html](index.html) — `data-count` alanları |
| Hizmet açıklamaları, teknik tablo değerleri | [index.html](index.html) |

### Form hakkında

Sitede sunucu tarafı yok. Teklif formu, doldurulan bilgileri hazır bir e-posta
taslağına dönüştürüp kullanıcının e-posta uygulamasını açar (`mailto:`).
Formun doğrudan size ulaşmasını istiyorsanız Formspree / Netlify Forms gibi bir
servise ya da kendi backend'inize bağlamanız gerekir —
[src/main.js](src/main.js) içindeki `teklifForm` submit bölümü değiştirilecek yerdir.

### Marka renkleri

[src/style.css](src/style.css) en üstteki `:root` bloğunda tanımlı.
`--amber` ana vurgu rengi, `--bg` koyu zemin.
