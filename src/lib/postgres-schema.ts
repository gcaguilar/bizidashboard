import { DEFAULT_CITY } from './constants'

const PG_IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/

export function normalizeDatabaseSchemaName(rawValue?: string): string {
  const schema = (rawValue || DEFAULT_CITY).trim().toLowerCase()

  if (!PG_IDENTIFIER_PATTERN.test(schema)) {
    throw new Error(
      `Invalid CITY value "${rawValue}". Expected a lowercase PostgreSQL identifier matching ${PG_IDENTIFIER_PATTERN.source}.`
    )
  }

  return schema
}

export function quotePgIdentifier(identifier: string): string {
  const normalized = normalizeDatabaseSchemaName(identifier)
  return `"${normalized}"`
}
