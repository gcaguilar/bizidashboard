import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_INPUT_PATH = 'ops/dashboard-web-vitals-prod.json';

const THRESHOLDS = {
  lcpMs: 2500,
  fcpMs: 1800,
  cls: 0.1,
};

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === '--input' && next) {
      args.inputPath = next;
      index += 1;
    }
  }

  return args;
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(process.cwd(), args.inputPath);
  const raw = await fs.readFile(inputPath, 'utf8');
  const report = JSON.parse(raw);

  const checks = Array.isArray(report?.summary?.checks) ? report.summary.checks : [];
  const failures = [];
  const warnings = [];

  for (const check of checks) {
    const route = typeof check?.route === 'string' ? check.route : 'unknown-route';
    const lcpMs = check?.lcpMs;
    const fcpMs = check?.fcpMs;
    const cls = check?.cls;

    if (!isNumber(lcpMs) || !isNumber(fcpMs) || !isNumber(cls)) {
      failures.push(`${route}: faltan metricas base (fcp/lcp/cls).`);
      continue;
    }

    if (lcpMs > THRESHOLDS.lcpMs) {
      failures.push(
        `${route}: LCP ${lcpMs}ms supera umbral ${THRESHOLDS.lcpMs}ms.`
      );
    }

    if (fcpMs > THRESHOLDS.fcpMs) {
      failures.push(
        `${route}: FCP ${fcpMs}ms supera umbral ${THRESHOLDS.fcpMs}ms.`
      );
    }

    if (cls > THRESHOLDS.cls) {
      failures.push(`${route}: CLS ${cls} supera umbral ${THRESHOLDS.cls}.`);
    }

    if (isNumber(check?.navDurationMs) && check.navDurationMs > 1500) {
      warnings.push(`${route}: navDuration ${check.navDurationMs}ms por encima de 1500ms.`);
    }
  }

  const output = {
    input: inputPath,
    ok: failures.length === 0,
    checkedRoutes: checks.length,
    thresholds: THRESHOLDS,
    failures,
    warnings,
  };

  console.log(JSON.stringify(output, null, 2));

  if (!output.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
