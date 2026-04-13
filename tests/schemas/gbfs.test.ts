import { describe, it, expect } from 'vitest';
import { extractFeedUrl, extractStationStatusUrl, type GBFSDiscovery } from '@/schemas/gbfs';

const mockDiscovery: GBFSDiscovery = {
  last_updated: 1234567890,
  ttl: 0,
  version: '2.0',
  data: {
    es: {
      feeds: [
        { name: 'station_status', url: 'https://example.com/es/stations' },
        { name: 'station_information', url: 'https://example.com/es/info' },
      ],
    },
    en: {
      feeds: [
        { name: 'station_status', url: 'https://example.com/en/stations' },
      ],
    },
    fr: {
      feeds: [
        { name: 'station_status', url: 'https://example.com/fr/stations' },
      ],
    },
  },
};

const mockDiscoveryWithMissingFeed: GBFSDiscovery = {
  last_updated: 1234567890,
  ttl: 0,
  version: '2.0',
  data: {
    en: {
      feeds: [
        { name: 'station_information', url: 'https://example.com/en/info' },
      ],
    },
  },
};

describe('gbfs', () => {
  describe('extractStationStatusUrl', () => {
    it('extracts station_status URL from Spanish locale', () => {
      const url = extractStationStatusUrl(mockDiscovery);
      expect(url).toBe('https://example.com/es/stations');
    });

    it('returns Spanish locale first (highest priority)', () => {
      const url = extractStationStatusUrl(mockDiscovery);
      expect(url).toContain('/es/');
    });

    it('returns null when station_status not found', () => {
      const url = extractStationStatusUrl(mockDiscoveryWithMissingFeed);
      expect(url).toBeNull();
    });
  });

  describe('extractFeedUrl', () => {
    it('extracts station_status from Spanish locale', () => {
      const url = extractFeedUrl(mockDiscovery, 'station_status');
      expect(url).toBe('https://example.com/es/stations');
    });

    it('extracts station_information from Spanish locale', () => {
      const url = extractFeedUrl(mockDiscovery, 'station_information');
      expect(url).toBe('https://example.com/es/info');
    });

    it('falls back to English when Spanish not available', () => {
      const mockDiscovery: GBFSDiscovery = {
        last_updated: 1234567890,
        ttl: 0,
        version: '2.0',
        data: {
          en: {
            feeds: [{ name: 'station_status', url: 'https://example.com/en/stations' }],
          },
        },
      };
      
      const url = extractFeedUrl(mockDiscovery, 'station_status');
      expect(url).toBe('https://example.com/en/stations');
    });

    it('falls back to French when Spanish and English not available', () => {
      const mockDiscovery: GBFSDiscovery = {
        last_updated: 1234567890,
        ttl: 0,
        version: '2.0',
        data: {
          fr: {
            feeds: [{ name: 'station_status', url: 'https://example.com/fr/stations' }],
          },
        },
      };
      
      const url = extractFeedUrl(mockDiscovery, 'station_status');
      expect(url).toBe('https://example.com/fr/stations');
    });

    it('returns null when feed not found in any locale', () => {
      const url = extractFeedUrl(mockDiscoveryWithMissingFeed, 'station_status');
      expect(url).toBeNull();
    });

    it('returns null for non-existent feed name', () => {
      const url = extractFeedUrl(mockDiscovery, 'non_existent_feed');
      expect(url).toBeNull();
    });
  });
});