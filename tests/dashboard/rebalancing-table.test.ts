import { describe, it, expect } from 'vitest';

describe('RebalancingTable', () => {
  it('module loads successfully', async () => {
    const module = await import('../../src/app/dashboard/redistribucion/_components/RebalancingTable');
    expect(module).toBeDefined();
  });
});