import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MetricEvidence } from '@/app/_components/MetricEvidence';

vi.mock('@/app/_components/TrackedLink', () => ({ TrackedLink: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

describe('MetricEvidence', () => {
  it('shows type, coverage, window, limitation and methodology at point of use', () => {
    const html = renderToStaticMarkup(<MetricEvidence type="estimado" coverage="30 días" window="abril" limitation="No son viajes." />);
    expect(html).toContain('Estimado');
    expect(html).toContain('Cobertura: 30 días');
    expect(html).toContain('Ventana: abril');
    expect(html).toContain('No son viajes.');
    expect(html).toContain('Metodología');
  });
});
