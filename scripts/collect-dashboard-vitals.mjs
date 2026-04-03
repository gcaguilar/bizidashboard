import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.VITALS_BASE_URL ?? 'https://datosbizi.com';
const ROUTES = [
  '/dashboard/views/overview',
  '/dashboard/views/operations',
  '/dashboard/views/research',
  '/dashboard/views/data',
];
const OUTPUT_PATH =
  process.env.VITALS_OUTPUT_PATH ?? 'ops/dashboard-web-vitals-prod.json';

function createVitalsCollector() {
  return `
(() => {
  window.__vitals = {
    lcp: null,
    cls: 0,
    fcp: null
  };

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__vitals.lcp = entry.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__vitals.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}

  try {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcp) {
      window.__vitals.fcp = fcp.startTime;
    } else {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            window.__vitals.fcp = entry.startTime;
          }
        }
      }).observe({ type: 'paint', buffered: true });
    }
  } catch {}
})();
`;
}

function roundMs(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value);
}

async function measureRoute(context, route) {
  const page = await context.newPage();
  await page.addInitScript(createVitalsCollector());
  const url = `${BASE_URL}${route}`;
  const start = Date.now();
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(2_000);

  const vitals = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const v = window.__vitals ?? {};
    return {
      lcp: v.lcp ?? null,
      cls: v.cls ?? null,
      fcp: v.fcp ?? null,
      domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
      loadEventEnd: nav?.loadEventEnd ?? null,
      transferSize: nav?.transferSize ?? null,
      decodedBodySize: nav?.decodedBodySize ?? null,
      duration: nav?.duration ?? null,
    };
  });

  await page.close();

  return {
    route,
    url,
    status: response?.status() ?? null,
    measuredAt: new Date().toISOString(),
    elapsedMs: Date.now() - start,
    metrics: {
      fcpMs: roundMs(vitals.fcp),
      lcpMs: roundMs(vitals.lcp),
      cls: typeof vitals.cls === 'number' ? Number(vitals.cls.toFixed(4)) : null,
      domContentLoadedMs: roundMs(vitals.domContentLoaded),
      loadEventEndMs: roundMs(vitals.loadEventEnd),
      navDurationMs: roundMs(vitals.duration),
      transferSizeBytes: vitals.transferSize ?? null,
      decodedBodySizeBytes: vitals.decodedBodySize ?? null,
    },
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  });

  const results = [];
  try {
    for (const route of ROUTES) {
      results.push(await measureRoute(context, route));
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const summary = {
    baseUrl: BASE_URL,
    measuredAt: new Date().toISOString(),
    routes: results.length,
    checks: results.map((entry) => ({
      route: entry.route,
      status: entry.status,
      fcpMs: entry.metrics.fcpMs,
      lcpMs: entry.metrics.lcpMs,
      cls: entry.metrics.cls,
      navDurationMs: entry.metrics.navDurationMs,
    })),
  };

  const output = { summary, results };
  const outputAbsPath = path.resolve(process.cwd(), OUTPUT_PATH);
  await fs.mkdir(path.dirname(outputAbsPath), { recursive: true });
  await fs.writeFile(outputAbsPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        output: outputAbsPath,
        summary,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
