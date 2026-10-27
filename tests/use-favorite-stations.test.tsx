import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FAVORITES_STORAGE_KEY,
  parseFavoriteIds,
  pruneFavoriteIds,
  pruneStoredFavorites,
  toggleFavoriteId,
  toggleStoredFavorite,
  useFavoriteStations,
} from '@/lib/use-favorite-stations';

function installFakeWindow(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const dispatchEvent = vi.fn();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  };
  vi.stubGlobal('window', { localStorage, dispatchEvent });
  return { store, dispatchEvent };
}

describe('parseFavoriteIds', () => {
  it('devuelve vacío con null, JSON inválido o que no es array', () => {
    expect(parseFavoriteIds(null)).toEqual([]);
    expect(parseFavoriteIds('{no json')).toEqual([]);
    expect(parseFavoriteIds('{"a":1}')).toEqual([]);
  });

  it('filtra no strings, recorta, descarta vacíos y duplicados', () => {
    expect(parseFavoriteIds(JSON.stringify(['1', ' 2 ', 3, '', '1', null]))).toEqual(['1', '2']);
  });
});

describe('toggleFavoriteId', () => {
  it('añade y quita sin mutar la entrada', () => {
    const base = ['1'];
    expect(toggleFavoriteId(base, '2')).toEqual(['1', '2']);
    expect(toggleFavoriteId(['1', '2'], '1')).toEqual(['2']);
    expect(base).toEqual(['1']);
  });

  it('ignora ids vacíos', () => {
    expect(toggleFavoriteId(['1'], '  ')).toEqual(['1']);
  });
});

describe('toggleStoredFavorite', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('es un no-op en servidor (sin window)', () => {
    expect(() => toggleStoredFavorite('1')).not.toThrow();
  });

  it('persiste en localStorage y notifica a los suscriptores', () => {
    const { store, dispatchEvent } = installFakeWindow();

    toggleStoredFavorite('7');
    expect(JSON.parse(store.get(FAVORITES_STORAGE_KEY) ?? '[]')).toEqual(['7']);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);

    toggleStoredFavorite('7');
    expect(JSON.parse(store.get(FAVORITES_STORAGE_KEY) ?? '[]')).toEqual([]);
  });

  it('se recupera de datos corruptos en el almacenamiento', () => {
    const { store } = installFakeWindow({ [FAVORITES_STORAGE_KEY]: 'corrupto' });
    toggleStoredFavorite('3');
    expect(JSON.parse(store.get(FAVORITES_STORAGE_KEY) ?? '[]')).toEqual(['3']);
  });
});

describe('useFavoriteStations en SSR', () => {
  it('renderiza siempre sin favoritas (sin hydration mismatch)', () => {
    function Probe() {
      const { favoriteStationIds } = useFavoriteStations();
      return <span>{favoriteStationIds.length}</span>;
    }

    expect(renderToString(<Probe />)).toContain('>0<');
  });
});

describe('pruneFavoriteIds', () => {
  it('quita ids que ya no existen y conserva el orden', () => {
    expect(pruneFavoriteIds(['3', '1', '9'], ['1', '2', '3'])).toEqual(['3', '1']);
  });

  it('devuelve la misma referencia si no cambia nada', () => {
    const current = ['1', '2'];
    expect(pruneFavoriteIds(current, ['1', '2', '3'])).toBe(current);
  });

  it('no borra nada si la red llega vacía', () => {
    const current = ['1'];
    expect(pruneFavoriteIds(current, [])).toBe(current);
  });
});

describe('pruneStoredFavorites', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('persiste solo cuando hay ids obsoletos', () => {
    const { store, dispatchEvent } = installFakeWindow({
      [FAVORITES_STORAGE_KEY]: JSON.stringify(['1', '9']),
    });
    pruneStoredFavorites(['1', '2']);
    expect(JSON.parse(store.get(FAVORITES_STORAGE_KEY) as string)).toEqual(['1']);
    const calls = dispatchEvent.mock.calls.length;
    pruneStoredFavorites(['1', '2']);
    expect(dispatchEvent.mock.calls.length).toBe(calls);
  });
});
