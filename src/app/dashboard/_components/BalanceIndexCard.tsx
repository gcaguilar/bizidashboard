import Link from 'next/link';
import { appRoutes } from '@/lib/routes';
import { Progress } from '@/components/ui/progress';
import { InfoHint } from './InfoHint';

type BalanceIndexCardProps = {
  balanceIndex: number;
  criticalStationsCount: number;
  density?: 'normal' | 'compact';
};

function getBalanceTone(value: number): string {
  if (value >= 0.8) return 'text-emerald-400';
  if (value >= 0.6) return 'text-amber-300';
  return 'text-[var(--primary)]';
}

function getBalanceLabel(value: number): string {
  if (value >= 0.8) return 'Sistema equilibrado';
  if (value >= 0.6) return 'Equilibrio mejorable';
  return 'Desequilibrio alto';
}

export function BalanceIndexCard({
  balanceIndex,
  criticalStationsCount,
  density = 'normal',
}: BalanceIndexCardProps) {
  const percentage = Math.round(balanceIndex * 100);
  const compact = density === 'compact';

  return (
    <article className={`ui-section-card ${compact ? 'border-[var(--primary)]/30 bg-[var(--primary)]/6' : ''}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Operaciones</p>
          <div className="mt-1 flex items-center gap-2">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Balance index</h3>
            <InfoHint
              label="Como se calcula el balance index"
              content="Se calcula comparando la ocupacion de cada estacion con el 50%. Si muchas estaciones estan cerca de ese punto, el sistema esta equilibrado y el indice sube hacia 1."
            />
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">Mide como de cerca esta cada estacion del 50% de ocupacion. Cuanto mas cerca de 1, mas equilibrado esta el sistema.</p>
        </div>
        <Link href={appRoutes.dashboardHelp('balance-index')} className="text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline">
          Entender formula
        </Link>
      </div>

      <div className={`mt-5 flex items-end gap-4 ${compact ? 'items-center' : ''}`.trim()}>
        <p className={`${compact ? 'text-4xl' : 'text-5xl'} font-black ${getBalanceTone(balanceIndex)}`}>{percentage}%</p>
        <div className="pb-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">{getBalanceLabel(balanceIndex)}</p>
          <p className="text-xs text-[var(--muted)]">{criticalStationsCount} estaciones en estado critico ahora mismo.</p>
        </div>
      </div>

      <Progress
        className="mt-4 h-3 bg-black/15"
        value={percentage}
        indicatorClassName="bg-[var(--primary)] duration-500"
      />
    </article>
  );
}
