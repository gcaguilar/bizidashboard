/**
 * Color de una celda de heatmap a partir de su ocupacion (0..1). Compartido por
 * el heatmap de estacion del dashboard y el heatmap de red del informe mensual.
 */
export function getHeatColor(value: number | null, min: number, max: number): string {
  if (value === null || !Number.isFinite(value)) {
    return 'hsl(338 22% 20%)';
  }

  const range = max - min || 1;
  const ratio = Math.min(1, Math.max(0, (value - min) / range));
  const lightness = 22 + ratio * 42;
  return `hsl(354 82% ${lightness}%)`;
}
