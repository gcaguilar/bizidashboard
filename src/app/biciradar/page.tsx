import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const revalidate = 86400;

const GOOGLE_GROUP_URL = 'https://groups.google.com/g/testers-biciradar';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gcaguilar.biciradar';
const APP_STORE_URL = 'https://apps.apple.com/es/app/biciradar/id6760931316';

const CITIES = [
  { name: 'Zaragoza', flag: '🇪🇸', supportsEbikes: true, supportsUsagePatterns: true },
  { name: 'Madrid', flag: '🇪🇸', supportsEbikes: true, supportsUsagePatterns: false },
  { name: 'Barcelona', flag: '🇪🇸', supportsEbikes: true, supportsUsagePatterns: false },
  { name: 'Valencia', flag: '🇪🇸', supportsEbikes: true, supportsUsagePatterns: false },
  { name: 'Sevilla', flag: '🇪🇸', supportsEbikes: true, supportsUsagePatterns: false },
];

const FEATURES = [
  {
    icon: '📍',
    title: 'Estaciones cercanas',
    description: 'Encuentra las estaciones de bicicleta publica mas cercanas a tu posicion actual con distancia y direccion.',
  },
  {
    icon: '🚲',
    title: 'Bicis en tiempo real',
    description: 'Consulta el numero de bicicletas disponibles en cada estacion, actualizado en tiempo real.',
  },
  {
    icon: '🅿️',
    title: 'Huecos libres',
    description: 'Comprueba los anclajes libres antes de llegar para no quedarte sin sitio donde aparcar.',
  },
  {
    icon: '⭐',
    title: 'Estaciones favoritas',
    description: 'Guarda tus estaciones mas usadas para acceder a su estado con un solo toque.',
  },
  {
    icon: '📊',
    title: 'Historico de uso',
    description: 'Observa patrones de uso y disponibilidad historica para planificar mejor tus viajes.',
  },
  {
    icon: '⚡',
    title: 'Bicis electricas',
    description: 'Identifica rapidamente estaciones con bicicletas electricas disponibles.',
  },
  {
    icon: '🔔',
    title: 'Alertas inteligentes',
    description: 'Recibe notificaciones cuando una estacion muy utilizada se quede vacia o llena.',
  },
  {
    icon: '🌙',
    title: 'Modo offline',
    description: 'Accede a tus estaciones favoritas y ultima posicion conocida sin conexion a internet.',
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: 'Bici Radar - App de bicis compartidas en tiempo real',
  description:
    'La app definitiva para encontrar estaciones de bicis compartidas. Zaragoza, Madrid, Barcelona, Valencia y Sevilla. Bicis disponibles, huecos libres y estaciones favoritas.',
  path: '/biciradar',
  keywords: [
    'bici radar',
    'app bicis compartidas',
    'bizi zaragoza',
    'bicimad',
    'bicing barcelona',
    'mibisi valencia',
    'sevici',
    'bicicleta publica espana',
  ],
});

function CityCard({ city }: { city: (typeof CITIES)[number] }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
      <span className="text-2xl">{city.flag}</span>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-[var(--foreground)]">{city.name}</h3>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {city.supportsEbikes && (
            <span className="rounded-full bg-green-500/12 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
              Bicis electricas
            </span>
          )}
          {city.supportsUsagePatterns && (
            <span className="rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
              Patrones de uso
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: (typeof FEATURES)[number] }) {
  return (
    <article className="flex flex-col items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-lg">
        {feature.icon}
      </span>
      <div>
        <h3 className="text-sm font-bold text-[var(--foreground)]">{feature.title}</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{feature.description}</p>
      </div>
    </article>
  );
}

export default function BiciRadarPage() {
  const siteUrl = getSiteUrl();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Bici Radar', item: `${siteUrl}/biciradar` },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Bici Radar',
        description:
          'App para encontrar estaciones de bicis compartidas en Zaragoza, Madrid, Barcelona, Valencia y Sevilla. Bicis disponibles y huecos libres en tiempo real.',
        applicationCategory: 'TravelApplication',
        operatingSystem: 'Android, iOS',
        url: `${siteUrl}/biciradar`,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-8 overflow-x-clip px-4 py-8 md:px-6 md:py-12">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/60 text-4xl shadow-lg shadow-[var(--accent)]/25">
          🚲
        </div>
        <h1 className="text-3xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
          Bici Radar
        </h1>
        <p className="mt-3 max-w-xl text-base text-[var(--muted)] md:text-lg">
          La app definitiva para encontrar bicis compartidas en tiempo real. Zaragoza, Madrid, Barcelona, Valencia y Sevilla.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={GOOGLE_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"/>
            </svg>
            Android (Beta)
          </a>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent)] bg-transparent px-5 py-2.5 text-sm font-bold text-[var(--accent)] transition hover:bg-[var(--accent)]/8"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            iOS
          </a>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-6">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-[var(--foreground)] md:text-3xl">Ciudades disponibles</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Bici Radar esta disponible en las principales ciudades de Espania</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((city) => (
            <CityCard key={city.name} city={city} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-[var(--foreground)] md:text-3xl">Caracteristicas</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Todo lo que necesitas para moverte en bicicleta por la ciudad</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-6">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-[var(--foreground)] md:text-3xl">Descarga la app</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Android en beta &mdash; iOS disponible</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href={GOOGLE_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.523 2.237a.625.625 0 0 0-.857.228l-1.376 2.4A8.154 8.154 0 0 0 12 4.098c-1.153 0-2.254.264-3.29.767L7.334 2.465a.626.626 0 0 0-1.085.629l1.344 2.348A7.677 7.677 0 0 0 4 11.874h16a7.677 7.677 0 0 0-3.593-6.432l1.344-2.348a.625.625 0 0 0-.228-.857zM9 9.375a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zm6 0a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zM4 13.125v6.25A1.875 1.875 0 0 0 5.875 21.25h.75v2.375a1.375 1.375 0 1 0 2.75 0V21.25h1.25v2.375a1.375 1.375 0 1 0 2.75 0V21.25h.75A1.875 1.875 0 0 0 20 19.375v-6.25H4zM1.375 13.125a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5zm18.5 0a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5z" />
            </svg>
            Unirse al grupo (Android)
          </a>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            App Store (iOS)
          </a>
        </div>
      </section>
    </main>
  );
}