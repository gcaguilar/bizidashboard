import { NextRequest, NextResponse } from 'next/server';
import { buildRebalancingReport } from '@/lib/rebalancing-report';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import type { StationDiagnostic, TransferRecommendation } from '@/types/rebalancing';

export const dynamic = 'force-dynamic';

const MAX_DAYS = 90;
const DEFAULT_DAYS = 15;

// ─── Parameter validation ────────────────────────────────────────────────────

function parseDays(value: string | null): number | null {
  if (value === null) return DEFAULT_DAYS;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DAYS) return null;
  return parsed;
}

// ─── CSV serialisation ───────────────────────────────────────────────────────

function escapeCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function toCsvDiagnostics(rows: StationDiagnostic[]): string {
  const headers = [
    'stationId',
    'stationName',
    'districtName',
    'capacity',
    'currentBikes',
    'currentAnchors',
    'currentOccupancy',
    'inferredType',
    'classification',
    'actionGroup',
    'urgency',
    'priorityScore',
    'targetBandMin',
    'targetBandMax',
    'occupancyAvg',
    'pctTimeEmpty',
    'pctTimeFull',
    'rotation',
    'persistenceProxy',
    'riskEmptyAt1h',
    'riskFullAt1h',
    'selfCorrectionProbability',
    'estimatedRecoveryMinutes',
    'classificationReasons',
    'actionReasons',
  ];

  const values = rows.map((row) => [
    row.stationId,
    row.stationName,
    row.districtName ?? '',
    row.capacity,
    row.currentBikes,
    row.currentAnchors,
    row.currentOccupancy.toFixed(3),
    row.inferredType,
    row.classification,
    row.actionGroup,
    row.urgency,
    row.priorityScore.toFixed(3),
    row.targetBand.min,
    row.targetBand.max,
    row.globalMetrics.occupancyAvg.toFixed(3),
    row.globalMetrics.pctTimeEmpty.toFixed(3),
    row.globalMetrics.pctTimeFull.toFixed(3),
    row.globalMetrics.rotation.toFixed(0),
    row.globalMetrics.persistenceProxy.toFixed(3),
    row.risk.riskEmptyAt1h.toFixed(3),
    row.risk.riskFullAt1h.toFixed(3),
    row.risk.selfCorrectionProbability.toFixed(3),
    row.risk.estimatedRecoveryMinutes ?? '',
    row.classificationReasons.join(' | '),
    row.actionReasons.join(' | '),
  ]);

  return [headers, ...values]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');
}

function toCsvTransfers(rows: TransferRecommendation[]): string {
  const headers = [
    'originStationId',
    'originStationName',
    'destinationStationId',
    'destinationStationName',
    'bikesToMove',
    'timeWindowStart',
    'timeWindowEnd',
    'matchScore',
    'confidence',
    'emptiesAvoided',
    'fullsAvoided',
    'usesRecovered',
    'costScore',
    'reasons',
  ];

  const values = rows.map((row) => [
    row.originStationId,
    row.originStationName,
    row.destinationStationId,
    row.destinationStationName,
    row.bikesToMove,
    row.timeWindow.start,
    row.timeWindow.end,
    row.matchScore.toFixed(3),
    row.confidence.toFixed(3),
    row.expectedImpact.emptiesAvoided.toFixed(2),
    row.expectedImpact.fullsAvoided.toFixed(2),
    row.expectedImpact.usesRecovered.toFixed(2),
    row.expectedImpact.costScore.toFixed(3),
    row.reasons.join(' | '),
  ]);

  return [headers, ...values]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const district = searchParams.get('district')?.trim() || null;
  const format = searchParams.get('format');
  const daysParam = searchParams.get('days');

  const days = parseDays(daysParam);
  if (days === null) {
    return NextResponse.json(
      { error: `Invalid days parameter. Must be an integer between 1 and ${MAX_DAYS}.`, dataState: 'error' },
      { status: 400 }
    );
  }

  if (format !== null && format !== 'json' && format !== 'csv') {
    return NextResponse.json(
      { error: 'Invalid format. Use json or csv.', dataState: 'error' },
      { status: 400 }
    );
  }

  try {
    const report = await buildRebalancingReport({ days, district });

    if (format === 'csv') {
      const diagCsv = toCsvDiagnostics(report.diagnostics);
      const transfersCsv = toCsvTransfers(report.transfers);
      const combined = `# DIAGNOSTICOS\n${diagCsv}\n\n# TRANSFERENCIAS\n${transfersCsv}`;

      return new NextResponse(combined, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="rebalancing-report-${days}d.csv"`,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        },
      });
    }

    return NextResponse.json(report, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'api.rebalancing-report',
      operation: 'GET /api/rebalancing-report',
      extra: { days, district, format },
    });
    console.error('[API Rebalancing] Error building report:', error);

    return NextResponse.json(
      { error: 'Failed to build rebalancing report', timestamp: new Date().toISOString(), dataState: 'error' },
      { status: 500 }
    );
  }
}
