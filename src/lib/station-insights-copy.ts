import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { translate } from '@/lib/i18n/messages';
import { getActivityIndexUnits } from '@/lib/product-copy';

/**
 * Copy compartido de los bloques "Frente a tu barrio" y "Mejor hora para ir"
 * de la ficha de estación. Ambos son lecturas estimadas del histórico. Los
 * textos viven en el diccionario central (`messages/station.ts`); las
 * constantes en español se conservan y `locale` sirve otros idiomas.
 */
export function getStationDistrictComparisonCopy(locale: Locale = DEFAULT_LOCALE) {
  return {
    heading: translate(locale, 'station.insights.district.heading'),
    subject: translate(locale, 'station.insights.district.subject'),
    emptyTitle: translate(locale, 'station.insights.district.emptyTitle'),
    emptyDescription: translate(locale, 'station.insights.district.emptyDescription'),
    note: translate(locale, 'station.insights.district.note'),
    thisStation: translate(locale, 'station.insights.district.thisStation'),
    district: translate(locale, 'station.insights.district.district'),
    metrics: {
      occupancy: translate(locale, 'station.insights.district.metric.occupancy'),
      emptyShare: translate(locale, 'station.insights.district.metric.emptyShare'),
      fullShare: translate(locale, 'station.insights.district.metric.fullShare'),
      movement: translate(locale, 'station.insights.district.metric.movement', {
        units: getActivityIndexUnits(locale).total,
      }),
    },
    verdicts: {
      above: translate(locale, 'station.insights.district.verdict.above'),
      similar: translate(locale, 'station.insights.district.verdict.similar'),
      below: translate(locale, 'station.insights.district.verdict.below'),
    },
    peersLabel: (districtName: string, peerCount: number) =>
      translate(
        locale,
        peerCount === 1
          ? 'station.insights.district.peers.one'
          : 'station.insights.district.peers.other',
        { count: peerCount, district: districtName },
      ),
  };
}

export const STATION_DISTRICT_COMPARISON_COPY = getStationDistrictComparisonCopy('es');

export function getStationBestTimeCopy(locale: Locale = DEFAULT_LOCALE) {
  return {
    heading: translate(locale, 'station.insights.bestTime.heading'),
    subject: translate(locale, 'station.insights.bestTime.subject'),
    emptyTitle: translate(locale, 'station.insights.bestTime.emptyTitle'),
    emptyDescription: translate(locale, 'station.insights.bestTime.emptyDescription'),
    note: translate(locale, 'station.insights.bestTime.note'),
    noBikesLabel: translate(locale, 'station.insights.bestTime.noBikes'),
    noAnchorsLabel: translate(locale, 'station.insights.bestTime.noAnchors'),
    betterLabel: translate(locale, 'station.insights.bestTime.better'),
    noIssues: translate(locale, 'station.insights.bestTime.noIssues'),
    noBetter: translate(locale, 'station.insights.bestTime.noBetter'),
  };
}

export const STATION_BEST_TIME_COPY = getStationBestTimeCopy('es');
