/**
 * Shared date utility functions for analytics queries
 */

/**
 * Parses a bucket start value from string or Date to Date object.
 * Handles ISO format strings and PostgreSQL timestamp strings.
 * 
 * @param value - The value to parse (Date object or string)
 * @returns Parsed Date object
 */
export function parseBucketStart(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  // Handle ISO format (contains 'T')
  if (value.includes('T')) {
    return new Date(value);
  }

  // Handle PostgreSQL format (space-separated) by converting to ISO
  return new Date(value.replace(' ', 'T') + 'Z');
}

/**
 * Validates that a string is a valid ISO date format
 * 
 * @param value - String to validate
 * @returns True if valid ISO date string
 */
export function isValidIsoDate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Formats a Date to PostgreSQL timestamp format
 * 
 * @param date - Date to format
 * @returns PostgreSQL timestamp string
 */
export function toPostgresTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}