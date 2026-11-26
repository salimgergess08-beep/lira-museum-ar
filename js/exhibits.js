// Museum of the Lebanese Lira — exhibit content and 3D scenes.
// Edit the TEXT in EXHIBITS to change what plaques and the audio guide say.
// Each 3D scene is built in the image-target's coordinate space:
// the printed artwork is 1 unit wide (x: -0.5..0.5) and 1.333 units tall,
// and +z points out of the poster toward the visitor.

import * as THREE from 'three';

export const EXHIBITS = [
  {
    id: 1,
    period: '1920',
    title: 'The Birth of the Lira',
    plaque: 'After the First World War, the Banque de Syrie issued a new Syro-Lebanese pound tied to the French franc: one pound was worth 20 francs. The conventions of 1924 and 1937 renewed the bank’s right to issue the currency.',
    lesson: 'From day one, the lira’s value was borrowed from a foreign anchor.',
  },
  {
    id: 2,
    period: '1997 – 2019',
    title: 'The Peg',
    plaque: 'For more than two decades, the central bank held the lira at 1,507.5 per US dollar. The stability depended on a steady inflow of dollars, attracted by high interest rates on deposits.',
    lesson: 'A fixed rate is only as strong as the dollars behind it.',
  },
  {
    id: 3,
    period: '2019 – 2023',
    title: 'The Collapse',
    plaque: 'When dollar inflows stopped in 2019, the peg broke. The official rate moved from 1,507.5 to 15,000 in 2023 and then to 89,500. The lira lost about 98% of its value, and inflation peaked at 268.78% in April 2023.',
    lesson: 'When trust disappears, a currency can lose almost everything.',
  },
  {
    id: 4,
    period: '2026',
    title: 'Lebanon Today',
    plaque: 'The rate has held near 89,500 per dollar since mid-2023, but inflation is back near 17.5% and the economy is projected to shrink by 6.4% in 2026 after renewed conflict. The central bank holds about $11.4 billion in foreign reserves, and about 287 tons of gold worth $45–47 billion. Around $70 billion of banking losses are still unallocated.',
    lesson: 'Calm on the surface, but the foundations are still broken.',
  },
  {
    id: 5,
    period: '2026 – 2031',
    title: 'Our Roadmap',
    plaque: 'Phase 1, 2026–27: stop the bleeding — pass the financial gap and bank resolution laws, end central bank lending to the state, and allow a slow managed float. Phase 2, 2028–29: rebuild trust — an independent, audited central bank, an inflation target steered with interest rates, rebuilt reserves, and gold protected by law. Phase 3, 2030–31: a hard anchor, only if every condition is met.',
    lesson: 'Fix the foundations first, then lock in the anchor.',
  },
  {
    id: 6,
    period: '2031',
    title: 'The New Lira',
    plaque: 'Our vision for 2031: a New Lira worth 1,000 old pounds, backed by gold and reserves under a currency board. Five lights must turn green first: a unified exchange rate, single-digit inflation, rebuilt reserves, restructured banks, and repaid depositors.',
    lesson: 'There is no monetary shortcut to political discipline.',
  },
];

// ---------- shared helpers ----------

const GOLD = () => new THREE.MeshStandardMaterial({ color: 0xffc94a, metalness: 0.85, roughness: 0.25, envMapIntensity: 1.6, emissive: 0x3a2500, emissiveIntensity: 0.35 });
const SILVER = () => new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 1, roughness: 0.3 });
const MARBLE = () => new THREE.MeshStandardMaterial({ color: 0xf1ece2, metalness: 0, roughness: 0.55 });
const DARK = () => new THREE.MeshStandardMaterial({ color: 0x2a2421, metalness: 0.2, roughness: 0.6 });

const easeOut = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

