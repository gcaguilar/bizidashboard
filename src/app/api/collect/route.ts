import { NextResponse } from 'next/server';
import { runCollection, getJobState, isCollectionScheduled } from '@/jobs/bizi-collection';

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export async function POST() {
  console.log('[API] Collection triggered via POST /api/collect');

  // TODO: Add API key auth for production
  try {
    const result = await runCollection();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'Collection failed',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stationCount: result.stationCount,
      recordedAt: toIsoString(result.recordedAt),
      quality: result.quality,
      duration: result.duration,
      warnings: result.warnings,
      timestamp: result.timestamp.toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Collection failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const state = getJobState();

  return NextResponse.json({
    lastRun: toIsoString(state.lastRun),
    lastSuccess: toIsoString(state.lastSuccess),
    consecutiveFailures: state.consecutiveFailures,
    totalRuns: state.totalRuns,
    totalSuccesses: state.totalSuccesses,
    isScheduled: isCollectionScheduled(),
  });
}
