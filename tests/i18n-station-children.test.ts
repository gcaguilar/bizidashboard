import { describe, expect, it } from 'vitest';

import { buildBreadcrumbStructuredData, createStationBreadcrumb } from '@/lib/breadcrumbs';
import { getDataStateMeta } from '@/lib/data-state';
import { translate } from '@/lib/i18n/messages';
import { CITIZEN_MAP_LEGEND, getCitizenStatus } from '@/lib/map-colors';
import {
  formatPredictionAccuracy,
  formatPredictionSentence,
  STATION_PREDICTION_COPY,
} from '@/lib/station-prediction-copy';
import {
  STATION_BEST_TIME_COPY,
  STATION_DISTRICT_COMPARISON_COPY,
  getStationDistrictComparisonCopy,
} from '@/lib/station-insights-copy';
import { getSiteUrl } from '@/lib/site';

describe('station sheet children i18n', () => {
  it('keeps the Spanish prediction copy and sentences', () => {
    expect(STATION_PREDICTION_COPY.heading).toBe('Qué podría pasar después');
    expect(STATION_PREDICTION_COPY.adviceStable).toBe('Se espera que siga disponible la próxima hora.');
    expect(
      formatPredictionSentence({ timeLabel: '08:30', bikes: 1, low: 1, high: 1, confidence: 'media' }),
    ).toBe('A las 08:30 habrá probablemente 1 bici, confianza media.');
    expect(
      formatPredictionSentence({ timeLabel: '08:30', bikes: 6, low: 4, high: 8, confidence: 'alta' }),
    ).toBe('A las 08:30 habrá probablemente 6 bicis (entre 4 y 8), confianza alta.');
    expect(formatPredictionAccuracy({ horizonMinutes: 30, percent: 82 })).toBe(
      'A 30 min acierta ±1 bici el 82 % de las veces (medido en su histórico reciente).',
    );
  });

  it('translates prediction sentences to English', () => {
    expect(
      formatPredictionSentence(
        { timeLabel: '08:30', bikes: 6, low: 4, high: 8, confidence: 'baja' },
        'en',
      ),
    ).toBe('At 08:30 there will probably be 6 bikes (between 4 and 8), low confidence.');
    expect(formatPredictionAccuracy({ horizonMinutes: 60, percent: 70 }, 'en')).toContain('60 min');
  });

  it('keeps the Spanish insights copy and translates it', () => {
    expect(STATION_DISTRICT_COMPARISON_COPY.heading).toBe('Frente a tu barrio');
    expect(STATION_DISTRICT_COMPARISON_COPY.metrics.movement).toBe(
      'Índice de actividad (puntos de actividad)',
    );
    expect(STATION_DISTRICT_COMPARISON_COPY.verdicts.above).toBe('Por encima');
    expect(STATION_DISTRICT_COMPARISON_COPY.peersLabel('Centro', 1)).toBe('Media de 1 estación de Centro');
    expect(STATION_DISTRICT_COMPARISON_COPY.peersLabel('Centro', 4)).toBe('Media de 4 estaciones de Centro');
    expect(STATION_BEST_TIME_COPY.noBikesLabel).toBe('Suele estar sin bicis');

    const en = getStationDistrictComparisonCopy('en');
    expect(en.heading).not.toBe(STATION_DISTRICT_COMPARISON_COPY.heading);
    expect(en.peersLabel('Centro', 4)).toBe('Average of 4 stations in Centro');
  });

  it('keeps Spanish citizen status labels and only translates when asked', () => {
    const station = { capacity: 20, bikesAvailable: 0, anchorsFree: 20 };
    const depleted = CITIZEN_MAP_LEGEND.find((entry) => entry.level === 'depleted')!;
    expect(getCitizenStatus(station)).toEqual(depleted);
    expect(getCitizenStatus(station, 'es')).toEqual(depleted);
    expect(getCitizenStatus(station, 'en')).toMatchObject({
      level: 'depleted',
      color: depleted.color,
      icon: depleted.icon,
      label: 'Depleted',
    });
    expect(getCitizenStatus({ capacity: 0, bikesAvailable: 0, anchorsFree: 0 }, 'en').label).toBe('No data');
  });

  it('keeps Spanish data-state copy and translates it', () => {
    expect(getDataStateMeta('empty', { subject: 'la predicción' })).toMatchObject({
      label: 'Sin datos',
      title: 'No hay datos para mostrar',
      description: 'No hay datos disponibles para la predicción ahora mismo.',
    });
    expect(getDataStateMeta('ok').description).toBe('los datos estan disponibles y son consistentes.');
    expect(getDataStateMeta('partial', { locale: 'en', subject: 'x' }).label).toBe('Partial data');
  });

  it('keeps Spanish share/favorite copy', () => {
    expect(translate('es', 'share.button')).toBe('Compartir');
    expect(translate('es', 'share.whatsapp')).toBe('Compartir por WhatsApp');
    expect(translate('es', 'favorite.add')).toBe('Guardar en mis estaciones');
    expect(translate('es', 'favorite.labeledOff')).toBe('☆ Marcar favorita');
    expect(translate('en', 'share.copyLink')).toBe('Copy link');
  });

  it('localizes the breadcrumb JSON-LD URLs of translated pages only', () => {
    const siteUrl = getSiteUrl();
    const items = createStationBreadcrumb('Plaza España', '/estadisticas/estaciones/101');

    const es = buildBreadcrumbStructuredData(items);
    expect(es.itemListElement.map((entry) => entry.item)).toEqual([
      `${siteUrl}/`,
      `${siteUrl}/estadisticas`,
      `${siteUrl}/estadisticas/estaciones`,
      `${siteUrl}/estadisticas/estaciones/101`,
    ]);

    const en = buildBreadcrumbStructuredData(items, 'en');
    expect(en.itemListElement.map((entry) => entry.item)).toEqual([
      `${siteUrl}/en`,
      `${siteUrl}/estadisticas`,
      `${siteUrl}/estadisticas/estaciones`,
      `${siteUrl}/en/estadisticas/estaciones/101`,
    ]);
  });
});