// A text card rendered to a canvas texture. lines: [{text, size, color, weight}]
export function makeCard(lines, opts = {}) {
  const w = opts.px || 1024;
  const pad = opts.pad ?? 48;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = (l) => `${l.weight || 600} ${l.size || 64}px "Helvetica Neue", Arial, sans-serif`;
  // measure height with wrapping
  const wrapped = [];
  for (const l of lines) {
    ctx.font = font(l);
    const words = String(l.text).split(' ');
    let cur = '';
    for (const word of words) {
      const test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width > w - pad * 2 && cur) { wrapped.push({ ...l, text: cur }); cur = word; }
      else cur = test;
    }
    wrapped.push({ ...l, text: cur });
  }
  const lh = (l) => (l.size || 64) * 1.22;
  const h = Math.ceil(wrapped.reduce((s, l) => s + lh(l), 0) + pad * 2);
  canvas.width = w; canvas.height = h;
  if (opts.bg !== null) {
    ctx.fillStyle = opts.bg || 'rgba(20,16,14,0.86)';
    roundRect(ctx, 0, 0, w, h, 36); ctx.fill();
    if (opts.border) { ctx.strokeStyle = opts.border; ctx.lineWidth = 8; roundRect(ctx, 4, 4, w - 8, h - 8, 32); ctx.stroke(); }
  }
  let y = pad;
  ctx.textBaseline = 'top';
  ctx.textAlign = opts.align || 'center';
  const x = ctx.textAlign === 'left' ? pad : w / 2;
  for (const l of wrapped) {
    ctx.font = font(l);
    ctx.fillStyle = l.color || '#fff';
    ctx.fillText(l.text, x, y);
    y += lh(l);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const width = opts.width || 0.5;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * h / w),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  );
  mesh.renderOrder = 10;
  return mesh;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Guilloche (banknote-style) pattern on a canvas
function guilloche(ctx, cx, cy, R, r, d, turns, color, lw = 1.2) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
  const steps = 2400;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns;
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y);
  }
  ctx.stroke();
}

function drawCedar(ctx, cx, base, h, color) {
  // Lebanese cedar (flag style): flat, wide, drooping tiers on a trunk
  ctx.fillStyle = color;
  ctx.fillRect(cx - h * 0.03, base - h * 0.86, h * 0.06, h * 0.86);
  for (let k = 0; k < 6; k++) {
    const y = base - h * 0.17 - k * h * 0.135;
    const hw = h * (0.55 - k * 0.08);
    const th = h * 0.075;
    ctx.beginPath();
    ctx.moveTo(cx - hw, y + th * 0.45);
    ctx.quadraticCurveTo(cx - hw * 0.45, y - th * 0.7, cx, y - th);
    ctx.quadraticCurveTo(cx + hw * 0.45, y - th * 0.7, cx + hw, y + th * 0.45);
    ctx.quadraticCurveTo(cx, y + th * 0.05, cx - hw, y + th * 0.45);
    ctx.fill();
  }
}

// Coin with printed faces; axis along z (face toward visitor) unless flat=true
function makeCoin(radius, thick, label, metal = 'gold', flat = false, sub = '') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = metal === 'gold' ? '#d9a93a' : metal === 'green' ? '#6f9b5c' : '#c9ced6';
  g.beginPath(); g.arc(128, 128, 128, 0, Math.PI * 2); g.fill();
  guilloche(g, 128, 128, 100, 37, 70, 37, 'rgba(60,40,10,0.35)', 1);
  g.strokeStyle = 'rgba(60,40,10,0.6)'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 116, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#3a2a12'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${label.length > 3 ? 64 : 96}px Arial`; g.fillText(label, 128, sub ? 112 : 128);
  if (sub) { g.font = '700 34px Arial'; g.fillText(sub, 128, 178); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  if (!flat) { tex.center.set(0.5, 0.5); tex.rotation = Math.PI / 2; }
  const base = metal === 'gold' ? GOLD() : metal === 'green' ? new THREE.MeshStandardMaterial({ color: 0x6f9b5c, metalness: 0.9, roughness: 0.3 }) : SILVER();
  const face = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.7, roughness: 0.35 });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thick, 48), [base, face, face]);
  if (!flat) mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function makeIngot(w = 0.11, h = 0.04, d = 0.055) {
  const shape = new THREE.Shape();
  const top = w * 0.72;
  shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(top / 2, h); shape.lineTo(-top / 2, h); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1 });
  geo.translate(0, 0, -d / 2);
  return geo;
}

