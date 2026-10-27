import { describe, expect, it } from 'vitest';
import {
  REPORT_EXPORT_SECTION_IDS,
  buildReportExportSections,
  getReportExportSection,
  isReportExportSectionId,
  listReportExportSections,
} from '@/lib/monthly-report-export';
import { buildMonthlyReportFixture } from '@tests/helpers/monthly-report-fixture';

const report = buildMonthlyReportFixture();

describe('monthly report export', () => {
  it('builds one section per declared id, in order', () => {
    const sections = buildReportExportSections(report);

    expect(sections.map((section) => section.id)).toEqual([...REPORT_EXPORT_SECTION_IDS]);
    for (const section of sections) {
      expect(section.headers.length).toBeGreaterThan(0);
      expect(section.title).not.toEqual('');
    }
  });

  it('summarizes the headline metrics in the first section', () => {
    const summary = getReportExportSection(report, 'resumen');

    expect(summary.headers).toEqual(['metrica', 'valor']);
    expect(summary.rows).toContainEqual(['Índice de actividad', 5200]);
    expect(summary.rows).toContainEqual(['Días cubiertos', 30]);
    expect(summary.rows).toContainEqual(['Hora punta', 9]);
  });

  it('merges the three district rankings with a ranking column', () => {
    const barrios = getReportExportSection(report, 'barrios');

    expect(barrios.rows).toEqual([
      ['Más activos', 'Centro', 900, 0.6, 12, 40, 30, 500, 0.14],
      ['Menos usados', 'Rural', 100, 0.2, 3, 10, 0, 400, 0.03],
      ['Desabastecimiento', 'Delicias', 700, 0.7, 10, 120, 100, 500, 0.44],
    ]);
  });

  it('exports anomaly causes as human labels and keeps unknown ones empty', () => {
    const anomalias = getReportExportSection(report, 'anomalias');

    expect(anomalias.rows).toContainEqual([
      '2026-03-19',
      400,
      180,
      1.2,
      3.1,
      'up',
      'Festivo: Festivo local',
    ]);
    expect(anomalias.rows).toContainEqual(['2026-03-20', 10, 180, -0.94, -2.8, 'down', null]);
  });

  it('exports station rankings', () => {
    expect(getReportExportSection(report, 'estaciones-top').rows).toEqual([
      ['105', 'Estación 105', 42],
    ]);
    expect(getReportExportSection(report, 'estaciones-menos-usadas').rows).toEqual([
      ['106', 'Estación 106', 3],
    ]);
  });

  it('validates section ids and lists them for the UI', () => {
    expect(isReportExportSectionId('barrios')).toBe(true);
    expect(isReportExportSectionId('no-existe')).toBe(false);
    expect(listReportExportSections()).toHaveLength(REPORT_EXPORT_SECTION_IDS.length);
  });
});
