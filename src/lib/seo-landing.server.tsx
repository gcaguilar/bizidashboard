import type { Metadata } from 'next';
import {
  fetchCachedDailyDemandCurve,
  fetchCachedMonthlyDemandCurve,
  fetchCachedSystemHourlyProfile,
} from '@/lib/analytics-series';
import { fetchAvailableDataMonths, fetchRankings, fetchStations } from '@/lib/api';
import { getDailyMobilityConclusions } from '@/lib/mobility-conclusions';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { average, formatDecimal, formatHourRange, formatInteger, formatPercent } from '@/lib/format';
import { evaluatePageIndexability, type SeoIndexabilityInput } from '@/lib/seo-policy';
import { getDistrictSeoRows } from '@/lib/seo-districts';
import {
  getSeoPageConfig,
  type SeoPageConfig,
  type SeoPageSlug,
} from '@/lib/seo-pages';
import { buildSocialImagePath } from '@/lib/social-images';
import { captureWarningWithContext } from '@/lib/sentry-reporting';

type SeoStat = {
  label: string;
  value: string;
  detail: string;
};

type SeoItem = {
  title: string;
  detail: string;
  href?: string;
  badge?: string;
};

type SeoLandingContent = {
  generatedAt: string;
  summary: string;
  stats: SeoStat[];
  sectionTitle: string;
  sectionItems: SeoItem[];
  emptyReason?: string;
};

const EMPTY_STATE_MESSAGE =
  'Todavia no hay suficiente historico o cobertura para publicar esta landing con datos consistentes.';

export function buildSeoFaqStructuredData(config: SeoPageConfig) {
  return {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Que ofrece la pagina ${config.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: config.description,
        },
      },
      {
        '@type': 'Question',
        name: 'Cada cuanto se actualiza esta informacion?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${config.cadenceLabel}. La fecha visible en la pagina indica la ultima actualizacion publicada.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Donde puedo ver el detalle operativo completo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Desde esta landing puedes abrir ${config.primaryCta.label.toLowerCase()} para consultar el detalle en tiempo real.`,
        },
      },
    ],
  };
}

function fallbackContent(config: SeoPageConfig, nowIso: string): SeoLandingContent {
  return {
    generatedAt: nowIso,
    summary: config.description,
    stats: [
      {
        label: 'Cobertura',
        value: 'Sin datos',
        detail: 'El dataset publico aun no ofrece suficiente cobertura para esta vista.',
      },
      {
        label: 'Estado',
        value: 'Pendiente',
        detail: 'La pagina queda publicada para enlazado interno y futura indexacion.',
      },
      {
        label: 'Destino',
        value: 'Dashboard',
        detail: 'Mientras tanto puedes abrir la vista operativa principal.',
      },
    ],
    sectionTitle: 'Cobertura pendiente',
    sectionItems: [],
    emptyReason: EMPTY_STATE_MESSAGE,
  };
}

async function buildMostUsedStationsContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  const [stationsResponse, rankingsResponse] = await Promise.all([
    fetchStations().catch((error) => {
      captureWarningWithContext('SEO landing degraded: fetchStations failed in most-used stations.', {
        area: 'seo.landing',
        operation: 'buildMostUsedStationsContent',
        dedupeKey: 'seo.landing.most-used.fetch-stations-fallback',
        extra: { reason: String(error) },
      });
      return { stations: [], generatedAt: nowIso };
    }),
    fetchRankings('turnover', 12).catch((error) => {
      captureWarningWithContext('SEO landing degraded: turnover rankings unavailable in most-used stations.', {
        area: 'seo.landing',
        operation: 'buildMostUsedStationsContent',
        dedupeKey: 'seo.landing.most-used.rankings-fallback',
        extra: { reason: String(error) },
      });
      return {
      type: 'turnover' as const,
      limit: 12,
      rankings: [],
      generatedAt: nowIso,
    };
    }),
  ]);

  const stationMap = new Map(stationsResponse.stations.map((station) => [station.id, station]));
  const items = rankingsResponse.rankings.slice(0, 8).map((row, index) => {
    const station = stationMap.get(row.stationId);
    return {
      title: `${index + 1}. ${station?.name ?? row.stationId}`,
      detail: `${formatDecimal(row.turnoverScore)} pts de rotacion · ${station ? `${station.bikesAvailable} bicis ahora` : 'detalle operativo disponible'}`,
      href: appRoutes.stationDetail(row.stationId),
      badge: `Top ${index + 1}`,
    };
  });

  if (items.length === 0 && stationsResponse.stations.length > 0) {
    const fallbackItems = [...stationsResponse.stations]
      .sort((left, right) => {
        const rightOccupancy = right.capacity > 0 ? right.bikesAvailable / right.capacity : 0;
        const leftOccupancy = left.capacity > 0 ? left.bikesAvailable / left.capacity : 0;
        return rightOccupancy - leftOccupancy || right.bikesAvailable - left.bikesAvailable;
      })
      .slice(0, 8)
      .map((station, index) => ({
        title: `${index + 1}. ${station.name}`,
        detail: `${formatInteger(station.bikesAvailable)} bicis disponibles · capacidad ${formatInteger(station.capacity)} · ocupacion ${formatPercent(station.capacity > 0 ? station.bikesAvailable / station.capacity : 0)}`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Snapshot',
      }));

    return {
      generatedAt: stationsResponse.generatedAt,
      summary:
        'Vista indexable basada en el snapshot actual de estaciones cuando el ranking historico no esta disponible.',
      stats: [
        {
          label: 'Estaciones activas',
          value: formatInteger(stationsResponse.stations.length),
          detail: 'Total de estaciones presentes en el snapshot actual.',
        },
        {
          label: 'Bicis visibles',
          value: formatInteger(
            stationsResponse.stations.reduce((sum, station) => sum + station.bikesAvailable, 0)
          ),
          detail: 'Bicicletas disponibles sumadas en el snapshot servido.',
        },
        {
          label: 'Modo',
          value: 'Snapshot',
          detail: 'Fallback activo al no disponer de ranking agregado reciente.',
        },
      ],
      sectionTitle: 'Estaciones destacadas por snapshot',
      sectionItems: fallbackItems,
    };
  }

  if (items.length === 0) {
    return fallbackContent(config, rankingsResponse.generatedAt);
  }

  return {
    generatedAt: rankingsResponse.generatedAt,
    summary:
      'Ranking indexable de estaciones lideres por actividad reciente, con enlaces persistentes al detalle operativo y contexto del snapshot actual.',
    stats: [
      {
        label: 'Estaciones activas',
        value: formatInteger(stationsResponse.stations.length),
        detail: 'Total de estaciones presentes en el snapshot actual.',
      },
      {
        label: 'Top 5 medio',
        value: `${formatDecimal(average(rankingsResponse.rankings.slice(0, 5).map((row) => Number(row.turnoverScore))))} pts`,
        detail: 'Rotacion media de las estaciones con mayor uso reciente.',
      },
      {
        label: 'Bicis visibles',
        value: formatInteger(
          stationsResponse.stations.reduce((sum, station) => sum + station.bikesAvailable, 0)
        ),
        detail: 'Bicicletas disponibles sumadas en el snapshot servido.',
      },
    ],
    sectionTitle: 'Estaciones lideres por rotacion',
    sectionItems: items,
  };
}