function banknoteTexture({ value, unit, year, colorA, colorB, specimen }) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 1024, 512); grd.addColorStop(0, colorA); grd.addColorStop(1, colorB);
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 6; i++) guilloche(g, 220 + i * 120, 256, 150 + i * 8, 41 + i * 3, 90, 41, 'rgba(255,255,255,0.18)', 1);
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 10; g.strokeRect(18, 18, 988, 476);
  drawCedar(g, 190, 400, 260, 'rgba(255,255,255,0.85)');
  g.fillStyle = '#fff'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
  g.font = '800 150px Arial'; g.fillText(value, 970, 230);
  g.font = '700 62px Arial'; g.fillText(unit, 970, 310);
  g.font = '600 40px Arial'; g.fillText(year, 970, 380);
  if (specimen) {
    g.save(); g.translate(560, 300); g.rotate(-0.18); g.fillStyle = 'rgba(200,20,30,0.75)'; g.textAlign = 'center';
    g.font = '800 70px Arial'; g.fillText('SPECIMEN', 0, 0); g.restore();
  }
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.textAlign = 'left'; g.font = '600 30px Arial';
  g.fillText('GEHS 260 · CLASS PROJECT · NOT LEGAL TENDER', 330, 470);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeNote(opts, width = 0.62) {
  const mat = new THREE.MeshStandardMaterial({ map: banknoteTexture(opts), roughness: 0.7, metalness: 0, side: THREE.DoubleSide, transparent: true });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, width / 2), mat);
}

function setOpacity(obj, o) {
  obj.traverse((m) => {
    if (!m.material) return;
    for (const mat of [].concat(m.material)) { mat.transparent = true; mat.opacity = o; }
  });
  obj.visible = o > 0.01;
}

// ---------- the six scenes ----------
// Each returns { group, update(t) } where t is seconds since the poster was found.

function sceneBirth() {
  const group = new THREE.Group();
  group.rotation.x = 0.28; // tilt toward visitor so the pans are visible
  const z = 0.18;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.16), MARBLE());
  base.position.set(0, -0.5, z); group.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.7, 24), GOLD());
  post.position.set(0, -0.13, z); group.add(post);
  const pivot = new THREE.Group(); pivot.position.set(0, 0.23, z); group.add(pivot);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.02, 0.025), GOLD()); pivot.add(beam);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), GOLD()); knob.position.set(0, 0.23, z); group.add(knob);

  const makePan = () => {
    const pan = new THREE.Group();
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.018, 40), GOLD()); dish.position.y = -0.24; pan.add(dish);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.25, 6), DARK());
      s.position.set(Math.cos(a) * 0.06, -0.12, Math.sin(a) * 0.06); s.rotation.z = Math.cos(a) * 0.22; s.rotation.x = -Math.sin(a) * 0.22; pan.add(s);
    }
    group.add(pan); return pan;
  };
  const left = makePan(), right = makePan();
  const pound = makeCoin(0.085, 0.022, '£', 'gold', true, '1 POUND'); pound.position.y = -0.22; left.add(pound);
  const francs = [];
  for (let i = 0; i < 20; i++) {
    const f = makeCoin(0.05, 0.009, 'F', 'silver', true); f.position.set(0, -0.225 + i * 0.0095, 0); f.visible = false; right.add(f); francs.push(f);
  }
  const title = makeCard([
    { text: '1 POUND = 20 FRENCH FRANCS', size: 70, weight: 800, color: '#f7d774' },
    { text: 'Banque de Syrie · 1920', size: 48, color: '#fff' },
  ], { width: 0.7 });
  title.position.set(0, 0.52, z); group.add(title);

  return {
    group,
    update(t) {
      const n = Math.min(20, Math.floor(Math.max(0, t - 0.6) / 0.22));
      francs.forEach((f, i) => {
        f.visible = i < n;
        const drop = i === n - 1 ? clamp01((t - 0.6 - (n - 1) * 0.22) / 0.22) : 1;
        f.position.y = -0.225 + i * 0.0095 + (1 - easeOut(drop)) * 0.25;
      });
      const angle = -0.32 * (1 - n / 20) + (n === 20 ? Math.sin(t * 2) * 0.01 * Math.exp(-(t - 5)) : 0);
      pivot.rotation.z = angle;
      const ends = [-0.37, 0.37];
      [left, right].forEach((p, i) => {
        p.position.set(ends[i] * Math.cos(angle), 0.23 + ends[i] * Math.sin(angle), z);
      });
      title.material.opacity = clamp01((t - 0.2) / 0.6);
    },
  };
}

