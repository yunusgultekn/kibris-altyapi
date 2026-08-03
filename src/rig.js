/* ============================================================
   3B Sondaj Kulesi — Three.js
   Hazır model dosyası yok; tüm geometri kod içinde üretilir.
   ============================================================ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const UP = new THREE.Vector3(0, 1, 0);
const DEG = Math.PI / 180;

/* ---------- yardımcılar ---------- */

// İki nokta arasına silindirik profil (kule dikmeleri / çaprazları)
function strut(ax, ay, az, bx, by, bz, r, seg = 6) {
  const a = new THREE.Vector3(ax, ay, az);
  const b = new THREE.Vector3(bx, by, bz);
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, false);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  g.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
      q,
      new THREE.Vector3(1, 1, 1)
    )
  );
  return g;
}

function boxAt(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

// Yumuşak kenarlı ışık lekesi dokusu (sprite'lar için)
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- yer katmanları (kesitli) ---------- */

const STRATA = [
  { name: 'Üst toprak', h: 0.42, color: 0x6d5335, rough: 0.98 },
  { name: 'Kil',        h: 0.68, color: 0x7d4f28, rough: 0.95 },
  { name: 'Kum-çakıl',  h: 0.52, color: 0x9a8455, rough: 0.92 },
  { name: 'Kireçtaşı',  h: 0.95, color: 0x5b6470, rough: 0.85 },
  { name: 'Akifer',     h: 0.5,  color: 0x1d6e93, rough: 0.35, emissive: 0x0c3c52 },
  { name: 'Ana kaya',   h: 1.15, color: 0x333b45, rough: 0.9  },
];

const R_GROUND = 3.7;
const CUT_START = 108 * DEG;   // dolu kısmın başlangıcı
const CUT_LEN = 264 * DEG;     // dolu kısmın açısı (96°'lik dilim boş)

function buildGround(env) {
  const group = new THREE.Group();
  let top = 0;

  STRATA.forEach((s, i) => {
    const yTop = top;
    const yBot = top - s.h;
    const yMid = (yTop + yBot) / 2;

    const mat = new THREE.MeshStandardMaterial({
      color: s.color,
      roughness: s.rough,
      metalness: 0.02,
      side: THREE.DoubleSide,
      emissive: s.emissive ?? 0x000000,
      emissiveIntensity: s.emissive ? 0.9 : 0,
      envMapIntensity: 0.35,
    });

    const parts = [];

    // dış yüzey (dilimli silindir)
    parts.push(
      new THREE.CylinderGeometry(R_GROUND, R_GROUND, s.h, 72, 1, true, CUT_START, CUT_LEN)
        .translate(0, yMid, 0)
    );

    // kesit duvarları (dilimin iki radyal yüzü)
    [CUT_START, CUT_START + CUT_LEN].forEach((ang) => {
      const w = new THREE.PlaneGeometry(R_GROUND, s.h);
      w.rotateY(-ang);
      w.translate(Math.cos(ang) * R_GROUND * 0.5, yMid, Math.sin(ang) * R_GROUND * 0.5);
      parts.push(w);
    });

    // en üst katman için zemin yüzeyi
    if (i === 0) {
      const cap = new THREE.CircleGeometry(R_GROUND, 72, CUT_START, CUT_LEN);
      cap.rotateX(-Math.PI / 2);
      cap.translate(0, yTop, 0);
      parts.push(cap);
    }

    const mesh = new THREE.Mesh(mergeGeometries(parts, false), mat);
    mesh.receiveShadow = true;
    mesh.castShadow = i === 0;
    group.add(mesh);

    top = yBot;
  });

  // kuyu deliği (içi görünen karanlık boşluk)
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x0b0f14, roughness: 1, metalness: 0, side: THREE.BackSide,
  });
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.33, 4.4, 24, 1, true),
    holeMat
  );
  hole.position.y = -2.15;
  group.add(hole);

  // yüzeydeki muhafaza bileziği
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.075, 10, 32),
    new THREE.MeshStandardMaterial({ color: 0xb9c0ca, metalness: 0.95, roughness: 0.3, envMap: env })
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.03;
  collar.castShadow = true;
  group.add(collar);

  return group;
}

/* ---------- kule ---------- */