async function buildDistrictOverviewContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  const rows = await getDistrictSeoRows().catch((error) => {
    captureWarningWithContext('SEO landing degraded: district rows unavailable.', {
      area: 'seo.landing',
      operation: 'buildDistrictOverviewContent',
      dedupeKey: 'seo.landing.district-overview.rows-fallback',
      extra: { reason: String(error) },
    });
    return [];
  });
  const items = rows.slice(0, 8).map((district, index) => ({
    title: `${index + 1}. ${district.name}`,
    detail: `${district.stationCount} estaciones · ${formatDecimal(district.avgTurnover)} pts medios · ${district.bikesAvailable} bicis disponibles`,
    href: appRoutes.districtDetail(district.slug),
    badge: `${district.stationCount} est.`,
  }));

  if (items.length === 0) {
    return fallbackContent(config, nowIso);
  }

  return {
    generatedAt: nowIso,
    summary:
      'Comparativa indexable por barrios con estaciones destacadas, carga operativa y enlaces al dashboard de flujo y a cada ficha de barrio.',
    stats: [
      {
        label: 'Barrios visibles',
        value: formatInteger(rows.length),
        detail: 'Barrios con estaciones activas y asignacion geografica disponible.',
      },
      {
        label: 'Estaciones sumadas',
        value: formatInteger(rows.reduce((sum, district) => sum + district.stationCount, 0)),
        detail: 'Estaciones activas agregadas en el conjunto de barrios publicado.',
      },
      {
        label: 'Bicis agregadas',
        value: formatInteger(rows.reduce((sum, district) => sum + district.bikesAvailable, 0)),
        detail: 'Bicicletas disponibles actualmente en los barrios representados.',
      },
    ],
    sectionTitle: 'Barrios destacados',
    sectionItems: items,
  };
}

