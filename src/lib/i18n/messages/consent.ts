import { defineArea } from './define';

/** Analytics consent banner and preference dialog. */
export const consentMessages = defineArea({
  es: {
    'consent.banner.ariaLabel': 'Preferencias de analítica',
    'consent.banner.title': 'Tu privacidad importa',
    'consent.banner.description':
      'Usamos analítica anónima y agregada para entender cómo se usa DatosBizi. No recogemos correos, nombres ni el contenido de búsquedas o formularios. Puedes cambiar tu decisión cuando quieras.',
    'consent.banner.accept': 'Aceptar analítica',
    'consent.banner.reject': 'Rechazar analítica',
    'consent.banner.settings': 'Configurar',
    'consent.settings.title': 'Preferencias de analítica',
    'consent.settings.description':
      'La analítica es opcional. Si la rechazas, el sitio funciona exactamente igual y no se envían eventos de uso.',
    'consent.settings.analytics': 'Analítica de producto (PostHog Cloud EU)',
    'consent.settings.enabled': 'Activada',
    'consent.settings.disabled': 'Desactivada',
    'consent.settings.save': 'Guardar preferencias',
    'consent.settings.revoke': 'Revocar consentimiento',
    'consent.settings.close': 'Cerrar',
    'consent.footer.preferences': 'Preferencias de analítica',
  },
  en: {
    'consent.banner.ariaLabel': 'Analytics preferences',
    'consent.banner.title': 'Your privacy matters',
    'consent.banner.description':
      'We use anonymous, aggregated analytics to understand how DatosBizi is used. We do not collect emails, names, or the content of searches and forms. You can change your choice at any time.',
    'consent.banner.accept': 'Accept analytics',
    'consent.banner.reject': 'Reject analytics',
    'consent.banner.settings': 'Configure',
    'consent.settings.title': 'Analytics preferences',
    'consent.settings.description':
      'Analytics is optional. If you reject it, the site works exactly the same and no usage events are sent.',
    'consent.settings.analytics': 'Product analytics (PostHog Cloud EU)',
    'consent.settings.enabled': 'Enabled',
    'consent.settings.disabled': 'Disabled',
    'consent.settings.save': 'Save preferences',
    'consent.settings.revoke': 'Revoke consent',
    'consent.settings.close': 'Close',
    'consent.footer.preferences': 'Analytics preferences',
  },
});
