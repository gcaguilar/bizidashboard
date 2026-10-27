import { movementUnits } from '@/lib/product-copy';
import type { StationSnapshot } from '@/lib/api-types';
import { average, formatDateLabel, formatDecimal, formatHourRange, formatInteger, formatPercent } from '@/lib/format';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata, type PageMetadata } from '@/lib/seo';
import { evaluatePageIndexability, type SeoIndexabilityInput } from '@/lib/seo-policy';
import {
  createLiveSeoLandingSources,
  type SeoLandingSources,
} from '@/lib/seo-landing-sources.server';
import {
  getSeoPageConfig,
  type SeoPageConfig,
  type SeoPageSlug,
} from '@/lib/seo-pages';
import { buildSocialImagePath } from '@/lib/social-images';

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
  'Todavía no hay suficientes datos para mostrar esta página con confianza.';

/** Ocupacion de una estacion (0..1); 0 si no declara capacidad. */
function occupancyOf(station: StationSnapshot): number {
  return station.capacity > 0 ? station.bikesAvailable / station.capacity : 0;
}

/** Bicis disponibles sumadas en un snapshot. */
function sumBikes(stations: StationSnapshot[]): number {
  return stations.reduce((sum, station) => sum + station.bikesAvailable, 0);
}

/** Ocupacion media del snapshot, con las estaciones sin capacidad contando 0. */
function averageOccupancy(stations: StationSnapshot[]): number {
  if (stations.length === 0) {
    return 0;
  }

  return stations.reduce((sum, station) => sum + occupancyOf(station), 0) / stations.length;
}

/** Copia ordenada por ocupacion descendente y, a igualdad, por bicis descendente. */
function sortByOccupancyDesc(stations: StationSnapshot[]): StationSnapshot[] {
  return [...stations].sort(
    (left, right) =>
      occupancyOf(right) - occupancyOf(left) || right.bikesAvailable - left.bikesAvailable
  );
}

/** Copia ordenada por bicis disponibles descendente. */
function sortByBikesDesc(stations: StationSnapshot[]): StationSnapshot[] {
  return [...stations].sort((left, right) => right.bikesAvailable - left.bikesAvailable);
}

export function buildSeoFaqStructuredData(config: SeoPageConfig) {
  return {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Qué puedo consultar en ${config.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: config.description,
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuándo se actualiza esta información?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${config.cadenceLabel}. La fecha visible indica cuándo se actualizaron los datos por última vez.`,
        },
      },
      {
        '@type': 'Question',
        name: '¿Dónde puedo ver más detalle?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Desde aquí puedes abrir ${config.primaryCta.label.toLowerCase()} para seguir explorando los datos actualizados.`,
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
        detail: 'Aún no hay suficiente cobertura de datos para esta vista.',
      },
      {
        label: 'Estado',
        value: 'Pendiente',
        detail: 'La página estará lista cuando haya datos suficientes.',
      },
      {
        label: 'Mientras tanto',
        value: 'Explora la red',
        detail: 'Puedes abrir el mapa y consultar las estaciones disponibles ahora.',
      },
    ],
    sectionTitle: 'Cobertura pendiente',
    sectionItems: [],
    emptyReason: EMPTY_STATE_MESSAGE,
  };
}

