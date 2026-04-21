'use client';

import { usePathname } from 'next/navigation';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { getFeedbackUrl } from '@/lib/feedback';
import { buildCtaClickEvent, resolveRouteKeyFromPathname, trackUmamiEvent } from '@/lib/umami';

type FeedbackCtaProps = {
  source: string;
  ctaId: string;
  className: string;
  pendingClassName?: string;
  children: ReactNode;
  pendingLabel?: ReactNode;
  module?: string;
  destination?: string;
  target?: '_blank' | '_self';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export function FeedbackCta({
  source,
  ctaId,
  className,
  pendingClassName,
  children,
  pendingLabel = 'Feedback pronto',
  module,
  destination = 'feedback_form',
  target = '_blank',
  type = 'button',
  ...buttonProps
}: FeedbackCtaProps) {
  const pathname = usePathname();
  const feedbackUrl = getFeedbackUrl();

  if (!feedbackUrl) {
    return (
      <button
        {...buttonProps}
        type={type}
        disabled
        aria-disabled="true"
        className={pendingClassName ?? className}
      >
        {pendingLabel}
      </button>
    );
  }

  const routeKey = resolveRouteKeyFromPathname(pathname);
  const surface = pathname?.startsWith('/dashboard') ? 'dashboard' : 'public';

  return (
    <a
      href={feedbackUrl}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      onClick={() =>
        trackUmamiEvent(
          buildCtaClickEvent({
            surface,
            routeKey,
            source,
            ctaId,
            destination,
            module,
            entityType: 'help',
            isExternal: true,
          })
        )
      }
      className={className}
    >
      {children}
    </a>
  );
}
