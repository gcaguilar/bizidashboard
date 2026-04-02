import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';
import { enforcePublicApiAccess } from '@/lib/security/public-api';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 2000;
const MAX_OFFSET = 20000;
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 20,
  windowMs: 60_000,
};

type AlertState = 'all' | 'active' | 'resolved';
type ExportFormat = 'json' | 'csv';
type AlertTypeValue = 'LOW_BIKES' | 'LOW_ANCHORS';

type ParsedQuery = {
  format: ExportFormat;
  state: AlertState;
  stationId: string | null;
  alertType: AlertTypeValue | null;
  severity: number | null;
  limit: number;
  offset: number;
  from: Date | null;
  to: Date | null;
};

type StationAlertRow = Prisma.StationAlertGetPayload<{
  include: {
    station: {
      select: {
        name: true;
      };
    };
  };
}>;

function parseBoundedInteger(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number | null {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function parseOptionalDate(value: string | null): Date | null {
  if (value === null || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function parseState(value: string | null): AlertState | null {
  if (!value) {
    return 'all';
  }

  if (value === 'all' || value === 'active' || value === 'resolved') {
    return value;
  }

  return null;
}

function parseFormat(value: string | null): ExportFormat | null {
  if (!value) {
    return 'json';
  }

  if (value === 'json' || value === 'csv') {
    return value;
  }

  return null;
}

function parseAlertType(value: string | null): AlertTypeValue | null {
  if (!value || value === 'all') {
    return null;
  }

  if (value === 'LOW_BIKES' || value === 'LOW_ANCHORS') {
    return value;
  }

  return null;
}

function parseSeverity(value: string | null): number | null | undefined {
  if (value === null || value === 'all') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    return undefined;
  }

  return parsed;
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(
  rows: Array<{
    id: number;
    stationId: string;
    stationName: string;
    alertType: string;
    severity: number;
    metricValue: number;
    windowHours: number;
    generatedAt: string;
    isActive: boolean;
  }>
): string {
  const header = [
    'id',
    'stationId',
    'stationName',
    'alertType',
    'severity',
    'metricValue',
    'windowHours',
    'generatedAt',
    'state',
  ].join(',');

  const body = rows
    .map((row) => {
      return [
        row.id,
        row.stationId,
        row.stationName,
        row.alertType,
        row.severity,
        row.metricValue,
        row.windowHours,
        row.generatedAt,
        row.isActive ? 'active' : 'resolved',
      ]
        .map((value) => escapeCsvCell(value))
        .join(',');
    })
    .join('\n');

  return `${header}\n${body}`;
}

function parseQuery(request: NextRequest): ParsedQuery | NextResponse {
  const { searchParams } = new URL(request.url);

  const format = parseFormat(searchParams.get('format'));
  const state = parseState(searchParams.get('state'));
  const alertType = parseAlertType(searchParams.get('alertType'));
  const severity = parseSeverity(searchParams.get('severity'));
  const limit = parseBoundedInteger(searchParams.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = parseBoundedInteger(searchParams.get('offset'), 0, 0, MAX_OFFSET);
  const from = parseOptionalDate(searchParams.get('from'));
  const to = parseOptionalDate(searchParams.get('to'));
  const stationIdRaw = searchParams.get('stationId');
  const stationId = stationIdRaw && stationIdRaw.trim().length > 0 ? stationIdRaw.trim() : null;

  if (format === null) {
    return NextResponse.json(
      { error: 'Invalid format. Use json or csv.' },
      { status: 400 }
    );
  }

  if (state === null) {
    return NextResponse.json(
      { error: 'Invalid state. Use all, active, or resolved.' },
      { status: 400 }
    );
  }

  const alertTypeParam = searchParams.get('alertType');
  if (alertTypeParam && alertTypeParam !== 'all' && !alertType) {
    return NextResponse.json(
      { error: 'Invalid alertType. Use LOW_BIKES, LOW_ANCHORS, or all.' },
      { status: 400 }
    );
  }

  if (severity === undefined) {
    return NextResponse.json(
      { error: 'Invalid severity. Use an integer between 1 and 5.' },
      { status: 400 }
    );
  }

  if (limit === null || offset === null) {
    return NextResponse.json(
      {
        error: `Invalid pagination. limit must be 1..${MAX_LIMIT} and offset must be 0..${MAX_OFFSET}.`,
      },
      { status: 400 }
    );
  }

  if ((searchParams.get('from') && !from) || (searchParams.get('to') && !to)) {
    return NextResponse.json(
      {
        error: 'Invalid date filter. Use ISO date or datetime (for example 2026-03-09 or 2026-03-09T12:00:00Z).',
      },
      { status: 400 }
    );
  }

  if (from && to && from > to) {
    return NextResponse.json(
      { error: 'Invalid date range. from must be before or equal to to.' },
      { status: 400 }
    );
  }

  return {
    format,
    state,
    stationId,
    alertType,
    severity,
    limit,
    offset,
    from,
    to,
  };
}

function buildWhereFilters(query: ParsedQuery): Prisma.StationAlertWhereInput {
  const where: Prisma.StationAlertWhereInput = {};

  if (query.state === 'active') {
    where.isActive = true;
  } else if (query.state === 'resolved') {
    where.isActive = false;
  }

  if (query.stationId) {
    where.stationId = query.stationId;
  }

  if (query.alertType) {
    where.alertType = query.alertType;
  }

  if (query.severity !== null) {
    where.severity = query.severity;
  }

  if (query.from || query.to) {
    where.generatedAt = {
      ...(query.from ? { gte: query.from } : {}),
      ...(query.to ? { lte: query.to } : {}),
    };
  }

  return where;
}

export async function GET(request: NextRequest): Promise<Response> {
  return withApiRequest(
    request,
    {
      route: '/api/alerts/history',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const parsed = parseQuery(request);

      if (parsed instanceof NextResponse) {
        return parsed;
      }

      const access = await enforcePublicApiAccess({
        route: '/api/alerts/history',
        request,
        requestId,
        clientIp,
        userAgent,
        namespace: 'public-alerts-history',
        limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
        windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
        requireApiKey: parsed.format === 'csv' || parsed.limit > 500,
      });

      if (!access.ok) {
        return access.response;
      }

      const where = buildWhereFilters(parsed);

      try {
        const [total, rows] = await Promise.all([
          prisma.stationAlert.count({ where }),
          prisma.stationAlert.findMany({
            where,
            include: {
              station: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: [{ generatedAt: 'desc' }, { id: 'desc' }],
            take: parsed.limit,
            skip: parsed.offset,
          }),
        ]);

        const alerts = rows.map((row: StationAlertRow) => ({
          id: row.id,
          stationId: row.stationId,
          stationName: row.station?.name ?? row.stationId,
          alertType: row.alertType,
          severity: row.severity,
          metricValue: Number(row.metricValue),
          windowHours: row.windowHours,
          generatedAt: row.generatedAt.toISOString(),
          isActive: row.isActive,
        }));

        if (parsed.format === 'csv') {
          const csv = toCsv(alerts);
          const suffix = new Date().toISOString().slice(0, 10);

          return new NextResponse(csv, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="alerts-history-${suffix}.csv"`,
              'Cache-Control': 'no-store',
              ...access.headers,
            },
          });
        }

        return NextResponse.json(
          {
            filters: {
              state: parsed.state,
              stationId: parsed.stationId,
              alertType: parsed.alertType,
              severity: parsed.severity,
              from: parsed.from?.toISOString() ?? null,
              to: parsed.to?.toISOString() ?? null,
            },
            pagination: {
              total,
              limit: parsed.limit,
              offset: parsed.offset,
              returned: alerts.length,
            },
            alerts,
            generatedAt: new Date().toISOString(),
          },
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              ...access.headers,
            },
          }
        );
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.alerts-history',
          operation: 'GET /api/alerts/history',
          extra: {
            format: parsed.format,
            state: parsed.state,
            stationId: parsed.stationId,
            alertType: parsed.alertType,
            severity: parsed.severity,
            limit: parsed.limit,
            offset: parsed.offset,
            from: parsed.from?.toISOString() ?? null,
            to: parsed.to?.toISOString() ?? null,
          },
        });
        logger.error('api.alerts_history.failed', { error });

        return NextResponse.json(
          {
            error: 'Failed to fetch alert history',
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }
  );
}
