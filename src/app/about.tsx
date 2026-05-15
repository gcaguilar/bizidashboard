import { createFileRoute } from '@tanstack/react-router'
import { getSiteUrl } from '@/lib/site'

export const Route = createFileRoute('/about')({
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Sobre DatosBizi'
    const description = 'DatosBizi ayuda a entender el estado, uso e historico del sistema de bicicletas publicas Bizi Zaragoza.'
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/about` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/about` }],
      title,
    }
  },
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Sobre el proyecto</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          DatosBizi: datos claros sobre Bizi Zaragoza
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          DatosBizi reune disponibilidad actual, historico, informes y API publica para entender
          mejor como se comporta Bizi Zaragoza. La aplicacion esta construida con TanStack Start,
          TanStack Router, TanStack Query, Prisma y Sentry.
        </p>
      </section>
    </main>
  )
}
