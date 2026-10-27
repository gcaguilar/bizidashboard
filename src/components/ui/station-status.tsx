import type { StationSnapshot } from '@/lib/api-types';
import type { Locale } from '@/lib/i18n/locales';
import { getCitizenStatus, type CitizenStatus } from '@/lib/map-colors';
import { cn } from '@/lib/utils';

type StationStatusLabelProps = {
  status: CitizenStatus;
  className?: string;
};

/**
 * Estado ciudadano con icono + texto + color (nunca solo color). Lee todo de
 * `CITIZEN_MAP_LEGEND` para que mapa, fichas y comparador digan lo mismo.
 */
export function StationStatusLabel({ status, className }: StationStatusLabelProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]',
        className
      )}
      title={status.description}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] font-black leading-none text-white"
        style={{ backgroundColor: status.color }}
      >
        {status.icon}
      </span>
      {status.label}
    </span>
  );
}

export function StationStatusBadge({
  station,
  className,
  locale,
}: {
  station: Pick<StationSnapshot, 'capacity' | 'bikesAvailable' | 'anchorsFree'>;
  className?: string;
  /** Idioma de la etiqueta; el español si se omite. */
  locale?: Locale;
}) {
  return <StationStatusLabel status={getCitizenStatus(station, locale)} className={className} />;
}
