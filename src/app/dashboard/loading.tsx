import { Skeleton } from '@/components/ui/skeleton';
import { WidgetSkeleton } from './_components/WidgetSkeleton';
import { PageShell } from '@/components/layout/page-shell';

export default function DashboardLoading() {
  return (
    <PageShell maxWidthClassName="">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <WidgetSkeleton key={i} className="h-24" lines={2} />
          ))}
        </div>
        <WidgetSkeleton className="min-h-[360px]" lines={6} />
      </div>
    </PageShell>
  );
}
