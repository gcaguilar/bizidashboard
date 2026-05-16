import { init, captureRequestError } from '@sentry/tanstackstart-react'
import { validateRuntimeConfiguration } from '@/lib/security/config'
import { initJobs, shutdownJobs } from '@/lib/jobs'

init({
  dsn: process.env.VITE_SENTRY_DSN,
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE || '0.2'),
  enabled: process.env.NODE_ENV === 'production',
})

initJobs()

export const onRequestError = captureRequestError

process.on('SIGTERM', () => {
  shutdownJobs()
  process.exit(0)
})

process.on('SIGINT', () => {
  shutdownJobs()
  process.exit(0)
})
