import { serverHandlers } from '@tests/helpers/route-handlers';
import { buildMonthlyReportFixture } from '@tests/helpers/monthly-report-fixture';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  buildMonthlyReportMock,
  isClosedReportMonthMock,
  getStoredMonthlyReportPdfMock,
  storeMonthlyReportPdfMock,
  renderMonthlyReportPagePdfMock,
} = vi.hoisted(() => ({
  buildMonthlyReportMock: vi.fn(),
  isClosedReportMonthMock: vi.fn(),
  getStoredMonthlyReportPdfMock: vi.fn(),
  storeMonthlyReportPdfMock: vi.fn(),
  renderMonthlyReportPagePdfMock: vi.fn(),
}));

vi.mock('@/lib/monthly-report', () => ({
  buildMonthlyReport: buildMonthlyReportMock,
  isClosedReportMonth: isClosedReportMonthMock,
}));

vi.mock('@/lib/monthly-report-pdf-store', () => ({
  getStoredMonthlyReportPdf: getStoredMonthlyReportPdfMock,
  storeMonthlyReportPdf: storeMonthlyReportPdfMock,
}));

vi.mock('@/lib/monthly-report-page-pdf', () => ({
  renderMonthlyReportPagePdf: renderMonthlyReportPagePdfMock,
}));

import { Route } from '@/app/api/reports/index';

const handler = serverHandlers(Route).GET!
const STORED_PDF = new Uint8Array(Buffer.from('%PDF-stored'))

describe('GET /api/reports', () => {
  beforeEach(() => {
    buildMonthlyReportMock.mockReset();
    buildMonthlyReportMock.mockResolvedValue(buildMonthlyReportFixture());
    isClosedReportMonthMock.mockReset();
    isClosedReportMonthMock.mockReturnValue(true);
    getStoredMonthlyReportPdfMock.mockReset();
    getStoredMonthlyReportPdfMock.mockResolvedValue(STORED_PDF);
    storeMonthlyReportPdfMock.mockReset();
    storeMonthlyReportPdfMock.mockResolvedValue(undefined);
    renderMonthlyReportPagePdfMock.mockReset();
    renderMonthlyReportPagePdfMock.mockResolvedValue(
      new Uint8Array(Buffer.from('%PDF-rendered'))
    );
  });

  it('returns the report payload as json with cache headers', async () => {
    const response = await handler({
      request: new Request('http://localhost/api/reports?month=2026-03'),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toContain('max-age=300');
    expect(payload.monthKey).toBe('2026-03');
    expect(buildMonthlyReportMock).toHaveBeenCalledWith('2026-03', expect.any(String));
  });

  it('exports the whole report as one csv document', async () => {
    const response = await handler({
      request: new Request('http://localhost/api/reports?month=2026-03&format=csv'),
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('csv');
    expect(response.headers.get('Content-Disposition')).toContain('informe-2026-03.csv');
    expect(body).toContain('"Resumen"');
    expect(body).toContain('"Barrios"');
    expect(body).toContain('"Picos anómalos"');
    expect(body).toContain('"Delicias"');
  });

  it('exports a single section when section is given', async () => {
    const response = await handler({
      request: new Request(
        'http://localhost/api/reports?month=2026-03&format=csv&section=barrios'
      ),
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Disposition')).toContain('informe-2026-03-barrios.csv');
    expect(body).toContain('"Barrios"');
    expect(body).toContain('"Delicias"');
    expect(body).not.toContain('"Resumen"');
  });

  it('serves the stored pdf when the month is sealed', async () => {
    const response = await handler({
      request: new Request('http://localhost/api/reports?month=2026-03&format=pdf'),
    });
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('informe-2026-03.pdf');
    expect(response.headers.get('X-Report-Pdf')).toBe('page');
    expect(bytes).toEqual(STORED_PDF);
    expect(renderMonthlyReportPagePdfMock).not.toHaveBeenCalled();
  });

  it('renders and stores the pdf when it does not exist yet', async () => {
    getStoredMonthlyReportPdfMock.mockResolvedValue(null);

    const response = await handler({
      request: new Request('http://localhost/api/reports?month=2026-03&format=pdf'),
    });
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
    expect(response.headers.get('X-Report-Pdf')).toBe('page');
    expect(renderMonthlyReportPagePdfMock).toHaveBeenCalledWith('2026-03');
    expect(storeMonthlyReportPdfMock).toHaveBeenCalledWith(
      '2026-03',
      expect.any(Uint8Array)
    );
  });

  it('falls back to the table pdf if the page render fails', async () => {
    getStoredMonthlyReportPdfMock.mockResolvedValue(null);
    renderMonthlyReportPagePdfMock.mockRejectedValue(new Error('browser unavailable'));

    const response = await handler({
      request: new Request('http://localhost/api/reports?month=2026-03&format=pdf'),
    });
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
    expect(response.headers.get('X-Report-Pdf')).toBe('table');
    expect(storeMonthlyReportPdfMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid month', async () => {
    const response = await handler({
      request: new Request('http://localhost/api/reports?month=2026-13'),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('Invalid month');
    expect(buildMonthlyReportMock).not.toHaveBeenCalled();
  });

  it('rejects an unknown section', async () => {
    const response = await handler({
      request: new Request(
        'http://localhost/api/reports?month=2026-03&format=csv&section=no-existe'
      ),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('Unknown section');
    expect(buildMonthlyReportMock).not.toHaveBeenCalled();
  });
});
