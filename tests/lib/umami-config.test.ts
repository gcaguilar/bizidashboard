import { describe, expect, it } from 'vitest'
import { resolveUmamiRuntimeConfig } from '@/lib/umami-config'

describe('Umami runtime configuration', () => {
  it('resolves canonical runtime variables in production', () => {
    expect(resolveUmamiRuntimeConfig({
      NODE_ENV: 'production',
      UMAMI_SCRIPT_SRC: 'https://cloud.umami.is/script.js',
      UMAMI_WEBSITE_ID: 'website-id',
      UMAMI_HOST_URL: 'https://api-gateway.umami.dev',
    })).toEqual({
      scriptSrc: 'https://cloud.umami.is/script.js',
      websiteId: 'website-id',
      hostUrl: 'https://api-gateway.umami.dev',
    })
  })

  it('does not load analytics outside production or with incomplete configuration', () => {
    expect(resolveUmamiRuntimeConfig({
      NODE_ENV: 'development',
      UMAMI_SCRIPT_SRC: 'https://cloud.umami.is/script.js',
      UMAMI_WEBSITE_ID: 'website-id',
      UMAMI_HOST_URL: 'https://api-gateway.umami.dev',
    })).toBeNull()
    expect(resolveUmamiRuntimeConfig({
      NODE_ENV: 'production',
      UMAMI_WEBSITE_ID: 'website-id',
    })).toBeNull()
  })

  it('keeps temporary Vite and Next aliases for runtime compatibility', () => {
    expect(resolveUmamiRuntimeConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_UMAMI_SCRIPT_SRC: 'https://analytics.example/script.js',
      VITE_UMAMI_WEBSITE_ID: 'legacy-id',
      NEXT_PUBLIC_UMAMI_HOST_URL: 'https://analytics.example',
    })?.websiteId).toBe('legacy-id')
  })
})
