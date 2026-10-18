import type { CsvRow, CsvSection } from '@/lib/csv';
import type { MonthlyReport } from '@/lib/monthly-report';
import { formatMonthLabel } from '@/lib/months';
import { getServiceCauseLabel } from '@/lib/service-calendar';

/**
 * Exportacion de un informe mensual a tablas planas. Modulo puro: mapea el
 * payload ya ensamblado a secciones (titulo + cabeceras + filas). El seam de
 * CSV (`@/lib/csv`) se encarga del escapado y de la respuesta HTTP, de modo que
 * aqui no se serializa ni se neutraliza nada a mano.
 */

export const REPORT_EXPORT_SECTION_IDS = [
  'resumen',
  'tendencias-mensuales',
  'tendencias-diarias',
  'tendencias-horarias',
  'barrios',
  'problemas-friccion',
  'problemas-manana',
  'problemas-episodios',
  'redistribucion',
  'anomalias',
  'estaciones-top',
  'estaciones-menos-usadas',
  'conclusiones',
  'hallazgos',
  'recomendaciones',
] as const;

export type ReportExportSectionId = (typeof REPORT_EXPORT_SECTION_IDS)[number];

const SECTION_TITLES: Record<ReportExportSectionId, string> = {
  resumen: 'Resumen',
  'tendencias-mensuales': 'Tendencias mensuales',
  'tendencias-diarias': 'Tendencias diarias',
  'tendencias-horarias': 'Perfil horario',
  barrios: 'Barrios',
  'problemas-friccion': 'Estaciones con más fricción',
  'problemas-manana': 'Fricción en la franja de mañana',
  'problemas-episodios': 'Episodios críticos más largos',
  redistribucion: 'Redistribución',
  anomalias: 'Picos anómalos',
  'estaciones-top': 'Estaciones con más uso',
  'estaciones-menos-usadas': 'Estaciones menos usadas',
  conclusiones: 'Conclusiones',
  hallazgos: 'Hallazgos',
  recomendaciones: 'Recomendaciones',
};

export type ReportExportSection = CsvSection & { id: ReportExportSectionId };

export function isReportExportSectionId(value: string): value is ReportExportSectionId {
  return (REPORT_EXPORT_SECTION_IDS as readonly string[]).includes(value);
}

/** Ordered (id, title) list for UI that offers per-section exports. */
export function listReportExportSections(): Array<{ id: ReportExportSectionId; title: string }> {
  return REPORT_EXPORT_SECTION_IDS.map((id) => ({ id, title: SECTION_TITLES[id] }));
}

function section(
  id: ReportExportSectionId,
  headers: string[],
  rows: CsvRow[]
): ReportExportSection {
  return { id, title: SECTION_TITLES[id], headers, rows };
}

