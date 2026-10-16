import './instrument.server'

import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { wrapFetchWithSentry } from '@sentry/tanstackstart-react'
import { validateRuntimeConfiguration } from '@/lib/security/config'

// Fail fast on invalid production configuration, once, on the first request.
// (Kept out of module top-level evaluation so build-time prerendering and
// non-production environments are unaffected.)
let runtimeConfigurationValidated = false
function ensureRuntimeConfiguration(): void {
  if (runtimeConfigurationValidated) {
    return
  }
  runtimeConfigurationValidated = true
  validateRuntimeConfiguration()
}

export default createServerEntry(
  wrapFetchWithSentry({
    fetch(request: Request) {
      ensureRuntimeConfiguration()
      return handler.fetch(request)
    },
  }),
)
