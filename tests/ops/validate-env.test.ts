import { describe, it, expect } from 'vitest';
import { validateProductionEnv } from '../../ops/validate-env.mjs';

const baseEnv = {
  NODE_ENV: 'production',
  JWT_SECRET: 'k9mQ2vX7pL4nR8tY1wU5iO3pA6sD0fG',
  SIGNATURE_SECRET: 'z8xQ1wE4rT7yU2iO5pA9sD3fG6hJ0kL',
  OPS_API_KEY: 'm4nB7vC2xZ9pL5qW8rT1yU6iO3pA0sD',
  REDIS_URL: 'redis://localhost:6379',
};

describe('validateProductionEnv', () => {
  it('passes with strong secrets', () => {
    expect(() => validateProductionEnv({ ...baseEnv })).not.toThrow();
  });

  it('is a no-op outside production', () => {
    expect(() => validateProductionEnv({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('throws on missing or placeholder secrets', () => {
    expect(() => validateProductionEnv({ ...baseEnv, JWT_SECRET: undefined })).toThrow(/JWT_SECRET/);
    expect(() => validateProductionEnv({ ...baseEnv, COLLECT_API_KEY: 'change-me', OPS_API_KEY: undefined })).toThrow(
      /OPS_API_KEY/
    );
    expect(() => validateProductionEnv({ ...baseEnv, REDIS_URL: '' })).toThrow(/REDIS_URL/);
  });
});