async function buildHourlyUsageContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  const profile = await fetchCachedSystemHourlyProfile(14).catch((error) => {
    captureWarningWithContext('SEO landing degraded: hourly profile unavailable.', {
      area: 'seo.landing',
      operation: 'buildHourlyUsageContent',
      dedupeKey: 'seo.landing.hourly-usage.profile-fallback',
      extra: { reason: String(error) },
    });
    return [];
  });
  const items = [...profile]
    .sort((left, right) => Number(left.avgBikesAvailable) - Number(right.avgBikesAvailable))
    .slice(0, 8)
    .map((row, index) => ({
      title: `${index + 1}. ${formatHourRange(row.hour)}`,
      detail: `${formatDecimal(Number(row.avgBikesAvailable))} bicis disponibles · ocupacion ${formatPercent(Number(row.avgOccupancy))}`,
      href: appRoutes.dashboardView('research'),
      badge: `${formatInteger(Number(row.sampleCount))} muestras`,
    }));

  if (items.length === 0) {
    const stationsResponse = await fetchStations().catch((error) => {
      captureWarningWithContext('SEO landing degraded: stations snapshot unavailable in hourly usage fallback.', {
        area: 'seo.landing',
        operation: 'buildHourlyUsageContent',
        dedupeKey: 'seo.landing.hourly-usage.stations-fallback',
        extra: { reason: String(error) },
      });
      return {
        stations: [],
        generatedAt: nowIso,
      };
    });
    const liveItems = [...stationsResponse.stations]
      .sort((left, right) => {
        const leftOccupancy = left.capacity > 0 ? left.bikesAvailable / left.capacity : 0;
        const rightOccupancy = right.capacity > 0 ? right.bikesAvailable / right.capacity : 0;
        return rightOccupancy - leftOccupancy || right.bikesAvailable - left.bikesAvailable;
      })
      .slice(0, 8)
      .map((station, index) => ({
        title: `${index + 1}. ${station.name}`,
        detail: `${station.bikesAvailable} bicis · ocupacion ${formatPercent(
          station.capacity > 0 ? station.bikesAvailable / station.capacity : 0
        )} · capacidad ${station.capacity}`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Snapshot',
      }));

    if (liveItems.length > 0) {
      const avgOccupancy =
        stationsResponse.stations.reduce(
          (sum, station) =>
            sum + (station.capacity > 0 ? station.bikesAvailable / station.capacity : 0),
          0
        ) / stationsResponse.stations.length;
      const now = new Date(stationsResponse.generatedAt);
      return {
        generatedAt: stationsResponse.generatedAt,
        summary:
          'Fallback indexable con snapshot actual de disponibilidad por estacion cuando no hay perfil horario agregado suficiente.',
        stats: [
          {
            label: 'Estaciones visibles',
            value: formatInteger(stationsResponse.stations.length),
            detail: 'Estaciones activas incluidas en el snapshot actual del sistema.',
          },
          {
            label: 'Hora de referencia',
            value: formatHourRange(now.getHours()),
            detail: 'Franja horaria correspondiente al ultimo snapshot publicado.',
          },
          {
            label: 'Ocupacion media',
            value: formatPercent(avgOccupancy),
            detail: 'Promedio de ocupacion estimado con la fotografia actual.',
          },
        ],
        sectionTitle: 'Estaciones con mayor ocupacion en el snapshot actual',
        sectionItems: liveItems,
      };
    }
  }

  if (items.length === 0) {
    return fallbackContent(config, nowIso);
  }

  const busiestHour = [...profile].sort(
    (left, right) => Number(left.avgBikesAvailable) - Number(right.avgBikesAvailable)
  )[0];

  return {
    generatedAt: nowIso,
    summary:
      'Distribucion horaria indexable del sistema con franjas destacadas, ocupacion media y acceso al modo flujo del dashboard.',
    stats: [
      {
        label: 'Franjas publicadas',
        value: formatInteger(profile.length),
        detail: 'Horas del dia con suficiente muestra agregada en la serie reciente.',
      },
      {
        label: 'Hora punta',
        value: busiestHour ? formatHourRange(busiestHour.hour) : 'Sin datos',
        detail: 'Franja con mayor volumen medio estimado de bicicletas en circulacion.',
      },
      {
        label: 'Ocupacion media',
        value: formatPercent(average(profile.map((row) => Number(row.avgOccupancy)))),
        detail: 'Promedio de ocupacion observado en el perfil horario agregado.',
      },
    ],
    sectionTitle: 'Horas con mayor actividad',
    sectionItems: items,
  };
}

