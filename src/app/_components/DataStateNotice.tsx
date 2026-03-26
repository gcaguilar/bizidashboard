import Link from 'next/link';
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
    <div
      className={joinClasses(
        'rounded-2xl border px-4 py-4 shadow-[var(--shadow-soft)]',
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
          <span
            className={joinClasses(
              'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]',
              meta.badgeClasses
            )}
          >
            {meta.label}
          </span>
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
            className="inline-flex rounded-xl border border-current/20 bg-black/10 px-3 py-2 text-xs font-bold text-current transition hover:bg-black/20"
          >
            {actionLabel ?? 'Ver detalle'}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
