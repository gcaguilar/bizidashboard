import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const revalidate = 86400;

const ANDROID_BETA_URL = 'https://appdistribution.firebase.dev/i/e00ef336fd84888c';

export const metadata: Metadata = buildPageMetadata({
  title: 'App Bizi Zaragoza Beta - Estaciones, bicis y huecos en tiempo real',
  description:
    'Unete a la beta de la app de Bizi Zaragoza. Encuentra estaciones cercanas, consulta bicis y huecos libres en tiempo real y guarda tus favoritas. Disponible para Android, proximamente en iOS.',
  path: '/beta',
  keywords: [
    'app bizi zaragoza',
    'bizi zaragoza app',
    'app bicicleta publica zaragoza',
    'estaciones bizi app',
    'bicis disponibles zaragoza app',
    'beta bizi zaragoza',
    'descargar app bizi',
    'bizi zaragoza android',
    'bizi zaragoza ios',
  ],
});

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <article className="dashboard-card flex flex-col items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-lg">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
      </div>
    </article>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <article className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
        {step}
      </span>
      <div>
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
      </div>
    </article>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
      <h3 className="text-sm font-bold text-[var(--foreground)]">{question}</h3>
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{answer}</p>
    </article>
  );
}

export default function BetaPage() {
  const siteUrl = getSiteUrl();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'App Beta', item: `${siteUrl}/beta` },
        ],
      },
      {
        '@type': 'MobileApplication',
        name: 'Bizi Zaragoza - Estaciones y disponibilidad',
        description:
          'App para encontrar estaciones de Bizi Zaragoza cercanas, ver bicis y huecos libres en tiempo real y guardar favoritas.',
        operatingSystem: 'Android',
        applicationCategory: 'TravelApplication',
        url: `${siteUrl}/beta`,
        installUrl: ANDROID_BETA_URL,
        softwareVersion: 'Beta',
        inLanguage: 'es',
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
        areaServed: {
          '@type': 'City',
          name: 'Zaragoza',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Que es la app de Bizi Zaragoza?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Es una aplicacion movil que te permite encontrar estaciones de Bizi Zaragoza cercanas, ver en tiempo real cuantas bicicletas y huecos libres hay, y guardar tus estaciones favoritas para acceder a ellas rapidamente.',
            },
          },
          {
            '@type': 'Question',
            name: 'Como puedo unirme a la beta?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'En Android, puedes unirte a traves del enlace de Firebase App Distribution. La version para iOS estara disponible proximamente.',
            },
          },
          {
            '@type': 'Question',
            name: 'La app es gratuita?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Si, la app es completamente gratuita tanto en su version beta como en su version final.',
            },
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* Hero */}
      <header className="hero-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Beta abierta</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              La app de Bizi Zaragoza que necesitas
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Encuentra estaciones cercanas, consulta bicis y huecos libres en tiempo real y guarda tus favoritas para tenerlas siempre a mano. Unete a la beta y ayudanos a mejorar la experiencia de BiziZaragoza.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">Gratuita</span>
            <span className="kpi-chip">Beta abierta</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={ANDROID_BETA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.523 2.237a.625.625 0 0 0-.857.228l-1.376 2.4A8.154 8.154 0 0 0 12 4.098c-1.153 0-2.254.264-3.29.767L7.334 2.465a.626.626 0 0 0-1.085.629l1.344 2.348A7.677 7.677 0 0 0 4 11.874h16a7.677 7.677 0 0 0-3.593-6.432l1.344-2.348a.625.625 0 0 0-.228-.857zM9 9.375a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zm6 0a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zM4 13.125v6.25A1.875 1.875 0 0 0 5.875 21.25h.75v2.375a1.375 1.375 0 1 0 2.75 0V21.25h1.25v2.375a1.375 1.375 0 1 0 2.75 0V21.25h.75A1.875 1.875 0 0 0 20 19.375v-6.25H4zM1.375 13.125a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5zm18.5 0a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5z" />
            </svg>
            Unirse a la beta en Android
          </a>
          <span
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-2.5 text-sm font-bold text-[var(--muted)] cursor-default"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            iOS - Proximamente
          </span>
        </div>
      </header>

      {/* Features grid */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black text-[var(--foreground)] md:text-2xl">Que puedes hacer con la app</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Pensada para el dia a dia del usuario de BiziZaragoza.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon="📍"
            title="Estaciones cercanas"
            description="Localiza al instante las estaciones de Bizi mas cercanas a tu posicion actual con distancia y direccion."
          />
          <FeatureCard
            icon="🚲"
            title="Bicis en tiempo real"
            description="Consulta cuantas bicicletas hay disponibles en cada estacion, actualizado en tiempo real."
          />
          <FeatureCard
            icon="🅿️"
            title="Huecos libres"
            description="Comprueba los anclajes libres antes de llegar para no quedarte sin sitio donde aparcar."
          />
          <FeatureCard
            icon="⭐"
            title="Estaciones favoritas"
            description="Guarda las estaciones que mas usas para acceder a su estado con un solo toque."
          />
        </div>
      </section>

      {/* How to join */}
      <section className="dashboard-card">
        <div>
          <h2 className="text-xl font-black text-[var(--foreground)] md:text-2xl">Como unirse a la beta</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">En tres pasos y menos de un minuto.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <StepCard
            step={1}
            title="Abre el enlace de invitacion"
            description="Pulsa el boton de Android de esta pagina desde tu telefono movil para acceder a la invitacion."
          />
          <StepCard
            step={2}
            title="Acepta la invitacion"
            description="Firebase App Distribution te guiara para instalar la app en tu dispositivo Android."
          />
          <StepCard
            step={3}
            title="Explora y da feedback"
            description="Usa la app, encuentra tus estaciones y cuentanos que mejorar. Tu opinion mejora la app para todos."
          />
        </div>
      </section>

      {/* Platform availability */}
      <section className="grid gap-4 md:grid-cols-2">
        <article className="dashboard-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/12 text-lg">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.523 2.237a.625.625 0 0 0-.857.228l-1.376 2.4A8.154 8.154 0 0 0 12 4.098c-1.153 0-2.254.264-3.29.767L7.334 2.465a.626.626 0 0 0-1.085.629l1.344 2.348A7.677 7.677 0 0 0 4 11.874h16a7.677 7.677 0 0 0-3.593-6.432l1.344-2.348a.625.625 0 0 0-.228-.857zM9 9.375a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zm6 0a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75zM4 13.125v6.25A1.875 1.875 0 0 0 5.875 21.25h.75v2.375a1.375 1.375 0 1 0 2.75 0V21.25h1.25v2.375a1.375 1.375 0 1 0 2.75 0V21.25h.75A1.875 1.875 0 0 0 20 19.375v-6.25H4zM1.375 13.125a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5zm18.5 0a1.375 1.375 0 0 1 2.75 0v4.5a1.375 1.375 0 1 1-2.75 0v-4.5z" />
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Android</h3>
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Disponible ahora</p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            La beta para Android esta abierta a todos los usuarios a traves de Firebase App Distribution.
            Descarga la app e instala las actualizaciones automaticamente.
          </p>
          <a
            href={ANDROID_BETA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Descargar beta Android
          </a>
        </article>

        <article className="dashboard-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)]/8 text-lg">
              <svg className="h-5 w-5 text-[var(--muted)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">iOS</h3>
              <p className="text-xs text-[var(--muted)] font-semibold">Proximamente</p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            La version para iOS esta en desarrollo. Visita esta pagina regularmente para enterarte cuando la beta de iPhone y iPad este disponible.
          </p>
          <span className="inline-flex w-fit cursor-default rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--muted)]">
            Proximamente
          </span>
        </article>
      </section>

      {/* FAQ */}
      <section className="dashboard-card">
        <div>
          <h2 className="text-xl font-black text-[var(--foreground)] md:text-2xl">Preguntas frecuentes</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Todo lo que necesitas saber sobre la app y la beta.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <FaqItem
            question="Que es la app de Bizi Zaragoza?"
            answer="Es una aplicacion movil que te permite encontrar estaciones de Bizi Zaragoza cercanas, ver en tiempo real cuantas bicicletas y huecos libres hay, y guardar tus estaciones favoritas para acceder a ellas rapidamente."
          />
          <FaqItem
            question="La app es gratuita?"
            answer="Si, la app es completamente gratuita tanto en su version beta como en su version final. No tiene publicidad ni compras dentro de la app."
          />
          <FaqItem
            question="Como puedo unirme a la beta en Android?"
            answer="Pulsa el boton 'Unirse a la beta en Android' desde tu movil. Firebase App Distribution te guiara para instalar la app. Es rapido y seguro."
          />
          <FaqItem
            question="Cuando estara disponible para iOS?"
            answer="Estamos trabajando en la version para iPhone y iPad. Proximamente publicaremos la beta en esta misma pagina. Vuelve a visitarnos para no perdertela."
          />
          <FaqItem
            question="Que datos usa la app?"
            answer="La app utiliza los datos publicos del sistema Bizi Zaragoza para mostrarte la disponibilidad en tiempo real de bicicletas y anclajes en cada estacion."
          />
          <FaqItem
            question="Como puedo enviar feedback?"
            answer="Durante la beta puedes enviarnos comentarios directamente desde Firebase App Distribution. Tu opinion es clave para mejorar la app antes del lanzamiento oficial."
          />
        </div>
      </section>

      {/* Related routes */}
      <section className="dashboard-card">
        <div>
          <h2 className="text-xl font-black text-[var(--foreground)] md:text-2xl">Explora tambien</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Mientras tanto, accede a toda la analitica desde el navegador.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Dashboard en tiempo real</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Mapa interactivo, estado del sistema y alertas.</p>
          </Link>
          <Link
            href="/estaciones-con-mas-bicis"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Estaciones con mas bicis</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Donde hay bicicletas disponibles ahora mismo.</p>
          </Link>
          <Link
            href="/dashboard/estaciones"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Directorio de estaciones</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Ficha detallada de cada estacion del sistema.</p>
          </Link>
          <Link
            href="/informes"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Informes mensuales</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Archivo historico con datos agregados por mes.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