async function buildMostUsedStationsContent(
  config: SeoPageConfig,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  const [stationsResponse, rankingsResponse] = await Promise.all([
    sources.loadStations(),
    sources.loadRankings('turnover', 12),
  ]);

  const stationMap = new Map(stationsResponse.stations.map((station) => [station.id, station]));
  const items = rankingsResponse.rankings.slice(0, 8).map((row, index) => {
    const station = stationMap.get(row.stationId);
    return {
      title: `${index + 1}. ${station?.name ?? row.stationId}`,
      detail: `${formatDecimal(row.turnoverScore)} ${movementUnits.total} · ${station ? `${station.bikesAvailable} bicis disponibles ahora` : 'ver detalle de la estación'}`,
      href: appRoutes.stationDetail(row.stationId),
      badge: `Top ${index + 1}`,
    };
  });

  if (items.length === 0 && stationsResponse.stations.length > 0) {
    const fallbackItems = sortByOccupancyDesc(stationsResponse.stations)
      .slice(0, 8)
      .map((station, index) => ({
        title: `${index + 1}. ${station.name}`,
        detail: `${formatInteger(station.bikesAvailable)} bicis disponibles · capacidad ${formatInteger(station.capacity)} · ocupación ${formatPercent(occupancyOf(station))}`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Estado actual',
      }));

    return {
      generatedAt: stationsResponse.generatedAt,
      summary:
        'Estas estaciones se ordenan por su disponibilidad actual porque aún no hay suficiente histórico para el ranking.',
      stats: [
        {
          label: 'Estaciones activas',
          value: formatInteger(stationsResponse.stations.length),
          detail: 'Total de estaciones incluidas en la última actualización.',
        },
        {
          label: 'Bicis visibles',
          value: formatInteger(sumBikes(stationsResponse.stations)),
          detail: 'Total de bicis disponibles en la última actualización.',
        },
        {
          label: 'Datos mostrados',
          value: 'Estado actual',
          detail: 'Mostramos disponibilidad actual mientras se completa el histórico.',
        },
      ],
      sectionTitle: 'Estaciones destacadas ahora',
      sectionItems: fallbackItems,
    };
  }

  if (items.length === 0) {
    return fallbackContent(config, rankingsResponse.generatedAt);
  }

  return {
    generatedAt: rankingsResponse.generatedAt,
    summary:
      'Estas son las estaciones con más movimiento estimado reciente. Abre cada una para consultar su disponibilidad actual.',
    stats: [
      {
        label: 'Estaciones activas',
        value: formatInteger(stationsResponse.stations.length),
        detail: 'Total de estaciones incluidas en la última actualización.',
      },
      {
        label: 'Movimiento medio del top 5',
        value: `${formatDecimal(average(rankingsResponse.rankings.slice(0, 5).map((row) => Number(row.turnoverScore))))} ${movementUnits.total}`,
        detail: 'Movimiento estimado medio de las estaciones más activas.',
      },
      {
        label: 'Bicis visibles',
        value: formatInteger(sumBikes(stationsResponse.stations)),
        detail: 'Total de bicis disponibles en la última actualización.',
      },
    ],
    sectionTitle: 'Estaciones con más movimiento',
    sectionItems: items,
  };
}

