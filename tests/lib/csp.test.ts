import { describe, expect, it } from 'vitest';
import {
  buildContentSecurityPolicy,
  getContentSecurityPolicyHeader,
} from '@/lib/security/csp.mjs';

describe('content security policy', () => {
  it('derives exact Umami and Sentry origins from effective configuration', () => {
    const policy = buildContentSecurityPolicy({
      UMAMI_SCRIPT_SRC: 'https://analytics.example.com/custom/script.js',
      UMAMI_HOST_URL: 'https://collector.example.net/analytics',
      UMAMI_WEBSITE_ID: 'site-id',
      SENTRY_DSN: 'https://public-key@errors.example.org/123',
    });

    expect(policy).toContain(
      "script-src 'self' 'unsafe-inline' https://analytics.example.com"
    );
    expect(policy).not.toContain('fonts.googleapis.com');
    expect(policy).not.toContain('fonts.gstatic.com');
    expect(policy).toContain('https://collector.example.net');
    expect(policy).toContain('https://errors.example.org');
    expect(policy).not.toContain('cloud.umami.is');
    expect(policy).not.toContain('*.ingest.sentry.io');
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
      buildContentSecurityPolicy({ UMAMI_SCRIPT_SRC: 'javascript:alert(1)' })
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