function scenePeg() {
  const group = new THREE.Group();
  const z = 0.2;
  const lbp = makeCoin(0.12, 0.03, 'LBP', 'silver', false, '1,507.5');
  const usd = makeCoin(0.12, 0.03, '$', 'green', false, '1 DOLLAR');
  const pair = new THREE.Group(); pair.position.set(0, 0.16, z); group.add(pair);
  lbp.position.x = -0.27; usd.position.x = 0.27; pair.add(lbp, usd);
  const links = [];
  for (let i = 0; i < 7; i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.007, 10, 24), GOLD());
    link.position.x = -0.135 + i * 0.045; link.rotation.y = i % 2 ? Math.PI / 2 : 0; link.scale.set(1.25, 0.8, 1);
    pair.add(link); links.push(link);
  }
  // flat line chart
  const chart = new THREE.Group(); chart.position.set(0, -0.32, z); group.add(chart);
  const axis = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.006, 0.006), DARK()); axis.position.y = -0.12; chart.add(axis);
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.7, 12), GOLD());
  line.rotation.z = Math.PI / 2; line.position.set(-0.03, -0.02, 0); chart.add(line);
  const crack = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0xd8323a, roughness: 0.4 }));
  crack.position.set(0.33, 0.13, 0); chart.add(crack);
  const l97 = makeCard([{ text: '1997', size: 60, color: '#fff' }], { width: 0.12, bg: null }); l97.position.set(-0.36, -0.17, 0); chart.add(l97);
  const l19 = makeCard([{ text: '2019', size: 60, color: '#ff8a8a' }], { width: 0.12, bg: null }); l19.position.set(0.33, -0.17, 0); chart.add(l19);
  const title = makeCard([
    { text: '1 $ = 1,507.5 LBP', size: 84, weight: 800, color: '#f7d774' },
    { text: '22 years at the same rate', size: 50, color: '#fff' },
  ], { width: 0.62 });
  title.position.set(0, 0.5, z); group.add(title);

  return {
    group,
    update(t) {
      pair.rotation.y = Math.sin(t * 0.9) * 0.5;
      const g = easeOut(t / 1.6);
      line.scale.y = Math.max(0.001, g); line.position.x = -0.38 + 0.35 * g;
      const c = clamp01((t - 3.5) / 0.8);
      crack.scale.y = Math.max(0.001, easeOut(c)); crack.position.y = -0.02 + 0.15 * easeOut(c);
      crack.visible = c > 0; l19.material.opacity = c;
      // when the line cracks, the chain shakes
      const shake = c > 0 ? Math.sin(t * 40) * 0.01 * (1 - clamp01((t - 4.3) / 1.5)) : 0;
      links.forEach((k, i) => (k.position.y = shake * (i % 2 ? 1 : -1)));
      title.material.opacity = clamp01(t / 0.6);
    },
  };
}