const Y_BASE = 0.5;
const Y_TOP = 7.6;
const W_BASE = 1.42;
const W_TOP = 0.42;
const LEVELS = 7;

const halfAt = (y) =>
  THREE.MathUtils.lerp(W_BASE, W_TOP, (y - Y_BASE) / (Y_TOP - Y_BASE));

const cornerAt = (i, y) => {
  const w = halfAt(y);
  const sx = i === 0 || i === 3 ? 1 : -1;
  const sz = i === 0 || i === 1 ? 1 : -1;
  return [sx * w, y, sz * w];
};

function buildDerrick(steelMat, paintMat) {
  const group = new THREE.Group();
  const frame = [];

  // ana dikmeler
  for (let i = 0; i < 4; i++) {
    const a = cornerAt(i, Y_BASE);
    const b = cornerAt(i, Y_TOP);
    frame.push(strut(a[0], a[1], a[2], b[0], b[1], b[2], 0.072, 8));
  }

  const ys = [];
  for (let l = 0; l <= LEVELS; l++) {
    ys.push(THREE.MathUtils.lerp(Y_BASE, Y_TOP, l / LEVELS));
  }

  // yatay kuşaklar
  ys.forEach((y) => {
    for (let i = 0; i < 4; i++) {
      const a = cornerAt(i, y);
      const b = cornerAt((i + 1) % 4, y);
      frame.push(strut(a[0], a[1], a[2], b[0], b[1], b[2], 0.042, 6));
    }
  });

  // çapraz bağlantılar (her yüzde X)
  for (let l = 0; l < LEVELS; l++) {
    const y0 = ys[l];
    const y1 = ys[l + 1];
    for (let i = 0; i < 4; i++) {
      const a0 = cornerAt(i, y0);
      const b0 = cornerAt((i + 1) % 4, y0);
      const a1 = cornerAt(i, y1);
      const b1 = cornerAt((i + 1) % 4, y1);
      frame.push(strut(a0[0], a0[1], a0[2], b1[0], b1[1], b1[2], 0.033, 5));
      frame.push(strut(b0[0], b0[1], b0[2], a1[0], a1[1], a1[2], 0.033, 5));
    }
  }

  const frameMesh = new THREE.Mesh(mergeGeometries(frame, false), steelMat);
  frameMesh.castShadow = true;
  group.add(frameMesh);

  // ara çalışma platformu (monkey board)
  const board = new THREE.Mesh(
    boxAt(halfAt(4.6) * 1.85, 0.07, 0.5, 0, 4.6, halfAt(4.6) + 0.14),
    paintMat
  );
  board.castShadow = true;
  group.add(board);

  // taç blok
  const crown = [];
  crown.push(boxAt(W_TOP * 2.5, 0.16, W_TOP * 2.5, 0, Y_TOP + 0.12, 0));
  crown.push(boxAt(W_TOP * 2.1, 0.4, 0.14, 0, Y_TOP + 0.4, 0.34));
  crown.push(boxAt(W_TOP * 2.1, 0.4, 0.14, 0, Y_TOP + 0.4, -0.34));
  const crownMesh = new THREE.Mesh(mergeGeometries(crown, false), paintMat);
  crownMesh.castShadow = true;
  group.add(crownMesh);

  // taç blok makaraları
  const sheave = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.06, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x9aa3ae, metalness: 0.95, roughness: 0.28 })
  );
  sheave.rotation.y = Math.PI / 2;
  sheave.position.set(0, Y_TOP + 0.4, 0);
  group.add(sheave);

  return group;
}

/* ---------- toz / kırıntı parçacıkları ---------- */

