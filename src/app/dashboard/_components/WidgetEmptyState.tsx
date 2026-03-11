import Link from 'next/link';

type WidgetEmptyStateProps = {
  title: string;
  description: string;
  helpHref?: string;
  helpLabel?: string;
};

export function WidgetEmptyState({ title, description, helpHref, helpLabel = 'Entender este bloque' }: WidgetEmptyStateProps) {
  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-5 text-sm text-[var(--muted)]">
      <p className="font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1">{description}</p>
      {helpHref ? (
        <Link
          href={helpHref}
          className="mt-3 inline-flex text-xs font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
        >
          {helpLabel}
        </Link>
      ) : null}
    </div>
  );
}
