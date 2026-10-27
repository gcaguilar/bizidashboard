import { TrackedAnchor } from '@/app/_components/TrackedAnchor'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'
import { translate } from '@/lib/i18n/messages'

type WhatsAppShareLinkProps = {
  url: string
  text: string
  source: string
  className?: string
  locale?: Locale
}

/**
 * Enlace de compartir por WhatsApp sin SDK ni cookies: solo un enlace universal.
 * En España es el canal de distribución real para contenido local.
 */
export function WhatsAppShareLink({
  url,
  text,
  source,
  className = 'ui-inline-action',
  locale = DEFAULT_LOCALE,
}: WhatsAppShareLinkProps) {
  const href = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`

  return (
    <TrackedAnchor
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      ctaEvent={{
        source,
        ctaId: 'share_whatsapp',
        destination: 'whatsapp',
        sourceRole: 'utility',
        destinationRole: 'utility',
        transitionKind: 'external',
        isExternal: true,
      }}
      className={className}
    >
      {translate(locale, 'share.whatsapp')}
    </TrackedAnchor>
  )
}