async function buildStationRankingContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  const [stationsResponse, turnoverResponse, availabilityResponse] = await Promise.all([
    fetchStations().catch(() => ({ stations: [], generatedAt: nowIso })),
    fetchRankings('turnover', 6).catch(() => ({
      type: 'turnover' as const,
      limit: 6,
      rankings: [],
      generatedAt: nowIso,
    })),
    fetchRankings('availability', 6).catch(() => ({
      type: 'availability' as const,
      limit: 6,
      rankings: [],
      generatedAt: nowIso,
    })),
  ]);

  const stationMap = new Map(stationsResponse.stations.map((station) => [station.id, station]));
  const items = [
    ...turnoverResponse.rankings.slice(0, 4).map((row, index) => ({
      title: `Uso ${index + 1}. ${stationMap.get(row.stationId)?.name ?? row.stationId}`,
      detail: `${formatDecimal(row.turnoverScore)} pts de rotacion · ${row.emptyHours + row.fullHours} horas de friccion`,
      href: appRoutes.stationDetail(row.stationId),
      badge: 'Demanda',
    })),
    ...availabilityResponse.rankings.slice(0, 4).map((row, index) => ({
      title: `Riesgo ${index + 1}. ${stationMap.get(row.stationId)?.name ?? row.stationId}`,
      detail: `${row.emptyHours + row.fullHours} horas entre vaciado y saturacion · ${formatDecimal(row.turnoverScore)} pts de rotacion`,
      href: appRoutes.stationDetail(row.stationId),
      badge: 'Disponibilidad',
    })),
  ];

  if (items.length === 0 && stationsResponse.stations.length > 0) {
    const fallbackItems = [...stationsResponse.stations]
      .sort((left, right) => right.bikesAvailable - left.bikesAvailable)
      .slice(0, 8)
      .map((station, index) => ({
        title: `${index + 1}. ${station.name}`,
        detail: `${formatInteger(station.bikesAvailable)} bicis · ${formatInteger(station.anchorsFree)} anclajes libres · capacidad ${formatInteger(station.capacity)}`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Snapshot',
      }));

    return {
      generatedAt: stationsResponse.generatedAt,
      summary:
        'Clasificacion indexable basada en disponibilidad actual cuando los rankings historicos no estan disponibles.',
      stats: [
        {
          label: 'Estaciones visibles',
          value: formatInteger(stationsResponse.stations.length),
          detail: 'Estaciones activas incluidas en la fotografia actual del sistema.',
        },
        {
          label: 'Bicis totales',
          value: formatInteger(
            stationsResponse.stations.reduce((sum, station) => sum + station.bikesAvailable, 0)
          ),
          detail: 'Suma de bicicletas visibles en el snapshot publico actual.',
        },
        {
          label: 'Modo',
          value: 'Snapshot',
          detail: 'Fallback activo al no disponer de rankings de uso/disponibilidad.',
        },
      ],
      sectionTitle: 'Estaciones ordenadas por disponibilidad actual',
      sectionItems: fallbackItems,
    };
  }

  if (items.length === 0) {
    return fallbackContent(config, turnoverResponse.generatedAt);
  }

  return {
    generatedAt: turnoverResponse.generatedAt,
    summary:
      'Clasificacion indexable de estaciones por uso y friccion operativa, pensada para enlazar al directorio completo y a cada detalle individual.',
    stats: [
      {
        label: 'Estaciones visibles',
        value: formatInteger(stationsResponse.stations.length),
        detail: 'Estaciones activas incluidas en la fotografia actual del sistema.',
      },
      {
        label: 'Top uso',
        value: `${formatDecimal(Number(turnoverResponse.rankings[0]?.turnoverScore ?? 0))} pts`,
        detail: 'Rotacion de la estacion que encabeza el ranking de uso.',
      },
      {
        label: 'Riesgo maximo',
        value: formatInteger(
          Number(availabilityResponse.rankings[0]?.emptyHours ?? 0) +
            Number(availabilityResponse.rankings[0]?.fullHours ?? 0)
        ),
        detail: 'Horas acumuladas de friccion para la estacion con peor disponibilidad.',
      },
    ],
    sectionTitle: 'Estaciones mas destacadas del ranking',
    sectionItems: items,
  };
}

async function buildDailyTripsContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  const dailySeries = await fetchCachedDailyDemandCurve(30).catch(() => []);
  const nonEmptyRows = dailySeries.filter(
    (row) => Number(row.sampleCount) > 0 || Number(row.demandScore) > 0
  );
  const latestRow = nonEmptyRows[nonEmptyRows.length - 1] ?? null;
  const items = [...nonEmptyRows]
    .reverse()
    .slice(0, 8)
    .map((row) => ({
      title: row.day,
      detail: `${formatInteger(Number(row.demandScore))} pts de demanda · ocupacion ${formatPercent(Number(row.avgOccupancy))}`,
      href: appRoutes.dashboardConclusions(),
      badge: `${formatInteger(Number(row.sampleCount))} muestras`,
    }));

  if (items.length === 0) {
    const stationsResponse = await fetchStations().catch(() => ({
      stations: [],
      generatedAt: nowIso,
    }));
    if (stationsResponse.stations.length > 0) {
      const totalBikes = stationsResponse.stations.reduce(
        (sum, station) => sum + station.bikesAvailable,
        0
      );
      const avgOccupancy =
        stationsResponse.stations.reduce(
          (sum, station) =>
            sum + (station.capacity > 0 ? station.bikesAvailable / station.capacity : 0),
          0
        ) / stationsResponse.stations.length;
      return {
        generatedAt: stationsResponse.generatedAt,
        summary:
          'Fallback indexable basado en snapshot actual cuando la serie diaria agregada no esta disponible.',
        stats: [
          {
            label: 'Dia de referencia',
            value: new Date(stationsResponse.generatedAt).toLocaleDateString('es-ES'),
            detail: 'Fecha del snapshot usado como respaldo de la vista diaria.',
          },
          {
            label: 'Bicis visibles',
            value: formatInteger(totalBikes),
            detail: 'Bicicletas disponibles en el snapshot de referencia.',
          },
          {
            label: 'Ocupacion media',
            value: formatPercent(avgOccupancy),
            detail: 'Ocupacion media estimada del sistema en el snapshot actual.',
          },
        ],
        sectionTitle: 'Referencia diaria basada en snapshot',
        sectionItems: [
          {
            title: new Date(stationsResponse.generatedAt).toLocaleDateString('es-ES'),
            detail: `${formatInteger(totalBikes)} bicis visibles · ocupacion media ${formatPercent(avgOccupancy)} · ${formatInteger(stationsResponse.stations.length)} estaciones`,
            href: appRoutes.dashboardConclusions(),
            badge: 'Snapshot',
          },
        ],
      };
    }
    return fallbackContent(config, nowIso);
  }

  return {
    generatedAt: nowIso,
    summary:
      'Serie diaria indexable con la demanda agregada del sistema, lista para enlazar al resumen ejecutivo y a los informes mensuales.',
    stats: [
      {
        label: 'Dias visibles',
        value: formatInteger(nonEmptyRows.length),
        detail: 'Dias recientes con demanda agregada publicada en la serie diaria.',
      },
      {
        label: 'Ultimo dia',
        value: latestRow ? latestRow.day : 'Sin datos',
        detail: 'Fecha mas reciente disponible en el historico diario expuesto.',
      },
      {
        label: 'Demanda reciente',
        value: latestRow ? `${formatInteger(Number(latestRow.demandScore))} pts` : 'Sin datos',
        detail: 'Indice agregado del ultimo dia con muestras disponibles.',
      },
    ],
    sectionTitle: 'Ultimos dias con demanda publicada',
    sectionItems: items,
  };
}