class Dust {
  constructor(count, opts) {
    this.count = count;
    this.o = opts;
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    this.max = new Float32Array(count);

    for (let i = 0; i < count; i++) this.spawn(i, Math.random() * opts.life);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));

    this.material = new THREE.PointsMaterial({
      size: opts.size,
      map: opts.map,
      color: opts.color,
      transparent: true,
      opacity: opts.opacity ?? 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
  }

  spawn(i, t = 0) {
    const o = this.o;
    const a = Math.random() * Math.PI * 2;
    const r = o.radius * (0.4 + Math.random() * 0.6);
    this.pos[i * 3] = Math.cos(a) * r + o.origin.x;
    this.pos[i * 3 + 1] = o.origin.y + (Math.random() - 0.5) * 0.1;
    this.pos[i * 3 + 2] = Math.sin(a) * r + o.origin.z;
    this.vel[i * 3] = Math.cos(a) * o.spread * (0.5 + Math.random());
    this.vel[i * 3 + 1] = o.rise * (0.6 + Math.random() * 0.8);
    this.vel[i * 3 + 2] = Math.sin(a) * o.spread * (0.5 + Math.random());
    this.max[i] = o.life * (0.6 + Math.random() * 0.7);
    this.life[i] = t;
  }

  update(dt) {
    const o = this.o;
    for (let i = 0; i < this.count; i++) {
      this.life[i] += dt;
      if (this.life[i] > this.max[i]) {
        this.spawn(i);
        continue;
      }
      this.vel[i * 3 + 1] += o.gravity * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

/* ---------- ana kurulum ---------- */

export function initRig(canvas, { onReady } = {}) {
  if (!canvas) return null;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 820px)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    return null;
  }
  if (!renderer.getContext()) return null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.6 : 2));
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 160);
  const camBase = new THREE.Vector3(10.2, 6.9, 19.8);
  camera.position.copy(camBase);

  // ortam yansımaları (metal parlaklığı için)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  /* --- ışıklar --- */
  const hemi = new THREE.HemisphereLight(0x8fb4dd, 0x1a1208, 0.6);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff1d6, 3.3);
  key.position.set(6.5, 13, 7.5);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.03;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x63b0ff, 2.1);
  rim.position.set(-9, 5, -7);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffb648, 0.6);
  fill.position.set(-4, 2, 8);
  scene.add(fill);

  // sondaj noktası kıvılcım ışığı
  const bitLight = new THREE.PointLight(0xffa42a, 9, 6, 2);
  bitLight.position.set(0, 0.72, 0);
  scene.add(bitLight);

  // akifer parıltısı
  const aquaLight = new THREE.PointLight(0x39c4f5, 6, 5, 2);
  aquaLight.position.set(0, -2.8, 0.4);
  scene.add(aquaLight);

  /* --- malzemeler --- */
  const steel = new THREE.MeshStandardMaterial({
    color: 0xb2bccb, metalness: 0.92, roughness: 0.3, envMapIntensity: 1.4,
  });
  const paint = new THREE.MeshStandardMaterial({
    color: 0xf0a72c, metalness: 0.5, roughness: 0.38, envMapIntensity: 0.9,
  });
  const darkSteel = new THREE.MeshStandardMaterial({
    color: 0x3d4653, metalness: 0.85, roughness: 0.5, envMapIntensity: 0.8,
  });
  const polished = new THREE.MeshStandardMaterial({
    color: 0xc8d0da, metalness: 1, roughness: 0.18, envMapIntensity: 1.4,
  });

  /* --- sahne kökü --- */
  const root = new THREE.Group();
  scene.add(root);

  root.add(buildGround(envRT.texture));
  root.add(buildDerrick(steel, paint));

  /* --- şase / platform --- */
  // Ortası açık şase: kuyu ağzı ve toz bulutu görünür kalsın
  const deckParts = [
    boxAt(3.5, 0.16, 1.05, 0, 0.42, 1.22),
    boxAt(3.5, 0.16, 1.05, 0, 0.42, -1.22),
    boxAt(1.05, 0.16, 1.4, 1.22, 0.42, 0),
    boxAt(1.05, 0.16, 1.4, -1.22, 0.42, 0),
    boxAt(3.9, 0.14, 0.3, 0, 0.28, 1.7),
    boxAt(3.9, 0.14, 0.3, 0, 0.28, -1.7),
    boxAt(0.3, 0.14, 3.9, 1.7, 0.28, 0),
    boxAt(0.3, 0.14, 3.9, -1.7, 0.28, 0),
  ];
  const deck = new THREE.Mesh(mergeGeometries(deckParts, false), darkSteel);
  deck.castShadow = true;
  deck.receiveShadow = true;
  root.add(deck);

  // yan ekipman: çamur tankı + boru rafı
  const rigYard = new THREE.Group();
  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 1.5, 20),
    darkSteel
  );
  tank.rotation.z = Math.PI / 2;
  tank.position.set(-2.75, 0.55, 1.25);
  tank.castShadow = true;
  rigYard.add(tank);

  const rack = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const p = new THREE.CylinderGeometry(0.075, 0.075, 2.4, 10);
      p.rotateX(Math.PI / 2);
      p.translate(2.65 + c * 0.18, 0.28 + r * 0.17, -1.1);
      rack.push(p);
    }
  }
  const pipes = new THREE.Mesh(mergeGeometries(rack, false), steel);
  pipes.castShadow = true;
  rigYard.add(pipes);
  root.add(rigYard);

  // döner tabla
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.68, 0.18, 28),
    paint
  );
  table.position.y = 0.58;
  table.castShadow = true;
  root.add(table);

  /* --- hareketli blok + halatlar --- */
  const block = new THREE.Group();
  const blockBody = new THREE.Mesh(boxAt(0.46, 0.62, 0.46, 0, 0, 0), paint);
  blockBody.castShadow = true;
  block.add(blockBody);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.045, 8, 16), polished);
  hook.position.y = -0.42;
  block.add(hook);
  block.position.y = 6.4;
  root.add(block);

  const lineMat = new THREE.MeshStandardMaterial({ color: 0x6b7480, metalness: 0.9, roughness: 0.45 });
  const lines = new THREE.Group();
  [-0.16, 0.16].forEach((x) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 5), lineMat);
    l.position.x = x;
    lines.add(l);
  });
  root.add(lines);

  // Halatlar taç bloktan hareketli bloğa gerilir
  const layoutLines = () => {
    const len = Math.max(0.1, Y_TOP + 0.4 - (block.position.y + 0.31));
    lines.position.set(0, block.position.y + 0.31 + len / 2, 0);
    lines.children.forEach((l) => { l.scale.y = len; });
  };
  layoutLines();

  /* --- dönen tij takımı --- */
  const string = new THREE.Group();

  const swivel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.32, 14), polished);
  swivel.position.y = 4.82;
  string.add(swivel);

  const kelly = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 4.2, 6), paint);
  kelly.position.y = 2.7;
  kelly.castShadow = true;
  string.add(kelly);

  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.95, 14), polished);
  pipe.position.y = -1.08;
  pipe.castShadow = true;
  string.add(pipe);

  // tij ekleme muflarını temsil eden bilezikler
  [-0.2, -1.05, -1.9, -2.7].forEach((y) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.15, 14), darkSteel);
    c.position.y = y;
    string.add(c);
  });

  // matkap ucu (tricone)
  const bit = new THREE.Group();
  const bitBody = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.3, 16), darkSteel);
  bit.add(bitBody);
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: 0xd9c27a, metalness: 0.9, roughness: 0.42 })
    );
    const a = (i / 3) * Math.PI * 2;
    cone.position.set(Math.cos(a) * 0.11, -0.2, Math.sin(a) * 0.11);
    cone.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
    cone.rotation.x = Math.PI;
    cone.rotation.z = 0.35 * Math.cos(a);
    bit.add(cone);
  }
  bit.position.y = -3.2;
  string.add(bit);

  root.add(string);

  /* --- yüzey halkaları (enerji dalgası) --- */
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf0a72c, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const rings = [0, 1].map((i) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 48), ringMat.clone());
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    m.userData.offset = i * 0.5;
    root.add(m);
    return m;
  });

  /* --- parçacıklar --- */
  const gtex = glowTexture();

  const dustSurface = new Dust(mobile ? 90 : 170, {
    origin: new THREE.Vector3(0, 0.62, 0),
    radius: 0.5, spread: 0.6, rise: 1.3, gravity: -0.8,
    life: 2.1, size: 0.28, color: 0xf6c988, opacity: 0.72, map: gtex,
  });
  root.add(dustSurface.points);

  const dustBit = new Dust(mobile ? 40 : 80, {
    origin: new THREE.Vector3(0, -3.3, 0),
    radius: 0.22, spread: 0.22, rise: 0.75, gravity: -0.25,
    life: 1.6, size: 0.13, color: 0x63d5ff, opacity: 0.55, map: gtex,
  });
  root.add(dustBit.points);

  // sondaj noktası parlaması
  const flare = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: gtex, color: 0xffb03a, transparent: true,
      opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  flare.scale.set(2.2, 2.2, 1);
  flare.position.set(0, 0.68, 0);
  root.add(flare);

  const aquaFlare = flare.clone();
  aquaFlare.material = flare.material.clone();
  aquaFlare.material.color.set(0x3fc9ff);
  aquaFlare.material.opacity = 0.4;
  aquaFlare.scale.set(2.6, 1.5, 1);
  aquaFlare.position.set(0.5, -2.8, 1.5);
  root.add(aquaFlare);

  /* --- etkileşim --- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointerMove = (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  /* --- boyutlandırma --- */
  const target = new THREE.Vector3(0, 2.15, 0);

  function resize() {
    const el = canvas.parentElement;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const ratio = w / h;
    const desktop = window.innerWidth > 820;

    if (desktop) {
      // Kule sağ tarafa kaysın, solda metne yer kalsın.
      // Kaydırma miktarı, kulenin ekranın ~%66'sında durmasına göre hesaplanır.
      target.x = -THREE.MathUtils.clamp(2.9 * ratio, 2.4, 5.8);
      target.y = 2.15;
      camera.fov = 36;
      root.scale.setScalar(1);
    } else {
      // Mobilde metnin arkasında, sağ üst köşeye yerleşen arka plan öğesi.
      // Hedefi sola/aşağı almak kuleyi ekranda sağ üste taşır.
      // Ölçek en/boy oranına bağlı: kule her cihazda ekran genişliğinin
      // ~%38'ini kaplasın, tablette orantısız büyümesin.
      const s = THREE.MathUtils.clamp(0.83 * ratio, 0.3, 0.6);
      camera.fov = 40;
      root.scale.setScalar(s);
      target.x = -4.3 * ratio;
      target.y = 1.9 * s - 5.0;
    }
    camera.updateProjectionMatrix();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  resize();

  /* --- görünürlük (ekran dışında render etme) --- */
  let visible = true;
  const io = new IntersectionObserver(
    ([e]) => { visible = e.isIntersecting; },
    { threshold: 0 }
  );
  io.observe(canvas.parentElement);

  const onVis = () => { visible = !document.hidden && visible; };
  document.addEventListener('visibilitychange', onVis);

  /* --- döngü --- */
  const clock = new THREE.Clock();
  let raf = 0;
  let intro = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!visible || document.hidden) return;

    intro = Math.min(1, intro + dt * 0.55);
    const ease = 1 - Math.pow(1 - intro, 3);

    if (!reduced) {
      // tij takımı dönüşü
      string.rotation.y -= dt * 3.4;
      table.rotation.y -= dt * 3.4;

      // blok ve tij takımının yavaş inip kalkması
      const bob = Math.sin(t * 0.42) * 0.34;
      block.position.y = 6.4 + bob;
      string.position.y = bob;

      // halatlar taç bloktan makaraya
      layoutLines();

      // parçacıklar
      dustSurface.update(dt);
      dustBit.update(dt);

      // yüzey halkaları
      rings.forEach((r, i) => {
        const p = ((t * 0.42 + r.userData.offset) % 1);
        const s = 0.6 + p * 5.2;
        r.scale.setScalar(s);
        r.material.opacity = 0.34 * (1 - p) * ease;
      });

      // ışık titreşimi
      const flick = 0.85 + Math.sin(t * 21) * 0.09 + Math.sin(t * 7.3) * 0.06;
      bitLight.intensity = 9 * flick;
      flare.material.opacity = 0.42 * flick * ease;
      flare.scale.setScalar(2.0 + Math.sin(t * 5.1) * 0.18);
      aquaLight.intensity = 5 + Math.sin(t * 1.7) * 1.4;

      // gövde salınımı + imleç etkisi
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2.6);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2.6);
      root.rotation.y = Math.sin(t * 0.13) * 0.1 + pointer.x * 0.22;
    }

    // giriş animasyonu + kamera parallaksı
    camera.position.set(
      camBase.x + pointer.x * 0.9,
      camBase.y - pointer.y * 0.7 + (1 - ease) * 2.2,
      camBase.z + (1 - ease) * 5.5
    );
    camera.lookAt(target);

    renderer.render(scene, camera);
  }

  frame();

  // ilk kare çizildikten sonra hazır sinyali
  requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()));

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
