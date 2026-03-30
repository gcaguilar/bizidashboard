import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
    const { initJobs } = await import('@/lib/jobs');
    initJobs();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

/** Server Components / RSC errors (Next.js 15+). */
export const onRequestError = Sentry.captureRequestError;