async function buildMonthlyTripsContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  const monthlySeries = await fetchCachedMonthlyDemandCurve(12).catch(() => []);
  const items = [...monthlySeries]
    .reverse()
    .slice(0, 8)
    .map((row) => ({
      title: isValidMonthKey(row.monthKey) ? formatMonthLabel(row.monthKey) : row.monthKey,
      detail: `${formatInteger(Number(row.demandScore))} pts · ocupacion ${formatPercent(Number(row.avgOccupancy))} · ${formatInteger(Number(row.activeStations))} estaciones`,
      href: appRoutes.reportMonth(row.monthKey),
      badge: row.monthKey,
    }));

  const latestRow = monthlySeries[monthlySeries.length - 1] ?? null;
  if (items.length === 0) {
    const stationsResponse = await fetchStations().catch(() => ({
      stations: [],
      generatedAt: nowIso,
    }));
    if (stationsResponse.stations.length > 0) {
      const snapshotDate = new Date(stationsResponse.generatedAt);
      const monthKey = `${snapshotDate.getUTCFullYear()}-${String(
        snapshotDate.getUTCMonth() + 1
      ).padStart(2, '0')}`;
      const totalBikes = stationsResponse.stations.reduce(
        (sum, station) => sum + station.bikesAvailable,
        0
      );
      const avgOccupancy =
        stationsResponse.stations.reduce(
          (sum, station) =>
            sum + (station.capacity > 0 ? station.bikesAvailable / station.capacity : 0),
          0
        ) / stationsResponse.stations.length;
      return {
        generatedAt: stationsResponse.generatedAt,
        summary:
          'Fallback indexable mensual basado en snapshot actual cuando la serie historica no esta disponible.',
        stats: [
          {
            label: 'Mes visible',
            value: isValidMonthKey(monthKey) ? formatMonthLabel(monthKey) : monthKey,
            detail: 'Mes inferido desde la ultima fecha disponible del snapshot.',
          },
          {
            label: 'Estaciones activas',
            value: formatInteger(stationsResponse.stations.length),
            detail: 'Estaciones presentes en el snapshot de respaldo.',
          },
          {
            label: 'Ocupacion media',
            value: formatPercent(avgOccupancy),
            detail: 'Estimacion de ocupacion media en el snapshot actual.',
          },
        ],
        sectionTitle: 'Mes de referencia basado en snapshot',
        sectionItems: [
          {
            title: isValidMonthKey(monthKey) ? formatMonthLabel(monthKey) : monthKey,
            detail: `${formatInteger(totalBikes)} bicis visibles · ocupacion ${formatPercent(avgOccupancy)} · ${formatInteger(stationsResponse.stations.length)} estaciones`,
            href: appRoutes.reports(),
            badge: 'Snapshot',
          },
        ],
      };
    }
    return fallbackContent(config, nowIso);
  }

  return {
    generatedAt: nowIso,
    summary:
      'Serie mensual indexable con comparativa intermensual, cobertura activa por estacion y acceso directo al archivo de informes.',
    stats: [
      {
        label: 'Meses visibles',
        value: formatInteger(monthlySeries.length),
        detail: 'Meses con agregados mensuales disponibles en la serie publicada.',
      },
      {
        label: 'Ultimo mes',
        value:
          latestRow && isValidMonthKey(latestRow.monthKey)
            ? formatMonthLabel(latestRow.monthKey)
            : latestRow?.monthKey ?? 'Sin datos',
        detail: 'Ultimo mes disponible en la serie mensual del sistema.',
      },
      {
        label: 'Estaciones activas',
        value: formatInteger(Number(latestRow?.activeStations ?? 0)),
        detail: 'Estaciones con actividad registrada en el ultimo mes visible.',
      },
    ],
    sectionTitle: 'Meses publicados',
    sectionItems: items,
  };
}

