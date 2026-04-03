import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/rebalancing-report', () => ({
  buildRebalancingReport: vi.fn().mockResolvedValue({
    diagnostics: [],
    transfers: [],
  }),
}));

import { GET } from '@/app/api/rebalancing-report/route';

describe('API rebalancing-report', () => {
  it('returns JSON format by default', async () => {
    const req = new NextRequest('http://localhost/api/rebalancing-report?days=10');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');

    const body = await res.json();
    expect(body.diagnostics).toEqual([]);
  });

  it('returns CSV format when requested', async () => {
    const req = new NextRequest('http://localhost/api/rebalancing-report?format=csv');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
  });
});
