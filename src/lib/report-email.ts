/**
 * Plantillas de correo del informe mensual
 *
 * Composición pura de los mensajes que se envían por email: confirmación de
 * suscripción (doble opt-in) e informe mensual. Cada plantilla devuelve asunto,
 * HTML y texto plano alternativo; no envía nada ni conoce Resend ni las rutas
 * (las URLs llegan ya construidas por el llamador).
 */

import { formatInteger, formatPercent, formatRatioDelta } from '@/lib/format';
import { formatMonthLabel } from '@/lib/months';
import type { MonthlyReport } from '@/lib/monthly-report';

export type ReportEmailMessage = {
  subject: string;
  html: string;
  text: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function emailPage(title: string, bodyHtml: string, footerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:24px;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2430;">
    <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;padding:28px;">
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e4e7ec;margin:24px 0;" />
      <p style="margin:0;font-size:12px;line-height:1.6;color:#667085;">${footerHtml}</p>
    </div>
  </body>
</html>`;
}

function linkButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:8px;background-color:#1f6feb;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">${escapeHtml(label)}</a>`;
}

// ── Confirmación de suscripción (doble opt-in) ──────────────────────────────

export function buildSubscriptionConfirmationEmail(params: {
  confirmUrl: string;
}): ReportEmailMessage {
  const subject = 'Confirma tu suscripción al informe mensual de DatosBizi';
  const bodyHtml = `
      <p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#667085;">DatosBizi · Informe mensual</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Confirma tu suscripción</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Has pedido recibir el informe mensual de Bizi Zaragoza en tu correo. Para activar la
        suscripción, confirma el enlace:
      </p>
      ${linkButton(params.confirmUrl, 'Confirmar suscripción')}
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#667085;">
        Si el botón no funciona, copia esta dirección en tu navegador:<br />
        ${escapeHtml(params.confirmUrl)}
      </p>`;
  const footerHtml = `Si no has sido tú quien pidió este correo, puedes ignorarlo: no se dará de alta ninguna suscripción sin confirmar.`;
  const text = [
    'DatosBizi · Informe mensual',
    '',
    'Confirma tu suscripción al informe mensual de Bizi Zaragoza.',
    '',
    'Abre este enlace para activar la suscripción:',
    params.confirmUrl,
    '',
    'Si no has sido tú quien pidió este correo, puedes ignorarlo: no se dará de alta ninguna suscripción sin confirmar.',
  ].join('\n');

  return {
    subject,
    html: emailPage(subject, bodyHtml, footerHtml),
    text,
  };
}

// ── Informe mensual ─────────────────────────────────────────────────────────

/** Máximo de hallazgos que se resumen en el correo; el resto vive en el informe. */
const MAX_DIGEST_HIGHLIGHTS = 4;

export function buildMonthlyDigestEmail(params: {
  report: MonthlyReport;
  reportUrl: string;
  pdfUrl: string;
  unsubscribeUrl: string;
}): ReportEmailMessage {
  const { report } = params;
  const monthLabel = formatMonthLabel(report.monthKey);
  const subject = `Informe mensual de Bizi Zaragoza · ${monthLabel}`;
  const highlights = report.highlights.slice(0, MAX_DIGEST_HIGHLIGHTS);
  const trendLabel = report.comparison.isComparable
    ? `vs ${report.comparison.periodLabel}`
    : 'sin comparativa';

  const metricsRows: Array<[string, string]> = [
    ['Movimiento estimado', `${formatInteger(report.headline.demandScore)} puntos`],
    ['Ocupación media', formatPercent(report.headline.avgOccupancy)],
    ['Estaciones activas', formatInteger(report.headline.activeStations)],
    [`Frente al mes anterior (${trendLabel})`, formatRatioDelta(report.comparison.normalizedDemandRatio)],
  ];

  const bodyHtml = `
      <p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#667085;">DatosBizi · Informe mensual</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Bizi Zaragoza en ${escapeHtml(monthLabel)}</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.5;font-weight:bold;">${escapeHtml(report.balance.headline)}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${escapeHtml(report.summary)}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:14px;">
        <caption style="text-align:left;font-size:13px;font-weight:bold;padding:0 0 8px;color:#667085;">Cifras del mes</caption>
        ${metricsRows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:6px 0;border-top:1px solid #e4e7ec;color:#667085;">${escapeHtml(label)}</td><td style="padding:6px 0;border-top:1px solid #e4e7ec;text-align:right;font-weight:bold;">${escapeHtml(value)}</td></tr>`
          )
          .join('')}
      </table>
      ${
        highlights.length > 0
          ? `<h2 style="margin:0 0 8px;font-size:16px;">Titulares</h2>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.6;">
        ${highlights
          .map(
            (highlight) =>
              `<li style="margin-bottom:6px;"><strong>${escapeHtml(highlight.title)}:</strong> ${escapeHtml(highlight.detail)}</li>`
          )
          .join('')}
      </ul>`
          : ''
      }
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">
        El informe completo tiene la evolución del mes, los barrios, los puntos de fricción y las
        conclusiones prácticas:
      </p>
      ${linkButton(params.reportUrl, 'Ver el informe completo')}
      ${linkButton(params.pdfUrl, 'Descargar PDF')}`;

  const footerHtml = `Recibes este correo porque te has suscrito al informe mensual de DatosBizi.<br />
        <a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#667085;text-decoration:underline;">Darte de baja</a> cuando quieras.`;

  const text = [
    subject,
    '',
    report.balance.headline,
    '',
    report.summary,
    '',
    'Cifras del mes',
    ...metricsRows.map(([label, value]) => `- ${label}: ${value}`),
    '',
    ...(highlights.length > 0
      ? ['Titulares', ...highlights.map((highlight) => `- ${highlight.title}: ${highlight.detail}`), '']
      : []),
    `Ver el informe completo: ${params.reportUrl}`,
    `Descargar PDF: ${params.pdfUrl}`,
    '',
    'Recibes este correo porque te has suscrito al informe mensual de DatosBizi.',
    `Darte de baja: ${params.unsubscribeUrl}`,
  ].join('\n');

  return {
    subject,
    html: emailPage(subject, bodyHtml, footerHtml),
    text,
  };
}
