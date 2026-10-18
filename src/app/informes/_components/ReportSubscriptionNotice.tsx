type SubscriptionNotice = 'confirmada' | 'baja' | 'error';

type ReportSubscriptionNoticeProps = {
  status?: SubscriptionNotice;
};

const NOTICE_COPY: Record<SubscriptionNotice, { title: string; detail: string; tone: string }> = {
  confirmada: {
    title: 'Suscripción confirmada',
    detail:
      'Ya recibirás el informe mensual de Bizi Zaragoza en tu correo cuando se cierre cada mes.',
    tone: 'text-[var(--primary)]',
  },
  baja: {
    title: 'Suscripción dada de baja',
    detail: 'No recibirás más informes mensuales. Puedes volver a apuntarte cuando quieras.',
    tone: 'text-[var(--foreground)]',
  },
  error: {
    title: 'El enlace no es válido',
    detail:
      'El enlace de confirmación o de baja no es válido o ya se ha usado. Si quieres recibir el informe, vuelve a apuntarte.',
    tone: 'text-[var(--warning)]',
  },
};

/**
 * Aviso del resultado de confirmar la suscripción o darse de baja, mostrado en
 * el archivo de informes tras el enlace del correo (`?sub=`).
 */
export function ReportSubscriptionNotice({ status }: ReportSubscriptionNoticeProps) {
  if (!status) {
    return null;
  }

  const notice = NOTICE_COPY[status];

  return (
    <section
      aria-live="polite"
      data-subscription-notice={status}
      className="ui-section-card ui-print-hide"
    >
      <h2 className={`text-lg font-black ${notice.tone}`}>{notice.title}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{notice.detail}</p>
    </section>
  );
}
