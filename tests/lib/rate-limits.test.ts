import { describe, it, expect } from 'vitest';
import { RATE_LIMITS, getRateLimitPreset, type RateLimitPreset } from '@/lib/security/rate-limits';

describe('rate-limits', () => {
  describe('RATE_LIMITS', () => {
    it('has public presets', () => {
      expect(RATE_LIMITS.public).toHaveProperty('default');
      expect(RATE_LIMITS.public).toHaveProperty('highTraffic');
      expect(RATE_LIMITS.public).toHaveProperty('lowTraffic');
    });

    it('has mobile presets', () => {
      expect(RATE_LIMITS.mobile).toHaveProperty('default');
      expect(RATE_LIMITS.mobile).toHaveProperty('sensitive');
      expect(RATE_LIMITS.mobile).toHaveProperty('geocoding');
    });

    it('has ops presets', () => {
      expect(RATE_LIMITS.ops).toHaveProperty('admin');
      expect(RATE_LIMITS.ops).toHaveProperty('collect');
      expect(RATE_LIMITS.ops).toHaveProperty('sentryTest');
    });

    it('has correct default public limit', () => {
      expect(RATE_LIMITS.public.default.limit).toBe(30);
      expect(RATE_LIMITS.public.default.windowMs).toBe(60_000);
    });

    it('has correct highTraffic limit', () => {
      expect(RATE_LIMITS.public.highTraffic.limit).toBe(40);
    });

    it('has correct lowTraffic limit', () => {
      expect(RATE_LIMITS.public.lowTraffic.limit).toBe(20);
    });

    it('has correct mobile sensitive limit', () => {
      expect(RATE_LIMITS.mobile.sensitive.limit).toBe(10);
      expect(RATE_LIMITS.mobile.sensitive.windowMs).toBe(300_000); // 5 min
    });

    it('has correct ops admin limit', () => {
      expect(RATE_LIMITS.ops.admin.limit).toBe(10);
    });
  });

  describe('getRateLimitPreset', () => {
    it('returns default preset', () => {
      const preset = getRateLimitPreset('default');
      expect(preset).toEqual({ limit: 30, windowMs: 60_000 });
    });

    it('returns highTraffic preset', () => {
      const preset = getRateLimitPreset('highTraffic');
      expect(preset).toEqual({ limit: 40, windowMs: 60_000 });
    });

    it('returns lowTraffic preset', () => {
      const preset = getRateLimitPreset('lowTraffic');
      expect(preset).toEqual({ limit: 20, windowMs: 60_000 });
    });
  });
});