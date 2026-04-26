import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildCtaClickEvent,
  buildEntitySelectEvent,
  buildFilterChangeEvent,
  buildLegacyInteractionEvent,
  buildNavigationClickEvent,
  buildPublicPageViewEvent,
  buildSearchSubmitEvent,
  getQueryLengthBucket,
  getResultCountBucket,
  resolveRouteKeyFromPathname,
  sanitizeUmamiPayload,
  trackUmamiEvent,
} from '@/lib/umami';

describe('umami tracking helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sanitizes payloads using the GDPR allowlist', () => {
    const payload = sanitizeUmamiPayload({
      surface: 'public',
      route_key: 'home',
      source: 'hero',
      query_length_bucket: '3_5',
      source_role: 'hub',
      destination_role: 'dashboard',
      transition_kind: 'to_dashboard',
      path: '/should-not-leak',
      station_id: '123',
      empty: '',
      nullable: null,
    } as never);

    expect(payload).toEqual({
      surface: 'public',
      route_key: 'home',
      source: 'hero',
      query_length_bucket: '3_5',
      source_role: 'hub',
      destination_role: 'dashboard',
      transition_kind: 'to_dashboard',
    });
  });

  it('builds public page views without raw path or slug fields', () => {
    expect(
      buildPublicPageViewEvent({
        routeKey: 'monthly_report',
        pageType: 'report',
        template: 'monthly_report',
      })
    ).toEqual({
      name: 'public_page_view',
      payload: {
        surface: 'public',
        route_key: 'monthly_report',
        page_type: 'report',
        template: 'monthly_report',
      },
    });
  });

  it('buckets search submissions without including the search text', () => {
    expect(getQueryLengthBucket(0)).toBe('0');
    expect(getQueryLengthBucket(2)).toBe('1_2');
    expect(getQueryLengthBucket(4)).toBe('3_5');
    expect(getQueryLengthBucket(9)).toBe('6_plus');
    expect(getResultCountBucket(0)).toBe('0');
    expect(getResultCountBucket(1)).toBe('1');
    expect(getResultCountBucket(4)).toBe('2_5');
    expect(getResultCountBucket(12)).toBe('6_20');
    expect(getResultCountBucket(30)).toBe('21_plus');

    expect(
      buildSearchSubmitEvent({
        surface: 'public',
        routeKey: 'explore',
        source: 'public_search',
        queryLength: 4,
        resultCount: 12,
      })
    ).toEqual({
      name: 'search_submit',
      payload: {
        surface: 'public',
        route_key: 'explore',
        source: 'public_search',
        query_present: true,
        query_length_bucket: '3_5',
        result_count_bucket: '6_20',
      },
    });
  });

  it('maps legacy station clicks to anonymous entity selection events', () => {
    const event = buildLegacyInteractionEvent({
      eventName: 'station_card_click',
      pathname: '/estadisticas-bizi-zaragoza',
      eventData: {
        source: 'insights_featured_stations',
        station_id: '401',
      },
    });

    expect(event).toEqual({
      name: 'entity_select',
      payload: {
        surface: 'public',
        route_key: 'insights_landing',
        entity_type: 'station',
        source: 'insights_featured_stations',
      },
    });
  });

  it('builds explicit entity selection events without leaking identifiers', () => {
    expect(
      buildEntitySelectEvent({
        surface: 'public',
        routeKey: 'monthly_report',
        entityType: 'station',
        source: 'monthly_report_top_stations',
      })
    ).toEqual({
      name: 'entity_select',
      payload: {
        surface: 'public',
        route_key: 'monthly_report',
        entity_type: 'station',
        source: 'monthly_report_top_stations',
      },
    });
  });

  it('resolves dashboard route keys for static and dynamic pages', () => {
    expect(resolveRouteKeyFromPathname('/dashboard')).toBe('dashboard_home');
    expect(resolveRouteKeyFromPathname('/dashboard/flujo')).toBe('dashboard_flow');
    expect(resolveRouteKeyFromPathname('/dashboard/estaciones/123')).toBe(
      'dashboard_station_detail'
    );
    expect(resolveRouteKeyFromPathname('/informes/2026-03')).toBe('monthly_report');
  });

  it('tracks sanitized payloads through window.umami', () => {
    const track = vi.fn();
    vi.stubGlobal('window', {
      umami: { track },
    });

    trackUmamiEvent(
      buildFilterChangeEvent({
        surface: 'dashboard',
        routeKey: 'dashboard_home',
        module: 'time_window',
        source: 'dashboard_header',
        timeWindow: '30d',
      })
    );

    expect(track).toHaveBeenCalledWith('filter_change', {
      surface: 'dashboard',
      route_key: 'dashboard_home',
      module: 'time_window',
      source: 'dashboard_header',
      time_window: '30d',
    });
  });

  it('keeps navigation and CTA role metadata additive', () => {
    expect(
      buildNavigationClickEvent({
        surface: 'public',
        routeKey: 'explore',
        source: 'public_section_nav',
        destination: 'dashboard',
        module: 'public_nav_primary',
        sourceRole: 'hub',
        destinationRole: 'dashboard',
        transitionKind: 'to_dashboard',
      })
    ).toEqual({
      name: 'navigation_click',
      payload: {
        surface: 'public',
        route_key: 'explore',
        source: 'public_section_nav',
        destination: 'dashboard',
        module: 'public_nav_primary',
        source_role: 'hub',
        destination_role: 'dashboard',
        transition_kind: 'to_dashboard',
      },
    });

    expect(
      buildCtaClickEvent({
        surface: 'public',
        routeKey: 'utility_landing',
        source: 'utility_landing_hero',
        ctaId: 'utility_primary',
        destination: 'dashboard_overview',
        sourceRole: 'entry_seo',
        destinationRole: 'dashboard',
        transitionKind: 'to_dashboard',
      })
    ).toEqual({
      name: 'cta_click',
      payload: {
        surface: 'public',
        route_key: 'utility_landing',
        source: 'utility_landing_hero',
        destination: 'dashboard_overview',
        cta_id: 'utility_primary',
        source_role: 'entry_seo',
        destination_role: 'dashboard',
        transition_kind: 'to_dashboard',
      },
    });
  });
});
