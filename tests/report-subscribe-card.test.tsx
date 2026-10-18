import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportSubscribeCard } from '@/app/informes/_components/ReportSubscribeCard';

describe('ReportSubscribeCard', () => {
  const html = renderToStaticMarkup(<ReportSubscribeCard />);

  it('explica qué se recibe y con qué frecuencia', () => {
    expect(html).toContain('Recibe el informe mensual en tu correo');
    expect(html).toContain('el resumen');
    expect(html).toContain('de baja desde');
  });

  it('pide el correo con un formulario de tipo email', () => {
    expect(html).toContain('type="email"');
    expect(html).toContain('name="email"');
    expect(html).toContain('Suscribirme');
    expect(html).toContain('Tu correo electrónico');
  });

  it('anuncia el doble opt-in y se oculta al imprimir', () => {
    expect(html).toContain('confirmar la suscripción');
    expect(html).toContain('ui-print-hide');
  });
});
