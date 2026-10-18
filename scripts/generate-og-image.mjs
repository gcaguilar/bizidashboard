/**
 * Genera la imagen Open Graph estática (`public/og-image.png`, 1200x630).
 *
 * Se ejecuta a mano cuando cambie el branding: la salida se versiona en el
 * repositorio y el servidor la sirve como asset estático.
 *
 *   node scripts/generate-og-image.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const WIDTH = 1200;
const HEIGHT = 630;
const OUTPUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-image.png');

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
      body {
        font-family: 'DejaVu Sans', 'Arial', sans-serif;
        background: #180a0c;
        color: #ffffff;
      }
      .card {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: ${WIDTH}px;
        height: ${HEIGHT}px;
        padding: 68px 80px 60px;
        overflow: hidden;
        background: radial-gradient(1100px 700px at 92% -20%, #5c0d18 0%, #2b0f13 46%, #180a0c 100%);
      }
      .glow {
        position: absolute;
        top: -220px;
        right: -160px;
        width: 640px;
        height: 640px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(234, 6, 21, 0.5) 0%, rgba(234, 6, 21, 0) 68%);
      }
      .eyebrow {
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #ffb4bc;
      }
      .dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ea0615;
        box-shadow: 0 0 26px #ea0615;
      }
      h1 {
        margin-top: 24px;
        font-size: 132px;
        font-weight: 800;
        line-height: 0.94;
        letter-spacing: -0.02em;
      }
      h1 .accent-word { color: #ff5a67; }
      .lead {
        max-width: 720px;
        margin-top: 26px;
        font-size: 33px;
        line-height: 1.36;
        color: #ecd9db;
      }
      .rule {
        width: 150px;
        height: 10px;
        margin-top: 32px;
        border-radius: 6px;
        background: linear-gradient(90deg, #ea0615, #ff8a95);
      }
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 25px;
        color: #cbb4b7;
      }
      .site { font-size: 27px; font-weight: 700; color: #ffffff; }
      .badge {
        padding: 12px 26px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 999px;
        font-size: 23px;
        color: #f4e7e9;
      }
      .bike { position: absolute; right: 84px; bottom: 146px; opacity: 0.94; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="glow"></div>
      <div>
        <div class="eyebrow"><span class="dot"></span> Bizi Zaragoza · Tiempo real</div>
        <h1>Datos<span class="accent-word">Bizi</span></h1>
        <p class="lead">Ocupación, demanda y redistribución de la red de bicicletas públicas de Zaragoza.</p>
        <div class="rule"></div>
      </div>
      <div class="footer">
        <div class="site">datosbizi.com</div>
        <div class="badge">Datos abiertos · Actualización continua</div>
      </div>
      <svg class="bike" width="318" height="318" viewBox="0 0 512 512" fill="none" aria-hidden="true">
        <g stroke="#ffffff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="156" cy="326" r="62" />
          <circle cx="356" cy="326" r="62" />
          <path d="M156 326l70-92h74l56 92" />
          <path d="M226 234l-28-48h56" />
        </g>
      </svg>
    </div>
  </body>
</html>`;

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch {
    // Fallback para entornos donde el chromium de Playwright no está descargado
    // pero sí hay Google Chrome instalado.
    return chromium.launch({ channel: 'chrome' });
  }
}

const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const buffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, buffer);
  console.log(`og-image.png ${WIDTH}x${HEIGHT} -> ${OUTPUT} (${buffer.length} bytes)`);
} finally {
  await browser.close();
}
