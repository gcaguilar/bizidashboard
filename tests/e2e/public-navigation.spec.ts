import { expect, test } from '@playwright/test';

function getPathname(url: string): string {
  return new URL(url).pathname;
}

function getSearchParam(url: string, key: string): string | null {
  return new URL(url).searchParams.get(key);
}

test('public search and explore hub keep canonical routes aligned', async ({ page }) => {
  await page.goto('/inicio');
  await expect.poll(() => getPathname(page.url())).toBe('/');

  await page.getByLabel('Buscador global').fill('api status');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect.poll(() => getPathname(page.url())).toBe('/explorar');
  await expect.poll(() => getSearchParam(page.url(), 'q')).toBe('api status');
  await expect(page.getByText('Resultados para "api status"')).toBeVisible();
  await expect(page.getByText('GET /api/status')).toBeVisible();

  await page.getByRole('link', { name: 'Limpiar busqueda' }).click();
  await expect.poll(() => getSearchParam(page.url(), 'q')).toBeNull();
  await expect(page.getByText('Resultados para "api status"')).toHaveCount(0);

  let breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toBeVisible();
  await expect(breadcrumbs).toContainText('Explorar');
  const citySwitcher = page.getByLabel('Selector de ciudad');
  await expect(citySwitcher).toBeVisible();
  await expect(citySwitcher).toContainText('Zaragoza');
  await expect(citySwitcher).not.toContainText('Madrid');
  await expect(citySwitcher).not.toContainText('Barcelona');

  const compareLink = page.getByRole('link', { name: 'Abrir comparador' });
  await expect(compareLink).toHaveAttribute('href', '/comparar');
});

test('compare hub loads with canonical route and breadcrumbs', async ({ page }) => {
  await page.goto('/comparar', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => getPathname(page.url())).toBe('/comparar');

  const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toContainText('Comparar');
  await expect(page.getByText('Elige dos lados y comparalos manualmente')).toBeVisible();
});

test('public redirects resolve to canonical pages', async ({ page }) => {
  await page.goto('/developers');
  await expect.poll(() => getPathname(page.url())).toBe('/developers');

  await page.getByRole('link', { name: 'API' }).first().click();
  await expect.poll(() => getPathname(page.url())).toBe('/developers');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Developers');

  await page.goto('/api/docs');
  await expect.poll(() => getPathname(page.url())).toBe('/developers');

  await page.goto('/dashboard/status');
  await expect.poll(() => getPathname(page.url())).toBe('/estado');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Estado');

  await page.goto('/zaragoza/explorar');
  await expect.poll(() => getPathname(page.url())).toBe('/explorar');

  await page.goto('/zaragoza/estado');
  await expect.poll(() => getPathname(page.url())).toBe('/estado');
});
