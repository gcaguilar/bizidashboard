export function writeJsonStorageItem(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota exceeded and private browsing failures.
  }
}
