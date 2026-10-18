import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const BUILDERS = 'src/lib/comparison-hub-builders.ts';
const ADAPTER = 'src/lib/comparison-hub.ts';

const read = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8');

/** Bloque de wiring del adapter: del argumento de buildComparisonHubViewModel al primer dato escalar. */
function wiringBlock(): string {
  return (
    read(ADAPTER).match(/buildComparisonHubViewModel\(\{([\s\S]*?)datasetCoverageDays/)?.[1] ?? ''
  );
}

describe('comparison hub seam', () => {
  it('keeps the builders free of any import from the adapter', () => {
    expect(read(BUILDERS)).not.toMatch(/from '@\/lib\/comparison-hub'/);
  });

  it('declares the view-model interface in the builders and re-exports it from the adapter', () => {
    expect(read(BUILDERS)).toMatch(/export type ComparisonCard = \{/);
    expect(read(ADAPTER)).not.toMatch(/^export type ComparisonCard = \{/m);
    expect(read(ADAPTER)).toMatch(
      /export type \{[\s\S]*ComparisonCard[\s\S]*\} from '@\/lib\/comparison-hub-builders'/
    );
  });

  it('lets the adapter wire domain rows straight through', () => {
    const wiring = wiringBlock();

    expect(wiring.length).toBeGreaterThan(0);
    expect(wiring, 'the adapter re-coerces rows with Number()').not.toMatch(/Number\(/);
    expect(wiring, 'the adapter reshapes rows with .map()').not.toMatch(/\.map\(/);
  });
});
