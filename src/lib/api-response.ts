import { NextResponse } from 'next/server';

export type DataState = 'ok' | 'warning' | 'error' | 'stale';

export interface ErrorResponse {
  error: string;
  timestamp: string;
  dataState: 'error';
  requestId?: string;
}

export interface WarningResponse {
  warning: string;
  timestamp: string;
  dataState: 'warning';
  requestId?: string;
}

export function errorResponse(message: string, status = 500, requestId?: string): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      timestamp: new Date().toISOString(),
      dataState: 'error',
      ...(requestId && { requestId }),
    },
    { status }
  );
}

export function warningResponse(message: string, requestId?: string): NextResponse<WarningResponse> {
  return NextResponse.json(
    {
      warning: message,
      timestamp: new Date().toISOString(),
      dataState: 'warning',
      ...(requestId && { requestId }),
    },
    { status: 200 }
  );
}

export function okResponse<T>(data: T, requestId?: string): NextResponse<T> {
  return NextResponse.json(data, {
    headers: requestId ? { 'X-Request-ID': requestId } : undefined,
  });
}