async function buildDistrictOverviewContent(
  config: SeoPageConfig,
  nowIso: string,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  const rows = await sources.loadDistrictRows();
  const items = rows.slice(0, 8).map((district, index) => ({
    title: `${index + 1}. ${district.name}`,
    detail: `${district.stationCount} estaciones · ${formatDecimal(district.avgTurnover)} ${movementUnits.perDay} de media · ${district.bikesAvailable} bicis disponibles`,
    href: appRoutes.districtDetail(district.slug),
    badge: `${district.stationCount} est.`,
  }));

  if (items.length === 0) {
    return fallbackContent(config, nowIso);
  }

  return {
    generatedAt: nowIso,
    summary:
      'Compara cuántas estaciones y bicis hay en cada barrio, y abre su ficha para ver el detalle.',
    stats: [
      {
        label: 'Barrios con datos',
        value: formatInteger(rows.length),
        detail: 'Barrios con estaciones activas y ubicación asignada.',
      },
      {
        label: 'Estaciones en total',
        value: formatInteger(rows.reduce((sum, district) => sum + district.stationCount, 0)),
        detail: 'Estaciones activas incluidas en los barrios mostrados.',
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
  nowIso: string,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  const profile = await sources.loadHourlyProfile(14);
  const items = [...profile]
    .sort((left, right) => Number(left.avgBikesAvailable) - Number(right.avgBikesAvailable))
    .slice(0, 8)
    .map((row, index) => ({
      title: `${index + 1}. ${formatHourRange(row.hour)}`,
      detail: `${formatDecimal(Number(row.avgBikesAvailable))} bicis disponibles · ocupación ${formatPercent(Number(row.avgOccupancy))}`,
      href: appRoutes.dashboardView('research'),
      badge: `${formatInteger(Number(row.sampleCount))} muestras`,
    }));

  if (items.length === 0) {
    const stationsResponse = await sources.loadStations();
    const liveItems = sortByOccupancyDesc(stationsResponse.stations)
      .slice(0, 8)
      .map((station, index) => ({
        title: `${index + 1}. ${station.name}`,
        detail: `${station.bikesAvailable} bicis · ocupación ${formatPercent(occupancyOf(station))} · capacidad ${station.capacity}`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Estado actual',
      }));

    if (liveItems.length > 0) {
      const avgOccupancy = averageOccupancy(stationsResponse.stations);
      const now = new Date(stationsResponse.generatedAt);
      return {
        generatedAt: stationsResponse.generatedAt,
        summary:
          'Aún no hay suficiente histórico horario; mientras tanto, consulta la disponibilidad actual de estas estaciones.',
        stats: [
          {
            label: 'Estaciones con datos',
            value: formatInteger(stationsResponse.stations.length),
            detail: 'Estaciones activas incluidas en la última actualización.',
          },
          {
            label: 'Hora de la consulta',
            value: formatHourRange(now.getHours()),
            detail: 'Hora a la que se tomó la última actualización.',
          },
          {
            label: 'Ocupación media',
            value: formatPercent(avgOccupancy),
            detail: 'Promedio de ocupación en la última actualización.',
          },
        ],
        sectionTitle: 'Estaciones con mayor ocupación ahora',
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
      'Descubre en qué franjas cambia más la disponibilidad de la red y compara las horas con más actividad.',
    stats: [
      {
        label: 'Franjas con datos',
        value: formatInteger(profile.length),
        detail: 'Horas del día con suficientes muestras recientes.',
      },
      {
        label: 'Franja más activa',
        value: busiestHour ? formatHourRange(busiestHour.hour) : 'Sin datos',
        detail: 'Franja con más movimiento estimado de bicis.',
      },
      {
        label: 'Ocupación media',
        value: formatPercent(average(profile.map((row) => Number(row.avgOccupancy)))),
        detail: 'Promedio de ocupación observado a lo largo del día.',
      },
    ],
    sectionTitle: 'Horas con mayor actividad',
    sectionItems: items,
  };
}

async function buildStationRankingContent(
  config: SeoPageConfig,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  const [stationsResponse, turnoverResponse, availabilityResponse] = await Promise.all([
    sources.loadStations(),
    sources.loadRankings('turnover', 6),
    sources.loadRankings('availability', 6),
  ]);

  const stationMap = new Map(stationsResponse.stations.map((station) => [station.id, station]));
  const items = [
    ...turnoverResponse.rankings.slice(0, 4).map((row, index) => ({
      title: `Uso ${index + 1}. ${stationMap.get(row.stationId)?.name ?? row.stationId}`,
      detail: `${formatDecimal(row.turnoverScore)} ${movementUnits.total} · ${row.emptyHours + row.fullHours} h sin bicis o huecos`,
      href: appRoutes.stationDetail(row.stationId),
      badge: 'Movimiento estimado',
    })),
    ...availabilityResponse.rankings.slice(0, 4).map((row, index) => ({
      title: `Riesgo ${index + 1}. ${stationMap.get(row.stationId)?.name ?? row.stationId}`,
      detail: `${row.emptyHours + row.fullHours} h sin bicis o huecos · ${formatDecimal(row.turnoverScore)} ${movementUnits.total}`,
      href: appRoutes.stationDetail(row.stationId),
      badge: 'Disponibilidad a revisar',
    })),
  ];

  if (items.length === 0 && stationsResponse.stations.length > 0) {
    const fallbackItems = sortByBikesDesc(stationsResponse.stations)
      .slice(0, 8)
      .map((station, index) => ({
        title: `${index + 1}. ${station.name}`,
        detail: `${formatInteger(station.bikesAvailable)} bicis · ${formatInteger(station.anchorsFree)} anclajes libres · capacidad ${formatInteger(station.capacity)}`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Estado actual',
      }));

    return {
      generatedAt: stationsResponse.generatedAt,
      summary:
        'Estas estaciones están ordenadas por disponibilidad actual porque todavía no hay histórico suficiente para el ranking.',
      stats: [
        {
          label: 'Estaciones con datos',
          value: formatInteger(stationsResponse.stations.length),
          detail: 'Estaciones activas incluidas en la última actualización.',
        },
        {
          label: 'Bicis totales',
          value: formatInteger(sumBikes(stationsResponse.stations)),
          detail: 'Total de bicis disponibles en la última actualización.',
        },
        {
          label: 'Datos mostrados',
          value: 'Estado actual',
          detail: 'Mostramos disponibilidad actual mientras se completa el histórico.',
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
      'Compara las estaciones con más movimiento estimado y las que pasan más tiempo sin bicis o huecos libres.',
    stats: [
      {
        label: 'Estaciones con datos',
        value: formatInteger(stationsResponse.stations.length),
        detail: 'Estaciones activas incluidas en la última actualización.',
      },
      {
        label: 'Más movimiento',
        value: `${formatDecimal(Number(turnoverResponse.rankings[0]?.turnoverScore ?? 0))} ${movementUnits.total}`,
        detail: 'Movimiento estimado de la estación que encabeza el ranking.',
      },
      {
        label: 'Mayor tiempo con problemas',
        value: formatInteger(
          Number(availabilityResponse.rankings[0]?.emptyHours ?? 0) +
            Number(availabilityResponse.rankings[0]?.fullHours ?? 0)
        ),
        detail: 'Horas acumuladas sin bicis o huecos en la estación que más conviene revisar.',
      },
    ],
    sectionTitle: 'Estaciones destacadas del ranking',
    sectionItems: items,
  };
}

async function buildDailyTripsContent(
  config: SeoPageConfig,
  nowIso: string,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  const dailySeries = await sources.loadDailySeries(30);
  const nonEmptyRows = dailySeries.filter(
    (row) => Number(row.sampleCount) > 0 || Number(row.demandScore) > 0
  );
  const latestRow = nonEmptyRows[nonEmptyRows.length - 1] ?? null;
  const items = [...nonEmptyRows]
    .reverse()
    .slice(0, 8)
    .map((row) => ({
      title: row.day,
      detail: `${formatInteger(Number(row.demandScore))} ${movementUnits.total} · ocupación ${formatPercent(Number(row.avgOccupancy))}`,
      href: appRoutes.dashboardConclusions(),
      badge: `${formatInteger(Number(row.sampleCount))} muestras`,
    }));

  if (items.length === 0) {
    const stationsResponse = await sources.loadStations();
    if (stationsResponse.stations.length > 0) {
      const totalBikes = sumBikes(stationsResponse.stations);
      const avgOccupancy = averageOccupancy(stationsResponse.stations);
      return {
        generatedAt: stationsResponse.generatedAt,
        summary:
          'Aún no hay suficiente histórico diario; mientras tanto, mostramos el estado actual de la red.',
        stats: [
          {
            label: 'Día de referencia',
            value: formatDateLabel(stationsResponse.generatedAt),
            detail: 'Fecha de la actualización usada como referencia.',
          },
          {
            label: 'Bicis visibles',
            value: formatInteger(totalBikes),
            detail: 'Bicis disponibles en esa actualización.',
          },
          {
            label: 'Ocupación media',
            value: formatPercent(avgOccupancy),
            detail: 'Ocupación media de la red en esa actualización.',
          },
        ],
        sectionTitle: 'Referencia diaria actual',
        sectionItems: [
          {
            title: formatDateLabel(stationsResponse.generatedAt),
            detail: `${formatInteger(totalBikes)} bicis disponibles · ocupación media ${formatPercent(avgOccupancy)} · ${formatInteger(stationsResponse.stations.length)} estaciones`,
            href: appRoutes.dashboardConclusions(),
            badge: 'Estado actual',
          },
        ],
      };
    }
    return fallbackContent(config, nowIso);
  }

  return {
    generatedAt: nowIso,
    summary:
      'Sigue cómo cambia el movimiento estimado de la red día a día. Es un índice para comparar, no el número oficial de viajes.',
    stats: [
      {
        label: 'Días con datos',
        value: formatInteger(nonEmptyRows.length),
        detail: 'Días recientes con movimiento estimado en la serie.',
      },
      {
        label: 'Último día',
        value: latestRow ? latestRow.day : 'Sin datos',
        detail: 'La fecha más reciente disponible en el histórico diario.',
      },
      {
        label: 'Movimiento reciente',
        value: latestRow ? `${formatInteger(Number(latestRow.demandScore))} ${movementUnits.total}` : 'Sin datos',
        detail: 'Índice de movimiento estimado del último día disponible.',
      },
    ],
    sectionTitle: 'Últimos días con movimiento estimado',
    sectionItems: items,
  };
}

async function buildMonthlyTripsContent(
  config: SeoPageConfig,
  nowIso: string,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  const monthlySeries = await sources.loadMonthlySeries(12);
  const items = [...monthlySeries]
    .reverse()
    .slice(0, 8)
    .map((row) => ({
      title: isValidMonthKey(row.monthKey) ? formatMonthLabel(row.monthKey) : row.monthKey,
      detail: `${formatInteger(Number(row.demandScore))} ${movementUnits.total} · ocupación ${formatPercent(Number(row.avgOccupancy))} · ${formatInteger(Number(row.activeStations))} estaciones`,
      href: appRoutes.reportMonth(row.monthKey),
      badge: row.monthKey,
    }));

  const latestRow = monthlySeries[monthlySeries.length - 1] ?? null;
  if (items.length === 0) {
    const stationsResponse = await sources.loadStations();
    if (stationsResponse.stations.length > 0) {
      const snapshotDate = new Date(stationsResponse.generatedAt);
      const monthKey = `${snapshotDate.getUTCFullYear()}-${String(
        snapshotDate.getUTCMonth() + 1
      ).padStart(2, '0')}`;
      const totalBikes = sumBikes(stationsResponse.stations);
      const avgOccupancy = averageOccupancy(stationsResponse.stations);
      return {
        generatedAt: stationsResponse.generatedAt,
        summary:
          'Aún no hay suficiente histórico mensual; mientras tanto, mostramos la última actualización disponible.',
        stats: [
          {
            label: 'Mes de referencia',
            value: isValidMonthKey(monthKey) ? formatMonthLabel(monthKey) : monthKey,
            detail: 'Mes de la última actualización disponible.',
          },
          {
            label: 'Estaciones activas',
            value: formatInteger(stationsResponse.stations.length),
            detail: 'Estaciones presentes en esa actualización.',
          },
          {
            label: 'Ocupación media',
            value: formatPercent(avgOccupancy),
            detail: 'Ocupación media de la última actualización.',
          },
        ],
        sectionTitle: 'Mes de referencia',
        sectionItems: [
          {
            title: isValidMonthKey(monthKey) ? formatMonthLabel(monthKey) : monthKey,
            detail: `${formatInteger(totalBikes)} bicis disponibles · ocupación ${formatPercent(avgOccupancy)} · ${formatInteger(stationsResponse.stations.length)} estaciones`,
            href: appRoutes.reports(),
            badge: 'Estado actual',
          },
        ],
      };
    }
    return fallbackContent(config, nowIso);
  }

  return {
    generatedAt: nowIso,
    summary:
      'Compara cómo evoluciona la red mes a mes y abre cada informe para ver las estaciones y barrios con más detalle.',
    stats: [
      {
        label: 'Meses con datos',
        value: formatInteger(monthlySeries.length),
        detail: 'Meses con datos agregados disponibles en la serie.',
      },
      {
        label: 'Último mes',
        value:
          latestRow && isValidMonthKey(latestRow.monthKey)
            ? formatMonthLabel(latestRow.monthKey)
            : latestRow?.monthKey ?? 'Sin datos',
        detail: 'El mes más reciente disponible en la serie.',
      },
      {
        label: 'Estaciones activas',
        value: formatInteger(Number(latestRow?.activeStations ?? 0)),
        detail: 'Estaciones con actividad registrada en el último mes.',
      },
    ],
    sectionTitle: 'Meses publicados',
    sectionItems: items,
  };
}

async function buildStationUsageContent(
  config: SeoPageConfig,
  nowIso: string,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  async function buildSnapshotFallbackContent(): Promise<SeoLandingContent | null> {
    const stationsResponse = await sources.loadStations();
    if (stationsResponse.stations.length === 0) {
      return null;
    }

    const sortedByBikes = sortByBikesDesc(stationsResponse.stations);
    const leastByBikes = [...stationsResponse.stations].sort(
      (left, right) => left.bikesAvailable - right.bikesAvailable
    );
    const fallbackItems = [
      ...sortedByBikes.slice(0, 4).map((station, index) => ({
        title: `Alta disponibilidad ${index + 1}. ${station.name}`,
        detail: `${formatInteger(station.bikesAvailable)} bicis · ${formatInteger(station.anchorsFree)} anclajes libres`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Estado actual',
      })),
      ...leastByBikes.slice(0, 4).map((station, index) => ({
        title: `Baja disponibilidad ${index + 1}. ${station.name}`,
        detail: `${formatInteger(station.bikesAvailable)} bicis · capacidad ${formatInteger(station.capacity)}`,
        href: appRoutes.stationDetail(station.id),
        badge: 'Estado actual',
      })),
    ];

    return {
      generatedAt: stationsResponse.generatedAt,
      summary:
        'Aún no hay suficiente histórico para comparar el uso. Mientras tanto, consulta qué estaciones tienen más o menos bicis ahora.',
      stats: [
        {
          label: 'Estaciones activas',
          value: formatInteger(stationsResponse.stations.length),
          detail: 'Estaciones disponibles en la última actualización.',
        },
        {
          label: 'Bicis visibles',
          value: formatInteger(sumBikes(stationsResponse.stations)),
          detail: 'Bicis disponibles en la última actualización.',
        },
        {
          label: 'Datos mostrados',
          value: 'Estado actual',
          detail: 'Mostramos disponibilidad actual mientras se completa el histórico.',
        },
      ],
      sectionTitle: 'Comparativa de estaciones ahora',
      sectionItems: fallbackItems,
    };
  }

  const payload = await sources.loadRecentConclusions();

  if (!payload) {
    const snapshotFallback = await buildSnapshotFallbackContent();
    if (snapshotFallback) {
      return snapshotFallback;
    }
    return fallbackContent(config, nowIso);
  }

  const items = [
    ...payload.topStationsByDemand.slice(0, 4).map((station, index) => ({
      title: `Alta demanda ${index + 1}. ${station.stationName}`,
      detail: `${formatDecimal(station.avgDemand)} ${movementUnits.perDay} · ver detalle de la estación`,
      href: appRoutes.stationDetail(station.stationId),
      badge: 'Top',
    })),
    ...payload.leastUsedStations.slice(0, 4).map((station, index) => ({
      title: `Menor uso ${index + 1}. ${station.stationName}`,
      detail: `${formatDecimal(station.avgDemand)} ${movementUnits.perDay} · conviene seguir su evolución`,
      href: appRoutes.stationDetail(station.stationId),
      badge: 'Seguimiento',
    })),
  ];

  if (items.length === 0) {
    const snapshotFallback = await buildSnapshotFallbackContent();
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
        label: 'Días de histórico',
        value: formatInteger(payload.totalHistoricalDays),
        detail: 'Días con datos usados para calcular esta comparación.',
      },
      {
        label: 'Estaciones con histórico',
        value: formatInteger(payload.stationsWithData),
        detail: 'Estaciones con suficientes datos para esta comparación.',
      },
    ],
    sectionTitle: 'Estaciones con más y menos movimiento',
    sectionItems: items,
  };
}

async function buildMostBikesContent(
  config: SeoPageConfig,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  const stationsResponse = await sources.loadStations();
  const stations = sortByBikesDesc(stationsResponse.stations);
  const items = stations.slice(0, 10).map((station, index) => ({
    title: `${index + 1}. ${station.name}`,
    detail: `${station.bikesAvailable} bicis disponibles · ${station.anchorsFree} huecos libres · capacidad ${station.capacity}`,
    href: appRoutes.stationDetail(station.id),
    badge: `${station.bikesAvailable} bicis`,
  }));

  if (items.length === 0) {
    return fallbackContent(config, stationsResponse.generatedAt);
  }

  return {
    generatedAt: stationsResponse.generatedAt,
    summary:
      'Estas son las estaciones con más bicis disponibles en la última actualización. Ábrelas para comprobar su estado antes de ir.',
    stats: [
      {
        label: 'Estaciones con datos',
        value: formatInteger(stations.length),
        detail: 'Estaciones activas incluidas en la última actualización.',
      },
      {
        label: 'Bicis totales',
        value: formatInteger(sumBikes(stations)),
        detail: 'Total de bicis disponibles en la última actualización.',
      },
      {
        label: 'Mayor disponibilidad',
        value: formatInteger(stations[0]?.bikesAvailable ?? 0),
        detail: 'Mayor número de bicis disponibles en una sola estación.',
      },
    ],
    sectionTitle: 'Estaciones con más bicis ahora',
    sectionItems: items,
  };
}

async function buildMonthlyReportsContent(
  config: SeoPageConfig,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  const [monthsResponse, monthlySeries] = await Promise.all([
    sources.loadAvailableMonths(),
    sources.loadMonthlySeries(36),
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
        ? `${formatInteger(Number(row.demandScore))} ${movementUnits.total} · ocupación ${formatPercent(Number(row.avgOccupancy))} · ${formatInteger(Number(row.activeStations))} estaciones`
        : 'Informe mensual publicado para consultar ese mes en detalle.',
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
      'Consulta los informes mensuales de Bizi Zaragoza y abre cada mes para ver su evolución en detalle.',
    stats: [
      {
        label: 'Meses publicados',
        value: formatInteger(validMonths.length),
        detail: 'Meses disponibles en el archivo de informes.',
      },
      {
        label: 'Último informe',
        value: validMonths[0] ? formatMonthLabel(validMonths[0]) : 'Sin datos',
        detail: 'El informe mensual más reciente disponible.',
      },
      {
        label: 'Serie mensual',
        value: formatInteger(monthlySeries.length),
        detail: 'Meses con datos agregados disponibles en la serie.',
      },
    ],
    sectionTitle: 'Informes mensuales publicados',
    sectionItems: items,
  };
}

export async function buildRedistribucionContent(
  _config: SeoPageConfig,
  nowIso: string,
  sources: SeoLandingSources = createLiveSeoLandingSources(nowIso)
): Promise<SeoLandingContent> {
  let stationCount = 0;
  let pctTimeEmpty = 0;
  let pctTimeFull = 0;
  let generatedAt = nowIso;

  // Solo hacen falta tres escalares: el informe completo (15 dias de
  // StationStatus) se reserva para el dashboard y la API.
  const summary = await sources.loadAvailabilitySummary(15);

  if (summary && summary.stationCount > 0) {
    stationCount = summary.stationCount;
    pctTimeEmpty = summary.pctTimeEmpty;
    pctTimeFull = summary.pctTimeFull;
    generatedAt = summary.generatedAt ?? nowIso;
  } else {
    const stationsResponse = await sources.loadStations();
    generatedAt = stationsResponse.generatedAt;
    if (stationsResponse.stations.length > 0) {
      stationCount = stationsResponse.stations.length;
      const occupancyValues = stationsResponse.stations
        .filter((station) => station.capacity > 0)
        .map(occupancyOf);
      const avgOccupancy = average(occupancyValues);
      // Proxy signals from live snapshot to avoid all "Sin datos".
      pctTimeEmpty = Math.max(0, 1 - avgOccupancy);
      pctTimeFull = Math.max(0, avgOccupancy);
    }
  }

  const items: SeoItem[] = [
    {
      title: 'Grupo A: suelen estar demasiado llenas',
      detail: 'Acumulan muchas bicis durante mucho tiempo y apenas se mueven. Puede convenir retirar algunas.',
    },
    {
      title: 'Grupo B: suelen quedarse sin bicis',
      detail: 'Tienen pocas bicis de media y mucha salida. Puede convenir llevarles bicis con regularidad.',
    },
    {
      title: 'Grupo C: se llenan a horas concretas',
      detail: 'El problema aparece sobre todo en horas punta. Anticiparse puede evitar que falten huecos.',
    },
    {
      title: 'Grupo D: se vacían a horas concretas',
      detail: 'Pierden bicis en horas punta, pero a veces se recuperan solas. Conviene comprobar la tendencia antes de actuar.',
    },
    {
      title: 'Grupo E: equilibradas',
      detail: 'Se mantienen dentro de un rango útil de bicis y huecos. No suelen necesitar intervención.',
    },
    {
      title: 'Grupo F: revisar los datos',
      detail: 'Hay señales anómalas o datos inconsistentes. No se usan para decidir movimientos de bicis.',
    },
  ];

  return {
    generatedAt,
    summary:
      'Entiende qué estaciones suelen quedarse sin bicis o sin huecos, cómo las agrupamos y qué señales ayudan a decidir dónde hace falta intervenir.',
    stats: [
      {
        label: 'Estaciones monitorizadas',
        value: stationCount > 0 ? formatInteger(stationCount) : 'Sin datos',
        detail: 'Estaciones incluidas en el último análisis de redistribución.',
      },
      {
        label: '% de tiempo vacías',
        value: pctTimeEmpty > 0 ? formatPercent(pctTimeEmpty) : 'Sin datos',
        detail: 'Parte del tiempo en que la red suele estar sin bicis disponibles (últimos 15 días).',
      },
      {
        label: '% de tiempo llenas',
        value: pctTimeFull > 0 ? formatPercent(pctTimeFull) : 'Sin datos',
        detail: 'Parte del tiempo en que la red suele estar sin huecos libres (últimos 15 días).',
      },
    ],
    sectionTitle: 'Cómo agrupamos las estaciones',
    sectionItems: items,
  };
}

async function buildSeoLandingContent(
  slug: SeoPageSlug,
  nowIso: string,
  sources: SeoLandingSources
): Promise<SeoLandingContent> {
  const config = getSeoPageConfig(slug);

  switch (slug) {
    case 'estaciones-mas-usadas-zaragoza':
      return buildMostUsedStationsContent(config, sources);
    case 'barrios-bizi-zaragoza':
      return buildDistrictOverviewContent(config, nowIso, sources);
    case 'uso-bizi-por-hora':
      return buildHourlyUsageContent(config, nowIso, sources);
    case 'ranking-estaciones-bizi':
      return buildStationRankingContent(config, sources);
    case 'viajes-por-dia-zaragoza':
      return buildDailyTripsContent(config, nowIso, sources);
    case 'viajes-por-mes-zaragoza':
      return buildMonthlyTripsContent(config, nowIso, sources);
    case 'uso-bizi-por-estacion':
      return buildStationUsageContent(config, nowIso, sources);
    case 'estaciones-con-mas-bicis':
      return buildMostBikesContent(config, sources);
    case 'informes-mensuales-bizi-zaragoza':
      return buildMonthlyReportsContent(config, sources);
    case 'redistribucion':
      return buildRedistribucionContent(config, nowIso, sources);
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

export async function getSeoLandingPageData(slug: SeoPageSlug, sources?: SeoLandingSources) {
  const config = getSeoPageConfig(slug);
  const nowIso = new Date().toISOString();
  const content = await buildSeoLandingContent(
    slug,
    nowIso,
    sources ?? createLiveSeoLandingSources(nowIso)
  );
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

export async function generateSeoLandingMetadata(slug: SeoPageSlug): Promise<PageMetadata> {
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
