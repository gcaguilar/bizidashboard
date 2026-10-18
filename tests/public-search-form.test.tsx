// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
    useNavigate: () => navigateMock,
  };
});

import { PublicSearchForm } from '@/app/_components/PublicSearchForm';

const STATIONS = [
  { id: '101', name: 'Plaza Aragón', bikesAvailable: 4 },
  { id: '102', name: 'Delicias Renfe', bikesAvailable: 0 },
];

describe('PublicSearchForm', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the provided stations without fetching /api/stations', () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error('no debería hacer fetch')));
    vi.stubGlobal('fetch', fetchSpy);

    render(<PublicSearchForm stations={STATIONS} />);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('suggests a station and navigates to its sheet', () => {
    render(<PublicSearchForm stations={STATIONS} />);
    const input = screen.getByRole('searchbox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Plaza' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: /Plaza Aragón/ }));

    expect(navigateMock).toHaveBeenCalledWith({ to: '/estadisticas/estaciones/101' });
  });

  it('suggests districts with a badge and navigates to the district page', () => {
    render(<PublicSearchForm stations={[]} districts={[{ name: 'Delicias', slug: 'delicias' }]} />);
    const input = screen.getByRole('searchbox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Del' } });

    const option = screen.getByRole('option', { name: /Delicias/ });
    expect(option.textContent).toContain('Barrio');
    fireEvent.mouseDown(option);

    expect(navigateMock).toHaveBeenCalledWith({ to: '/estadisticas/barrios/delicias' });
  });
});
