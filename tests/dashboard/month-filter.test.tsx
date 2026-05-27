// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock, useLocationMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useLocationMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    useLocation: () => useLocationMock(),
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/lib/umami', () => ({
  buildFilterChangeEvent: vi.fn((payload) => ({ name: 'filter_change', payload })),
  trackUmamiEvent: vi.fn(),
}));

describe('MonthFilter', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useLocationMock.mockReset();
  });

  it('preserves only allowed query params when selecting a month', async () => {
    useLocationMock.mockReturnValue({
      pathname: '/dashboard/flujo',
      searchStr: '?mode=data&period=night&stationId=2&month=2026-05',
    });

    const { MonthFilter } = await import('@/app/dashboard/_components/MonthFilter');

    render(
      <MonthFilter
        months={['2026-05', '2026-04']}
        activeMonth="2026-05"
        preservedSearchKeys={['period']}
        routeKey="dashboard_flow"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'abril de 2026' }));

    expect(navigateMock).toHaveBeenCalledWith({
      search: { period: 'night', month: '2026-04' },
      replace: true,
    });
  });

  it('removes month and keeps only preserved params when selecting accumulated mode', async () => {
    useLocationMock.mockReturnValue({
      pathname: '/dashboard/flujo',
      searchStr: '?period=night&month=2026-05&stationId=2',
    });

    const { MonthFilter } = await import('@/app/dashboard/_components/MonthFilter');

    render(
      <MonthFilter
        months={['2026-05', '2026-04']}
        activeMonth="2026-05"
        preservedSearchKeys={['period']}
        routeKey="dashboard_flow"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Acumulado' }));

    expect(navigateMock).toHaveBeenCalledWith({
      search: { period: 'night' },
      replace: true,
    });
  });

  it('does not keep unrelated params when no preserved keys are configured', async () => {
    useLocationMock.mockReturnValue({
      pathname: '/dashboard/conclusiones',
      searchStr: '?mode=data&period=night&stationId=2&month=2026-05',
    });

    const { MonthFilter } = await import('@/app/dashboard/_components/MonthFilter');

    render(
      <MonthFilter
        months={['2026-05', '2026-04']}
        activeMonth="2026-05"
        routeKey="dashboard_conclusions"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'abril de 2026' }));

    expect(navigateMock).toHaveBeenCalledWith({
      search: { month: '2026-04' },
      replace: true,
    });
  });

  it('preserves zero-like string values in allowed params', async () => {
    useLocationMock.mockReturnValue({
      pathname: '/dashboard/flujo',
      searchStr: '?period=0&month=2026-05&stationId=2',
    });

    const { MonthFilter } = await import('@/app/dashboard/_components/MonthFilter');

    render(
      <MonthFilter
        months={['2026-05', '2026-04']}
        activeMonth="2026-05"
        preservedSearchKeys={['period']}
        routeKey="dashboard_flow"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'abril de 2026' }));

    expect(navigateMock).toHaveBeenCalledWith({
      search: { period: '0', month: '2026-04' },
      replace: true,
    });
  });

  it('does not navigate when selecting the already active month', async () => {
    useLocationMock.mockReturnValue({
      pathname: '/dashboard/flujo',
      searchStr: '?period=night&month=2026-05',
    });

    const { MonthFilter } = await import('@/app/dashboard/_components/MonthFilter');

    render(
      <MonthFilter
        months={['2026-05', '2026-04']}
        activeMonth="2026-05"
        preservedSearchKeys={['period']}
        routeKey="dashboard_flow"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'mayo de 2026' }));

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
