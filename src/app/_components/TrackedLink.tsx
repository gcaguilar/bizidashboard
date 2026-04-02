'use client';

import Link, { type LinkProps } from 'next/link';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { trackUmamiEvent, type UmamiEventValue } from '@/lib/umami';

type TrackedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    children: ReactNode;
    eventName?: string;
    eventData?: Record<string, UmamiEventValue>;
  };

export function TrackedLink({
  children,
  eventName,
  eventData,
  onClick,
  className,
  ...linkProps
}: TrackedLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (eventName) {
      trackUmamiEvent(eventName, eventData);
    }

    onClick?.(event);
  }

  return (
    <Link
      {...linkProps}
      onClick={handleClick}
      className={`${
        className ?? ''
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.trim()}
    >
      {children}
    </Link>
  );
}