function sceneCollapse() {
  const group = new THREE.Group();
  const z = 0.16;
  const data = [
    { label: '2019', value: '1,507.5', sub: 'the peg', v: 1507.5, color: 0x4caf7a },
    { label: '2023', value: '15,000', sub: 'new official rate', v: 15000, color: 0xf0a33a },
    { label: '2023 →', value: '89,500', sub: 'today’s rate', v: 89500, color: 0xd8323a },
  ];
  const maxH = 0.82, baseY = -0.56;
  const bars = data.map((d, i) => {
    const x = -0.12 + i * 0.22;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1, 0.1), new THREE.MeshStandardMaterial({ color: d.color, roughness: 0.35, metalness: 0.1 }));
    bar.position.set(x, baseY, z); group.add(bar);
    const card = makeCard([
      { text: d.value, size: 110, weight: 800, color: '#fff' },
      { text: d.label, size: 72, color: '#f7d774' },
    ], { width: 0.21, pad: 28 });
    group.add(card);
    return { bar, card, h: Math.max(0.012, (d.v / 89500) * maxH), x };
  });
  const coin = makeCoin(0.1, 0.025, 'LBP', 'silver'); coin.position.set(-0.36, 0.3, z); group.add(coin);
  const lost = makeCard([{ text: '−98% value', size: 100, weight: 800, color: '#ff6b6b' }], { width: 0.34 });
  lost.position.set(-0.33, 0.1, z); group.add(lost);
  const infl = makeCard([
    { text: 'INFLATION PEAK', size: 44, color: '#ffb3b3' },
    { text: '268.78%', size: 84, weight: 800, color: '#fff' },
    { text: 'April 2023', size: 40, color: '#ddd' },
  ], { width: 0.3, bg: 'rgba(140,20,25,0.88)' });
  infl.position.set(-0.32, -0.28, z); group.add(infl);
  const title = makeCard([{ text: 'LBP PER US DOLLAR', size: 80, weight: 800, color: '#f7d774' }], { width: 0.6 });
  title.position.set(0.1, 0.56, z); group.add(title);

  return {
    group,
    update(t) {
      bars.forEach((b, i) => {
        const g = easeOut((t - 0.4 - i * 1.1) / 1.0);
        const h = Math.max(0.001, b.h * g);
        b.bar.scale.y = h; b.bar.position.y = baseY + h / 2;
        b.card.position.set(b.x, baseY + h + 0.08, z + 0.06);
        b.card.material.opacity = clamp01(g * 1.5);
      });
      const s = 1 - 0.85 * easeOut((t - 1.2) / 3);
      coin.scale.setScalar(s); coin.rotation.z = t * 1.5;
      lost.material.opacity = clamp01((t - 3.2) / 0.6);
      infl.material.opacity = clamp01((t - 4.2) / 0.6);
      title.material.opacity = clamp01(t / 0.6);
    },
  };
}

function sceneToday() {
  const group = new THREE.Group();
  const z = 0.15, baseY = -0.6;
  // cash stack: $11.4bn ; gold: ~$46bn  -> height ratio ~ 1 : 4
  const cashMat = new THREE.MeshStandardMaterial({ color: 0x5c8f55, roughness: 0.75 });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xefe6c8, roughness: 0.8 });
  const cash = [];
  const unit = 0.045;
  const cashRows = 4; // 4 rows x 0.045 = 0.18
  for (let r = 0; r < cashRows; r++) for (let c = 0; c < 2; c++) {
    const b = new THREE.Group();
    const brick = new THREE.Mesh(new THREE.BoxGeometry(0.12, unit * 0.95, 0.07), cashMat);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.03, unit * 0.97, 0.072), bandMat);
    b.add(brick, band); b.position.set(-0.33 + c * 0.125, baseY + unit / 2 + r * unit, z); group.add(b); cash.push(b);
  }
  const ingotGeo = makeIngot(0.1, 0.04, 0.06);
  const gold = GOLD();
  const golds = [];
  const goldRows = 16; // 16 x 0.045 = 0.72 (~4x cash)
  for (let r = 0; r < goldRows; r++) for (let c = 0; c < 3; c++) {
    const m = new THREE.Mesh(ingotGeo, gold);
    m.position.set(0.06 + c * 0.11, baseY + r * unit, z); if (r % 2) m.rotation.y = Math.PI; group.add(m); golds.push(m);
  }
  const cashCard = makeCard([
    { text: '$11.4 bn', size: 80, weight: 800, color: '#bff0b0' },
    { text: 'foreign reserves', size: 44, color: '#fff' },
  ], { width: 0.25, pad: 30 });
  const goldCard = makeCard([
    { text: '≈ $46 bn', size: 80, weight: 800, color: '#f7d774' },
    { text: '287 tons of gold', size: 44, color: '#fff' },
  ], { width: 0.27, pad: 30 });
  group.add(cashCard, goldCard);
  const kpis = [
    { text: 'LBP 89,500 / $', sub: 'stable since 2023', color: '#9fd3ff' },
    { text: 'Inflation 17.5%', sub: 'Sept 2026', color: '#ffcf8a' },
    { text: 'GDP −6.4%', sub: '2026 projection', color: '#ff9a9a' },
  ].map((k, i) => {
    const card = makeCard([{ text: k.text, size: 76, weight: 800, color: k.color }, { text: k.sub, size: 52, color: '#ddd' }], { width: 0.33, pad: 24 });
    card.position.set(-0.34 + i * 0.34, 0.58, z + 0.08); group.add(card); return card;
  });
  const losses = makeCard([{ text: '≈ $70 bn of bank losses', size: 70, weight: 800, color: '#fff' }, { text: 'still unallocated', size: 52, color: '#ffd0d0' }], { width: 0.5, bg: 'rgba(140,20,25,0.88)', pad: 24 });
  losses.position.set(-0.22, 0.38, z + 0.08); group.add(losses);

  return {
    group,
    update(t) {
      cash.forEach((b, i) => { const g = clamp01((t - 0.3 - i * 0.08) / 0.3); b.visible = g > 0; b.scale.setScalar(easeOut(g)); });
      golds.forEach((m, i) => { const g = clamp01((t - 1.2 - i * 0.04) / 0.3); m.visible = g > 0; m.scale.setScalar(easeOut(g)); });
      cashCard.position.set(-0.27, baseY + cashRows * unit + 0.09, z + 0.07);
      cashCard.material.opacity = clamp01((t - 0.9) / 0.5);
      const goldTop = baseY + goldRows * unit;
      goldCard.position.set(0.17, Math.min(goldTop, baseY + 0.02 + Math.floor(clamp01((t - 1.2) / (golds.length * 0.04)) * goldRows) * unit) + 0.1, z + 0.07);
      goldCard.material.opacity = clamp01((t - 2.0) / 0.5);
      kpis.forEach((k, i) => (k.material.opacity = clamp01((t - 3.4 - i * 0.4) / 0.5)));
      losses.material.opacity = clamp01((t - 4.8) / 0.6);
    },
  };
}

