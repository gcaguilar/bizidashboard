/**
 * GET /api/reports/subscribe/unsubscribe — baja de la suscripción
 *
 * Enlace de baja incluido en cada envío del informe. Da de baja desde
 * cualquier estado (pendiente o confirmado) y redirige al archivo de
 * informes con el resultado (`?sub=baja`).
 */

import { createFileRoute } from '@tanstack/react-router';
import { unsubscribeSubscription } from '@/lib/report-subscriptions';
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

export const Route = createFileRoute('/api/reports/subscribe/unsubscribe/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: appRoutes.api.reportSubscribeUnsubscribe(),
          routeGroup: 'api.reports-subscribe',
          namespace: 'public-report-subscribe-unsubscribe',
          limit: 20,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'no-store',
        },
        async ({ request }) => {
          const token = new URL(request.url).searchParams.get('token') ?? '';
          const result = await unsubscribeSubscription({
            store: reportSubscriptionStore,
            token,
            nowIso: new Date().toISOString(),
          });

          return redirectToReportsNotice(result.status === 'invalid' ? 'error' : 'baja');
        }
      ),
    },
  },
});
