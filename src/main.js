import './style.css';

/* ---------- 3B sahne (yalnızca ana sayfada) ---------- */

const canvas = document.getElementById('rig');

if (canvas) {
  // Three.js ayrı parça olarak yüklenir; sayfa beklemeden boyanır.
  (async () => {
    try {
      const { initRig } = await import('./rig.js');
      if (!initRig(canvas)) throw new Error('WebGL bağlamı oluşturulamadı');
    } catch (err) {
      console.warn('3B sahne devre dışı, CSS yedeğine geçiliyor:', err);
      canvas.hidden = true;
      const fallback = document.getElementById('noWebgl');
      if (fallback) fallback.hidden = false;
    }
  })();
}

/* ---------- menü ---------- */

const nav = document.getElementById('nav');
const navLinks = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');

const closeNav = () => {
  navLinks.classList.remove('is-open');
  navToggle.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  navToggle.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  document.body.style.overflow = open ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));

// Mobilde açılır menüler dokunmayla açılsın
navLinks.querySelectorAll('.nav__drop > a').forEach((a) => {
  a.addEventListener('click', (e) => {
    if (window.innerWidth > 1080) return;
    const drop = a.parentElement;
    if (!drop.classList.contains('is-open')) {
      e.preventDefault();
      e.stopPropagation();
      navLinks.querySelectorAll('.nav__drop').forEach((d) => d.classList.remove('is-open'));
      drop.classList.add('is-open');
    }
  });
});

const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- kaydırınca beliren bloklar ---------- */

const reveals = document.querySelectorAll('.reveal, .tile, .section__head, .side-card');
reveals.forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.className === el.className);
  el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 5) * 80}ms`);
  el.classList.add('reveal');
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
  { threshold: 0.1, rootMargin: '0px 0px -50px' }
);
reveals.forEach((el) => revealIO.observe(el));

/* ---------- sayaçlar ---------- */

const countIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 1500);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('tr-TR') + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

/* ---------- teklif formu ---------- */

const form = document.getElementById('teklifForm');

if (form) {
  const hint = document.getElementById('formHint');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const ad = (data.get('ad') || '').toString().trim();
    const tel = (data.get('tel') || '').toString().trim();
    const digits = tel.replace(/\D/g, '');

    form.elements.ad.classList.toggle('is-bad', !ad);
    form.elements.tel.classList.toggle('is-bad', digits.length < 10);

    if (!ad || digits.length < 10) {
      hint.textContent = 'Lütfen ad ve geçerli bir telefon numarası girin.';
      hint.classList.remove('is-ok');
      return;
    }

    // Backend yok: talep WhatsApp mesajına dönüştürülür.
    const metin = [
      'Merhaba, siteden teklif talebi:',
      `Ad Soyad: ${ad}`,
      `Telefon: ${tel}`,
      `Hizmet: ${data.get('hizmet')}`,
      `Bölge: ${data.get('bolge')}`,
      `Notlar: ${(data.get('mesaj') || '').toString().trim() || '-'}`,
    ].join('\n');

    window.open(`https://wa.me/905338439333?text=${encodeURIComponent(metin)}`, '_blank', 'noopener');

    hint.textContent = 'Teşekkürler! Talebiniz WhatsApp üzerinden iletilmek üzere açıldı.';
    hint.classList.add('is-ok');
  });

  form.querySelectorAll('input').forEach((el) =>
    el.addEventListener('input', () => el.classList.remove('is-bad'))
  );
}

/* ---------- yıl ---------- */

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
