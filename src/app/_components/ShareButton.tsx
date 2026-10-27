'use client'

import { useState } from 'react'
import { WhatsAppShareLink } from '@/app/_components/WhatsAppShareLink'

type ShareButtonProps = {
  url: string
  title: string
  text: string
  source: string
  className?: string
}

/**
 * Botón "Compartir": usa la Web Share API cuando existe y, si no, ofrece
 * WhatsApp y copiar el enlace. La vista previa (og:image) la pone la página.
 */
export function ShareButton({ url, title, text, source, className = 'ui-inline-action' }: ShareButtonProps) {
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
        Compartir
      </button>
      {fallbackOpen ? (
        <>
          <WhatsAppShareLink url={url} text={text} source={source} className={className} />
          <button type="button" className={className} onClick={handleCopy}>
            Copiar enlace
          </button>
          <span role="status" aria-live="polite" className="text-xs text-[var(--muted)]">
            {copied ? 'Enlace copiado' : ''}
          </span>
        </>
      ) : null}
    </span>
  )
}
