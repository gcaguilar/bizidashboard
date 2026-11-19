import { describe, expect, it } from 'vitest';
import {
  buildContentSecurityPolicy,
  getContentSecurityPolicyHeader,
} from '@/lib/security/csp.mjs';

describe('content security policy', () => {
  it('allows PostHog EU ingestion and asset origins only when a key is configured', () => {
    const withoutKey = buildContentSecurityPolicy({});
    expect(withoutKey).not.toContain('posthog.com');

    const policy = buildContentSecurityPolicy({
      POSTHOG_KEY: 'ph_project_token',
      POSTHOG_HOST: 'https://eu.i.posthog.com',
      SENTRY_DSN: 'https://public-key@errors.example.org/123',
    });

    expect(policy).toContain('https://eu.i.posthog.com');
    expect(policy).toContain('https://eu-assets.i.posthog.com');
    expect(policy).toContain('https://errors.example.org');
    expect(policy).not.toContain('cloud.umami.is');
    expect(policy).not.toContain('api-gateway.umami.dev');
    expect(policy).not.toContain('*.ingest.sentry.io');
  });

  it('derives the configured PostHog host origin and removes duplicates', () => {
    const policy = buildContentSecurityPolicy({
      POSTHOG_KEY: 'ph_project_token',
      POSTHOG_HOST: 'https://ingest.example.net/custom/path',
      CSP_CONNECT_SRC_ORIGINS: 'https://ingest.example.net',
    });

    expect(policy.match(/https:\/\/ingest\.example\.net/g)).toHaveLength(2);
  });

  it('supports controlled additional origins and removes duplicates', () => {
    const policy = buildContentSecurityPolicy({
      CSP_SCRIPT_SRC_ORIGINS: 'https://cdn.example.com, https://cdn.example.com/path',
      CSP_CONNECT_SRC_ORIGINS: 'https://api.example.com',
    });

    expect(policy.match(/https:\/\/cdn\.example\.com/g)).toHaveLength(1);
    expect(policy).toContain('https://api.example.com');
  });

  it('allows the tally feedback iframe by default', () => {
    const policy = buildContentSecurityPolicy({});

    expect(policy).toContain("frame-src 'self' https://tally.so");
  });

  it('frames the configured feedback origin and controlled extra origins without duplicates', () => {
    const policy = buildContentSecurityPolicy({
      NEXT_PUBLIC_FEEDBACK_URL: 'https://forms.example.com/embed/abc',
      CSP_FRAME_SRC_ORIGINS: 'https://frames.example.net, https://forms.example.com/otra',
    });

    expect(policy).toContain('https://forms.example.com');
    expect(policy).toContain('https://frames.example.net');
    expect(policy.match(/https:\/\/forms\.example\.com/g)).toHaveLength(1);
  });

  it('ignores an invalid feedback url instead of failing startup', () => {
    const policy = buildContentSecurityPolicy({
      NEXT_PUBLIC_FEEDBACK_URL: 'not-a-url',
    });

    expect(policy).toContain("frame-src 'self' https://tally.so");
  });

  it('rejects invalid configured URLs', () => {
    expect(() =>
      buildContentSecurityPolicy({
        POSTHOG_KEY: 'ph_project_token',
        POSTHOG_HOST: 'javascript:alert(1)',
      })
    ).toThrow(/http or https/);
    expect(() =>
      buildContentSecurityPolicy({ CSP_CONNECT_SRC_ORIGINS: 'not-a-url' })
    ).toThrow(/valid absolute URL/);
  });

  it('uses report-only only when explicitly enabled', () => {
    expect(getContentSecurityPolicyHeader({ CSP_REPORT_ONLY: 'true' })).toBe(
      'Content-Security-Policy-Report-Only'
    );
    expect(getContentSecurityPolicyHeader({ CSP_REPORT_ONLY: 'false' })).toBe(
      'Content-Security-Policy'
    );
  });
});
