import Link from 'next/link';

type DashboardQuickLinksProps = {
  selectedStationDetailUrl: string;
};

export function DashboardQuickLinks({ selectedStationDetailUrl }: DashboardQuickLinksProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Detalle de estacion</h3>
        <p className="text-sm text-[var(--muted)]">
          Abre la vista completa de la estacion seleccionada para ver prediccion, mapa por barrios y comparativas.
        </p>
        <Link
          href={selectedStationDetailUrl}
          className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          Abrir detalle completo
        </Link>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Flujo por barrios</h3>
        <p className="text-sm text-[var(--muted)]">
          Consulta la matriz O-D, el chord y las rutas de mayor volumen en una pagina dedicada.
        </p>
        <Link
          href="/dashboard/flujo"
          className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          Ir a analisis de flujo
        </Link>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Conclusiones diarias</h3>
        <p className="text-sm text-[var(--muted)]">
          Resumen ejecutivo de movilidad, tendencias semanales y recomendaciones operativas.
        </p>
        <Link
          href="/dashboard/conclusiones"
          className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          Ver conclusiones
        </Link>
      </article>

      <article className="dashboard-card">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">Centro de ayuda</h3>
        <p className="text-sm text-[var(--muted)]">
          Metodologia, criterios de alertas y documentacion en una pagina independiente.
        </p>
        <Link
          href="/dashboard/ayuda"
          className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          Abrir ayuda
        </Link>
      </article>
    </section>
  );
}
