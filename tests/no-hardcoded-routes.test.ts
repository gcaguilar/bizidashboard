import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type RoutePattern = {
  label: string;
  regex: RegExp;
};

const UI_ROOT = path.join(process.cwd(), 'src', 'app');

const ROUTE_PATTERNS: RoutePattern[] = [
  {
    label: 'literal href prop',
    regex: /\bhref\s*=\s*['"`](\/(?!\/)[^'"`]+)['"`]/g,
  },
  {
    label: 'literal href object value',
    regex: /\bhref\s*:\s*['"`](\/(?!\/)[^'"`]+)['"`]/g,
  },
  {
    label: 'literal helpHref prop',
    regex: /\bhelpHref\s*=\s*['"`](\/(?!\/)[^'"`]+)['"`]/g,
  },
  {
    label: 'literal helpHref object value',
    regex: /\bhelpHref\s*:\s*['"`](\/(?!\/)[^'"`]+)['"`]/g,
  },
  {
    label: 'literal data download prop',
    regex:
      /\b(?:stationsCsvUrl|frictionCsvUrl|historyJsonUrl|historyCsvUrl|alertsCsvUrl|statusCsvUrl)\s*=\s*['"`](\/(?!\/)[^'"`]+)['"`]/g,
  },
  {
    label: 'literal metadata path',
    regex: /\bpath\s*:\s*['"`](\/(?!\/)[^'"`]+)['"`]/g,
  },
  {
    label: 'literal fetch url',
    regex: /\bfetch\(\s*['"`](\/(?!\/)[^'"`]+)['"`]/g,
  },
  {
    label: 'literal route constant',
    regex:
      /\bconst\s+\w+(?:Href|Url|Path|Route)\w*\s*=\s*['"`](\/(dashboard|informes|beta|biciradar|barrios|ayuda|developers|metodologia|inicio|ciudades|api|comparar|explorar|estado)[^'"`]*)['"`]/g,
  },
];

function collectUiFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (entry === 'api') {
        return [];
      }

      return collectUiFiles(fullPath);
    }

    return fullPath.endsWith('.tsx') ? [fullPath] : [];
  });
}

describe('UI routes', () => {
  it('uses appRoutes helpers instead of hardcoded internal paths', () => {
    const violations: Array<{ file: string; label: string; match: string }> = [];

    for (const file of collectUiFiles(UI_ROOT)) {
      const contents = readFileSync(file, 'utf8');

      for (const pattern of ROUTE_PATTERNS) {
        for (const match of contents.matchAll(pattern.regex)) {
          violations.push({
            file: path.relative(process.cwd(), file),
            label: pattern.label,
            match: match[1] ?? match[0],
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
