import { withCache as _withCache } from '@/lib/cache/cache';

export type CacheTTL = {
  live: number;
  analytics: number;
};

const DEFAULT_TTL: CacheTTL = {
  live: 60,
  analytics: 300,
};

export class DataCache {
  private ttl: CacheTTL;

  constructor(ttl?: Partial<CacheTTL>) {
    this.ttl = { ...DEFAULT_TTL, ...ttl };
  }

  async get<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    return _withCache(key, ttlSeconds, fetcher);
  }

  async live<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    return _withCache(key, this.ttl.live, fetcher);
  }

  async analytics<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    return _withCache(key, this.ttl.analytics, fetcher);
  }
}
