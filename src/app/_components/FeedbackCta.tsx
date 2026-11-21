'use client';

import { useEffect, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { FeedbackDialog } from '@/app/_components/FeedbackDialog';
import { Button } from '@/components/ui/button';
import { getFeedbackUrl, markFeedbackModalSeenForCurrentVisit } from '@/lib/feedback';
import {
  buildCtaClickEvent,
  buildQualityEvent,
  buildWorkflowEvent,
  resolveRouteKeyFromPathname,
  trackEvent,
} from '@/lib/analytics';

type FeedbackCtaProps = {
  source: string;
  ctaId: string;
  className: string;
  pendingClassName?: string;
  children: ReactNode;
  pendingLabel?: ReactNode;
  module?: string;
  destination?: string;
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
  type = 'button',
  onClick,
  ...buttonProps
}: FeedbackCtaProps) {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const surface = pathname?.startsWith('/dashboard') ? 'dashboard' : 'public';
  const feedbackUrl = getFeedbackUrl();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!feedbackUrl) {
      trackEvent(buildQualityEvent('feature_unavailable', {
        surface,
        routeKey,
        source,
        feature: 'feedback_dialog',
        section: module,
        result: 'unavailable',
      }));
    }
  }, [feedbackUrl, module, routeKey, source, surface]);

  if (!feedbackUrl) {
    return (
      <Button
        {...buttonProps}
        type={type}
        disabled
        aria-disabled="true"
        className={pendingClassName ?? className}
      >
        {pendingLabel}
      </Button>
    );
  }

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    trackEvent(
      buildCtaClickEvent({
        surface,
        routeKey,
        source,
        ctaId,
        destination,
        module,
        entityType: 'help',
        isExternal: false,
      })
    );
    trackEvent(buildWorkflowEvent('workflow_start', {
      surface,
      routeKey,
      source,
      workflowName: 'feedback',
      section: module,
    }));
    setIsOpen(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      markFeedbackModalSeenForCurrentVisit();
    }

    setIsOpen(nextOpen);
  };

  return (
    <>
      <Button
        {...buttonProps}
        type={type}
        className={className}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={handleClick}
      >
        {children}
      </Button>
      {isOpen ? (
        <FeedbackDialog
          open={isOpen}
          onOpenChange={handleOpenChange}
          source={source}
          module={module}
        />
      ) : null}
    </>
  );
}
