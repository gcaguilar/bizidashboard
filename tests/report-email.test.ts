import { describe, expect, it } from 'vitest';

import { buildMonthlyReportFixture } from '@tests/helpers/monthly-report-fixture';
import {
  buildMonthlyDigestEmail,
  buildSubscriptionConfirmationEmail,
  escapeHtml,
} from '@/lib/report-email';

describe('escapeHtml', () => {
  it('neutraliza los caracteres con significado en HTML', () => {
    expect(escapeHtml('<b>"x" & \'y\'</b>')).toBe('&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;');
  });
});

describe('buildSubscriptionConfirmationEmail', () => {
  const message = buildSubscriptionConfirmationEmail({
    confirmUrl: 'https://datosbizi.com/api/reports/subscribe/confirm?token=abc',
  });

  it('explica el doble opt-in y lleva el enlace de confirmación', () => {
    expect(message.subject).toContain('Confirma tu suscripción');
    expect(message.html).toContain('Confirmar suscripción');
    expect(message.html).toContain(
      'https://datosbizi.com/api/reports/subscribe/confirm?token=abc'
    );
    expect(message.text).toContain(
      'https://datosbizi.com/api/reports/subscribe/confirm?token=abc'
    );
  });

  it('avisa de que sin confirmar no hay alta', () => {
    expect(message.text).toContain('no se dará de alta ninguna suscripción sin confirmar');
    expect(message.html).toContain('no se dará de alta ninguna suscripción sin confirmar');
  });
});

describe('buildMonthlyDigestEmail', () => {
  const report = buildMonthlyReportFixture();
  const message = buildMonthlyDigestEmail({
    report,
    reportUrl: 'https://datosbizi.com/informes/2026-03',
    pdfUrl: 'https://datosbizi.com/api/reports?month=2026-03&format=pdf',
    unsubscribeUrl: 'https://datosbizi.com/api/reports/subscribe/unsubscribe?token=xyz',
  });

  it('nombra el mes en el asunto', () => {
    expect(message.subject).toBe('Informe mensual de Bizi Zaragoza · marzo de 2026');
  });

  it('resume el informe: balance, resumen, cifras y titulares', () => {
    expect(message.html).toContain('La red creció frente al mes anterior');
    expect(message.html).toContain('Resumen del mes.');
    expect(message.html).toContain('Cifras del mes');
    expect(message.html).toContain('Movimiento estimado');
    expect(message.html).toContain('Ocupación media');
    expect(message.html).toContain('Titulares');
    expect(message.html).toContain('Hallazgo');
    expect(message.text).toContain('Resumen del mes.');
    expect(message.text).toContain('- Movimiento estimado:');
    expect(message.text).toContain('- Hallazgo: Detalle del hallazgo.');
  });

  it('incluye los enlaces al informe, al PDF y de baja en ambas versiones', () => {
    for (const url of [
      'https://datosbizi.com/informes/2026-03',
      'https://datosbizi.com/api/reports?month=2026-03&format=pdf',
      'https://datosbizi.com/api/reports/subscribe/unsubscribe?token=xyz',
    ]) {
      expect(message.html).toContain(url.replace('&', '&amp;'));
      expect(message.text).toContain(url);
    }
    expect(message.text).toContain('Darte de baja:');
    expect(message.html).toContain('Darte de baja');
  });

  it('escapa el contenido dinámico en la versión HTML', () => {
    const injected = buildMonthlyDigestEmail({
      report: buildMonthlyReportFixture({
        summary: 'Intento de <script>alert("x")</script> & compañía',
        highlights: [{ title: '<img src=x>', detail: 'detalle "entrecomillado"' }],
      }),
      reportUrl: 'https://datosbizi.com/informes/2026-03',
      pdfUrl: 'https://datosbizi.com/api/reports?month=2026-03&format=pdf',
      unsubscribeUrl: 'https://datosbizi.com/api/reports/subscribe/unsubscribe?token=xyz',
    });

    expect(injected.html).toContain('&lt;script&gt;');
    expect(injected.html).not.toContain('<script>');
    expect(injected.html).toContain('&lt;img src=x&gt;');
    expect(injected.html).toContain('detalle &quot;entrecomillado&quot;');
  });
});
