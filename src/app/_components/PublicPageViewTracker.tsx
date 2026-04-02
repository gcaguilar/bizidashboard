'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackUmamiEvent, type UmamiEventValue } from '@/lib/umami';

type PublicPageViewTrackerProps = {
  pageType: string;
  template: string;
  pageSlug?: string;
  entityId?: string;
  extra?: Record<string, UmamiEventValue>;
  eventName?: string;
};

export function PublicPageViewTracker({
  pageType,
  template,
  pageSlug,
  entityId,
  extra,
  eventName = 'public_page_view',
}: PublicPageViewTrackerProps) {
  const pathname = usePathname();
  const lastTrackedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const trackingKey = [pathname, pageType, template, pageSlug ?? '', entityId ?? ''].join('|');

    if (lastTrackedKey.current === trackingKey) {
      return;
    }

    lastTrackedKey.current = trackingKey;

    trackUmamiEvent(eventName, {
      path: pathname,
      page_type: pageType,
      template,
      page_slug: pageSlug,
      entity_id: entityId,
      ...extra,
    });
  }, [entityId, eventName, extra, pageSlug, pageType, pathname, template]);

  return null;
}
