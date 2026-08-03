import './style.css';

/* ---------- 3B sahne ---------- */

const canvas = document.getElementById('rig');
const loader = document.getElementById('loader');

let loaderDone = false;
const hideLoader = () => {
  if (loaderDone) return;
  loaderDone = true;
  loader.classList.add('is-done');
  document.body.classList.add('is-ready');
};

// Three.js ayrı parça olarak yüklenir; sayfa beklemeden boyanır.
(async () => {
  try {
    const { initRig } = await import('./rig.js');
    const rig = initRig(canvas, { onReady: hideLoader });
    if (!rig) throw new Error('WebGL bağlamı oluşturulamadı');
    // sahne beklenenden uzun sürerse yine de perdeyi kaldır
    setTimeout(hideLoader, 4000);
  } catch (err) {
    console.warn('3B sahne devre dışı, CSS yedeğine geçiliyor:', err);
    canvas.hidden = true;
    document.getElementById('noWebgl').hidden = false;
    hideLoader();
  }
})();

/* ---------- menü ---------- */

const nav = document.getElementById('nav');
const navLinks = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  navToggle.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  document.body.style.overflow = open ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  })
);

const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- kaydırınca beliren bloklar ---------- */

const reveals = document.querySelectorAll('.reveal');
reveals.forEach((el, i) => {
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  el.style.setProperty('--d', `${siblings.indexOf(el) * 90}ms`);
});

const revealIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      // Görünür olan ya da üstte kalan (ani sıçramalarda atlanan) blokları göster
      if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -60px' }
);
reveals.forEach((el) => revealIO.observe(el));

/* ---------- sayaçlar ---------- */

const counters = document.querySelectorAll('[data-count]');
const runCounter = (el) => {
  const end = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const dur = 1600;
  const t0 = performance.now();

  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(end * eased).toLocaleString('tr-TR') + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const countIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        runCounter(e.target);
        countIO.unobserve(e.target);
      }
    });
  },
  { threshold: 0.6 }
);
counters.forEach((el) => countIO.observe(el));

/* ---------- teklif formu ---------- */

const form = document.getElementById('teklifForm');
const hint = document.getElementById('formHint');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const ad = (data.get('ad') || '').toString().trim();
  const tel = (data.get('tel') || '').toString().trim();

  const adEl = form.elements.ad;
  const telEl = form.elements.tel;
  adEl.classList.toggle('is-bad', !ad);
  telEl.classList.toggle('is-bad', tel.replace(/\D/g, '').length < 10);

  if (!ad || tel.replace(/\D/g, '').length < 10) {
    hint.textContent = 'Lütfen ad ve geçerli bir telefon numarası girin.';
    hint.classList.remove('is-ok');
    return;
  }

  // Backend yok: talep hazır bir e-posta taslağına dönüştürülür.
  const konu = `Teklif talebi — ${data.get('hizmet')}`;
  const govde = [
    `Ad Soyad: ${ad}`,
    `Telefon: ${tel}`,
    `Hizmet: ${data.get('hizmet')}`,
    '',
    `Notlar: ${(data.get('mesaj') || '').toString().trim() || '-'}`,
  ].join('\n');

  window.location.href =
    `mailto:info@kibrisaltyapi.com?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`;

  hint.textContent = 'Teşekkürler! E-posta uygulamanız talebinizle birlikte açılıyor.';
  hint.classList.add('is-ok');
});

form.querySelectorAll('input').forEach((el) =>
  el.addEventListener('input', () => el.classList.remove('is-bad'))
);

/* ---------- yıl ---------- */

document.getElementById('year').textContent = new Date().getFullYear();
