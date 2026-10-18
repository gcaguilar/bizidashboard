import type { ComparisonVerdict } from '@/lib/comparison-verdict';

/**
 * Hero de diagnóstico: traduce la comparación a una conclusión en lenguaje
 * natural que un ciudadano puede leer sin interpretar gráficos ni tablas.
 */
export function CompareVerdictHero({ verdict }: { verdict: ComparisonVerdict | null }) {
  if (!verdict) {
    return null;
  }

  return (
    <article className="compare-verdict" data-tone={verdict.tone}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Conclusión
      </p>
      <h3 className="mt-2 text-lg font-black leading-snug text-[var(--foreground)]">
        <span aria-hidden className="mr-1">
          {verdict.emoji}
        </span>
        {verdict.headline}
      </h3>
      {verdict.detail ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{verdict.detail}</p>
      ) : null}
      {verdict.recommendation ? (
        <p className="mt-3 text-sm font-bold text-[var(--primary)]">{verdict.recommendation}</p>
      ) : null}
    </article>
  );
}
