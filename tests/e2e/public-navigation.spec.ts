import { expect, test } from '@playwright/test';

function getPathname(url: string): string {
  return new URL(url).pathname;
}

function getSearchParam(url: string, key: string): string | null {
  return new URL(url).searchParams.get(key);
}

test('public search and explore hub keep canonical routes aligned', async ({ page }) => {
  await page.goto('/estado');
  await expect.poll(() => getPathname(page.url())).toBe('/estado');

  await page.getByLabel('Buscar estación').fill('api status');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect.poll(() => getPathname(page.url())).toBe('/explorar');
  await expect.poll(() => getSearchParam(page.url(), 'q')).toBe('api status');

  const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toBeVisible();
  await expect(breadcrumbs).toContainText('Explorar');
  const citySwitcher = page.getByLabel('Selector de ciudad');
  if (await citySwitcher.count()) {
    await expect(citySwitcher).toBeVisible();
    await expect(citySwitcher).toContainText('Zaragoza');
    await expect(citySwitcher).not.toContainText('Madrid');
    await expect(citySwitcher).not.toContainText('Barcelona');
  }

  const compareLink = page.getByRole('link', { name: /Comparador/ });
  await expect(compareLink).toHaveAttribute('href', '/comparar');
});

test('compare hub loads with canonical route and breadcrumbs', async ({ page }) => {
  await page.goto('/comparar', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => getPathname(page.url())).toBe('/comparar');
  await expect.poll(() => getSearchParam(page.url(), 'dimension')).toBeNull();

  const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toContainText('Comparar');
  await expect(page.getByText(/Elige dos lados y comp[áa]ralos manualmente/)).toBeVisible();
});

test('public redirects resolve to canonical pages', async ({ page }) => {
  await page.goto('/developers');
  await expect.poll(() => getPathname(page.url())).toBe('/developers');

  const publicNavigation = page.getByRole('navigation', { name: 'Navegación principal' });
  await publicNavigation.getByRole('button', { name: 'Más' }).click();
  await publicNavigation.getByRole('link', { name: 'API', exact: true }).click();
  await expect.poll(() => getPathname(page.url())).toBe('/developers');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Developers');

  await page.goto('/api/docs');
  await expect.poll(() => getPathname(page.url())).toBe('/developers');

  await page.goto('/dashboard/status');
  await expect.poll(() => getPathname(page.url())).toBe('/estado');
  await expect(page.getByRole('heading', { name: /Estado de los datos/i })).toBeVisible();

  await page.goto('/zaragoza/explorar');
  await expect.poll(() => getPathname(page.url())).toBe('/estadisticas');

  await page.goto('/zaragoza/estado');
  await expect.poll(() => getPathname(page.url())).toBe('/estado');
});

test('principal public routes keep their canonical URL and render without an error page', async ({ page }) => {
  const routes = ['/', '/dashboard', '/comparar', '/informes', '/estado', '/metodologia', '/developers', '/biciradar'];

  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

    expect(response?.status(), route).toBeLessThan(400);
    await expect.poll(() => getPathname(page.url()), { message: route }).toBe(route);
    await expect(page.getByRole('heading', { name: 'Error interno' }), route).toHaveCount(0);
  }
});

test('BiciRadar remains an independently accessible route', async ({ page }) => {
  await page.goto('/biciradar', { waitUntil: 'domcontentloaded' });

  await expect.poll(() => getPathname(page.url())).toBe('/biciradar');
  await expect(page.getByRole('heading', { name: /Bici Radar/i })).toBeVisible();
  await expect(page).not.toHaveURL(/\/dashboard/);
});
