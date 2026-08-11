import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import {
  getContext,
} from './integrations/tanstack-query/root-provider'
import { NotFoundPage } from './app/_components/NotFoundPage'
import { PublicErrorPage } from './app/_components/PublicErrorPage'
import { PublicPageLoading } from './app/_components/PublicPageLoading'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // La mayoria de loaders llaman a las server functions directamente (sin cache de
    // React Query), asi que el preload debe respetar la staleness o cada hover reejecuta.
    defaultPreloadStaleTime: 30_000,
    defaultStaleTime: 30_000,
    defaultPendingComponent: PublicPageLoading,
    defaultErrorComponent: PublicErrorPage,
    defaultNotFoundComponent: NotFoundPage,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
