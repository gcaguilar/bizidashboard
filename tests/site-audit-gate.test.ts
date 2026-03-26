import { describe, expect, it } from 'vitest';
import {
  evaluateSiteAuditReport,
  findCriticalOrphanPages,
  type AuditReport,
} from '@/lib/site-audit-report';

function createReport(overrides?: Partial<AuditReport>): AuditReport {
  return {
    generated_at: '2026-03-26T10:00:00.000Z',
    base_url: 'https://datosbizi.com',
    summary: {
      crawled_pages: 10,
      checked_urls: 12,
      sitemap_entries: 8,
    },
    broken_links: [],
    redirects: [],
    orphan_pages: [],
    sitemap_mismatch: {
      broken_entries: [],
      redirected_entries: [],
      missing_from_sitemap: [],
    },
    inconsistent_data_pages: [],
    stale_pages: [],
    pages_with_no_data: [],
    api_vs_frontend_diff: [],
    api_errors: [],
    ...overrides,
  };
}

describe('site audit gate', () => {
  it('passes when the report only contains non-blocking warnings', () => {
    const result = evaluateSiteAuditReport(
      createReport({
        redirects: [
          {
            url: 'https://datosbizi.com/inicio',
            finalUrl: 'https://datosbizi.com/',
            finalStatus: 200,
            redirects: [
              {
                url: 'https://datosbizi.com/inicio',
                status: 301,
                location: 'https://datosbizi.com/',
              },
            ],
            sources: ['__seed__'],
          },
        ],
        pages_with_no_data: [
          {
            page: 'https://datosbizi.com/comparar',
            reason: 'Todavia no hay historico suficiente.',
          },
        ],
      })
    );

    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('fails on broken links, sitemap mismatches and api errors', () => {
    const result = evaluateSiteAuditReport(
      createReport({
        broken_links: [
          {
            source: 'https://datosbizi.com/',
            href: '/rota',
            target: 'https://datosbizi.com/rota',
            finalUrl: 'https://datosbizi.com/rota',
            status: 404,
            redirects: [],
            reason: 'HTTP 404',
          },
        ],
        sitemap_mismatch: {
          broken_entries: [
            {
              url: 'https://datosbizi.com/rota',
              reason: 'HTTP 404',
            },
          ],
          redirected_entries: [],
          missing_from_sitemap: [],
        },
        api_errors: [
          {
            endpoint: 'https://datosbizi.com/api/status',
            status: 500,
            reason: 'HTTP 500',
          },
        ],
      })
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toContain('1 enlaces internos rotos.');
    expect(result.failures).toContain('1 entradas del sitemap devuelven error.');
    expect(result.failures).toContain('1 endpoints criticos de API fallan.');
  });

  it('classifies critical orphan pages from the canonical route set', () => {
    const report = createReport({
      orphan_pages: [
        {
          url: 'https://datosbizi.com/estado',
          reason: 'Sin enlaces internos.',
        },
        {
          url: 'https://datosbizi.com/barrios/delicias',
          reason: 'Sin enlaces internos.',
        },
      ],
    });

    expect(findCriticalOrphanPages(report)).toEqual([
      {
        url: 'https://datosbizi.com/estado',
        reason: 'Sin enlaces internos.',
      },
    ]);

    const result = evaluateSiteAuditReport(report);
    expect(result.ok).toBe(false);
    expect(result.failures).toContain('1 paginas huerfanas criticas.');
  });
});
