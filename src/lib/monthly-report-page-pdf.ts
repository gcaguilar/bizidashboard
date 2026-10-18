/**
 * Render del informe mensual a PDF con el mismo motor que la web.
 *
 * Se usa desde la API: si el PDF de un mes no esta guardado, se renderiza una
 * vez y se persiste para las siguientes descargas. Abre la pagina publica del
 * informe en Chromium headless y la imprime con las reglas de `styles.css`.
 *
 * Modulo de servidor: nunca debe importarse desde el bundle del cliente.
 */

import { chromium, type Browser } from 'playwright';
import { appRoutes } from '@/lib/routes';

/** Espera maxima para cargar la pagina y sus datos. */
const NAVIGATION_TIMEOUT_MS = 90_000;
/** Espera maxima a que la pagina hidrate; si no, se imprime igualmente. */
const HYDRATION_TIMEOUT_MS = 20_000;
/** Margen para que hidraten los graficos y se asiente el layout de impresion. */
const RENDER_SETTLE_MS = 1_000;

/**
 * Origen desde el que se carga la pagina. Por defecto se usa el propio
 * servidor (mismo proceso, sin depender de DNS ni del proxy); en Docker o en
 * un despliegue con instancias separadas puede apuntarse al servicio web
 * interno o a la URL publica.
 */
function reportPageOrigin(): string {
  const configured = process.env.REPORT_PDF_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/u, '');
  }

  // En desarrollo Vite escucha en `localhost` (IPv6); en el contenedor de
  // produccion el servidor escucha en 0.0.0.0 y se alcanza por loopback IPv4.
  const host = process.env.NODE_ENV === 'production' ? '127.0.0.1' : 'localhost';

  return `http://${host}:${process.env.PORT?.trim() || '3000'}`;
}

export function monthlyReportPageUrl(monthKey: string): string {
  return `${reportPageOrigin()}${appRoutes.reportMonth(monthKey)}`;
}

/** Host del script de analitica, que el render no debe cargar. */
function configuredAnalyticsHost(): string | null {
  const src = process.env.UMAMI_SCRIPT_SRC?.trim();

  if (!src) {
    return null;
  }

  try {
    return new URL(src).host;
  } catch {
    return null;
  }
}

export async function createReportPdfBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

/**
 * Renderiza un informe ya sellado. Si se pasa un navegador compartido, el
 * llamante conserva su ciclo de vida; si no, se abre y se cierra uno.
 */
export async function renderMonthlyReportPagePdf(
  monthKey: string,
  browser?: Browser
): Promise<Uint8Array> {
  const activeBrowser = browser ?? (await createReportPdfBrowser());
  const page = await activeBrowser.newPage({
    // A4 util a 96 ppp: los graficos se miden cerca del ancho final del papel.
    viewport: { width: 794, height: 1123 },
    deviceScaleFactor: 1,
  });

  // El render no es una visita real: no debe contar en la analitica.
  const analyticsHost = configuredAnalyticsHost();
  if (analyticsHost) {
    await page.route('**/*', (route) => {
      try {
        if (new URL(route.request().url()).host === analyticsHost) {
          return route.abort();
        }
      } catch {
        // URL no parseable: se deja pasar.
      }

      return route.continue();
    });
  }

  try {
    const response = await page.goto(monthlyReportPageUrl(monthKey), {
      waitUntil: 'load',
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    if (!response || !response.ok()) {
      throw new Error(`Report page returned ${response?.status() ?? 'no response'}`);
    }

    // Los graficos se montan tras la hidratacion: la pagina marca el final.
    await page
      .waitForFunction(
        () => document.documentElement.dataset.reportHydrated === 'true',
        undefined,
        { timeout: HYDRATION_TIMEOUT_MS }
      )
      .catch(() => {
        // Un informe sin graficos (o con ellos degradados) sigue siendo valido.
      });

    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(RENDER_SETTLE_MS);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return new Uint8Array(pdf);
  } finally {
    await page.close();

    if (!browser) {
      await activeBrowser.close();
    }
  }
}
