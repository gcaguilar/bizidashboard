// @vitest-environment jsdom

import { render, waitFor } from '@testing-library/react';
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

vi.mock('@/app/dashboard/_components/useAbortableAsyncEffect', () => ({
  fetchJson: vi.fn(),
  useAbortableAsyncEffect: () => {},
}));

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

vi.mock('@/app/dashboard/_components/GitHubRepoButton', () => ({
  GitHubRepoButton: () => <button type="button">GitHub</button>,
}));

vi.mock('@/app/dashboard/_components/ThemeToggleButton', () => ({
  ThemeToggleButton: () => <button type="button">Theme</button>,
}));

vi.mock('@/components/layout/page-shell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/layout/page-header-card', () => ({
  PageHeaderCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectIcon: () => null,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: () => <input />,
}));

describe('AlertsHistoryClient navigation sync', () => {
  it('does not call navigate when URL already matches parsed view state', async () => {
    navigateMock.mockReset();
    useLocationMock.mockReturnValue({
      pathname: '/dashboard/alertas',
      searchStr: '?stationId=101&alertType=LOW_BIKES&state=active&severity=2&from=2026-05-01&to=2026-05-07&page=2',
    });

    const { AlertsHistoryClient } = await import('@/app/dashboard/alertas/_components/AlertsHistoryClient');

    render(
      <AlertsHistoryClient
        stations={[
          {
            id: '101',
            name: 'Estacion 101',
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

    await waitFor(() => {
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