function sceneRoadmap() {
  const group = new THREE.Group();
  const z = 0.15;
  const phases = [
    { years: '2026–27', name: 'STOP THE BLEEDING', items: ['Gap & bank resolution laws', 'No lending to the state', 'Slow managed float'], color: 0xd8323a, css: '#ff9a9a' },
    { years: '2028–29', name: 'REBUILD TRUST', items: ['Independent, audited BDL', 'Inflation target + rates', 'Rebuild reserves, protect gold'], color: 0xf0a33a, css: '#ffcf8a' },
    { years: '2030–31', name: 'HARD ANCHOR', items: ['Gold-backed currency board', 'New Lira (÷1,000)', 'Only if all conditions met'], color: 0x4caf7a, css: '#a8f0b8' },
  ];
  const steps = phases.map((p, i) => {
    const h = 0.12 + i * 0.16;
    const mat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.1 });
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, 0.16), mat);
    const x = -0.32 + i * 0.32;
    step.position.set(x, -0.62 + h / 2, z); group.add(step);
    const card = makeCard([
      { text: p.years, size: 56, color: p.css },
      { text: p.name, size: 66, weight: 800, color: '#fff' },
      ...p.items.map((t) => ({ text: '• ' + t, size: 50, weight: 500, color: '#eee' })),
    ], { width: 0.32, pad: 26, align: 'left' });
    card.position.set(x, -0.62 + h + 0.3, z + 0.1); group.add(card);
    return { step, card, top: -0.62 + h, x, color: new THREE.Color(p.color) };
  });
  const coin = makeCoin(0.05, 0.014, '£', 'gold'); group.add(coin);
  const title = makeCard([{ text: '2026 → 2031', size: 80, weight: 800, color: '#f7d774' }, { text: 'a five-year plan in three phases', size: 44, color: '#fff' }], { width: 0.55 });
  title.position.set(-0.18, 0.58, z); group.add(title);

  return {
    group,
    update(t) {
      // coin hops onto step i at time 1 + i*2.4
      const seg = Math.max(0, (t - 0.6) / 2.4);
      const i = Math.min(2, Math.floor(seg));
      const f = Math.min(1, (seg - i) / 0.4);
      const from = i === 0 ? { x: -0.55, top: -0.62 } : steps[i - 1];
      const to = steps[i];
      const ff = seg >= 3 ? 1 : f;
      coin.position.set(from.x + (to.x - from.x) * ff, from.top + (to.top - from.top) * ff + Math.sin(Math.PI * ff) * 0.12 + 0.055, z + 0.02);
      coin.rotation.y = t * 2;
      steps.forEach((s, k) => {
        const lit = seg >= k + 0.4;
        s.step.material.color.lerp(lit ? s.color : new THREE.Color(0x777777), 0.08);
        s.card.material.opacity += ((lit ? 1 : 0) - s.card.material.opacity) * 0.08;
      });
      title.material.opacity = clamp01(t / 0.6);
    },
  };
}

