import type { ComparisonPreset } from '@/lib/comparison-hub';

/**
 * Accesos directos a preguntas ciudadanas frecuentes. Cada preset fija modo,
 * entidad A y entidad B en un clic, sin registro: la resolución de ubicación o
 * de favoritos ocurre en el cliente (geolocalización / LocalStorage).
 */
export function ComparePresets({
  presets,
  activePresetId,
  onSelect,
  getDisabledReason,
}: {
  presets: ComparisonPreset[];
  activePresetId: string | null;
  onSelect: (preset: ComparisonPreset) => void;
  getDisabledReason?: (preset: ComparisonPreset) => string | null;
}) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Comparaciones rápidas
      </p>
      <div className="compare-preset-grid mt-2">
        {presets.map((preset) => {
          const disabledReason = getDisabledReason?.(preset) ?? null;
          return (
            <button
              key={preset.id}
              type="button"
              className="compare-preset"
              data-active={activePresetId === preset.id}
              aria-pressed={activePresetId === preset.id}
              disabled={Boolean(disabledReason)}
              title={disabledReason ?? preset.description}
              onClick={() => onSelect(preset)}
            >
              <span aria-hidden className="text-lg leading-none">
                {preset.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-snug text-[var(--foreground)]">
                  {preset.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[var(--muted)]">
                  {disabledReason ?? preset.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
