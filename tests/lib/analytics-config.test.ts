import { describe, expect, it } from 'vitest';
import { resolvePostHogRuntimeConfig } from '@/lib/analytics/config';

describe('PostHog runtime configuration', () => {
  it('stays disabled outside production', () => {
    expect(
      resolvePostHogRuntimeConfig({ NODE_ENV: 'development', POSTHOG_KEY: 'ph_test' })
    ).toBeNull();
    expect(resolvePostHogRuntimeConfig({ POSTHOG_KEY: 'ph_test' })).toBeNull();
  });

  it('stays disabled without an explicit key', () => {
    expect(resolvePostHogRuntimeConfig({ NODE_ENV: 'production' })).toBeNull();
  });

  it('defaults to the EU Cloud hosts', () => {
    expect(resolvePostHogRuntimeConfig({ NODE_ENV: 'production', POSTHOG_KEY: 'ph_test' })).toEqual({
      key: 'ph_test',
      host: 'https://eu.i.posthog.com',
      uiHost: 'https://eu.posthog.com',
    });
  });

  it('accepts explicit https hosts', () => {
    expect(
      resolvePostHogRuntimeConfig({
        NODE_ENV: 'production',
        POSTHOG_KEY: 'ph_test',
        POSTHOG_HOST: 'https://ingest.example.net/prefix',
        POSTHOG_UI_HOST: 'https://app.example.net',
      })
    ).toEqual({
      key: 'ph_test',
      host: 'https://ingest.example.net',
      uiHost: 'https://app.example.net',
    });
  });

  it('rejects non-https hosts instead of sending data to an unsafe origin', () => {
    expect(
      resolvePostHogRuntimeConfig({
        NODE_ENV: 'production',
        POSTHOG_KEY: 'ph_test',
        POSTHOG_HOST: 'http://insecure.example.net',
      })
    ).toBeNull();
  });
});
