import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardRouteLinks } from '@/app/dashboard/_components/DashboardRouteLinks';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('dashboard route links', () => {
  it('keeps alerts outside the primary dashboard navigation', () => {
    const html = renderToStaticMarkup(<DashboardRouteLinks activeRoute="dashboard" />);

    expect(html).toContain('>Inicio<');
    expect(html).toContain('>Estaciones<');
    expect(html).toContain('>Flujo<');
    expect(html).toContain('>Conclusiones<');
    expect(html).toContain('>Redistribución<');
    expect(html).toContain('>Ayuda<');
    expect(html).not.toContain('>Alertas<');
  });
});