async function buildStationUsageContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  async function buildSnapshotFallbackContent(referenceIso: string): Promise<SeoLandingContent | null> {
    const stationsResponse = await fetchStations().catch(() => ({
      stations: [],
      generatedAt: referenceIso,
    }));
    if (stationsResponse.stations.length === 0) {
      return null;
    }

    const sortedByBikes = [...stationsResponse.stations].sort(
      (left, right) => right.bikesAvailable - left.bikesAvailable
    );
    const leastByBikes = [...stationsResponse.stations].sort(
      (left, right) => left.bikesAvailable - right.bikesAvailable
    );
    const fallbackItems = [
      ...sortedByBikes.slice(0, 4).map((station, index) => ({
        title: `Alta disponibilidad ${index + 1}. ${station.name}`,
        detail: `${formatInteger(station.bikesAvailable)} bicis · ${formatInteger(station.anchorsFree)} anclajes libres`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Snapshot',
      })),
      ...leastByBikes.slice(0, 4).map((station, index) => ({
        title: `Baja disponibilidad ${index + 1}. ${station.name}`,
        detail: `${formatInteger(station.bikesAvailable)} bicis · capacidad ${formatInteger(station.capacity)}`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Snapshot',
      })),
    ];

    return {
      generatedAt: stationsResponse.generatedAt,
      summary:
        'Comparativa fallback por estacion basada en el snapshot actual cuando las conclusiones historicas no estan disponibles.',
      stats: [
        {
          label: 'Estaciones activas',
          value: formatInteger(stationsResponse.stations.length),
          detail: 'Estaciones disponibles en la fotografia actual del sistema.',
        },
        {
          label: 'Bicis visibles',
          value: formatInteger(
            stationsResponse.stations.reduce((sum, station) => sum + station.bikesAvailable, 0)
          ),
          detail: 'Bicicletas disponibles en el snapshot usado como respaldo.',
        },
        {
          label: 'Modo',
          value: 'Snapshot',
          detail: 'Fallback activo por falta de serie historica consolidada.',
        },
      ],
      sectionTitle: 'Comparativa de estaciones con snapshot actual',
      sectionItems: fallbackItems,
    };
  }

  const payload = await getDailyMobilityConclusions()
    .then((result) => result.payload)
    .catch((error) => {
      captureWarningWithContext('SEO landing degraded: daily mobility conclusions unavailable.', {
        area: 'seo.landing',
        operation: 'buildStationUsageContent',
        dedupeKey: 'seo.landing.station-usage.mobility-conclusions-fallback',
        extra: { reason: String(error) },
      });
      return null;
    });

  if (!payload) {
    const snapshotFallback = await buildSnapshotFallbackContent(nowIso);
    if (snapshotFallback) {
      return snapshotFallback;
    }
    return fallbackContent(config, nowIso);
  }

  const items = [
    ...payload.topStationsByDemand.slice(0, 4).map((station, index) => ({
      title: `Alta demanda ${index + 1}. ${station.stationName}`,
      detail: `${formatDecimal(station.avgDemand)} pts/dia · enlace al detalle operativo`,
      href: appRoutes.stationDetail(station.stationId),
      badge: 'Top',
    })),
    ...payload.leastUsedStations.slice(0, 4).map((station, index) => ({
      title: `Menor uso ${index + 1}. ${station.stationName}`,
      detail: `${formatDecimal(station.avgDemand)} pts/dia · seguimiento recomendado`,
      href: appRoutes.stationDetail(station.stationId),
      badge: 'Seguimiento',
    })),
  ];

  if (items.length === 0) {
    const snapshotFallback = await buildSnapshotFallbackContent(payload.generatedAt);
    if (snapshotFallback) {
      return snapshotFallback;
    }
    return fallbackContent(config, payload.generatedAt);
  }

  return {
    generatedAt: payload.generatedAt,
    summary: payload.summary,
    stats: [
      {
        label: 'Estaciones activas',
        value: formatInteger(payload.activeStations),
        detail: 'Estaciones activas consideradas por el briefing de movilidad reciente.',
      },
      {
        label: 'Cobertura historica',
        value: formatInteger(payload.totalHistoricalDays),
        detail: 'Dias historicos considerados por la capa de conclusiones publicada.',
      },
      {
        label: 'Estaciones con datos',
        value: formatInteger(payload.stationsWithData),
        detail: 'Estaciones con historico util en la ventana de analitica actual.',
      },
    ],
    sectionTitle: 'Estaciones mas y menos usadas',
    sectionItems: items,
  };
}

async function buildMostBikesContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  const stationsResponse = await fetchStations().catch(() => ({
    stations: [],
    generatedAt: nowIso,
  }));
  const stations = [...stationsResponse.stations].sort(
    (left, right) => right.bikesAvailable - left.bikesAvailable
  );
  const items = stations.slice(0, 10).map((station, index) => ({
    title: `${index + 1}. ${station.name}`,
    detail: `${station.bikesAvailable} bicis · ${station.anchorsFree} anclajes libres · capacidad ${station.capacity}`,
    href: appRoutes.stationDetail(station.id),
    badge: `${station.bikesAvailable} bicis`,
  }));

  if (items.length === 0) {
    return fallbackContent(config, stationsResponse.generatedAt);
  }

  return {
    generatedAt: stationsResponse.generatedAt,
    summary:
      'Listado indexable de estaciones con mayor numero de bicicletas disponibles en el snapshot mas reciente del sistema.',
    stats: [
      {
        label: 'Estaciones visibles',
        value: formatInteger(stations.length),
        detail: 'Estaciones activas incluidas en el snapshot de disponibilidad actual.',
      },
      {
        label: 'Bicis totales',
        value: formatInteger(
          stations.reduce((sum, station) => sum + station.bikesAvailable, 0)
        ),
        detail: 'Suma de bicicletas visibles en el snapshot publico actual.',
      },
      {
        label: 'Pico visible',
        value: formatInteger(stations[0]?.bikesAvailable ?? 0),
        detail: 'Mayor numero de bicicletas disponibles en una sola estacion.',
      },
    ],
    sectionTitle: 'Estaciones con mas bicicletas ahora',
    sectionItems: items,
  };
}

