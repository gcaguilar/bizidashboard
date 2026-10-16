import { useCallback, useRef, useSyncExternalStore } from 'react';

// Los valores derivados de localStorage se leen con `useSyncExternalStore` en
// lugar de un efecto + setState: así el render del cliente parte del snapshot
// del servidor durante la hidratación y evita el parpadeo y el re-render en
// cascada que la regla `react/set-state-in-effect` detecta.
const STORAGE_CHANGE_EVENT = 'bizidashboard:storage-change';

function emitStorageChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
}

export function readStorageText(key: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageText(key: string, value: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore quota exceeded and private browsing failures.
  }

  emitStorageChange();
}

export function parseJsonStringArray(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
  } catch {
    return [];
  }
}

export function subscribeToStorage(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(STORAGE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(STORAGE_CHANGE_EVENT, onStoreChange);
  };
}

export function useStorageValue<T>(
  key: string,
  parse: (raw: string | null) => T,
  serverValue: T,
): T {
  const cacheRef = useRef<{ raw: string | null; value: T } | null>(null);

  const getSnapshot = useCallback((): T => {
    const raw = readStorageText(key);

    if (!cacheRef.current || cacheRef.current.raw !== raw) {
      cacheRef.current = { raw, value: parse(raw) };
    }

    return cacheRef.current.value;
  }, [key, parse]);

  const getServerSnapshot = useCallback((): T => serverValue, [serverValue]);

  return useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);
}

const subscribeToNothing = (): (() => void) => () => {};
const getIsHydrated = (): boolean => true;
const getIsServer = (): boolean => false;

export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribeToNothing, getIsHydrated, getIsServer);
}
