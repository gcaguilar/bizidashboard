import { createFileRoute } from '@tanstack/react-router';
import { StatsSecondaryNav } from '@/app/estadisticas/_components/StatsSecondaryNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { getSiteUrl } from '@/lib/site';
import { PageShell } from '@/components/layout/page-shell';

export const Route = createFileRoute('/estadisticas/')({
  head: () => {
    const siteUrl = getSiteUrl();
    const title = 'Estadísticas Bizi Zaragoza - DatosBizi';
    const description = 'Explora estadísticas de Bizi Zaragoza: estaciones, barrios, horarios, viajes y más.';
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estadisticas` },
        { name: 'robots', content: 'index, follow' },
      ],
      link: [{ rel: 'canonical', href: `${siteUrl}/estadisticas` }],
      title,
    };
  },
  component: EstadisticasHubPage,
});

const STATS_CARDS = [
  {
    href: '/estadisticas/estaciones',
    eyebrow: 'Ranking y disponibilidad',
    title: 'Estaciones',
    description: 'Estaciones más usadas, ranking y disponibilidad en tiempo real.',
  },
  {
    href: '/estadisticas/barrios',
    eyebrow: 'Contexto territorial',
    title: 'Barrios',
    description: 'Compara barrios de Zaragoza por estaciones, actividad y disponibilidad.',
  },
  {
    href: '/estadisticas/horarios',
    eyebrow: 'Patrones horarios',
    title: 'Horarios',
    description: 'Horas pico, franjas de mayor actividad y comportamiento del sistema.',
  },
  {
    href: '/estadisticas/viajes',
    eyebrow: 'Serie temporal',
    title: 'Viajes',
    description: 'Tendencia diaria y mensual de viajes estimados en el sistema.',
  },
  {
    href: '/estadisticas/mapa',
    eyebrow: 'Vista cartográfica',
    title: 'Mapa',
    description: 'Mapa de estaciones con disponibilidad y acceso al dashboard en vivo.',
  },
  {
    href: '/estadisticas/redistribucion',
    eyebrow: 'Logística y equilibrio',
    title: 'Redistribución',
    description: 'Diagnóstico de reequilibrio y estaciones que necesitan atención.',
  },
] as const;

function EstadisticasHubPage() {
  const breadcrumbs = createRootBreadcrumbs({ label: 'Estadísticas', href: '/estadisticas' });

  return (
    <PageShell>
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <header className="ui-page-hero">
        <StatsSecondaryNav className="mt-1" />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Estadísticas públicas</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">Estadísticas</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Explora datos y análisis del sistema Bizi Zaragoza: estaciones, barrios, horarios, viajes y más.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STATS_CARDS.map((card) => (
          <a key={card.href} className="ui-surface-block ui-surface-block-interactive block" href={card.href}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{card.eyebrow}</p>
            <p className="mt-2 text-base font-black text-[var(--foreground)]">{card.title}</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{card.description}</p>
          </a>
        ))}
      </section>
    </PageShell>
  );
}
