import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportSubscriptionNotice } from '@/app/informes/_components/ReportSubscriptionNotice';

describe('ReportSubscriptionNotice', () => {
  it('no renderiza nada sin resultado de suscripción', () => {
    expect(renderToStaticMarkup(<ReportSubscriptionNotice />)).toBe('');
    expect(renderToStaticMarkup(<ReportSubscriptionNotice status={undefined} />)).toBe('');
  });

  it('confirma el alta', () => {
    const html = renderToStaticMarkup(<ReportSubscriptionNotice status="confirmada" />);

    expect(html).toContain('Suscripción confirmada');
    expect(html).toContain('Ya recibirás el informe mensual');
    expect(html).toContain('data-subscription-notice="confirmada"');
  });

  it('confirma la baja y deja la puerta abierta a volver a apuntarse', () => {
    const html = renderToStaticMarkup(<ReportSubscriptionNotice status="baja" />);

    expect(html).toContain('Suscripción dada de baja');
    expect(html).toContain('volver a apuntarte');
    expect(html).toContain('data-subscription-notice="baja"');
  });

  it('avisa de un enlace no válido', () => {
    const html = renderToStaticMarkup(<ReportSubscriptionNotice status="error" />);

    expect(html).toContain('El enlace no es válido');
    expect(html).toContain('data-subscription-notice="error"');
  });
});
