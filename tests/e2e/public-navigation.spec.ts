import { expect, test } from '@playwright/test';

function getPathname(url: string): string {
  return new URL(url).pathname;
}

test('public navigation keeps canonical routes, redirects and breadcrumbs aligned', async ({ page }) => {
  await page.goto('/inicio');
  await expect.poll(() => getPathname(page.url())).toBe('/');

  await page
    .getByRole('link', { name: 'Uso de Bizi por hora en Zaragoza' })
    .first()
    .click();
  await expect.poll(() => getPathname(page.url())).toBe('/uso-bizi-por-hora');

  let breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toBeVisible();
  await expect(breadcrumbs).toContainText('Uso de Bizi por hora en Zaragoza');

  await page.getByRole('link', { name: 'Abrir archivo mensual' }).click();
  await expect.poll(() => getPathname(page.url())).toBe('/informes');

  breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toContainText('Informes');

  await breadcrumbs.getByRole('link', { name: 'Inicio' }).click();
  await expect.poll(() => getPathname(page.url())).toBe('/');

  await page.goto('/zaragoza/flujo');
  await expect.poll(() => getPathname(page.url())).toBe('/dashboard/flujo');

  breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(breadcrumbs).toContainText('Flujo');

  await page
    .getByRole('navigation', { name: 'Secciones del dashboard' })
    .getByRole('link', { name: 'Ayuda' })
    .first()
    .click();
  await expect.poll(() => getPathname(page.url())).toBe('/dashboard/ayuda');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Ayuda');
});
