import Link from 'next/link';
import { appRoutes } from '@/lib/routes';
import { CITY_CONFIGS, DEFAULT_CITY, isValidCity } from '@/lib/constants';
import { getSeoPageConfig, SEO_PAGE_SLUGS } from '@/lib/seo-pages';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';

const QUICK_LINKS = [
  {
    href: appRoutes.dashboard(),
    title: 'Dashboard en vivo',
    description: 'Mapa, alertas, flujo y lecturas operativas del sistema actual.',
  },
  {
    href: appRoutes.reports(),
    title: 'Archivo mensual',
    description: 'Informes indexables por mes con enlaces persistentes y contexto historico.',
  },
  {
    href: appRoutes.dashboardStatus(),
    title: 'Estado del sistema',
    description: 'Frescura de datos, volumen reciente y diagnostico rapido.',
  },
  {
    href: appRoutes.biciradar(),
    title: 'Bici Radar',
    description: 'App movil vinculada al proyecto con seguimiento de bicis compartidas.',
  },
  {
    href: appRoutes.beta(),
    title: 'Vista beta',
    description: 'Exploracion del producto y acceso a los modulos en desarrollo.',
  },
] as const;

function getCurrentCityName(): string {
  const candidate = process.env.CITY?.toLowerCase() ?? DEFAULT_CITY;
  if (isValidCity(candidate)) {
    return CITY_CONFIGS[candidate].name;
  }

  return CITY_CONFIGS[DEFAULT_CITY].name;
}

export default function Home() {
  const currentCityName = getCurrentCityName();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-8 overflow-x-clip px-4 py-8 md:px-6 md:py-12">
      <header className="hero-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Panel publico y rutas indexables
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
              {SITE_TITLE}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              {SITE_DESCRIPTION} Esta instalacion publica esta enfocada en {currentCityName} y
              enlaza al dashboard, informes y landings SEO con rutas estables.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">Ciudad activa {currentCityName}</span>
            <span className="kpi-chip">Navegacion canonica sin prefijo</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={appRoutes.dashboard()}
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir dashboard principal
          </Link>
          <Link
            href={appRoutes.reports()}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Abrir informes
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="dashboard-card transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Acceso rapido
            </p>
            <h2 className="mt-2 text-xl font-black text-[var(--foreground)]">{link.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{link.description}</p>
          </Link>
        ))}
      </section>

      <section className="dashboard-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">
              Rutas SEO disponibles
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cada landing publica resume una capa concreta del sistema y enlaza al dashboard
              correspondiente.
            </p>
          </div>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SEO_PAGE_SLUGS.map((slug) => {
            const page = getSeoPageConfig(slug);

            return (
              <Link
                key={slug}
                href={appRoutes.seoPage(slug)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{page.title}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">{page.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
