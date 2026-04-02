import { getExecutionContext } from '@/lib/request-context';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogRecord = Record<string, unknown>;

function normalizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, normalizeValue(entry)])
    );
  }

  return value;
}

function toLogRecord(value: unknown): LogRecord {
  const normalized = normalizeValue(value);
  if (normalized && typeof normalized === 'object' && !Array.isArray(normalized)) {
    return normalized as LogRecord;
  }
  return {};
}

function emit(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...toLogRecord(getExecutionContext()),
    ...toLogRecord(extra),
  };

  const payload = JSON.stringify(entry);

  switch (level) {
    case 'debug':
      console.debug(payload);
      return;
    case 'warn':
      console.warn(payload);
      return;
    case 'error':
      console.error(payload);
      return;
    default:
      console.log(payload);
  }
}

export const logger = {
  debug(message: string, extra?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      emit('debug', message, extra);
    }
  },
  info(message: string, extra?: Record<string, unknown>): void {
    emit('info', message, extra);
  },
  warn(message: string, extra?: Record<string, unknown>): void {
    emit('warn', message, extra);
  },
  error(message: string, extra?: Record<string, unknown>): void {
    emit('error', message, extra);
  },
};

