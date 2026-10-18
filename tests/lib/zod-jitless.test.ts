import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import '@/lib/zod-jitless';

describe('zod strict-CSP configuration', () => {
  it('disables Zod JIT compilation so it never probes new Function', () => {
    expect(z.core.globalConfig.jitless).toBe(true);
  });

  it('still validates schemas correctly without JIT', () => {
    const schema = z.object({ id: z.coerce.string(), count: z.number() });

    expect(schema.parse({ id: 254, count: 3 })).toEqual({ id: '254', count: 3 });
    expect(schema.safeParse({ id: 254, count: 'x' }).success).toBe(false);
  });
});