function sceneNewLira() {
  const group = new THREE.Group();
  const z = 0.16;
  const oldNote = makeNote({ value: '100,000', unit: 'OLD LIVRES', year: '2026', colorA: '#7a5a8c', colorB: '#3b2b48', specimen: false }, 0.6);
  oldNote.position.set(0, 0.2, z); group.add(oldNote);
  const newNote = makeNote({ value: '100', unit: 'NEW LIRA', year: '2031', colorA: '#1f7a6b', colorB: '#b88a1e', specimen: true }, 0.66);
  newNote.position.set(0, 0.2, z + 0.02); group.add(newNote);
  const div = makeCard([{ text: '÷ 1,000', size: 90, weight: 800, color: '#f7d774' }], { width: 0.24 });
  div.position.set(0, 0.2, z + 0.1); group.add(div);
  // gold wall behind the note
  const ingotGeo = makeIngot(0.1, 0.04, 0.06), gold = GOLD();
  const golds = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8 - r; c++) {
    const m = new THREE.Mesh(ingotGeo, gold);
    m.position.set(-((8 - r - 1) * 0.105) / 2 + c * 0.105, -0.3 + r * 0.045, z - 0.05); group.add(m); golds.push(m);
  }
  const backing = makeCard([{ text: 'Backed by gold & reserves', size: 50, weight: 700, color: '#f7d774' }, { text: 'currency board · 1 New Lira = 1,000 old LBP', size: 38, color: '#fff' }], { width: 0.6, pad: 24 });
  backing.position.set(0, 0.5, z + 0.05); group.add(backing);
  // dashboard
  const lights = ['Unified rate', 'Inflation < 10%', 'Reserves', 'Banks fixed', 'Depositors'].map((name, i) => {
    const x = -0.4 + i * 0.2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 24, 16), new THREE.MeshStandardMaterial({ color: 0xd8323a, emissive: 0xd8323a, emissiveIntensity: 0.8 }));
    bulb.position.set(x, -0.46, z + 0.06); group.add(bulb);
    const label = makeCard([{ text: name, size: 44, weight: 700, color: '#fff' }], { width: 0.19, pad: 18 });
    label.position.set(x, -0.54, z + 0.06); group.add(label);
    return bulb;
  });
  const red = new THREE.Color(0xd8323a), amber = new THREE.Color(0xf0a33a), green = new THREE.Color(0x3ccf6e);

  return {
    group,
    update(t) {
      // 0-1.5s old note visible, 1.5-3 shrink & fade, new note grows in
      const s = easeOut((t - 1.2) / 1.4);
      oldNote.scale.setScalar(Math.max(0.001, 1 - 0.9 * s)); setOpacity(oldNote, 1 - s);
      const n = easeOut((t - 2.2) / 1.2);
      newNote.scale.setScalar(Math.max(0.001, n)); newNote.rotation.y = (1 - n) * Math.PI + Math.sin(t * 0.8) * 0.18 * n;
      newNote.position.y = 0.2 + Math.sin(t * 1.3) * 0.015;
      div.material.opacity = clamp01((t - 1.2) / 0.4) * (1 - clamp01((t - 3.0) / 0.5));
      golds.forEach((m, i) => { const g = clamp01((t - 3.0 - i * 0.05) / 0.3); m.visible = g > 0; m.scale.setScalar(easeOut(g)); });
      backing.material.opacity = clamp01((t - 4.2) / 0.6);
      lights.forEach((b, i) => {
        const k = t - 5 - i * 0.6;
        const c = k < 0 ? red : k < 0.3 ? amber : green;
        b.material.color.lerp(c, 0.15); b.material.emissive.lerp(c, 0.15);
      });
    },
  };
}

export const SCENES = [sceneBirth, scenePeg, sceneCollapse, sceneToday, sceneRoadmap, sceneNewLira];

// Soft museum lighting + reflections for the metals
export async function setupLighting(scene, renderer) {
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  const dir = new THREE.DirectionalLight(0xffffff, 1.6); dir.position.set(0.5, 1, 1.5); scene.add(dir);
}
