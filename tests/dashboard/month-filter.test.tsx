// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock, useSearchMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useSearchMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    useSearch: (options: { select?: (search: unknown) => unknown }) => {
      const search = useSearchMock();
      return options?.select ? options.select(search) : search;
    },
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/lib/umami', () => ({
  buildFilterChangeEvent: vi.fn((payload) => ({ name: 'filter_change', payload })),
  trackUmamiEvent: vi.fn(),
}));

/** Resuelve el updater funcional que MonthFilter pasa a navigate. */
function resolveNextSearch(previous: Record<string, unknown>): Record<string, unknown> {
  expect(navigateMock).toHaveBeenCalledTimes(1);
  const call = navigateMock.mock.calls[0][0] as {
    replace: boolean;
    search: (prev: Record<string, unknown>) => Record<string, unknown>;
  };

  expect(call.replace).toBe(true);
  return call.search(previous);
}

describe('MonthFilter', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useSearchMock.mockReset();
  });

  it('sets the selected month and keeps the rest of the route search', async () => {
    useSearchMock.mockReturnValue({ period: 'night', month: '2026-05' });

    const { MonthFilter } = await import('@/app/dashboard/_components/MonthFilter');

    render(
      <MonthFilter months={['2026-05', '2026-04']} activeMonth="2026-05" routeKey="dashboard_flow" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'abril de 2026' }));

    expect(resolveNextSearch({ period: 'night', month: '2026-05' })).toEqual({
      period: 'night',
      month: '2026-04',
    });
  });

  it('clears the month when selecting accumulated mode', async () => {
    useSearchMock.mockReturnValue({ period: 'night', month: '2026-05' });

    const { MonthFilter } = await import('@/app/dashboard/_components/MonthFilter');

    render(
      <MonthFilter months={['2026-05', '2026-04']} activeMonth="2026-05" routeKey="dashboard_flow" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Acumulado' }));

    expect(resolveNextSearch({ period: 'night', month: '2026-05' })).toEqual({
      period: 'night',
      month: undefined,
    });
  });

  it('preserves zero-like string values already present in the search', async () => {
    useSearchMock.mockReturnValue({ period: '0', month: '2026-05' });

    const { MonthFilter } = await import('@/app/dashboard/_components/MonthFilter');

    render(
      <MonthFilter months={['2026-05', '2026-04']} activeMonth="2026-05" routeKey="dashboard_flow" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'abril de 2026' }));

    expect(resolveNextSearch({ period: '0', month: '2026-05' })).toEqual({
      period: '0',
      month: '2026-04',
    });
  });

  it('does not navigate when selecting the already active month', async () => {
    useSearchMock.mockReturnValue({ period: 'night', month: '2026-05' });

    const { MonthFilter } = await import('@/app/dashboard/_components/MonthFilter');

    render(
      <MonthFilter months={['2026-05', '2026-04']} activeMonth="2026-05" routeKey="dashboard_flow" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'mayo de 2026' }));

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
