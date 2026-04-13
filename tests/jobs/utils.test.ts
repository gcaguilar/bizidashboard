import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureLockRefreshed, type RefreshableLock } from '@/jobs/utils';

describe('jobs/utils', () => {
  describe('ensureLockRefreshed', () => {
    let mockLock: RefreshableLock;
    
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('succeeds when lock refresh returns true', async () => {
      mockLock = { refresh: vi.fn().mockResolvedValue(true) };
      
      await expect(
        ensureLockRefreshed(mockLock, 'test-stage', 'collection')
      ).resolves.toBeUndefined();
      
      expect(mockLock.refresh).toHaveBeenCalledTimes(1);
    });

    it('throws error when lock refresh returns false', async () => {
      mockLock = { refresh: vi.fn().mockResolvedValue(false) };
      
      await expect(
        ensureLockRefreshed(mockLock, 'test-stage', 'analytics')
      ).rejects.toThrow('analytics lock refresh failed at stage: test-stage');
    });

    it('throws error when lock refresh throws', async () => {
      mockLock = { refresh: vi.fn().mockRejectedValue(new Error('Lock error')) };
      
      await expect(
        ensureLockRefreshed(mockLock, 'test-stage', 'collection')
      ).rejects.toThrow('Lock error');
    });

    it('throws original error with context when lock refresh throws', async () => {
      mockLock = { refresh: vi.fn().mockRejectedValue(new Error('Network failure')) };
      
      try {
        await ensureLockRefreshed(mockLock, 'pre-rollup', 'analytics');
        throw new Error('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Network failure');
      }
    });

    it('uses correct context in error message for collection', async () => {
      mockLock = { refresh: vi.fn().mockResolvedValue(false) };
      
      try {
        await ensureLockRefreshed(mockLock, 'pre-sync', 'collection');
      } catch (error) {
        expect((error as Error).message).toContain('collection');
        expect((error as Error).message).toContain('pre-sync');
      }
    });

    it('uses correct context in error message for analytics', async () => {
      mockLock = { refresh: vi.fn().mockResolvedValue(false) };
      
      try {
        await ensureLockRefreshed(mockLock, 'pre-rollup', 'analytics');
      } catch (error) {
        expect((error as Error).message).toContain('analytics');
        expect((error as Error).message).toContain('pre-rollup');
      }
    });
  });
});