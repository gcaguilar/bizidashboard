import { describe, expect, it } from 'vitest';
import { FAQ_ITEMS } from '@/app/dashboard/ayuda/_components/help-center-content';
import { MESSAGE_CATALOGS, type MessageKey } from '@/lib/i18n/messages';
import { getSiteUrl } from '@/lib/site';
import { formatMonthLabel } from '@/lib/months';
import { getCoverageLabel, getHealthLabel, getObservedCadenceLabel } from '@/lib/system-status';
import { buildMethodologyContent, getMethodologyFaqItems } from '@/server-functions/metodologia';

const FAQ_IDS = ['fuente-datos', 'actualizacion', 'demanda-no-viajes-reales', 'prediccion-que-es'];

const dataset = { coverage: { generatedAt: '2026-03-01T00:00:00.000Z' } } as Parameters<
  typeof buildMethodologyContent
>[1];
const historyMeta = { generatedAt: '2026-03-01T00:00:00.000Z' };
const content = (locale: 'es' | 'en') =>
  buildMethodologyContent(locale, dataset, historyMeta, '2026-03-02T00:00:00.000Z');

type Graph = { '@graph': Array<Record<string, unknown>> };

function node(graph: Graph, type: string) {
  const found = graph['@graph'].find((entry) => entry['@type'] === type);
  if (!found) {
    throw new Error(`missing ${type}`);
  }
  return found;
}

describe('methodology FAQ', () => {
  it('serves the Spanish items byte for byte from FAQ_ITEMS', () => {
    const items = getMethodologyFaqItems('es');
    expect(items.map((item) => item.id)).toEqual(FAQ_IDS);
    for (const item of items) {
      expect(item).toBe(FAQ_ITEMS.find((source) => source.id === item.id));
    }
  });

  it('keeps the Spanish dictionary identical to FAQ_ITEMS', () => {
    for (const id of FAQ_IDS) {
      const source = FAQ_ITEMS.find((item) => item.id === id)!;
      expect(MESSAGE_CATALOGS.es[`methodology.faq.${id}.question` as MessageKey]).toBe(source.question);
      expect(MESSAGE_CATALOGS.es[`methodology.faq.${id}.answer` as MessageKey]).toBe(source.answer);
    }
  });

  it('translates the four items to English with the activity index vocabulary', () => {
    const items = getMethodologyFaqItems('en');
    expect(items.map((item) => item.id)).toEqual(FAQ_IDS);
    for (const item of items) {
      const source = FAQ_ITEMS.find((candidate) => candidate.id === item.id)!;
      expect(item.question).not.toBe(source.question);
      expect(item.answer).not.toBe(source.answer);
      expect(item.answer).not.toMatch(/movimiento estimado/i);
    }
    expect(items.find((item) => item.id === 'demanda-no-viajes-reales')!.answer).toContain('activity index');
  });

  it('has English entries for every methodology key (key parity)', () => {
    const missing = Object.keys(MESSAGE_CATALOGS.es).filter(
      (key) => key.startsWith('methodology.') && !(key in MESSAGE_CATALOGS.en),
    );
    expect(missing).toEqual([]);
  });
});

describe('methodology loader', () => {
  it('keeps Spanish breadcrumbs and JSON-LD unchanged', () => {
    const data = content('es');
    expect(data.breadcrumbs.map((item) => item.label)).toEqual(['Inicio', 'Metodología']);
    const graph = data.structuredData as unknown as Graph;
    expect(node(graph, 'TechArticle').inLanguage).toBe('es-ES');
    expect(node(graph, 'Dataset').name).toMatch(/^Dataset Bizi /);
    expect((node(graph, 'BreadcrumbList').itemListElement as Array<{ item: string }>)[1].item).toBe(
      `${getSiteUrl()}/metodologia`,
    );
    const faq = node(graph, 'FAQPage');
    expect(faq.inLanguage).toBe('es-ES');
    expect((faq.mainEntity as Array<{ name: string }>).map((q) => q.name)).toEqual(
      data.faqItems.map((item) => item.question),
    );
  });

  it('serves English breadcrumbs and JSON-LD coherent with the visible FAQ', () => {
    const data = content('en');
    expect(data.breadcrumbs.map((item) => item.label)).toEqual(['Home', 'Methodology']);
    const graph = data.structuredData as unknown as Graph;
    expect(node(graph, 'TechArticle').headline).toMatch(/^Methodology and data quality of Bizi /);
    const crumbs = node(graph, 'BreadcrumbList').itemListElement as Array<{ name: string; item: string }>;
    expect(crumbs.map((crumb) => crumb.name)).toEqual(['Home', 'Methodology']);
    expect(crumbs.map((crumb) => crumb.item)).toEqual([`${getSiteUrl()}/en`, `${getSiteUrl()}/en/metodologia`]);
    const faq = node(graph, 'FAQPage');
    expect(faq.inLanguage).toBe('en');
    const entities = faq.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>;
    expect(entities.map((q) => q.name)).toEqual(data.faqItems.map((item) => item.question));
    expect(entities.map((q) => q.acceptedAnswer.text)).toEqual(data.faqItems.map((item) => item.answer));
    expect(JSON.stringify(graph)).not.toMatch(/Metodología y calidad|¿/);
  });
});

describe('system-status labels', () => {
  type Status = Parameters<typeof getObservedCadenceLabel>[0];
  const noPolls = { pipeline: { pollsLast24Hours: 0 } } as Status;
  const polls = { pipeline: { pollsLast24Hours: 288 } } as Status;

  it('keeps Spanish defaults', () => {
    expect(getHealthLabel('down')).toBe('Caido');
    expect(getHealthLabel('healthy')).toBe('Saludable');
    expect(getObservedCadenceLabel(noPolls)).toBe('Sin datos recientes');
    expect(getObservedCadenceLabel(polls)).toBe('~5 min por sondeo');
    expect(formatMonthLabel('2026-03')).toBe('marzo de 2026');
  });

  it('translates them to English', () => {
    expect(getHealthLabel('down', 'en')).toBe('Down');
    expect(getHealthLabel('degraded', 'en')).toBe('Degraded');
    expect(getObservedCadenceLabel(noPolls, 'en')).toBe('No recent data');
    expect(getObservedCadenceLabel(polls, 'en')).toBe('~5 min per poll');
    expect(formatMonthLabel('2026-03', 'en')).toBe('March 2026');
    const coverageDataset = {
      coverage: { totalDays: 3, firstRecordedAt: null, lastRecordedAt: null },
    } as unknown as Parameters<typeof getCoverageLabel>[0];
    expect(getCoverageLabel(coverageDataset, 'en')).toBe('3 days · No data -> No data');
    expect(getCoverageLabel(coverageDataset)).toBe('3 días · Sin datos -> Sin datos');
  });
});
