import { expect, test } from '@playwright/test';

function getSearchParam(url: string, key: string): string | null {
  return new URL(url).searchParams.get(key);
}

test('shared navigation links work across internal pages', async ({ page }) => {
  await page.goto('/dashboard/flujo');

  await page
    .getByRole('navigation', { name: 'Secciones del dashboard' })
    .getByRole('link', { name: 'Estaciones' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard\/estaciones/);

  await page
    .getByRole('navigation', { name: 'Secciones del dashboard' })
    .getByRole('link', { name: 'Ayuda' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard\/ayuda/);
});

test('dashboard syncs selected window and station with URL', async ({ page }) => {
  await page.goto('/dashboard');

  const stationPicker = page.locator('#station-picker');
  await expect(stationPicker).toBeVisible();

  const optionCount = await stationPicker.locator('option').count();
  test.skip(optionCount < 2, 'Se necesitan al menos dos estaciones para esta prueba.');

  const initialStationId = await stationPicker.inputValue();

  await page.getByRole('button', { name: 'Mes' }).first().click();
  await expect.poll(() => getSearchParam(page.url(), 'timeWindow')).toBe('30d');

  await stationPicker.selectOption({ index: 1 });
  await expect.poll(() => getSearchParam(page.url(), 'stationId')).not.toBeNull();
  await expect.poll(() => getSearchParam(page.url(), 'stationId')).not.toBe(initialStationId);

  await page.reload();

  await expect(page.getByRole('button', { name: 'Mes' }).first()).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => getSearchParam(page.url(), 'timeWindow')).toBe('30d');
});

test('flow period filter is reflected in query string', async ({ page }) => {
  await page.goto('/dashboard/flujo?period=night');

  await expect(page.getByRole('button', { name: 'Noche' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Manana' }).click();
  await expect.poll(() => getSearchParam(page.url(), 'period')).toBe('morning');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Manana' })).toHaveAttribute('aria-pressed', 'true');
});

test('transport dashboards are reachable from classic dashboard', async ({ page }) => {
  await page.goto('/dashboard');

  await page.getByRole('link', { name: 'Abrir dashboard bus' }).click();
  await expect(page).toHaveURL(/\/dashboard\/transporte\/bus/);

  await page.getByRole('link', { name: 'Tranvia' }).click();
  await expect(page).toHaveURL(/\/dashboard\/transporte\/tranvia/);
});
