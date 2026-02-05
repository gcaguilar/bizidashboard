/**
 * Retry utility with exponential backoff and jitter
 * 
 * Provides resilient HTTP request handling with automatic retry
 * for transient failures (network errors, 5xx, 429 rate limit).
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 5) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number;
}

/**
 * Sleep helper for delays and testing
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 * - Network errors (TypeError from fetch)
 * - 5xx server errors
 * - 429 rate limit errors
 */
function isRetryableError(error: unknown): boolean {
  // Network errors from fetch throw TypeError
  if (error instanceof TypeError) {
    return true;
  }

  // HTTP errors with status code
  if (error instanceof Response) {
    const status = error.status;
    // Retry on 5xx server errors and 429 rate limit
    return status >= 500 || status === 429;
  }

  return false;
}

/**
 * Extract status code from error for logging
 */
function getErrorStatus(error: unknown): number | string {
  if (error instanceof Response) {
    return error.status;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return 'unknown';
}

/**
 * Execute a function with exponential backoff retry
 * 
 * @param fn - Function to execute (should return a Promise)
 * @param options - Retry configuration
 * @returns Promise resolving to function result
 * @throws Last error encountered if all retries exhausted
 * 
 * @example
 * ```typescript
 * const data = await withRetry(() => fetch(url).then(r => r.json()));
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 5, baseDelay = 1000 } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry non-retryable errors (4xx except 429)
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      // Add jitter (0-1000ms random) to prevent thundering herd
      const jitter = Math.random() * 1000;
      const delay = exponentialDelay + jitter;
      
      console.warn(
        `[retry] Attempt ${attempt + 1}/${maxRetries + 1} failed ` +
        `(${getErrorStatus(error)}). Retrying in ${Math.round(delay)}ms...`
      );
      
      await sleep(delay);
    }
  }
  
  // All retries exhausted
  throw lastError;
}
