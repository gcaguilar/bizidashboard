'use client'

import { useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { WhatsAppShareLink } from '@/app/_components/WhatsAppShareLink'
import {
  buildCopyActionEvent,
  buildShareActionEvent,
  resolveRouteKeyFromPathname,
  trackEvent,
  type AnalyticsEntityType,
} from '@/lib/analytics'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'
import { translate } from '@/lib/i18n/messages'

type ShareButtonProps = {
  url: string
  title: string
  text: string
  source: string
  className?: string
  locale?: Locale
  /** Tipo de contenido compartido; se omite cuando el llamador no lo conoce. */
  entityType?: AnalyticsEntityType
}

/**
 * Botón "Compartir": usa la Web Share API cuando existe y, si no, ofrece
 * WhatsApp y copiar el enlace. La vista previa (og:image) la pone la página.
 */
export function ShareButton({ url, title, text, source, className = 'ui-inline-action', locale = DEFAULT_LOCALE, entityType }: ShareButtonProps) {
  const [fallbackOpen, setFallbackOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const pathname = useLocation().pathname
  const routeKey = resolveRouteKeyFromPathname(pathname)
  const surface = pathname?.startsWith('/dashboard') ? 'dashboard' : 'public'

  async function handleShare() {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url })
        trackEvent(buildShareActionEvent({
          surface, routeKey, source, channel: 'web_share', entityType, result: 'success',
        }))
        return
      } catch (error) {
        // Cancelar el diálogo nativo no es un error que haya que compensar.
        if (error instanceof DOMException && error.name === 'AbortError') {
          trackEvent(buildShareActionEvent({
            surface, routeKey, source, channel: 'web_share', result: 'cancel',
          }))
          return
        }
      }
    }
    setFallbackOpen(true)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackEvent(buildCopyActionEvent({
        surface, routeKey, source, module: 'share_button', ctaId: 'share_link', result: 'success',
      }))
    } catch {
      setCopied(false)
      trackEvent(buildCopyActionEvent({
        surface, routeKey, source, module: 'share_button', ctaId: 'share_link', result: 'error',
      }))
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button type="button" className={className} onClick={handleShare} aria-expanded={fallbackOpen}>
        {translate(locale, 'share.button')}
      </button>
      {fallbackOpen ? (
        <>
          <WhatsAppShareLink url={url} text={text} source={source} className={className} locale={locale} entityType={entityType} />
          <button type="button" className={className} onClick={handleCopy}>
            {translate(locale, 'share.copyLink')}
          </button>
          <span role="status" aria-live="polite" className="text-xs text-[var(--muted)]">
            {copied ? translate(locale, 'share.copied') : ''}
          </span>
        </>
      ) : null}
    </span>
  )
}
