import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { DASHBOARD_MODE_META, DASHBOARD_VIEW_MODES, resolveDashboardViewMode } from '@/lib/dashboard-modes';
import { buildPageMetadata } from '@/lib/seo';

type DashboardModePageProps = {
  params: Promise<{
    mode: string;
  }>;
};

export function generateStaticParams() {
  return DASHBOARD_VIEW_MODES.map((mode) => ({ mode }));
}

export async function generateMetadata({ params }: DashboardModePageProps): Promise<Metadata> {
  const { mode } = await params;
  const resolvedMode = resolveDashboardViewMode(mode);
  const meta = DASHBOARD_MODE_META[resolvedMode];

  return buildPageMetadata({
    title: `${meta.label} del dashboard`,
    description: meta.introDescription,
    path: `/dashboard/views/${resolvedMode}`,
  });
}

export default async function DashboardModePage({ params }: DashboardModePageProps) {
  const { mode } = await params;
  const resolvedMode = resolveDashboardViewMode(mode);

  permanentRedirect(`/dashboard?mode=${resolvedMode}`);
}
