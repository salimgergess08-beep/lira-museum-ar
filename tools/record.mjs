// Renders a backup video of all six exhibits from preview.html.
// Needs: a local server on :8765 at the repo root, Chrome, puppeteer-core, ffmpeg.
//   python3 -m http.server 8765 &   node tools/record.mjs
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { execSync } from 'child_process';

const OUT = process.env.OUT || 'print/museum-backup.mp4';
const FPS = 15, SECONDS = 8;
const TITLES = ['1920 · The Birth of the Lira', '1997–2019 · The Peg', '2019–2023 · The Collapse', '2026 · Lebanon Today', '2026–2031 · Our Roadmap', '2031 · The New Lira'];
const dir = fs.mkdtempSync('/tmp/frames-');
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto('http://localhost:8765/preview.html#1', { waitUntil: 'load' });
await page.waitForFunction(() => window.__preview);
await page.addStyleTag({ content: `.tabs,.plaque{display:none!important}
  #cap{position:fixed;left:40px;top:40px;z-index:9;font:400 40px Georgia,serif;color:#f4efe6;text-shadow:0 2px 12px #000}
  #cap small{display:block;font:600 15px Arial;letter-spacing:.3em;color:#d9a93a;margin-bottom:6px}` });
await page.evaluate(() => { const d = document.createElement('div'); d.id = 'cap'; document.body.appendChild(d); });
let n = 0;
for (let i = 0; i < 6; i++) {
  await page.evaluate((i, t) => { window.__preview.show(i); document.getElementById('cap').innerHTML = `<small>MUSEUM OF THE LEBANESE LIRA · EXHIBIT ${i + 1}</small>${t}`; }, i, TITLES[i]);
  await new Promise((r) => setTimeout(r, 1500)); // let the poster texture load
  for (let f = 0; f < FPS * SECONDS; f++) {
    const t = f / FPS;
    await page.evaluate((t) => {
      const p = window.__preview; p.setTime(t);
      const a = Math.sin(t * 0.35) * 0.35;
      p.camera.position.set(Math.sin(a) * 2.05, 0.0, Math.cos(a) * 2.05 + 0.15);
      p.controls.update();
      return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, t);
    await page.screenshot({ path: `${dir}/f${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
  }
}
await browser.close();
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${dir}/f%05d.jpg -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -movflags +faststart ${OUT}`);
console.log('wrote', OUT, n, 'frames');
