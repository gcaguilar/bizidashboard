/**
 * GET /api/reports/subscribe/confirm — confirma la suscripción (doble opt-in)
 *
 * Enlace del correo de confirmación. Confirma la suscripción pendiente y
 * redirige al archivo de informes con el resultado (`?sub=`), para que la
 * persona vea confirmado el alta en la propia web. Un token desconocido o una
 * suscripción ya dada de baja terminan en `?sub=error`.
 */

import { createFileRoute } from '@tanstack/react-router';
import { confirmSubscription } from '@/lib/report-subscriptions';
import { reportSubscriptionStore } from '@/lib/report-subscription-store';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';
import { withPublicApiRoute } from '@/lib/security/public-api-route';

type SubscriptionNotice = 'confirmada' | 'baja' | 'error';

function redirectToReportsNotice(notice: SubscriptionNotice): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: toAbsoluteRouteUrl(appRoutes.reports({ subscription: notice })) },
  });
}

export const Route = createFileRoute('/api/reports/subscribe/confirm/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: appRoutes.api.reportSubscribeConfirm(),
          routeGroup: 'api.reports-subscribe',
          namespace: 'public-report-subscribe-confirm',
          limit: 20,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'no-store',
        },
        async ({ request }) => {
          const token = new URL(request.url).searchParams.get('token') ?? '';
          const result = await confirmSubscription({
            store: reportSubscriptionStore,
            token,
            nowIso: new Date().toISOString(),
          });

          return redirectToReportsNotice(result.status === 'invalid' ? 'error' : 'confirmada');
        }
      ),
    },
  },
});
