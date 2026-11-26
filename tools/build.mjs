// Builds the publishable site into ./_site
//  1. copies three.js + MindAR from node_modules into vendor/
//  2. draws the six exhibit paintings (tools/targets.html) -> targets/exhibit-N.png
//  3. compiles them into the MindAR tracking file targets/targets.mind
//  4. renders the printable A4 posters with the entrance QR -> print/posters.pdf
// Usage: npm install && node tools/build.mjs [siteUrl]
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import QRCode from 'qrcode';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = process.argv[2] || process.env.SITE_URL || 'https://salimgergess08-beep.github.io/lira-museum-ar/';
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
const r = (...p) => path.join(ROOT, ...p);
const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
const log = (...a) => console.log('[build]', ...a);

// 1. vendor libraries
const NM = r('node_modules');
const copies = [
  ['three/build/three.module.js', 'vendor/three/three.module.js'],
  ['three/examples/jsm/renderers/CSS3DRenderer.js', 'vendor/three/addons/renderers/CSS3DRenderer.js'],
  ['three/examples/jsm/environments/RoomEnvironment.js', 'vendor/three/addons/environments/RoomEnvironment.js'],
  ['three/examples/jsm/controls/OrbitControls.js', 'vendor/three/addons/controls/OrbitControls.js'],
];
const mindDist = path.join(NM, 'mind-ar/dist');
for (const f of fs.readdirSync(mindDist)) if (/^(mindar-image(-three)?\.prod|controller-|ui-)/.test(f)) copies.push([`mind-ar/dist/${f}`, `vendor/mind-ar/${f}`]);
for (const [from, to] of copies) { mkdir(path.dirname(r(to))); fs.copyFileSync(path.join(NM, from), r(to)); }
log('vendored', copies.length, 'library files');

// tiny static server
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.mind': 'application/octet-stream', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
  const p = r(decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  // 2 + 3. artwork and tracking file
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  await page.goto(`${BASE}/tools/targets.html`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.MINDAR && window.MINDAR.IMAGE, { timeout: 60000 });
  mkdir(r('targets'));
  const urls = [];
  for (let i = 0; i < 6; i++) {
    const url = await page.evaluate((i) => window.renderTarget(i), i);
    urls.push(url);
    fs.writeFileSync(r('targets', `exhibit-${i + 1}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  log('drew 6 exhibit paintings; compiling tracking data (takes ~30 s)...');
  const res = await page.evaluate((u) => window.compileAll(u), urls);
  fs.writeFileSync(r('targets', 'targets.mind'), Buffer.from(res.b64, 'base64'));
  log('targets.mind written; feature points per target:', JSON.stringify(res.points));
  if (res.points.some((p) => !p || p[0] < 20)) throw new Error('a target has too few tracking features');

  // 4. posters
  mkdir(r('print'));
  await QRCode.toFile(r('print', 'qr.png'), SITE_URL, { margin: 1, scale: 20, errorCorrectionLevel: 'M' });
  const p2 = await browser.newPage();
  await p2.goto(`${BASE}/tools/posters.html?url=${encodeURIComponent(SITE_URL)}`, { waitUntil: 'networkidle0' });
  await p2.pdf({ path: r('print', 'posters.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  log('posters.pdf written (entrance QR ->', SITE_URL + ')');
} finally {
  await browser.close();
  server.close();
}

// assemble _site
const SITE = r('_site');
fs.rmSync(SITE, { recursive: true, force: true });
const include = ['index.html', 'ar.html', 'around.html', 'preview.html', '.nojekyll', 'README.md', 'css', 'js', 'vendor', 'targets', 'print'];
for (const item of include) if (fs.existsSync(r(item))) fs.cpSync(r(item), path.join(SITE, item), { recursive: true });
log('site assembled in _site/');
