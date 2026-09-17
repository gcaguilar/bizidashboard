import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cidrContains, getClientIp, isTrustedProxyPeer } from '@/lib/security/http';

function headers(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe('cidrContains', () => {
  it('matches IPv4 ranges', () => {
    expect(cidrContains('173.245.48.0/20', '173.245.48.1')).toBe(true);
    expect(cidrContains('173.245.48.0/20', '173.245.63.255')).toBe(true);
    expect(cidrContains('173.245.48.0/20', '173.245.64.1')).toBe(false);
    expect(cidrContains('104.16.0.0/13', '104.16.5.4')).toBe(true);
    expect(cidrContains('104.16.0.0/13', '203.0.113.7')).toBe(false);
  });

  it('matches IPv6 ranges', () => {
    expect(cidrContains('2606:4700::/32', '2606:4700:4700::1111')).toBe(true);
    expect(cidrContains('2606:4700::/32', '2606:4710::1')).toBe(false);
    expect(cidrContains('2a06:98c0::/29', '2a06:98c0::1')).toBe(true);
  });

  it('rejects malformed input', () => {
    expect(cidrContains('not-a-cidr', '1.2.3.4')).toBe(false);
    expect(cidrContains('10.0.0.0/33', '10.0.0.1')).toBe(false);
    expect(cidrContains('10.0.0.0/8', 'not-an-ip')).toBe(false);
  });
});

describe('getClientIp behind Cloudflare', () => {
  const saved = process.env.TRUSTED_PROXY_CIDRS;

  beforeEach(() => {
    process.env.TRUSTED_PROXY_CIDRS = '173.245.48.0/20,2606:4700::/32';
  });

  afterEach(() => {
    if (saved === undefined) {
      delete process.env.TRUSTED_PROXY_CIDRS;
    } else {
      process.env.TRUSTED_PROXY_CIDRS = saved;
    }
  });

  it('trusts cf-connecting-ip when the peer is Cloudflare', () => {
    expect(
      getClientIp(headers({
        'x-server-peer-ip': '173.245.48.10',
        'cf-connecting-ip': '203.0.113.7',
        'x-forwarded-for': '198.51.100.9, 203.0.113.7',
      }))
    ).toBe('203.0.113.7');
  });

  it('falls back to the last XFF entry when cf-connecting-ip is missing', () => {
    expect(
      getClientIp(headers({
        'x-server-peer-ip': '173.245.48.10',
        'x-forwarded-for': '198.51.100.9, 203.0.113.7',
      }))
    ).toBe('203.0.113.7');
  });

  it('ignores spoofed cf-connecting-ip on direct connections', () => {
    expect(
      getClientIp(headers({
        'x-server-peer-ip': '198.51.100.50',
        'cf-connecting-ip': '203.0.113.7',
        'x-forwarded-for': '203.0.113.7',
      }))
    ).toBe('198.51.100.50');
  });

  it('supports IPv6 Cloudflare peers', () => {
    expect(
      getClientIp(headers({
        'x-server-peer-ip': '2606:4700:4700::1111',
        'cf-connecting-ip': '2001:db8::1',
      }))
    ).toBe('2001:db8::1');
  });

  it('returns unknown when nothing valid is present', () => {
    expect(getClientIp(headers({}))).toBe('unknown');
    expect(getClientIp(headers({ 'x-forwarded-for': 'not-an-ip' }))).toBe('unknown');
  });
});

describe('isTrustedProxyPeer', () => {
  it('uses TRUSTED_PROXY_CIDRS when configured', () => {
    process.env.TRUSTED_PROXY_CIDRS = '10.0.0.0/8';
    expect(isTrustedProxyPeer('10.1.2.3')).toBe(true);
    expect(isTrustedProxyPeer('173.245.48.1')).toBe(false);
    delete process.env.TRUSTED_PROXY_CIDRS;
  });
});
