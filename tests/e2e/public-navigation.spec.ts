import { expect, test } from '@playwright/test';

function getPathname(url: string): string {
  return new URL(url).pathname;
}

test('public navigation keeps canonical routes, redirects and breadcrumbs aligned', async ({ page }) => {
  await page.goto('/inicio');
  await expect.poll(() => getPathname(page.url())).toBe('/');

  await page.getByRole('link', { name: 'Abrir hub Explorar' }).click();
  await expect.poll(() => getPathname(page.url())).toBe('/explorar');

  let breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toBeVisible();
  await expect(breadcrumbs).toContainText('Explorar');
  await expect(page.getByLabel('Selector de ciudad')).toBeVisible();

  await page.getByRole('link', { name: /Comparador/ }).first().click();
  await expect.poll(() => getPathname(page.url())).toBe('/comparar');

  breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toContainText('Comparar');
  await expect(page.getByText('Elige dos lados y comparalos manualmente')).toBeVisible();

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
