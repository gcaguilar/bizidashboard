import { describe, it, expect } from 'vitest';
import { isBlockedUrl } from '@/services/gbfs-client';

describe('isBlockedUrl', () => {
  it('blocks private IPv4 literals', () => {
    expect(isBlockedUrl('http://10.0.0.5/x.json')).toBe(true);
    expect(isBlockedUrl('http://192.168.1.1/x.json')).toBe(true);
    expect(isBlockedUrl('http://127.0.0.1:3000/x.json')).toBe(true);
    expect(isBlockedUrl('http://169.254.169.254/latest')).toBe(true);
  });

  it('blocks IPv6 literals including bracketed forms', () => {
    expect(isBlockedUrl('http://[::1]/x.json')).toBe(true);
    expect(isBlockedUrl('http://[fc00::1]/x.json')).toBe(true);
    expect(isBlockedUrl('http://[fe80::1]/x.json')).toBe(true);
  });

  it('blocks CGNAT, reserved, multicast, and IPv6 transition ranges', () => {
    expect(isBlockedUrl('http://100.64.0.1/x.json')).toBe(true);
    expect(isBlockedUrl('http://100.100.100.200/x.json')).toBe(true);
    expect(isBlockedUrl('http://192.0.0.1/x.json')).toBe(true);
    expect(isBlockedUrl('http://198.18.0.1/x.json')).toBe(true);
    expect(isBlockedUrl('http://224.0.0.1/x.json')).toBe(true);
    expect(isBlockedUrl('http://255.255.255.255/x.json')).toBe(true);
    expect(isBlockedUrl('http://[ff02::1]/x.json')).toBe(true);
    expect(isBlockedUrl('http://[fe90::1]/x.json')).toBe(true);
    expect(isBlockedUrl('http://[64:ff9b::7f00:1]/x.json')).toBe(true);
    expect(isBlockedUrl('http://[2002:7f00:1::]/x.json')).toBe(true);
  });

  it('blocks localhost and non-http schemes', () => {
    expect(isBlockedUrl('http://localhost:3000/x.json')).toBe(true);
    expect(isBlockedUrl('file:///etc/passwd')).toBe(true);
    expect(isBlockedUrl('not a url')).toBe(true);
  });

  it('allows public provider URLs', () => {
    expect(isBlockedUrl('https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json')).toBe(false);
  });
});
