export type LocationSearchLike = {
  searchStr?: string;
  search?: string;
};

export function getLocationSearchParams(location: LocationSearchLike | null | undefined): URLSearchParams {
  const searchString = location?.searchStr ?? location?.search ?? '';
  return new URLSearchParams(searchString);
}
