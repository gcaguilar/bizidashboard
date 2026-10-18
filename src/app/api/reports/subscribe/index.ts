/**
 * POST /api/reports/subscribe — alta en la suscripción al informe mensual
 *
 * Doble opt-in: la petición deja la suscripción en `PENDING` y dispara el
 * correo de confirmación. No confirma nada por sí sola. La respuesta es
 * deliberadamente genérica cuando el correo ya existe, pero distingue el caso
 * «ya confirmada» para no mandar un enlace de confirmación que no hace falta.
 */

import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { errorResponse, okResponse } from '@/lib/api-response';
import { isEmailConfigured, sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import {
  isValidSubscriptionEmail,
  normalizeSubscriptionEmail,
  requestReportSubscription,
} from '@/lib/report-subscriptions';
import { reportSubscriptionStore } from '@/lib/report-subscription-store';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';
import { withPublicApiRoute } from '@/lib/security/public-api-route';

const subscribeSchema = z.object({
  email: z.string().trim().min(1).max(254),
});

export const Route = createFileRoute('/api/reports/subscribe/')({
  server: {
    handlers: {
      POST: withPublicApiRoute(
        {
          route: appRoutes.api.reportSubscribe(),
          routeGroup: 'api.reports-subscribe',
          namespace: 'public-report-subscribe',
          // Envío de correos: cupo corto para que el formulario público no se
          // pueda usar como remitente masivo.
          limit: 5,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'no-store',
        },
        async ({ request, requestId }) => {
          const body = await request.json().catch(() => null);
          const parsed = subscribeSchema.safeParse(body);

          if (!parsed.success) {
            return errorResponse('Falta el campo "email".', 400, requestId);
          }

          const email = normalizeSubscriptionEmail(parsed.data.email);
          if (!isValidSubscriptionEmail(email)) {
            return errorResponse('El correo electrónico no es válido.', 400, requestId);
          }

          if (!isEmailConfigured()) {
            logger.warn('api.reports_subscribe.email_not_configured');
            return errorResponse(
              'Las suscripciones por correo no están disponibles ahora mismo.',
              503,
              requestId
            );
          }

          const result = await requestReportSubscription(email, {
            store: reportSubscriptionStore,
            send: sendEmail,
            confirmUrl: (token) =>
              toAbsoluteRouteUrl(appRoutes.api.reportSubscribeConfirm({ token })),
            nowIso: new Date().toISOString(),
          });

          if (result.status === 'invalid') {
            return errorResponse('El correo electrónico no es válido.', 400, requestId);
          }

          if (result.status === 'already_confirmed') {
            return okResponse(
              {
                status: 'already_confirmed',
                message: 'Este correo ya está suscrito al informe mensual.',
              },
              requestId
            );
          }

          if (result.status === 'unavailable') {
            logger.warn('api.reports_subscribe.confirmation_email_failed');
            return errorResponse(
              'No se pudo enviar el correo de confirmación. Inténtalo de nuevo en unos minutos.',
              503,
              requestId
            );
          }

          return Response.json(
            {
              status: 'pending',
              message:
                'Revisa tu correo: te hemos enviado un enlace para confirmar la suscripción.',
            },
            { status: 202 }
          );
        }
      ),
    },
  },
});
