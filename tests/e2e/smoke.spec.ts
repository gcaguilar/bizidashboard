import { expect, test } from '@playwright/test';

test('home page loads hero text, bike count chip, and station cards', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Bizi Zaragoza ahora mismo')).toBeVisible();

  await expect(page.getByText('bicis disponibles')).toBeVisible();

  const stationCards = page.locator('.ui-surface-block-interactive');
  await expect(stationCards.first()).toBeVisible({ timeout: 15_000 });
});

test('estado page shows health indicator and key metrics', async ({ page }) => {
  await page.goto('/estado', { waitUntil: 'domcontentloaded' });

  const healthDot = page.locator('.rounded-full.bg-green-500, .rounded-full.bg-amber-500, .rounded-full.bg-red-500');
  await expect(healthDot.first()).toBeVisible({ timeout: 10_000 });

  await expect(page.getByText('Ultima muestra util')).toBeVisible();
  await expect(page.getByText('Frecuencia de actualización')).toBeVisible();
  await expect(page.getByText('Historial disponible')).toBeVisible();
  await expect(page.getByText('Estaciones activas')).toBeVisible();
});

test('estaciones directory loads filter buttons then station cards', async ({ page }) => {
  await page.goto('/estadisticas/estaciones');

  await expect(page.getByRole('button', { name: 'Todas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Con bicis' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Con huecos' })).toBeVisible();

  const stationCard = page.locator('.ui-metric-card').first();
  await expect(stationCard).toBeVisible({ timeout: 15_000 });
  await expect(stationCard).toContainText('bicis');
  await expect(stationCard).toContainText('huecos');
});

test('estacion detail for station 101 shows info, favorite button, and breadcrumb', async ({ page }) => {
  await page.goto('/estadisticas/estaciones/101');

  await expect(page.getByText('Ficha publica de estacion')).toBeVisible({ timeout: 10_000 });

  await expect(page.getByRole('button', { name: /marcar favorita/i })).toBeVisible();

  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumb).toBeVisible();

  await expect(page.getByText(/bicis|huecos|capacidad/i)).toBeVisible();
});

test('informes page loads last report link and archive', async ({ page }) => {
  await page.goto('/informes');

  await expect(page.getByText('Archivo mensual')).toBeVisible();
  await expect(page.getByText('Informes mensuales de Bizi Zaragoza')).toBeVisible();

  const lastReportLink = page.getByRole('link', { name: /ultimo informe/i });
  await expect(lastReportLink).toBeVisible({ timeout: 10_000 });

  const archiveCards = page.locator('.ui-metric-card, .ui-section-card').filter({ hasText: /informe/i });
  const count = await archiveCards.count();
  expect(count).toBeGreaterThanOrEqual(1);
});