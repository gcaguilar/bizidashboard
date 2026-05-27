// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
    useLocationMock.mockReturnValue({
      pathname: '/dashboard',
      searchStr: '?rankingTab=availability',
    });

    const { RankingsTable } = await import('@/app/dashboard/_components/RankingsTable');

    render(
      <RankingsTable
        rankings={{
          turnover: {
            type: 'turnover',
            limit: 20,
            rankings: [
              {
                id: 't-1',
                stationId: '101',
                stationName: 'Estación 101',
                turnoverScore: 2.3,
                occupancyAvg: 0.45,
                occupancyP95: 0.7,
                demandScore: 20,
                sampleCount: 15,
                emptyHours: 1,
                fullHours: 0,
                totalHours: 24,
                peakEmptyHours: [],
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
                id: 'a-1',
                stationId: '102',
                stationName: 'Estación 102',
                turnoverScore: 1.1,
                occupancyAvg: 0.6,
                occupancyP95: 0.9,
                demandScore: 10,
                sampleCount: 12,
                emptyHours: 3,
                fullHours: 1,
                totalHours: 24,
                peakEmptyHours: [],
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
