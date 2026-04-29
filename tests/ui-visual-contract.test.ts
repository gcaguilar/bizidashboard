import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_ROOTS = [
  path.join(process.cwd(), 'src', 'app'),
  path.join(process.cwd(), 'src', 'components'),
];

const IGNORE_FILES = new Set([
  path.join(process.cwd(), 'src', 'components', 'ui', 'card.tsx'),
  path.join(process.cwd(), 'src', 'components', 'ui', 'button.tsx'),
]);

const FORBIDDEN_LEGACY_CLASS_NAMES =
  /(?<![a-z-])(hero-card|dashboard-card|stat-card|kpi-chip|legend-item)(?![a-z-])|className\s*=\s*["'`][^"'`]*(?:^|\s)icon-button(?:\s|$)|\.icon-button\b/g;
const FORBIDDEN_DOUBLE_PREFIX = /\bui-ui-[a-z-]+\b/g;

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx') && !fullPath.endsWith('.css')) {
      return [];
    }

    if (IGNORE_FILES.has(fullPath)) {
      return [];
    }

    return [fullPath];
  });
}

describe('UI visual contract', () => {
  it('does not use legacy visual class names outside compatibility primitives', () => {
    const violations: Array<{ file: string; token: string }> = [];

    for (const root of SOURCE_ROOTS) {
      for (const file of collectSourceFiles(root)) {
        const contents = readFileSync(file, 'utf8');

        for (const match of contents.matchAll(FORBIDDEN_LEGACY_CLASS_NAMES)) {
          violations.push({
            file: path.relative(process.cwd(), file),
            token: match[0],
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('does not contain duplicated ui-ui-* class prefixes', () => {
    const violations: Array<{ file: string; token: string }> = [];

    for (const root of SOURCE_ROOTS) {
      for (const file of collectSourceFiles(root)) {
        const contents = readFileSync(file, 'utf8');

        for (const match of contents.matchAll(FORBIDDEN_DOUBLE_PREFIX)) {
          violations.push({
            file: path.relative(process.cwd(), file),
            token: match[0],
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
