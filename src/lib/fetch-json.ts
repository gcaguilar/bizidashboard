type FetchJsonOptions = RequestInit & {
  errorMessage?: string;
};

export async function fetchJson<T>(
  input: RequestInfo | URL,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { errorMessage, ...requestInit } = options;
  const response = await fetch(input, requestInit);

  if (!response.ok) {
    throw new Error(errorMessage ?? `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}
