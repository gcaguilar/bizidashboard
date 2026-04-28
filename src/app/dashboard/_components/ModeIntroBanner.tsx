'use client';

import { Card } from '@/components/ui/card';
import { DASHBOARD_MODE_META, type DashboardViewMode } from '@/lib/dashboard-modes';

type ModeIntroBannerProps = {
  mode: DashboardViewMode;
};

export function ModeIntroBanner({ mode }: ModeIntroBannerProps) {
  const copy = DASHBOARD_MODE_META[mode];

  return (
    <Card className={`rounded-2xl bg-gradient-to-r px-5 py-5 ${copy.introTone}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{copy.introEyebrow}</p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--foreground)]">{copy.introTitle}</h2>
      <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">{copy.introDescription}</p>
    </Card>
  );
}
