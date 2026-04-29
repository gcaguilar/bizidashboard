import Link from 'next/link';
import { EmptyStateCard } from '@/components/ui/empty-state-card';

type WidgetEmptyStateProps = {
  title: string;
  description: string;
  helpHref?: string;
  helpLabel?: string;
};

export function WidgetEmptyState({ title, description, helpHref, helpLabel = 'Entender este bloque' }: WidgetEmptyStateProps) {
  return (
    <EmptyStateCard
      title={title}
      description={description}
      actionSlot={helpHref ? <Link href={helpHref}>{helpLabel}</Link> : undefined}
    />
  );
}