export function buildReportExportSections(report: MonthlyReport): ReportExportSection[] {
  const { headline, redistribution } = report;

  return [
    section(
      'resumen',
      ['metrica', 'valor'],
      [
        ['Mes', formatMonthLabel(report.monthKey)],
        ['Resumen', report.summary],
        ['Movimiento estimado', headline.demandScore],
        ['Ocupación media', headline.avgOccupancy],
        ['Estaciones activas', headline.activeStations],
        ['Muestras', headline.sampleCount],
        ['Días cubiertos', headline.coveredDays],
        ['Días esperados', headline.expectedDays],
        ['Hora punta', headline.peakHour],
        ['Variación demanda vs mes anterior', headline.demandDeltaRatio],
        ['Variación ocupación vs mes anterior', headline.occupancyDeltaRatio],
        ['Fricción de red', redistribution.networkFrictionRate],
        ['Rotación estimada', redistribution.rotation],
        ['Generado en', report.generatedAt],
      ]
    ),
    section(
      'tendencias-mensuales',
      ['mes', 'movimiento_estimado', 'ocupacion_media', 'estaciones_activas', 'muestras'],
      report.trends.monthly.map((row) => [
        row.monthKey,
        row.demandScore,
        row.avgOccupancy,
        row.activeStations,
        row.sampleCount,
      ])
    ),
    section(
      'tendencias-diarias',
      ['dia', 'movimiento_estimado', 'ocupacion_media', 'muestras'],
      report.trends.daily.map((row) => [row.day, row.demandScore, row.avgOccupancy, row.sampleCount])
    ),
    section(
      'tendencias-horarias',
      ['hora', 'ocupacion_media', 'bicis_disponibles_media', 'muestras'],
      report.trends.hourly.map((row) => [
        row.hour,
        row.avgOccupancy,
        row.avgBikesAvailable,
        row.sampleCount,
      ])
    ),
    section(
      'barrios',
      ['ranking', 'barrio', 'movimiento_estimado', 'ocupacion_media', 'estaciones', 'horas_vacio', 'horas_lleno', 'horas_totales', 'tasa_friccion'],
      [
        ...report.districts.mostActive.map((district) => [
          'Más activos',
          district.district,
          district.demandScore,
          district.avgOccupancy,
          district.stations,
          district.emptyHours,
          district.fullHours,
          district.totalHours,
          district.frictionRate,
        ]),
        ...report.districts.leastActive.map((district) => [
          'Menos usados',
          district.district,
          district.demandScore,
          district.avgOccupancy,
          district.stations,
          district.emptyHours,
          district.fullHours,
          district.totalHours,
          district.frictionRate,
        ]),
        ...report.districts.undersupplied.map((district) => [
          'Desabastecimiento',
          district.district,
          district.demandScore,
          district.avgOccupancy,
          district.stations,
          district.emptyHours,
          district.fullHours,
          district.totalHours,
          district.frictionRate,
        ]),
      ] as CsvRow[]
    ),
    section(
      'problemas-friccion',
      ['estacion_id', 'estacion', 'barrio', 'horas_vacio', 'horas_lleno', 'horas_totales', 'horas_friccion', 'tasa_friccion'],
      report.problemSpots.worstFriction.map((spot) => [
        spot.stationId,
        spot.stationName,
        spot.district,
        spot.emptyHours,
        spot.fullHours,
        spot.totalHours,
        spot.frictionHours,
        spot.frictionRate,
      ])
    ),
    section(
      'problemas-manana',
      ['estacion_id', 'estacion', 'barrio', 'horas_manana', 'horas_vacio_manana', 'horas_lleno_manana', 'tasa_vacio_manana', 'tasa_lleno_manana', 'tasa_friccion_manana'],
      report.problemSpots.worstMorning.map((spot) => [
        spot.stationId,
        spot.stationName,
        spot.district,
        spot.morningHours,
        spot.morningEmptyHours,
        spot.morningFullHours,
        spot.morningEmptyRate,
        spot.morningFullRate,
        spot.morningFrictionRate,
      ])
    ),
    section(
      'problemas-episodios',
      ['estacion_id', 'estacion', 'barrio', 'episodios', 'media_vacio_min', 'media_lleno_min', 'max_vacio_min', 'max_lleno_min'],
      report.problemSpots.longestEpisodes.map((spot) => [
        spot.stationId,
        spot.stationName,
        spot.district,
        spot.episodeCount,
        spot.avgEmptyEpisodeMinutes,
        spot.avgFullEpisodeMinutes,
        spot.maxEmptyEpisodeMinutes,
        spot.maxFullEpisodeMinutes,
      ])
    ),
    section(
      'redistribucion',
      ['estacion_id', 'estacion', 'barrio', 'rotacion', 'horas_friccion', 'tasa_friccion'],
      redistribution.ineffectiveStations.map((spot) => [
        spot.stationId,
        spot.stationName,
        spot.district,
        spot.rotation,
        spot.frictionHours,
        spot.frictionRate,
      ])
    ),
    section(
      'anomalias',
      ['dia', 'movimiento_estimado', 'baseline', 'desviacion', 'z', 'direccion', 'causa'],
      report.anomalies.map((anomaly) => [
        anomaly.day,
        anomaly.demandScore,
        anomaly.baseline,
        anomaly.deviationRatio,
        anomaly.zScore,
        anomaly.direction,
        anomaly.cause ? `${getServiceCauseLabel(anomaly.cause.kind)}: ${anomaly.cause.label}` : null,
      ])
    ),
    section(
      'estaciones-top',
      ['estacion_id', 'estacion', 'demanda_media'],
      report.topStations.map((station) => [station.stationId, station.stationName, station.avgDemand])
    ),
    section(
      'estaciones-menos-usadas',
      ['estacion_id', 'estacion', 'demanda_media'],
      report.leastUsedStations.map((station) => [
        station.stationId,
        station.stationName,
        station.avgDemand,
      ])
    ),
    section(
      'conclusiones',
      ['conclusion'],
      report.monthlyConclusions.map((conclusion) => [conclusion])
    ),
    section(
      'hallazgos',
      ['titulo', 'detalle'],
      report.highlights.map((highlight) => [highlight.title, highlight.detail])
    ),
    section(
      'recomendaciones',
      ['recomendacion'],
      report.recommendations.map((recommendation) => [recommendation])
    ),
  ];
}

export function getReportExportSection(
  report: MonthlyReport,
  id: ReportExportSectionId
): ReportExportSection {
  return buildReportExportSections(report).find((candidate) => candidate.id === id) as ReportExportSection;
}
