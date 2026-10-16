// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { navigateMock, useSearchMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useSearchMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    getRouteApi: () => ({
      useSearch: (options: { select?: (search: unknown) => unknown }) => {
        const search = useSearchMock();
        return options?.select ? options.select(search) : search;
      },
    }),
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('RankingsTable navigation sync', () => {
  it('does not navigate when clicking the already active tab', async () => {
    navigateMock.mockReset();
    useSearchMock.mockReturnValue({ rankingTab: 'availability' });

    const { RankingsTable } = await import('@/app/dashboard/_components/RankingsTable');

    render(
      <RankingsTable
        rankings={{
          turnover: {
            type: 'turnover',
            limit: 20,
            rankings: [
              {
                id: 1,
                stationId: '101',
                stationName: 'Estación 101',
                districtName: null,
                turnoverScore: 2.3,
                emptyHours: 1,
                fullHours: 0,
                totalHours: 24,
                windowStart: '2026-05-01T00:00:00.000Z',
                windowEnd: '2026-05-02T00:00:00.000Z',
                problemHours: 1,
                emptyHourShare: 0.1,
                demandVsStressedHint: 'datos_incompletos',
                peakFullHours: [],
              },
            ],
            districtSpotlight: [],
            generatedAt: '2026-05-01T00:00:00.000Z',
            dataState: 'ok',
          },
          availability: {
            type: 'availability',
            limit: 20,
            rankings: [
              {
                id: 2,
                stationId: '102',
                stationName: 'Estación 102',
                districtName: null,
                turnoverScore: 1.1,
                emptyHours: 3,
                fullHours: 1,
                totalHours: 24,
                windowStart: '2026-05-01T00:00:00.000Z',
                windowEnd: '2026-05-02T00:00:00.000Z',
                problemHours: 3,
                emptyHourShare: 0.3,
                demandVsStressedHint: 'datos_incompletos',
                peakFullHours: [],
              },
            ],
            districtSpotlight: [],
            generatedAt: '2026-05-01T00:00:00.000Z',
            dataState: 'ok',
          },
        }}
        stations={[
          {
            id: '101',
            name: 'Estación 101',
            lat: 0,
            lon: 0,
            bikesAvailable: 1,
            anchorsFree: 1,
            capacity: 2,
            recordedAt: '2026-05-07T10:00:00.000Z',
          },
          {
            id: '102',
            name: 'Estación 102',
            lat: 0,
            lon: 0,
            bikesAvailable: 1,
            anchorsFree: 1,
            capacity: 2,
            recordedAt: '2026-05-07T10:00:00.000Z',
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Criticas' }));

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
