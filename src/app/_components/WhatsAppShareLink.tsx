'use client';

import { useLocation } from '@tanstack/react-router';
import { TrackedAnchor } from '@/app/_components/TrackedAnchor';
import { buildShareActionEvent, resolveRouteKeyFromPathname, type AnalyticsEntityType } from '@/lib/analytics';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { translate } from '@/lib/i18n/messages';

type WhatsAppShareLinkProps = {
  url: string;
  text: string;
  source: string;
  className?: string;
  locale?: Locale;
  /** Tipo de contenido compartido; se omite cuando el llamador no lo conoce. */
  entityType?: AnalyticsEntityType;
};

/**
 * Enlace de compartir por WhatsApp sin SDK ni cookies: solo un enlace universal.
 * Emite `share_action` (canal whatsapp), sin texto libre ni URLs con parámetros.
 */
export function WhatsAppShareLink({
  url,
  text,
  source,
  className = 'ui-inline-action',
  locale = DEFAULT_LOCALE,
  entityType,
}: WhatsAppShareLinkProps) {
  const pathname = useLocation().pathname;
  const href = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const surface = pathname?.startsWith('/dashboard') ? 'dashboard' : 'public';

  return (
    <TrackedAnchor
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      trackingEvent={buildShareActionEvent({
        surface,
        routeKey,
        source,
        channel: 'whatsapp',
        entityType,
      })}
      className={className}
    >
      {translate(locale, 'share.whatsapp')}
    </TrackedAnchor>
  );
}
