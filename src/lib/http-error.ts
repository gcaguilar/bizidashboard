/**
 * HTTP status helpers shared by server functions and Sentry reporting.
 *
 * TanStack Start derives the response status of an uncaught server function
 * error from `error.status`/`error.statusCode` (or its `cause`), so attaching a
 * status is how a validation failure becomes a 4xx instead of a 500.
 */
export function getHttpErrorStatus(error: unknown): number | undefined {
  if (error instanceof Response) {
    return error.status;
  }

  const candidates = [
    error,
    (error as { cause?: unknown } | null | undefined)?.cause,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') {
      continue;
    }
    if (candidate instanceof Response) {
      return candidate.status;
    }
    const { status, statusCode } = candidate as {
      status?: unknown;
      statusCode?: unknown;
    };
    for (const value of [status, statusCode]) {
      if (typeof value === 'number' && value >= 400 && value <= 599) {
        return value;
      }
    }
  }

  return undefined;
}

/** True for errors that describe a bad request rather than a server failure. */
export function isClientError(error: unknown): boolean {
  // TanStack Router's `notFound()` marker: a missing resource, not a failure.
  if ((error as { isNotFound?: unknown } | null | undefined)?.isNotFound === true) {
    return true;
  }
  const status = getHttpErrorStatus(error);
  return status !== undefined && status < 500;
}

/** Error carrying an HTTP status so TanStack Start can answer with a 4xx. */
export function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), {
    name: 'HttpError',
    status,
  });
}
