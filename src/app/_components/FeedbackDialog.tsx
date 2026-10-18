'use client';

import { useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { buildTallyEmbedUrl, getFeedbackUrl, type FeedbackRating } from '@/lib/feedback';
import {
  buildCtaClickEvent,
  buildFeedbackRatingEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
} from '@/lib/umami';

type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
  module?: string;
};

type FeedbackStage = 'rating' | 'thanks' | 'details';

const RATING_OPTIONS: Array<{ value: FeedbackRating; label: string; emoji: string }> = [
  { value: 'positive', label: 'Me gusta', emoji: '👍' },
  { value: 'negative', label: 'No me gusta', emoji: '👎' },
];

const STAGE_TITLES: Record<FeedbackStage, string> = {
  rating: '¿Cómo va DatosBizi?',
  thanks: 'Gracias por tu respuesta',
  details: 'Cuéntanos un poco más',
};

export function FeedbackDialog({ open, onOpenChange, source, module }: FeedbackDialogProps) {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const surface = pathname?.startsWith('/dashboard') ? 'dashboard' : 'public';
  const feedbackUrl = getFeedbackUrl();

  const [stage, setStage] = useState<FeedbackStage>('rating');
  const [rating, setRating] = useState<FeedbackRating | null>(null);

  const embedUrl = useMemo(
    () => buildTallyEmbedUrl(feedbackUrl, { rating: rating ?? undefined, source }),
    [feedbackUrl, rating, source]
  );

  function trackCta(ctaId: string, destination: string, isExternal = false) {
    trackUmamiEvent(
      buildCtaClickEvent({
        surface,
        routeKey,
        source,
        ctaId,
        destination,
        module,
        entityType: 'help',
        isExternal,
      })
    );
  }

  function handleRating(value: FeedbackRating) {
    setRating(value);
    setStage('thanks');
    trackUmamiEvent(
      buildFeedbackRatingEvent({
        surface,
        routeKey,
        source,
        module,
        rating: value,
      })
    );
  }

  function openDetails() {
    setStage('details');
    trackCta('feedback_details_open', 'feedback_form');
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setStage('rating');
      setRating(null);
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{STAGE_TITLES[stage]}</DialogTitle>
        </DialogHeader>

        {stage === 'rating' ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Un solo clic nos ayuda a saber cómo mejorar. Sin formularios largos.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {RATING_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => handleRating(option.value)}
                >
                  <span className="text-xl" aria-hidden="true">
                    {option.emoji}
                  </span>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
            <button
              type="button"
              className="text-xs text-[var(--muted)] underline-offset-4 hover:underline"
              onClick={() => handleOpenChange(false)}
            >
              Ahora no
            </button>
          </div>
        ) : null}

        {stage === 'thanks' ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              {rating === 'positive'
                ? 'Nos alegra que te resulte útil. Si quieres, cuéntanos qué es lo que más usas o qué añadirías.'
                : 'Gracias por decírnoslo. ¿Nos cuentas qué podemos mejorar? Con tu respuesta lo revisamos.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={openDetails}>
                {rating === 'positive' ? 'Dejar un comentario' : 'Contar qué mejorar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Ahora no
              </Button>
            </div>
            {rating === 'positive' ? (
              <p className="text-xs text-[var(--muted)]">
                El comentario es opcional: puedes cerrar sin escribir nada.
              </p>
            ) : null}
          </div>
        ) : null}

        {stage === 'details' ? (
          <div className="mt-4 space-y-3">
            {embedUrl ? (
              <iframe
                title="Formulario de feedback de DatosBizi"
                src={embedUrl}
                loading="lazy"
                className="h-[60vh] w-full rounded-xl border border-[var(--border)] bg-white"
              />
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Abre el formulario para dejarnos los detalles.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStage('thanks')}
              >
                Volver
              </Button>
              {feedbackUrl ? (
                <a
                  href={feedbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[var(--primary)] underline underline-offset-4"
                  onClick={() => trackCta('feedback_fallback_open', 'feedback_form', true)}
                >
                  Abrir el formulario en una pestaña nueva
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
