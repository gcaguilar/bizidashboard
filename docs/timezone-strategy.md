# Timezone Strategy (Europe/Madrid)

## Goals

- Store all timestamps in UTC (offset 0) to avoid DST ambiguity.
- Convert to Europe/Madrid only for display and local-time input handling.
- Detect DST transitions to prevent missing or duplicated hours.

## Storage Policy

- Persist timestamps as ISO 8601 UTC strings (e.g., `2024-03-31T01:00:00.000Z`).
- Use `toUTC(date)` for normalization when timestamps already represent real instants.
- Use `normalizeForStorage(date)` for user-entered local wall times.

## Display Policy

- Use `toEuropeMadrid(date)` for UI display.
- Output includes the time zone abbreviation and offset, e.g.:
  - `2024-01-15 10:15:00 CET (+01:00)`
  - `2024-07-15 10:15:00 CEST (+02:00)`

## DST Transition Rules (Europe/Madrid)

- **Spring forward:** Last Sunday of March at 02:00 local time → 03:00.
  - Local times from 02:00 to 02:59 do **not** exist.
- **Fall back:** Last Sunday of October at 03:00 local time → 02:00.
  - Local times from 02:00 to 02:59 occur **twice**.

## Ambiguous/Missing Handling

- `isMissingHour(date)` detects non-existent local times in spring.
- `isAmbiguousHour(date)` detects repeated times in fall.
- `normalizeForStorage(date)` resolves edge cases:
  - Missing hour → moves to the first valid instant (03:00 local).
  - Ambiguous hour → chooses the first occurrence (still in CEST).

## Integration Notes (Plan 04)

- Ingestion pipelines should call `normalizeForStorage` when parsing local timestamps.
- Database writes should always use UTC ISO strings.
- UI rendering should use `toEuropeMadrid` for consistent display.
- When comparing by local time (e.g., charts), convert UTC to Europe/Madrid at query time.
