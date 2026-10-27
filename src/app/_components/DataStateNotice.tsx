import { TrackedLink } from '@/app/_components/TrackedLink';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  getDataStateMeta,
  type DataState,
} from '@/lib/data-state';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { translate } from '@/lib/i18n/messages';

type DataStateNoticeProps = {
  state: DataState;
  subject?: string;
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  className?: string;
  compact?: boolean;
  /** Idioma del texto por defecto; el español si se omite. */
  locale?: Locale;
};

function joinClasses(...values: Array<string | null | undefined | false>): string {
  return values.filter(Boolean).join(' ');
}

export function DataStateNotice({
  state,
  subject,
  title,
  description,
  href,
  actionLabel,
  className,
  compact = false,
  locale = DEFAULT_LOCALE,
}: DataStateNoticeProps) {
  const meta = getDataStateMeta(state, { subject, locale });

  return (
    <Card
      className={joinClasses(
        'rounded-2xl px-4 py-4 shadow-[var(--shadow-soft)]',
        meta.toneClasses,
        className
      )}
    >
      <div
        className={joinClasses(
          'flex flex-wrap items-start justify-between gap-3',
          compact ? 'gap-y-2' : 'gap-y-3'
        )}
      >
        <div className="min-w-0">
          <Badge
            className={joinClasses(
              'rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.16em]',
              meta.badgeClasses
            )}
          >
            {meta.label}
          </Badge>
          <p className={joinClasses('font-semibold text-current', compact ? 'mt-2 text-sm' : 'mt-3 text-base')}>
            {title ?? meta.title}
          </p>
          <p className={joinClasses('leading-relaxed text-current/90', compact ? 'mt-1 text-xs' : 'mt-2 text-sm')}>
            {description ?? meta.description}
          </p>
        </div>

        {href ? (
          <TrackedLink href={href}
            className="ui-inline-action"
          >
            {actionLabel ?? translate(locale, 'dataState.viewDetail')}
          </TrackedLink>
        ) : null}
      </div>
    </Card>
  );
}