async function buildMonthlyReportsContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  const [monthsResponse, monthlySeries] = await Promise.all([
    fetchAvailableDataMonths().catch((error) => {
      captureWarningWithContext('SEO landing degraded: available months unavailable in monthly reports.', {
        area: 'seo.landing',
        operation: 'buildMonthlyReportsContent',
        dedupeKey: 'seo.landing.monthly-reports.available-months-fallback',
        extra: { reason: String(error) },
      });
      return { months: [], generatedAt: nowIso };
    }),
    fetchCachedMonthlyDemandCurve(36).catch((error) => {
      captureWarningWithContext('SEO landing degraded: monthly demand series unavailable in monthly reports.', {
        area: 'seo.landing',
        operation: 'buildMonthlyReportsContent',
        dedupeKey: 'seo.landing.monthly-reports.monthly-series-fallback',
        extra: { reason: String(error) },
      });
      return [];
    }),
  ]);
  const monthSet = new Set<string>();
  for (const month of [
    ...monthsResponse.months,
    ...monthlySeries.map((row) => row.monthKey),
  ]) {
    if (isValidMonthKey(month)) {
      monthSet.add(month);
    }
  }
  const validMonths = Array.from(monthSet).sort((left, right) =>
    right.localeCompare(left)
  );
  const monthMap = new Map(monthlySeries.map((row) => [row.monthKey, row]));
  const items = validMonths.slice(0, 8).map((month) => {
    const row = monthMap.get(month);
    return {
      title: formatMonthLabel(month),
      detail: row
        ? `${formatInteger(Number(row.demandScore))} pts · ocupacion ${formatPercent(Number(row.avgOccupancy))} · ${formatInteger(Number(row.activeStations))} estaciones`
        : 'Informe mensual publicado con acceso directo al dashboard filtrado.',
      href: appRoutes.reportMonth(month),
      badge: month,
    };
  });

  if (items.length === 0) {
    return fallbackContent(config, monthsResponse.generatedAt);
  }

  return {
    generatedAt: monthsResponse.generatedAt,
    summary:
      'Archivo indexable de informes mensuales con URLs persistentes por mes, preparado para enlazado interno y navegacion editorial.',
    stats: [
      {
        label: 'Meses indexables',
        value: formatInteger(validMonths.length),
        detail: 'Meses publicados en el archivo mensual disponible para indexacion.',
      },
      {
        label: 'Ultimo informe',
        value: validMonths[0] ? formatMonthLabel(validMonths[0]) : 'Sin datos',
        detail: 'Informe mensual mas reciente accesible desde el archivo publico.',
      },
      {
        label: 'Serie mensual',
        value: formatInteger(monthlySeries.length),
        detail: 'Meses con agregados mensuales disponibles en la serie base.',
      },
    ],
    sectionTitle: 'Informes mensuales publicados',
    sectionItems: items,
  };
}

async function buildRedistribucionContent(
  config: SeoPageConfig,
  nowIso: string
): Promise<SeoLandingContent> {
  // Fetch a lightweight summary (uses cached report assembler)
  let stationCount = 0;
  let pctTimeEmpty = 0;
  let pctTimeFull = 0;

  try {
    const { buildRebalancingReport } = await import('@/lib/rebalancing-report');
    const report = await buildRebalancingReport({ days: 15 });
    stationCount = report.summary.totalStations;
    pctTimeEmpty = report.kpis.service.systemPctTimeEmpty;
    pctTimeFull = report.kpis.service.systemPctTimeFull;
  } catch {
    const stationsResponse = await fetchStations().catch(() => ({
      stations: [],
      generatedAt: nowIso,
    }));
    if (stationsResponse.stations.length > 0) {
      stationCount = stationsResponse.stations.length;
      const occupancyValues = stationsResponse.stations
        .filter((station) => station.capacity > 0)
        .map((station) => station.bikesAvailable / station.capacity);
      const avgOccupancy = average(occupancyValues);
      // Proxy signals from live snapshot to avoid all "Sin datos".
      pctTimeEmpty = Math.max(0, 1 - avgOccupancy);
      pctTimeFull = Math.max(0, avgOccupancy);
    }
  }

  const items: SeoItem[] = [
    {
      title: 'Clasificacion A: Sobrestock estructural',
      detail: 'Estaciones cronicamente llenas, baja rotacion e inmovilidad elevada. Candidatas a donar bicis.',
    },
    {
      title: 'Clasificacion B: Deficit estructural',
      detail: 'Ocupacion media baja y alta presion de salida. Necesitan reposicion periodica.',
    },
    {
      title: 'Clasificacion C: Saturacion puntual',
      detail: 'Solo se saturan en hora punta de manana o tarde. Intervencion preventiva recomendada.',
    },
    {
      title: 'Clasificacion D: Vaciado puntual',
      detail: 'Se vacias en hora punta pero se recuperan solas. El sistema evalua si actuar o esperar.',
    },
    {
      title: 'Clasificacion E: Equilibrada',
      detail: 'Estaciones que se autoregeulan dentro de la banda objetivo. No requieren intervencion.',
    },
    {
      title: 'Clasificacion F: Revisar dato',
      detail: 'Sensores anomalos o datos inconsistentes. Excluidas de decisiones logisticas.',
    },
  ];

  return {
    generatedAt: nowIso,
    summary:
      'Metodologia y datos del sistema de redistribucion de Bizi Zaragoza: como se clasifican las estaciones, que reglas deciden cuando intervenir y como se calculan los movimientos sugeridos.',
    stats: [
      {
        label: 'Estaciones monitorizadas',
        value: stationCount > 0 ? formatInteger(stationCount) : 'Sin datos',
        detail: 'Estaciones incluidas en el ultimo diagnostico de redistribucion.',
      },
      {
        label: '% tiempo vacias',
        value: pctTimeEmpty > 0 ? formatPercent(pctTimeEmpty) : 'Sin datos',
        detail: 'Fraccion del tiempo que el sistema promedio esta sin bicis disponibles (ultimos 15 dias).',
      },
      {
        label: '% tiempo llenas',
        value: pctTimeFull > 0 ? formatPercent(pctTimeFull) : 'Sin datos',
        detail: 'Fraccion del tiempo que el sistema promedio esta sin anclajes libres (ultimos 15 dias).',
      },
    ],
    sectionTitle: 'Sistema de clasificacion A-F',
    sectionItems: items,
  };
}

