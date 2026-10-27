'use client'

import { useState } from 'react'
import { WhatsAppShareLink } from '@/app/_components/WhatsAppShareLink'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'
import { translate } from '@/lib/i18n/messages'

type ShareButtonProps = {
  url: string
  title: string
  text: string
  source: string
  className?: string
  locale?: Locale
}

/**
 * Botón "Compartir": usa la Web Share API cuando existe y, si no, ofrece
 * WhatsApp y copiar el enlace. La vista previa (og:image) la pone la página.
 */
export function ShareButton({ url, title, text, source, className = 'ui-inline-action', locale = DEFAULT_LOCALE }: ShareButtonProps) {
  const [fallbackOpen, setFallbackOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (error) {
        // Cancelar el diálogo nativo no es un error que haya que compensar.
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    setFallbackOpen(true)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button type="button" className={className} onClick={handleShare} aria-expanded={fallbackOpen}>
        {translate(locale, 'share.button')}
      </button>
      {fallbackOpen ? (
        <>
          <WhatsAppShareLink url={url} text={text} source={source} className={className} locale={locale} />
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
