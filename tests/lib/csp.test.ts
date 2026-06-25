import { describe, expect, it } from 'vitest';
import {
  buildContentSecurityPolicy,
  getContentSecurityPolicyHeader,
} from '@/lib/security/csp.mjs';

describe('content security policy', () => {
  it('derives exact Umami and Sentry origins from effective configuration', () => {
    const policy = buildContentSecurityPolicy({
      VITE_UMAMI_SCRIPT_SRC: 'https://analytics.example.com/custom/script.js',
      VITE_UMAMI_HOST_URL: 'https://collector.example.net/analytics',
      VITE_UMAMI_WEBSITE_ID: 'site-id',
      SENTRY_DSN: 'https://public-key@errors.example.org/123',
    });

    expect(policy).toContain(
      "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://analytics.example.com"
    );
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

  it('rejects invalid configured URLs', () => {
    expect(() =>
      buildContentSecurityPolicy({ VITE_UMAMI_SCRIPT_SRC: 'javascript:alert(1)' })
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
