import { afterEach, describe, expect, it } from 'vitest';

import {
  getSocialConfig,
  parseSocialConfig,
  resetSocialConfig,
  validateSocialRuntimeConfig,
} from '@/lib/social/config';

const originalCity = process.env.SOCIAL_CITY;

afterEach(() => {
  if (originalCity === undefined) {
    delete process.env.SOCIAL_CITY;
  } else {
    process.env.SOCIAL_CITY = originalCity;
  }
  resetSocialConfig();
});

describe('parseSocialConfig', () => {
  it('uses the spec defaults', () => {
    expect(parseSocialConfig({})).toEqual({
      enabled: false,
      city: 'zaragoza',
      timezone: 'Europe/Madrid',
      stateDbPath: '/app/data/social.sqlite',
      dryRun: false,
      imageHost: 'tmpfiles',
      bufferApiKey: null,
      bufferChannelId: null,
      tmpfilesExpireSeconds: 7200,
      catchupMinutes: 120,
    });
  });

  it('reads explicit overrides', () => {
    expect(
      parseSocialConfig({
        SOCIAL_ENABLED: '1',
        SOCIAL_CITY: 'zaragoza',
        SOCIAL_TIMEZONE: 'Europe/Madrid',
        SOCIAL_STATE_DB: '/tmp/social.sqlite',
        SOCIAL_DRY_RUN: 'true',
        SOCIAL_IMAGE_HOST: 'cloudinary',
        BUFFER_API_KEY: 'key',
        BUFFER_CHANNEL_ID: 'channel',
        TMPFILES_EXPIRE_SECONDS: '900',
        SOCIAL_CATCHUP_MINUTES: '30',
      })
    ).toEqual({
      enabled: true,
      city: 'zaragoza',
      timezone: 'Europe/Madrid',
      stateDbPath: '/tmp/social.sqlite',
      dryRun: true,
      imageHost: 'cloudinary',
      bufferApiKey: 'key',
      bufferChannelId: 'channel',
      tmpfilesExpireSeconds: 900,
      catchupMinutes: 30,
    });
  });

  it('accepts the usual false spellings and blanks as defaults', () => {
    const config = parseSocialConfig({
      SOCIAL_ENABLED: 'off',
      SOCIAL_DRY_RUN: '',
      SOCIAL_STATE_DB: '   ',
      BUFFER_API_KEY: '',
    });

    expect(config.enabled).toBe(false);
    expect(config.dryRun).toBe(false);
    expect(config.stateDbPath).toBe('/app/data/social.sqlite');
    expect(config.bufferApiKey).toBeNull();
  });

  it('rejects an invalid boolean', () => {
    expect(() => parseSocialConfig({ SOCIAL_ENABLED: 'maybe' })).toThrow(
      /SOCIAL_ENABLED/
    );
  });

  it('rejects invalid numbers instead of silently defaulting', () => {
    expect(() =>
      parseSocialConfig({ TMPFILES_EXPIRE_SECONDS: 'soon' })
    ).toThrow(/TMPFILES_EXPIRE_SECONDS/);
    expect(() =>
      parseSocialConfig({ TMPFILES_EXPIRE_SECONDS: '12.5' })
    ).toThrow(/TMPFILES_EXPIRE_SECONDS/);
    expect(() =>
      parseSocialConfig({ TMPFILES_EXPIRE_SECONDS: '0' })
    ).toThrow(/TMPFILES_EXPIRE_SECONDS/);
    expect(() =>
      parseSocialConfig({ SOCIAL_CATCHUP_MINUTES: '-1' })
    ).toThrow(/SOCIAL_CATCHUP_MINUTES/);
  });

  it('rejects an invalid timezone', () => {
    expect(() =>
      parseSocialConfig({ SOCIAL_TIMEZONE: 'Mars/Olympus' })
    ).toThrow(/SOCIAL_TIMEZONE/);
  });

  it('does not throw at import time and validates on first getter use', () => {
    expect(getSocialConfig).toBeTypeOf('function');

    process.env.SOCIAL_CITY = 'madrid';
    resetSocialConfig();
    expect(getSocialConfig().city).toBe('madrid');

    process.env.SOCIAL_CITY = 'valencia';
    expect(getSocialConfig().city).toBe('madrid');

    resetSocialConfig();
    expect(getSocialConfig().city).toBe('valencia');
  });
});

describe('validateSocialRuntimeConfig', () => {
  it('accepts the zaragoza/Europe-Madrid runtime', () => {
    expect(() =>
      validateSocialRuntimeConfig(
        { city: 'zaragoza', timezone: 'Europe/Madrid' },
        { CITY: 'zaragoza' }
      )
    ).not.toThrow();

    expect(() =>
      validateSocialRuntimeConfig(
        { city: 'zaragoza', timezone: 'Europe/Madrid' },
        {}
      )
    ).not.toThrow();
  });

  it('rejects a city mismatch instead of posting the wrong schema', () => {
    expect(() =>
      validateSocialRuntimeConfig(
        { city: 'zaragoza', timezone: 'Europe/Madrid' },
        { CITY: 'madrid' }
      )
    ).toThrow(/does not match CITY/);
  });

  it('rejects a timezone different from the analytics timezone', () => {
    expect(() =>
      validateSocialRuntimeConfig(
        { city: 'zaragoza', timezone: 'UTC' },
        { CITY: 'zaragoza' }
      )
    ).toThrow(/SOCIAL_TIMEZONE/);
  });
});
