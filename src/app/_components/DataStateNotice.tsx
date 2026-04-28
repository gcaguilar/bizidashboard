import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getDataStateMeta,
  type DataState,
} from '@/lib/data-state';

type DataStateNoticeProps = {
  state: DataState;
  subject?: string;
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  className?: string;
  compact?: boolean;
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
}: DataStateNoticeProps) {
  const meta = getDataStateMeta(state, { subject });

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
          <Link
            href={href}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'rounded-xl border-current/20 bg-black/10 px-3 py-2 text-xs font-bold text-current hover:bg-black/20',
            })}
          >
            {actionLabel ?? 'Ver detalle'}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
