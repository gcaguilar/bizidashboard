import { TrackedLink } from '@/app/_components/TrackedLink';
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
      actionSlot={helpHref ? <TrackedLink href={helpHref}>{helpLabel}</TrackedLink> : undefined}
    />
  );
}