async function buildSeoLandingContent(slug: SeoPageSlug): Promise<SeoLandingContent> {
  const config = getSeoPageConfig(slug);
  const nowIso = new Date().toISOString();

  switch (slug) {
    case 'estaciones-mas-usadas-zaragoza':
      return buildMostUsedStationsContent(config, nowIso);
    case 'barrios-bizi-zaragoza':
      return buildDistrictOverviewContent(config, nowIso);
    case 'uso-bizi-por-hora':
      return buildHourlyUsageContent(config, nowIso);
    case 'ranking-estaciones-bizi':
      return buildStationRankingContent(config, nowIso);
    case 'viajes-por-dia-zaragoza':
      return buildDailyTripsContent(config, nowIso);
    case 'viajes-por-mes-zaragoza':
      return buildMonthlyTripsContent(config, nowIso);
    case 'uso-bizi-por-estacion':
      return buildStationUsageContent(config, nowIso);
    case 'estaciones-con-mas-bicis':
      return buildMostBikesContent(config, nowIso);
    case 'informes-mensuales-bizi-zaragoza':
      return buildMonthlyReportsContent(config, nowIso);
    case 'redistribucion-bizi-zaragoza':
    case 'redistribucion':
      return buildRedistribucionContent(config, nowIso);
    default:
      return fallbackContent(config, nowIso);
  }
}

function buildSeoLandingIndexabilityInput(
  config: SeoPageConfig,
  content: SeoLandingContent
): Omit<SeoIndexabilityInput, 'path' | 'canonicalPath'> {
  return {
    pageType: config.isLegacyAlias ? 'duplicate' : 'data_hub',
    hasMeaningfulContent: true,
    hasData: !content.emptyReason && content.sectionItems.length > 0,
    requiresStrongCoverage: true,
    isDuplicate: config.isLegacyAlias,
    thresholds: config.isLegacyAlias
      ? []
      : [
          {
            label: 'section-items',
            current: content.sectionItems.length,
            minimum: 3,
          },
        ],
  };
}

export function resolveSeoLandingDestinationRole(href: string): 'dashboard' | 'hub' | 'utility' {
  if (href.startsWith('/dashboard')) {
    return 'dashboard';
  }

  if (
    href === appRoutes.developers() ||
    href === appRoutes.methodology() ||
    href === appRoutes.status()
  ) {
    return 'utility';
  }

  return 'hub';
}

export function resolveSeoLandingDestination(href: string): string {
  if (href.startsWith('/dashboard')) {
    return 'dashboard_view';
  }

  if (href.startsWith('/estaciones/')) {
    return 'station_detail';
  }

  if (href.startsWith('/barrios/')) {
    return 'district_detail';
  }

  if (href.startsWith('/informes/')) {
    return 'monthly_report';
  }

  return href === appRoutes.reports() ? 'report_archive' : 'seo_or_hub';
}

export function resolveSeoLandingTransitionKind(href: string): 'to_dashboard' | 'within_public' {
  return href.startsWith('/dashboard') ? 'to_dashboard' : 'within_public';
}

export async function getSeoLandingPageData(slug: SeoPageSlug) {
  const config = getSeoPageConfig(slug);
  const content = await buildSeoLandingContent(slug);
  const path = appRoutes.seoPage(slug);
  const indexabilityInput = buildSeoLandingIndexabilityInput(config, content);
  const indexability = evaluatePageIndexability({
    path,
    canonicalPath: config.canonicalPath,
    ...indexabilityInput,
  });

  return {
    path,
    config,
    content,
    indexability,
    indexabilityInput,
  };
}

export async function generateSeoLandingMetadata(slug: SeoPageSlug): Promise<Metadata> {
  const { config, content, path, indexabilityInput } = await getSeoLandingPageData(slug);

  return buildPageMetadata({
    title: config.metadataTitle,
    description: config.description,
    path,
    canonicalPath: config.canonicalPath,
    keywords: config.keywords,
    socialImagePath: buildSocialImagePath({
      kind: 'landing',
      title: config.title,
      subtitle: content.summary,
      eyebrow: config.heroKicker,
      badges: [config.cadenceLabel, 'Landing SEO'],
    }),
    indexability: indexabilityInput,
  });
}
