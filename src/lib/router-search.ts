export function getLocationSearchParams(location: { searchStr?: string; search?: unknown } | null | undefined): URLSearchParams {
  const raw = location?.searchStr ?? (typeof location?.search === 'string' ? location?.search : '');
  return new URLSearchParams(raw ?? '');
}
