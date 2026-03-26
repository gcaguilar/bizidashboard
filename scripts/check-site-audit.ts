import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import {
  evaluateSiteAuditReport,
  type AuditReport,
} from '../src/lib/site-audit-report';

const DEFAULT_INPUT_PATH = 'ops/site-audit-report.json';

function parseArgs(argv: string[]) {
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rootDirectory = process.cwd();
  const inputPath = path.resolve(rootDirectory, args.inputPath);
  const rawReport = await fs.readFile(inputPath, 'utf8');
  const report = JSON.parse(rawReport) as AuditReport;
  const evaluation = evaluateSiteAuditReport(report);

  console.log(
    JSON.stringify(
      {
        input: inputPath,
        ok: evaluation.ok,
        counts: evaluation.counts,
        failures: evaluation.failures,
        warnings: evaluation.warnings,
        critical_orphan_pages: evaluation.critical_orphan_pages,
        api_errors: evaluation.api_errors,
      },
      null,
      2
    )
  );

  if (!evaluation.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
